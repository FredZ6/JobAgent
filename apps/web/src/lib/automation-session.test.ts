import { describe, expect, it } from "vitest";

import {
  compareAutomationSessions,
  getAutomationSessionPhaseLabel,
  summarizeAutomationSessionEvidence
} from "./automation-session";

const baseSession = {
  id: "session_1",
  applicationId: "app_1",
  workflowRunId: "run_1",
  resumeVersionId: "resume_1",
  kind: "prefill",
  status: "completed" as const,
  applyUrl: "https://apply.example.com",
  formSnapshot: {},
  fieldResults: [
    {
      fieldName: "email",
      fieldType: "basic_text" as const,
      suggestedValue: "ada@example.com",
      filled: true,
      status: "filled" as const,
      strategy: "text_input",
      source: "profile"
    },
    {
      fieldName: "resume",
      fieldType: "resume_upload" as const,
      suggestedValue: "resume.pdf",
      filled: false,
      status: "unhandled" as const,
      source: "resume_pdf"
    },
    {
      fieldName: "why_company",
      fieldType: "long_text" as const,
      questionText: "Why do you want to work here?",
      suggestedValue: "",
      filled: false,
      status: "failed" as const,
      source: "llm_generated",
      failureReason: "field detached"
    }
  ],
  screenshotPaths: ["shot-1.png", "shot-2.png"],
  workerLog: [
    { level: "info" as const, message: "started" },
    { level: "error" as const, message: "failed" }
  ],
  errorMessage: "field detached",
  startedAt: "2026-03-19T09:00:00.000Z",
  completedAt: "2026-03-19T09:01:00.000Z",
  createdAt: "2026-03-19T09:00:00.000Z",
  updatedAt: "2026-03-19T09:01:00.000Z"
};

describe("automation-session helpers", () => {
  it("summarizes field, screenshot, and worker log evidence", () => {
    expect(summarizeAutomationSessionEvidence(baseSession)).toEqual({
      filled: 1,
      failed: 1,
      unresolved: 1,
      screenshotCount: 2,
      logCount: 2
    });
  });

  it("derives a phase label from status and timestamps", () => {
    expect(getAutomationSessionPhaseLabel(baseSession)).toBe("Completed");
    expect(getAutomationSessionPhaseLabel({ ...baseSession, status: "running", completedAt: null })).toBe(
      "In progress"
    );
    expect(getAutomationSessionPhaseLabel({ ...baseSession, status: "failed" })).toBe("Failed");
    expect(getAutomationSessionPhaseLabel({ ...baseSession, status: "cancelled" })).toBe("Cancelled");
    expect(getAutomationSessionPhaseLabel({ ...baseSession, status: "queued", startedAt: null, completedAt: null })).toBe(
      "Queued"
    );
  });

  it("compares two sessions with summary-first deltas", () => {
    const previous = {
      ...baseSession,
      id: "session_prev",
      fieldResults: [
        ...baseSession.fieldResults,
        {
          fieldName: "location",
          fieldType: "basic_text" as const,
          suggestedValue: "Winnipeg, MB",
          filled: false,
          status: "unresolved" as const,
          source: "profile"
        }
      ],
      screenshotPaths: ["shot-1.png"],
      workerLog: [{ level: "info" as const, message: "started" }]
    };
    const latest = {
      ...baseSession,
      id: "session_latest",
      status: "running" as const,
      fieldResults: [
        {
          fieldName: "email",
          fieldType: "basic_text" as const,
          suggestedValue: "ada@example.com",
          filled: true,
          status: "filled" as const,
          strategy: "text_input",
          source: "profile"
        },
        {
          fieldName: "resume",
          fieldType: "resume_upload" as const,
          suggestedValue: "resume.pdf",
          filled: false,
          status: "failed" as const,
          source: "resume_pdf"
        }
      ],
      screenshotPaths: ["shot-1.png", "shot-2.png"],
      workerLog: [
        { level: "info" as const, message: "started" },
        { level: "warn" as const, message: "retrying" }
      ],
      completedAt: null
    };

    expect(compareAutomationSessions(latest, previous)).toEqual(
      expect.objectContaining({
        latestId: "session_latest",
        previousId: "session_prev",
        latestStatus: "running",
        previousStatus: "completed",
        filledDelta: 0,
        failedDelta: 0,
        unresolvedDelta: -2,
        screenshotDelta: 1,
        logDelta: 1,
        latestSummary: {
          filled: 1,
          failed: 1,
          unresolved: 0,
          screenshotCount: 2,
          logCount: 2
        },
        previousSummary: {
          filled: 1,
          failed: 1,
          unresolved: 2,
          screenshotCount: 1,
          logCount: 1
        }
      })
    );
  });

  it("handles empty evidence without throwing", () => {
    const emptySession = {
      ...baseSession,
      id: "session_empty",
      fieldResults: [],
      screenshotPaths: [],
      workerLog: []
    };

    expect(compareAutomationSessions(emptySession, emptySession)).toEqual(
      expect.objectContaining({
        latestId: "session_empty",
        previousId: "session_empty",
        latestStatus: "completed",
        previousStatus: "completed",
        filledDelta: 0,
        failedDelta: 0,
        unresolvedDelta: 0,
        screenshotDelta: 0,
        logDelta: 0,
        latestSummary: {
          filled: 0,
          failed: 0,
          unresolved: 0,
          screenshotCount: 0,
          logCount: 0
        },
        previousSummary: {
          filled: 0,
          failed: 0,
          unresolved: 0,
          screenshotCount: 0,
          logCount: 0
        }
      })
    );
  });
});
