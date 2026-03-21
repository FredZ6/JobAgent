import { execFile, spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { createServer as createNetServer } from "node:net";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const apiWorkspaceRoot = fileURLToPath(new URL("../../../../apps/api/", import.meta.url));
const webWorkspaceRoot = fileURLToPath(new URL("../../../../apps/web/", import.meta.url));

type BrowserHappyPathRuntime = {
  apiUrl: string;
  webUrl: string;
};

type StartedProcess = {
  child: ChildProcess;
  output: string[];
};

let postgresContainerName: string | null = null;
let workerStubServer: Server | null = null;
let apiProcess: StartedProcess | null = null;
let webProcess: StartedProcess | null = null;
let runtime: BrowserHappyPathRuntime | null = null;

function makeWorkerResponse() {
  const timestamp = new Date().toISOString();

  return {
    status: "completed" as const,
    formSnapshot: {
      step: "prefill",
      source: "browser-e2e"
    },
    fieldResults: [
      {
        fieldName: "fullName",
        fieldLabel: "Full name",
        fieldType: "basic_text" as const,
        suggestedValue: "Ada Lovelace",
        filled: true,
        status: "filled" as const,
        strategy: "text_input",
        source: "profile"
      }
    ],
    screenshotPaths: ["prefill-complete.png"],
    workerLog: [
      {
        level: "info" as const,
        message: "Prefill completed successfully",
        timestamp
      }
    ],
    errorMessage: null
  };
}

async function runDockerCommand(args: string[]) {
  const result = await execFileAsync("docker", args, {
    timeout: 30_000
  });

  return result.stdout.trim();
}

async function getPublishedPostgresPort(containerName: string) {
  const inspectOutput = await runDockerCommand([
    "inspect",
    "-f",
    "{{(index (index .NetworkSettings.Ports \"5432/tcp\") 0).HostPort}}",
    containerName
  ]);

  if (!inspectOutput) {
    throw new Error("Failed to discover the published PostgreSQL host port");
  }

  return inspectOutput;
}

async function waitForPostgres(containerName: string) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      await runDockerCommand(["exec", containerName, "pg_isready", "-U", "postgres", "-d", "job_agent"]);
      return;
    } catch (error) {
      if (attempt === 29) {
        throw error;
      }

      await new Promise((resolve) => setTimeout(resolve, 1_000));
    }
  }
}

async function applyMigrations(databaseUrl: string) {
  await execFileAsync("npm", ["run", "prisma:migrate:deploy"], {
    cwd: repoRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl
    },
    timeout: 60_000
  });
}

function appendOutput(target: string[], chunk: Buffer | string) {
  target.push(chunk.toString());

  while (target.length > 200) {
    target.shift();
  }
}

function startProcess(command: string, args: string[], options: { cwd: string; env: NodeJS.ProcessEnv }) {
  const child = spawn(command, args, {
    cwd: options.cwd,
    env: options.env,
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output: string[] = [];

  child.stdout?.on("data", (chunk) => appendOutput(output, chunk));
  child.stderr?.on("data", (chunk) => appendOutput(output, chunk));

  return {
    child,
    output
  };
}

async function waitForUrl(url: string, options?: { contains?: string; timeoutMs?: number; logs?: string[] }) {
  const timeoutMs = options?.timeoutMs ?? 60_000;
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        if (!options?.contains) {
          return;
        }

        const body = await response.text();
        if (body.includes(options.contains)) {
          return;
        }
      }
    } catch {
      // keep polling until timeout
    }

    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }

  const logs = options?.logs?.join("");
  throw new Error(`Timed out waiting for ${url}${logs ? `\nRecent logs:\n${logs}` : ""}`);
}

async function createWorkerStubServer() {
  const server = createServer(async (request, response) => {
    if (request.method !== "POST" || request.url !== "/prefill") {
      response.statusCode = 404;
      response.end("not found");
      return;
    }

    const chunks: Buffer[] = [];
    for await (const chunk of request) {
      chunks.push(Buffer.from(chunk));
    }

    JSON.parse(Buffer.concat(chunks).toString("utf8"));

    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(makeWorkerResponse()));
  });

  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind worker stub server");
  }

  workerStubServer = server;

  return `http://127.0.0.1:${address.port}`;
}

async function getFreePort() {
  const server = createNetServer();
  server.listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    server.close();
    throw new Error("Failed to allocate a free port");
  }

  const port = address.port;
  await new Promise<void>((resolve, reject) => {
    server.close((error) => {
      if (error) {
        reject(error);
        return;
      }

      resolve();
    });
  });

  return port;
}

async function stopProcess(processHandle: StartedProcess | null) {
  if (!processHandle?.child.pid) {
    return;
  }

  processHandle.child.kill("SIGTERM");

  try {
    await Promise.race([
      once(processHandle.child, "exit"),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("process did not exit in time")), 10_000)
      )
    ]);
  } catch {
    processHandle.child.kill("SIGKILL");
    await once(processHandle.child, "exit").catch(() => undefined);
  }
}

export async function startBrowserHappyPathRuntime(): Promise<BrowserHappyPathRuntime> {
  if (runtime) {
    return runtime;
  }

  const apiPort = await getFreePort();
  const webPort = await getFreePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;

  postgresContainerName = `rolecraft-browser-e2e-postgres-${process.pid}-${Date.now()}`;
  await runDockerCommand([
    "run",
    "--detach",
    "--rm",
    "--name",
    postgresContainerName,
    "--publish",
    "127.0.0.1::5432",
    "--env",
    "POSTGRES_DB=job_agent",
    "--env",
    "POSTGRES_USER=postgres",
    "--env",
    "POSTGRES_PASSWORD=postgres",
    "postgres:16-alpine"
  ]);

  const postgresHostPort = await getPublishedPostgresPort(postgresContainerName);
  await waitForPostgres(postgresContainerName);

  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${postgresHostPort}/job_agent`;
  await applyMigrations(databaseUrl);

  const workerUrl = await createWorkerStubServer();

  apiProcess = startProcess("npx", ["tsx", "src/main.ts"], {
    cwd: apiWorkspaceRoot,
    env: {
      ...process.env,
      PORT: String(apiPort),
      DATABASE_URL: databaseUrl,
      API_URL: apiUrl,
      APP_URL: webUrl,
      WORKER_URL: workerUrl,
      JOB_IMPORT_MODE: "mock",
      JOB_ANALYSIS_MODE: "mock",
      JOB_RESUME_MODE: "mock",
      TEMPORAL_ENABLED: "false",
      JWT_SECRET: "rolecraft-browser-e2e-jwt",
      INTERNAL_API_TOKEN: "rolecraft-browser-e2e-internal"
    }
  });
  await waitForUrl(`${apiUrl}/health`, {
    contains: "\"status\":\"ok\"",
    logs: apiProcess.output
  });

  webProcess = startProcess("npx", ["next", "dev", "--hostname", "127.0.0.1", "--port", String(webPort)], {
    cwd: webWorkspaceRoot,
    env: {
      ...process.env,
      NEXT_PUBLIC_API_URL: apiUrl,
      API_URL: apiUrl
    }
  });
  await waitForUrl(`${webUrl}/profile`, {
    contains: "Profile",
    timeoutMs: 90_000,
    logs: webProcess.output
  });

  runtime = {
    apiUrl,
    webUrl
  };

  return runtime;
}

export async function stopBrowserHappyPathRuntime() {
  await stopProcess(webProcess);
  await stopProcess(apiProcess);

  webProcess = null;
  apiProcess = null;

  if (workerStubServer) {
    await new Promise<void>((resolve, reject) => {
      workerStubServer?.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    }).catch(() => undefined);
    workerStubServer = null;
  }

  if (postgresContainerName) {
    await runDockerCommand(["rm", "--force", postgresContainerName]).catch(() => undefined);
    postgresContainerName = null;
  }

  runtime = null;
}
