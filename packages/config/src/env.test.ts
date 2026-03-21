import { describe, expect, it } from "vitest";

import { parseAppEnv, resolveInternalApiToken, resolveTemporalRuntime } from "./env";

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
