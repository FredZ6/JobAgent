import { execFile, spawn, type ChildProcess } from "node:child_process";
import { createServer, type Server } from "node:http";
import { once } from "node:events";
import { createServer as createNetServer } from "node:net";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import { PrismaClient, type Prisma } from "@prisma/client";

const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../../", import.meta.url));
const apiWorkspaceRoot = fileURLToPath(new URL("../../../../apps/api/", import.meta.url));
const webWorkspaceRoot = fileURLToPath(new URL("../../../../apps/web/", import.meta.url));

type BrowserHappyPathRuntime = {
  apiUrl: string;
  webUrl: string;
};

type SeededFallbackJobFixture = {
  jobId: string;
  title: string;
};

type SeededUnresolvedReviewFixture = {
  applicationId: string;
  resolveTitle: string;
  ignoreTitle: string;
};

type SeededTemporalWorkflowRunFixture = {
  workflowRunId: string;
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
let prismaClient: PrismaClient | null = null;

function debugRuntime(message: string) {
  if (process.env.ROLECRAFT_E2E_DEBUG === "true") {
    process.stderr.write(`[browser-e2e-runtime] ${message}\n`);
  }
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} did not complete within ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

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

function getPrismaClient() {
  if (!prismaClient) {
    throw new Error("Browser e2e runtime is not started");
  }

  return prismaClient;
}

function makeFixtureId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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
    debugRuntime("reusing existing runtime");
    return runtime;
  }

  const apiPort = await getFreePort();
  const webPort = await getFreePort();
  const apiUrl = `http://127.0.0.1:${apiPort}`;
  const webUrl = `http://127.0.0.1:${webPort}`;

  postgresContainerName = `rolecraft-browser-e2e-postgres-${process.pid}-${Date.now()}`;
  debugRuntime(`starting postgres container ${postgresContainerName}`);
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
  debugRuntime(`postgres ready on host port ${postgresHostPort}`);

  const databaseUrl = `postgresql://postgres:postgres@127.0.0.1:${postgresHostPort}/job_agent`;
  await applyMigrations(databaseUrl);
  debugRuntime("prisma migrations applied");
  process.env.DATABASE_URL = databaseUrl;
  prismaClient = new PrismaClient();
  await prismaClient.$connect();
  debugRuntime("prisma client connected");

  const workerUrl = await createWorkerStubServer();
  debugRuntime(`worker stub listening at ${workerUrl}`);

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
      ROLECRAFT_E2E_FAKE_TEMPORAL: "true",
      JWT_SECRET: "rolecraft-browser-e2e-jwt",
      INTERNAL_API_TOKEN: "rolecraft-browser-e2e-internal"
    }
  });
  await waitForUrl(`${apiUrl}/health`, {
    contains: "\"status\":\"ok\"",
    logs: apiProcess.output
  });
  debugRuntime(`api ready at ${apiUrl}`);

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
  debugRuntime(`web ready at ${webUrl}`);

  runtime = {
    apiUrl,
    webUrl
  };

  return runtime;
}

export async function stopBrowserHappyPathRuntime() {
  debugRuntime("stopping web process");
  await stopProcess(webProcess);
  debugRuntime("stopping api process");
  await stopProcess(apiProcess);

  webProcess = null;
  apiProcess = null;

  if (workerStubServer) {
    const server = workerStubServer;
    workerStubServer = null;
    server.closeAllConnections?.();
    debugRuntime("closing worker stub server");
    await withTimeout(
      new Promise<void>((resolve, reject) => {
        server.close((error) => {
          if (error) {
            reject(error);
            return;
          }

          resolve();
        });
      }),
      5_000,
      "worker stub shutdown"
    ).catch(() => undefined);
  }

  if (prismaClient) {
    const client = prismaClient;
    prismaClient = null;
    debugRuntime("disconnecting prisma client");
    await withTimeout(client.$disconnect(), 5_000, "prisma disconnect").catch(() => undefined);
  }

  if (postgresContainerName) {
    const containerName = postgresContainerName;
    postgresContainerName = null;
    debugRuntime(`removing postgres container ${containerName}`);
    await withTimeout(
      runDockerCommand(["rm", "--force", containerName]),
      10_000,
      "postgres container cleanup"
    ).catch(() => undefined);
  }

  runtime = null;
  debugRuntime("runtime stopped");
}

export async function seedFallbackJobFixture(): Promise<SeededFallbackJobFixture> {
  const prisma = getPrismaClient();
  const jobId = makeFixtureId("job_fallback");
  const title = "Fallback Platform Engineer";
  const sourceUrl = "https://jobs.example.com/fallback-platform-engineer";
  const applyUrl = sourceUrl;

  await prisma.job.create({
    data: {
      id: jobId,
      sourceUrl,
      applyUrl,
      title,
      company: "jobs.example.com",
      location: "Remote / Unspecified",
      description: "Imported via synthetic fallback. Replace with live fetch data when the source page is accessible.",
      rawText: "Imported via synthetic fallback. Replace with live fetch data when the source page is accessible.",
      importStatus: "failed",
      events: {
        create: {
          type: "job_imported",
          actorType: "api",
          actorLabel: "apps-api",
          actorId: "apps-api",
          source: "browser-e2e-fixture",
          payload: {
            sourceUrl,
            importStatus: "failed",
            importSource: "synthetic_fallback",
            warnings: ["fetch_failed"],
            diagnostics: {
              fetchStatus: 503,
              titleSource: "fallback",
              companySource: "fallback",
              descriptionSource: "fallback",
              applyUrlSource: "source_url"
            }
          } as Prisma.InputJsonValue
        }
      }
    }
  });

  return { jobId, title };
}

export async function seedUnresolvedReviewFixture(): Promise<SeededUnresolvedReviewFixture> {
  const prisma = getPrismaClient();
  const profileId = makeFixtureId("profile");
  const jobId = makeFixtureId("job");
  const resumeId = makeFixtureId("resume");
  const applicationId = makeFixtureId("application");
  const sessionId = makeFixtureId("session");
  const resolveTitle = "Resume";
  const ignoreTitle = "Why do you want to join Rolecraft?";

  await prisma.candidateProfile.create({
    data: {
      id: profileId,
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      location: "Remote",
      linkedinUrl: "https://www.linkedin.com/in/ada-lovelace",
      githubUrl: "https://github.com/ada-lovelace",
      workAuthorization: "Authorized to work in Canada",
      summary: "Platform-minded engineer who values reliable internal systems.",
      skills: ["TypeScript", "React", "Prisma"] as Prisma.InputJsonValue,
      experienceLibrary: [] as Prisma.InputJsonValue,
      projectLibrary: [] as Prisma.InputJsonValue,
      defaultAnswers: {} as Prisma.InputJsonValue
    }
  });

  await prisma.job.create({
    data: {
      id: jobId,
      sourceUrl: "https://jobs.example.com/needs-attention-platform-engineer",
      applyUrl: "https://jobs.example.com/needs-attention-platform-engineer",
      title: "Needs Attention Platform Engineer",
      company: "Orbital",
      location: "Remote",
      description: "A deterministic fixture job for unresolved item browser coverage.",
      rawText: "A deterministic fixture job for unresolved item browser coverage.",
      importStatus: "imported"
    }
  });

  await prisma.resumeVersion.create({
    data: {
      id: resumeId,
      jobId,
      sourceProfileId: profileId,
      status: "completed",
      headline: "Platform Engineer resume",
      professionalSummary: "Strong platform engineering background.",
      skills: ["TypeScript", "React", "Prisma"] as Prisma.InputJsonValue,
      experienceSections: [] as Prisma.InputJsonValue,
      projectSections: [] as Prisma.InputJsonValue,
      changeSummary: [] as Prisma.InputJsonValue,
      structuredContent: {
        professionalSummary: "Strong platform engineering background."
      } as Prisma.InputJsonValue
    }
  });

  await prisma.application.create({
    data: {
      id: applicationId,
      jobId,
      resumeVersionId: resumeId,
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "not_ready",
      applyUrl: "https://jobs.example.com/needs-attention-platform-engineer",
      formSnapshot: {} as Prisma.InputJsonValue,
      fieldResults: [
        {
          fieldName: "resume",
          fieldLabel: resolveTitle,
          fieldType: "resume_upload",
          suggestedValue: "resume.pdf",
          filled: false,
          status: "failed",
          source: "resume_pdf",
          failureReason: "resume upload control not found"
        },
        {
          fieldName: "whyRolecraft",
          fieldLabel: ignoreTitle,
          fieldType: "long_text",
          questionText: ignoreTitle,
          suggestedValue: "I care about workflow tooling that keeps humans in the loop.",
          filled: false,
          status: "unhandled",
          source: "llm_generated",
          failureReason: "manual review required"
        }
      ] as Prisma.InputJsonValue,
      screenshotPaths: [] as Prisma.InputJsonValue,
      workerLog: [
        {
          level: "warn",
          message: "Some fields still need manual follow-up",
          timestamp: new Date().toISOString()
        }
      ] as Prisma.InputJsonValue,
      reviewNote: "Review unresolved items before submit"
    }
  });

  await prisma.automationSession.create({
    data: {
      id: sessionId,
      applicationId,
      resumeVersionId: resumeId,
      kind: "prefill",
      status: "completed",
      applyUrl: "https://jobs.example.com/needs-attention-platform-engineer",
      formSnapshot: {} as Prisma.InputJsonValue,
      fieldResults: [
        {
          fieldName: "resume",
          fieldLabel: resolveTitle,
          fieldType: "resume_upload",
          suggestedValue: "resume.pdf",
          filled: false,
          status: "failed",
          source: "resume_pdf",
          failureReason: "resume upload control not found"
        },
        {
          fieldName: "whyRolecraft",
          fieldLabel: ignoreTitle,
          fieldType: "long_text",
          questionText: ignoreTitle,
          suggestedValue: "I care about workflow tooling that keeps humans in the loop.",
          filled: false,
          status: "unhandled",
          source: "llm_generated",
          failureReason: "manual review required"
        }
      ] as Prisma.InputJsonValue,
      screenshotPaths: [] as Prisma.InputJsonValue,
      workerLog: [
        {
          level: "warn",
          message: "Manual follow-up required",
          timestamp: new Date().toISOString()
        }
      ] as Prisma.InputJsonValue,
      completedAt: new Date()
    }
  });

  await prisma.unresolvedAutomationItem.createMany({
    data: [
      {
        id: makeFixtureId("unresolved"),
        automationSessionId: sessionId,
        applicationId,
        fieldName: "resume",
        fieldLabel: resolveTitle,
        fieldType: "resume_upload",
        status: "unresolved",
        failureReason: "resume upload control not found",
        source: "resume_pdf",
        suggestedValue: "resume.pdf",
        metadata: {} as Prisma.InputJsonValue
      },
      {
        id: makeFixtureId("unresolved"),
        automationSessionId: sessionId,
        applicationId,
        fieldName: "whyRolecraft",
        fieldLabel: ignoreTitle,
        fieldType: "long_text",
        questionText: ignoreTitle,
        status: "unresolved",
        failureReason: "manual review required",
        source: "llm_generated",
        suggestedValue: "I care about workflow tooling that keeps humans in the loop.",
        metadata: {} as Prisma.InputJsonValue
      }
    ]
  });

  return {
    applicationId,
    resolveTitle,
    ignoreTitle
  };
}

export async function seedTemporalWorkflowRunFixture(): Promise<SeededTemporalWorkflowRunFixture> {
  const prisma = getPrismaClient();
  const jobId = makeFixtureId("job");
  const workflowRunId = makeFixtureId("run");

  await prisma.job.create({
    data: {
      id: jobId,
      sourceUrl: "https://jobs.example.com/temporal-prefill-engineer",
      applyUrl: "https://jobs.example.com/temporal-prefill-engineer",
      title: "Temporal Prefill Engineer",
      company: "Orbital",
      location: "Remote",
      description: "A deterministic fixture job for workflow run control browser coverage.",
      rawText: "A deterministic fixture job for workflow run control browser coverage.",
      importStatus: "imported"
    }
  });

  await prisma.workflowRun.create({
    data: {
      id: workflowRunId,
      jobId,
      kind: "prefill",
      status: "running",
      executionMode: "temporal",
      workflowId: `prefill-job-${workflowRunId}`,
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date()
    }
  });

  await prisma.workflowRunEvent.create({
    data: {
      workflowRunId,
      type: "run_started",
      payload: {
        status: "running"
      } as Prisma.InputJsonValue
    }
  });

  return { workflowRunId };
}
