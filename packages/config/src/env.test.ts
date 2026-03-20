import { describe, expect, it } from "vitest";

import { parseAppEnv, resolveInternalApiToken } from "./env";

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
