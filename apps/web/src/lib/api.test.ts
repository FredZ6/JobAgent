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
