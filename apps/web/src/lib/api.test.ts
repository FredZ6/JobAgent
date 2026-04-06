import { beforeEach, describe, expect, it, vi } from "vitest";

import { fetchAutomationSessions } from "./api";

describe("fetchAutomationSessions", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches application automation sessions from the dedicated endpoint", async () => {
    const responseBody = [
      {
        id: "session_1",
        applicationId: "app_1",
        workflowRunId: "run_1",
        resumeVersionId: "resume_1",
        kind: "prefill",
        status: "completed",
        applyUrl: "https://apply.example.com",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-20T00:00:00.000Z",
        updatedAt: "2026-03-20T00:00:00.000Z"
      }
    ];

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(responseBody)
    });
    vi.stubGlobal("fetch", fetchSpy);

    const result = await fetchAutomationSessions("app_1");

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://localhost:3001/applications/app_1/automation-sessions",
      expect.objectContaining({
        cache: "no-store",
        headers: {
          "Content-Type": "application/json"
        }
      })
    );
    expect(result).toEqual(responseBody);
  });
});

describe("demo fallback data", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it("falls back to demo jobs in the browser when the API cannot be reached", async () => {
    vi.stubGlobal("window", {} as Window & typeof globalThis);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { fetchJobs } = await import("./api");

    const result = await fetchJobs();

    expect(result).toHaveLength(1);
    expect(result[0]?.title).toBe("Senior Product Platform Engineer");
    expect(result[0]?.company).toBe("Northstar");
    expect(result[0]?.latestAnalysis?.matchScore).toBe(84);
  });

  it("falls back to demo dashboard overview in the browser when the API cannot be reached", async () => {
    vi.stubGlobal("window", {} as Window & typeof globalThis);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));

    const { fetchDashboardOverview } = await import("./api");

    const result = await fetchDashboardOverview();

    expect(result.metrics.totalJobs).toBe(1);
    expect(result.metrics.totalApplications).toBe(2);
    expect(result.jobs[0]?.title).toBe("Senior Product Platform Engineer");
    expect(result.recentActivity[0]?.type).toBe("approval_updated");
  });
});
