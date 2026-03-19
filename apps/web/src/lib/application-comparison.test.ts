import { describe, expect, it } from "vitest";

import { compareApplicationRuns } from "./application-comparison";
import type { ApplicationWithContext } from "./api";

function buildApplicationContext(
  overrides?: Partial<ApplicationWithContext["application"]>
): ApplicationWithContext {
  return {
    application: {
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: "2026-03-17T00:00:00.000Z",
      updatedAt: "2026-03-17T00:00:00.000Z",
      ...overrides
    },
    job: {
      id: "job_1",
      title: "Role",
      company: "Co",
      applyUrl: "https://example.com/apply"
    },
    resumeVersion: {
      id: "resume_1",
      headline: "Headline",
      status: "completed"
    }
  };
}

describe("compareApplicationRuns", () => {
  it("computes deltas for fields, screenshots, and logs", () => {
    const previous = buildApplicationContext({
      id: "app_prev",
      fieldResults: [
        { fieldName: "email", suggestedValue: "ada@example.com", filled: false, failureReason: "selector not found" },
        { fieldName: "phone", suggestedValue: "555-0101", filled: false }
      ],
      screenshotPaths: ["/tmp/prev.png"],
      workerLog: [{ level: "info", message: "prefill started" }]
    });
    const latest = buildApplicationContext({
      id: "app_latest",
      fieldResults: [
        { fieldName: "email", suggestedValue: "ada@example.com", filled: true },
        { fieldName: "phone", suggestedValue: "555-0101", filled: false },
        { fieldName: "linkedin", suggestedValue: "https://linkedin.com/in/ada", filled: false, failureReason: "selector not found" }
      ],
      screenshotPaths: ["/tmp/one.png", "/tmp/two.png"],
      workerLog: [
        { level: "info", message: "prefill started" },
        { level: "info", message: "prefill completed" }
      ]
    });

    const comparison = compareApplicationRuns(latest, previous);

    expect(comparison.filledDelta).toBe(1);
    expect(comparison.failedDelta).toBe(0);
    expect(comparison.unresolvedDelta).toBe(0);
    expect(comparison.screenshotDelta).toBe(1);
    expect(comparison.workerLogDelta).toBe(1);
    expect(comparison.changedFields.map((field) => field.fieldName)).toEqual(["email", "linkedin"]);
  });

  it("treats missing prior fields as changes", () => {
    const previous = buildApplicationContext({
      id: "app_prev"
    });
    const latest = buildApplicationContext({
      id: "app_latest",
      fieldResults: [{ fieldName: "location", suggestedValue: "Winnipeg", filled: false }]
    });

    const comparison = compareApplicationRuns(latest, previous);

    expect(comparison.changedFields).toEqual([
      expect.objectContaining({
        fieldName: "location",
        latestState: "unresolved",
        previousState: "missing"
      })
    ]);
  });
});
