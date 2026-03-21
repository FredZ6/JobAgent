import { describe, expect, it } from "vitest";

import {
  parseAppEnv,
  resolveAnalysisRuntime,
  resolveApiBaseUrl,
  resolveApplicationStorageDir,
  resolveInternalApiToken,
  resolveJobImportRuntime,
  resolveResumeRuntime,
  resolveServicePort,
  resolveTemporalRuntime,
  resolveWorkerRuntime
} from "./env";

function buildEnv(overrides: Partial<Record<string, string>> = {}) {
  return {
    NODE_ENV: "development",
    APP_URL: "http://localhost:3000",
    API_URL: "http://localhost:3001",
    DATABASE_URL: "postgresql://postgres:postgres@localhost:5432/job_agent",
    REDIS_URL: "redis://localhost:6379",
    LLM_PROVIDER: "openai",
    LLM_MODEL: "gpt-5.4",
    LLM_API_KEY: "",
    JWT_SECRET: "jwt-secret",
    INTERNAL_API_TOKEN: "",
    FILE_STORAGE_PATH: "/tmp/storage",
    ...overrides
  };
}

describe("resolveInternalApiToken", () => {
  it("prefers INTERNAL_API_TOKEN when present", () => {
    const env = parseAppEnv(
      buildEnv({
        INTERNAL_API_TOKEN: "internal-secret",
        JWT_SECRET: "jwt-secret"
      })
    );

    expect(resolveInternalApiToken(env)).toBe("internal-secret");
  });

  it("falls back to JWT_SECRET outside production", () => {
    const env = parseAppEnv(
      buildEnv({
        NODE_ENV: "test",
        INTERNAL_API_TOKEN: "",
        JWT_SECRET: "jwt-secret"
      })
    );

    expect(resolveInternalApiToken(env)).toBe("jwt-secret");
  });

  it("does not fall back to JWT_SECRET in production", () => {
    const env = parseAppEnv(
      buildEnv({
        NODE_ENV: "production",
        INTERNAL_API_TOKEN: "",
        JWT_SECRET: "jwt-secret"
      })
    );

    expect(resolveInternalApiToken(env)).toBeUndefined();
  });

  it("returns undefined when no usable token exists", () => {
    const env = parseAppEnv(
      buildEnv({
        INTERNAL_API_TOKEN: "",
        JWT_SECRET: ""
      })
    );

    expect(resolveInternalApiToken(env)).toBeUndefined();
  });
});

describe("resolveTemporalRuntime", () => {
  it("defaults to Rolecraft Temporal settings when values are unset", () => {
    const runtime = resolveTemporalRuntime({});

    expect(runtime.enabled).toBe(false);
    expect(runtime.address).toBe("temporal:7233");
    expect(runtime.namespace).toBe("default");
    expect(runtime.taskQueue).toBe("rolecraft-analysis");
  });

  it("treats TEMPORAL_ENABLED as the single source of truth for enablement", () => {
    expect(resolveTemporalRuntime({ TEMPORAL_ENABLED: "true" }).enabled).toBe(true);
    expect(resolveTemporalRuntime({ TEMPORAL_ENABLED: "false" }).enabled).toBe(false);
  });

  it("prefers explicit Temporal connection values when present", () => {
    const runtime = resolveTemporalRuntime({
      TEMPORAL_ENABLED: "true",
      TEMPORAL_ADDRESS: "temporal.example.com:7233",
      TEMPORAL_NAMESPACE: "rolecraft-prod",
      TEMPORAL_TASK_QUEUE: "rolecraft-prefill"
    });

    expect(runtime).toEqual({
      enabled: true,
      address: "temporal.example.com:7233",
      namespace: "rolecraft-prod",
      taskQueue: "rolecraft-prefill"
    });
  });
});

describe("mode runtime helpers", () => {
  it("defaults import, analysis, and resume modes to live", () => {
    expect(resolveJobImportRuntime({})).toEqual({ mode: "live" });
    expect(resolveAnalysisRuntime({})).toEqual({ mode: "live" });
    expect(resolveResumeRuntime({})).toEqual({ mode: "live" });
  });

  it("treats explicit mock mode as mock", () => {
    expect(resolveJobImportRuntime({ JOB_IMPORT_MODE: "mock" })).toEqual({ mode: "mock" });
    expect(resolveAnalysisRuntime({ JOB_ANALYSIS_MODE: "mock" })).toEqual({ mode: "mock" });
    expect(resolveResumeRuntime({ JOB_RESUME_MODE: "mock" })).toEqual({ mode: "mock" });
  });

  it("treats unknown mode values as live", () => {
    expect(resolveJobImportRuntime({ JOB_IMPORT_MODE: "staging" })).toEqual({ mode: "live" });
    expect(resolveAnalysisRuntime({ JOB_ANALYSIS_MODE: "staging" })).toEqual({ mode: "live" });
    expect(resolveResumeRuntime({ JOB_RESUME_MODE: "staging" })).toEqual({ mode: "live" });
  });
});

describe("URL and path runtime helpers", () => {
  it("normalizes API base URLs with trimming and trailing-slash removal", () => {
    expect(resolveApiBaseUrl({ API_URL: " http://api.example.com:3001/ " })).toBe(
      "http://api.example.com:3001"
    );
  });

  it("falls back API base URL when unset", () => {
    expect(resolveApiBaseUrl({}, "http://localhost:3001")).toBe("http://localhost:3001");
  });

  it("normalizes worker URLs with trimming and trailing-slash removal", () => {
    expect(resolveWorkerRuntime({ WORKER_URL: " http://worker-playwright:4000/ " })).toBe(
      "http://worker-playwright:4000"
    );
  });

  it("falls back worker URL when unset", () => {
    expect(resolveWorkerRuntime({}, "http://worker-playwright:4000")).toBe(
      "http://worker-playwright:4000"
    );
  });

  it("uses explicit application storage directory when present", () => {
    expect(
      resolveApplicationStorageDir({
        APPLICATION_STORAGE_DIR: " /tmp/rolecraft-applications "
      })
    ).toBe("/tmp/rolecraft-applications");
  });

  it("falls back application storage directory when unset", () => {
    expect(resolveApplicationStorageDir({}, "/app/storage/applications")).toBe(
      "/app/storage/applications"
    );
  });
});

describe("resolveServicePort", () => {
  it("parses explicit numeric PORT values", () => {
    expect(resolveServicePort({ PORT: "4100" }, 3001)).toBe(4100);
  });

  it("falls back when PORT is missing", () => {
    expect(resolveServicePort({}, 3001)).toBe(3001);
  });

  it("falls back when PORT is invalid", () => {
    expect(resolveServicePort({ PORT: "NaN" }, 3001)).toBe(3001);
    expect(resolveServicePort({ PORT: "0" }, 3001)).toBe(3001);
  });
});
