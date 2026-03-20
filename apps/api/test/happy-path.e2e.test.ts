import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { NestFactory } from "@nestjs/core";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";
import request from "supertest";

import { AppModule } from "../src/app.module.js";
import { PrismaService } from "../src/lib/prisma.service.js";

const happyPathSteps = [
  "PUT /profile",
  "PUT /settings/llm",
  "POST /jobs/import-by-url",
  "POST /jobs/:id/analyze",
  "POST /jobs/:id/generate-resume",
  "POST /jobs/:id/prefill",
  "GET /applications/:id"
] as const;

const workerStubUrl = "http://worker-stub.invalid";
const apiStubUrl = "http://api-test.invalid";

const originalEnv = {
  DATABASE_URL: process.env.DATABASE_URL,
  JOB_IMPORT_MODE: process.env.JOB_IMPORT_MODE,
  JOB_ANALYSIS_MODE: process.env.JOB_ANALYSIS_MODE,
  JOB_RESUME_MODE: process.env.JOB_RESUME_MODE,
  TEMPORAL_ENABLED: process.env.TEMPORAL_ENABLED,
  WORKER_URL: process.env.WORKER_URL,
  API_URL: process.env.API_URL
};

const originalFetch = globalThis.fetch;
const execFileAsync = promisify(execFile);
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));

let appInstance: Awaited<ReturnType<typeof NestFactory.create>> | null = null;
let prismaService: PrismaService | null = null;
let postgresContainerName: string | null = null;
let postgresHostPort: string | null = null;

function makeWorkerResponse() {
  const timestamp = new Date().toISOString();

  return {
    status: "completed" as const,
    formSnapshot: {
      step: "prefill",
      source: "runtime-happy-path"
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

function getRequestUrl(input: string | URL | Request) {
  if (typeof input === "string") {
    return input;
  }

  return input instanceof URL ? input.toString() : input.url;
}

function getRequestMethod(input: string | URL | Request, init?: RequestInit) {
  if (init?.method) {
    return init.method;
  }

  if (typeof input === "string" || input instanceof URL) {
    return "GET";
  }

  return input.method;
}

describe.skipIf(!process.env.RUN_RUNTIME_HAPPY_PATH)("runtime happy path API", () => {
  beforeAll(async () => {
    postgresContainerName = `rolecraft-happy-path-postgres-${process.pid}-${Date.now()}`;

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
    postgresHostPort = await getPublishedPostgresPort(postgresContainerName);
    await waitForPostgres(postgresContainerName);

    process.env.DATABASE_URL = `postgresql://postgres:postgres@127.0.0.1:${postgresHostPort}/job_agent`;
    await applyMigrations(process.env.DATABASE_URL);
    process.env.JOB_IMPORT_MODE = "mock";
    process.env.JOB_ANALYSIS_MODE = "mock";
    process.env.JOB_RESUME_MODE = "mock";
    process.env.TEMPORAL_ENABLED = "false";
    process.env.WORKER_URL = workerStubUrl;
    process.env.API_URL = apiStubUrl;

    globalThis.fetch = (async (input, init) => {
      const url = getRequestUrl(input);
      const method = getRequestMethod(input, init);

      expect(url).toBe(`${workerStubUrl}/prefill`);
      expect(method).toBe("POST");

      const bodyText = typeof init?.body === "string" ? init.body : "";
      const payload = JSON.parse(bodyText) as {
        applicationId: string;
        applyUrl: string;
        profile: { fullName: string; email: string; phone: string; linkedinUrl: string; githubUrl: string; location: string };
        resume: {
          id: string;
          headline: string;
          status: string;
          pdfDownloadUrl: string;
          pdfFileName: string;
        };
        job: {
          id: string;
          title: string;
          company: string;
          location: string;
          description: string;
          applyUrl: string;
        };
        analysis: unknown;
        defaultAnswers: Record<string, string>;
      };

      expect(payload.applicationId).toMatch(/^c[a-z0-9]+$/i);
      expect(payload.applyUrl).toBe("https://example.com/jobs/platform-engineer");
      expect(payload.resume.pdfDownloadUrl).toContain(`${apiStubUrl}/resume-versions/`);
      expect(payload.resume.pdfFileName).toContain("platform-engineer");
      expect(payload.job.title).toBe("Platform Engineer");
      expect(payload.defaultAnswers).toMatchObject({
        "Why do you want to work here?": expect.any(String)
      });

      return new Response(JSON.stringify(makeWorkerResponse()), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      });
    }) as typeof fetch;

    appInstance = await NestFactory.create(AppModule, {
      logger: false
    });
    await appInstance.init();

    prismaService = appInstance.get(PrismaService);
  }, 60_000);

  afterAll(async () => {
    if (appInstance) {
      await appInstance.close();
    }

    if (postgresContainerName) {
      await runDockerCommand(["rm", "--force", postgresContainerName]).catch(() => undefined);
    }

    globalThis.fetch = originalFetch;

    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }, 60_000);

  it("documents the main product loop from profile setup through Application Review", async () => {
    const server = appInstance?.getHttpServer();

    if (!server) {
      throw new Error("Nest application was not initialized");
    }

    const profilePayload = {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0100",
      linkedinUrl: "https://linkedin.com/in/ada-lovelace",
      githubUrl: "https://github.com/ada-lovelace",
      location: "Winnipeg, MB",
      workAuthorization: "Open to work in Canada",
      summary: "Product-minded engineer focused on reliable internal platforms.",
      skills: ["TypeScript", "Node.js", "NestJS"],
      experienceLibrary: [
        {
          role: "Senior Full-Stack Engineer",
          company: "North Star Labs",
          startDate: "2022-01",
          endDate: "Present",
          bullets: [
            "Built internal workflow automation for recruiting and operations teams.",
            "Shipped TypeScript and React tools that reduced manual coordination overhead."
          ]
        }
      ],
      projectLibrary: [
        {
          name: "Rolecraft",
          tagline: "Human-in-the-loop workflow automation",
          bullets: [
            "Designed a local-first monorepo for AI-assisted job workflows.",
            "Integrated structured analysis and review-focused UX patterns."
          ],
          skills: ["TypeScript", "Next.js", "NestJS", "Prisma"]
        }
      ],
      defaultAnswers: {
        "Why do you want to work here?": "I enjoy building reliable internal platforms that help product teams move faster.",
        "Do you require sponsorship?": "No."
      }
    };

    const settingsPayload = {
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "test-openai-key",
      isConfigured: true
    };

    const jobUrl = "https://example.com/jobs/platform-engineer";

    const profileResponse = await request(server).put("/profile").send(profilePayload).expect(200);
    expect(profileResponse.body.fullName).toBe(profilePayload.fullName);

    const settingsResponse = await request(server).put("/settings/llm").send(settingsPayload).expect(200);
    expect(settingsResponse.body.provider).toBe("openai");
    expect(settingsResponse.body.isConfigured).toBe(true);

    const importResponse = await request(server)
      .post("/jobs/import-by-url")
      .send({ sourceUrl: jobUrl })
      .expect(201);

    expect(importResponse.body.id).toMatch(/^c[a-z0-9]+$/i);
    expect(importResponse.body.title).toBe("Platform Engineer");
    expect(importResponse.body.company).toBe("example.com");
    expect(importResponse.body.applyUrl).toBe(jobUrl);

    const jobId = importResponse.body.id as string;

    const analysisResponse = await request(server).post(`/jobs/${jobId}/analyze`).expect(201);
    expect(analysisResponse.body.jobId).toBe(jobId);
    expect(analysisResponse.body.status).toBe("completed");
    expect(analysisResponse.body.summary).toEqual(expect.any(String));

    const resumeResponse = await request(server).post(`/jobs/${jobId}/generate-resume`).expect(201);
    expect(resumeResponse.body.jobId).toBe(jobId);
    expect(resumeResponse.body.status).toBe("completed");
    expect(resumeResponse.body.headline).toEqual(expect.any(String));

    const prefillResponse = await request(server).post(`/jobs/${jobId}/prefill`).expect(201);
    expect(prefillResponse.body.job.id).toBe(jobId);
    expect(prefillResponse.body.application.status).toBe("completed");
    expect(prefillResponse.body.application.fieldResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "fullName",
          filled: true,
          status: "filled"
        })
      ])
    );
    expect(prefillResponse.body.latestAutomationSession).toEqual(
      expect.objectContaining({
        status: "completed",
        fieldResults: expect.arrayContaining([
          expect.objectContaining({
            fieldName: "fullName",
            filled: true
          })
        ])
      })
    );

    const applicationId = prefillResponse.body.application.id as string;

    const applicationResponse = await request(server).get(`/applications/${applicationId}`).expect(200);
    expect(applicationResponse.body.job.id).toBe(jobId);
    expect(applicationResponse.body.resumeVersion.id).toBe(resumeResponse.body.id);
    expect(applicationResponse.body.application.id).toBe(applicationId);
    expect(applicationResponse.body.application.status).toBe("completed");
    expect(applicationResponse.body.application.fieldResults).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          fieldName: "fullName",
          filled: true,
          status: "filled"
        })
      ])
    );
    expect(applicationResponse.body.application.workerLog).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          level: "info",
          message: "Prefill completed successfully"
        })
      ])
    );
    expect(applicationResponse.body.application.screenshotPaths).toEqual(["prefill-complete.png"]);
    expect(applicationResponse.body.latestAutomationSession).toEqual(
      expect.objectContaining({
        applicationId,
        status: "completed",
        screenshotPaths: ["prefill-complete.png"]
      })
    );
  }, 60_000);
});
