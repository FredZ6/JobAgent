import { describe, expect, it } from "vitest";

import { getAutomationSessionPhaseLabel, summarizeAutomationSessionEvidence } from "./automation-session";

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
});
