import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const heartbeat = vi.fn();
const cancellationSignal = new AbortController().signal;

vi.mock("@temporalio/activity", () => ({
  Context: {
    current: () => ({
      heartbeat,
      cancellationSignal
    })
  }
}));

import { runDirectAnalysis, runDirectPrefill, runDirectResumeGeneration } from "./activities.js";

const originalFetch = global.fetch;
const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;
const originalInternalApiToken = process.env.INTERNAL_API_TOKEN;
const originalApiUrl = process.env.API_URL;

describe("worker-temporal internal auth headers", () => {
  beforeEach(() => {
    heartbeat.mockReset();
    process.env.API_URL = "http://api:3001";
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch);
    } else {
      vi.unstubAllGlobals();
    }

    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalInternalApiToken === undefined) {
      delete process.env.INTERNAL_API_TOKEN;
    } else {
      process.env.INTERNAL_API_TOKEN = originalInternalApiToken;
    }

    if (originalApiUrl === undefined) {
      delete process.env.API_URL;
    } else {
      process.env.API_URL = originalApiUrl;
    }
  });

  it("prefers INTERNAL_API_TOKEN for direct analysis requests", async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "jwt-secret";
    process.env.INTERNAL_API_TOKEN = "internal-secret";

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    vi.stubGlobal("fetch", fetchSpy);

    await runDirectAnalysis("job_1", { executionMode: "temporal" }, "run_1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api:3001/internal/jobs/job_1/analyze-direct",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-internal-token": "internal-secret"
        })
      })
    );
  });

  it("falls back to JWT_SECRET outside production for direct resume requests", async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "jwt-secret";
    delete process.env.INTERNAL_API_TOKEN;

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    vi.stubGlobal("fetch", fetchSpy);

    await runDirectResumeGeneration("job_2", { executionMode: "temporal" }, "run_2");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api:3001/internal/jobs/job_2/generate-resume-direct",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-internal-token": "jwt-secret"
        })
      })
    );
  });

  it("sends an empty token in production when INTERNAL_API_TOKEN is unset", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "jwt-secret";
    delete process.env.INTERNAL_API_TOKEN;

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ status: "ok" })
    });
    vi.stubGlobal("fetch", fetchSpy);

    await runDirectPrefill("job_3", { executionMode: "temporal" }, "run_3");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api:3001/internal/jobs/job_3/prefill-direct",
      expect.objectContaining({
        headers: expect.objectContaining({
          "x-internal-token": ""
        })
      })
    );
  });
});
