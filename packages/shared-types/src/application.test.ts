import { describe, expect, it } from "vitest";

import {
  applicationSchema,
  applicationEventSchema,
  applicationEventTypeSchema,
  approvalRequestSchema,
  fieldResultSchema,
  markRetryReadyRequestSchema,
  reopenSubmissionRequestSchema,
  markSubmittedRequestSchema,
  markSubmitFailedRequestSchema,
  submissionReviewSchema,
  submissionStatusSchema
} from "./application";

describe("application schemas", () => {
  const validFieldResult = {
    fieldName: "email",
    suggestedValue: "test@example.com",
    filled: true
  };
  const emptySuggestionFieldResult = {
    fieldName: "phone",
    filled: false
  };

  it("accepts a valid application payload", () => {
    const result = applicationSchema.safeParse({
      id: "app_123",
      jobId: "job_123",
      resumeVersionId: "resume_123",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://example.com/apply",
      formSnapshot: { fields: ["email", "name"] },
      fieldResults: [validFieldResult],
      screenshotPaths: ["screenshot-1.png"],
      workerLog: [
        { level: "info", message: "prefill started" },
        { level: "info", message: "prefill done" }
      ],
      submissionStatus: "ready_to_submit",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "Looks good",
      errorMessage: null,
      createdAt: "2026-03-16T00:00:00.000Z",
      updatedAt: "2026-03-16T00:00:00.000Z"
    });

    expect(result.success).toBe(true);
  });

  it("rejects applications with invalid approvalStatus", () => {
    const result = applicationSchema.safeParse({
      id: "app_123",
      jobId: "job_123",
      resumeVersionId: "resume_123",
      status: "completed",
      approvalStatus: "invalid_status",
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
      createdAt: "2026-03-16T00:00:00.000Z",
      updatedAt: "2026-03-16T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("rejects invalid approval request payloads", () => {
    const result = approvalRequestSchema.safeParse({
      approvalStatus: "banana",
      reviewNote: "Needs more work"
    });

    expect(result.success).toBe(false);
  });

  it("accepts field result entries", () => {
    const result = fieldResultSchema.safeParse(validFieldResult);
    expect(result.success).toBe(true);
  });

  it("accepts field results without a suggested value", () => {
    const result = fieldResultSchema.safeParse(emptySuggestionFieldResult);
    expect(result.success).toBe(true);
  });

  it("requires worker log entries to include level and message", () => {
    const logResult = applicationSchema.safeParse({
      id: "app_123",
      jobId: "job_123",
      resumeVersionId: "resume_123",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [{ text: "missing level" }],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: "2026-03-16T00:00:00.000Z",
      updatedAt: "2026-03-16T00:00:00.000Z"
    });

    expect(logResult.success).toBe(false);
  });

  it("accepts valid submission statuses", () => {
    expect(submissionStatusSchema.parse("submitted")).toBe("submitted");
  });

  it("accepts a valid mark-submitted payload", () => {
    const result = markSubmittedRequestSchema.safeParse({
      submissionNote: "Submitted manually from the ATS page."
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid mark-submit-failed payload", () => {
    const result = markSubmitFailedRequestSchema.safeParse({
      submissionNote: "Blocked by an unanswered required question."
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid reopen-submission payload", () => {
    const result = reopenSubmissionRequestSchema.safeParse({
      note: "Marked submitted too early."
    });

    expect(result.success).toBe(true);
  });

  it("accepts a valid retry-ready payload", () => {
    const result = markRetryReadyRequestSchema.safeParse({
      note: "Manual fix completed."
    });

    expect(result.success).toBe(true);
  });

  it("accepts known application event types", () => {
    expect(applicationEventTypeSchema.parse("prefill_run")).toBe("prefill_run");
    expect(applicationEventTypeSchema.parse("submission_reopened")).toBe("submission_reopened");
    expect(applicationEventTypeSchema.parse("submission_retry_ready")).toBe(
      "submission_retry_ready"
    );
  });

  it("accepts a valid application event payload", () => {
    const result = applicationEventSchema.safeParse({
      id: "event_123",
      applicationId: "app_123",
      type: "submission_reopened",
      actorType: "user",
      actorLabel: "local-user",
      actorId: "local-user",
      source: "web-ui",
      summary: "submitted -> ready_to_submit · Need one more manual pass.",
      payload: {
        note: "Need one more manual pass.",
        fromStatus: "submitted",
        toStatus: "ready_to_submit"
      },
      createdAt: "2026-03-16T00:00:00.000Z"
    });

    expect(result.success).toBe(true);
  });

  it("rejects an application event payload without actor attribution", () => {
    const result = applicationEventSchema.safeParse({
      id: "event_123",
      applicationId: "app_123",
      type: "submission_reopened",
      summary: "submitted -> ready_to_submit",
      payload: {},
      createdAt: "2026-03-16T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("rejects an application event payload without summary", () => {
    const result = applicationEventSchema.safeParse({
      id: "event_123",
      applicationId: "app_123",
      type: "submission_reopened",
      actorType: "user",
      actorLabel: "local-user",
      actorId: "local-user",
      source: "web-ui",
      payload: {},
      createdAt: "2026-03-16T00:00:00.000Z"
    });

    expect(result.success).toBe(false);
  });

  it("accepts a valid submission review payload", () => {
    const result = submissionReviewSchema.safeParse({
      application: {
        id: "app_123",
        jobId: "job_123",
        resumeVersionId: "resume_123",
        status: "completed",
        approvalStatus: "approved_for_submit",
        applyUrl: "https://example.com/apply",
        formSnapshot: {},
        fieldResults: [
          {
            fieldName: "email",
            suggestedValue: "ada@example.com",
            filled: false,
            failureReason: "selector not found"
          }
        ],
        screenshotPaths: ["screenshot-1.png"],
        workerLog: [{ level: "info", message: "prefill complete" }],
        submissionStatus: "ready_to_submit",
        submittedAt: null,
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        reviewNote: "Ready after a final manual check.",
        errorMessage: null,
        createdAt: "2026-03-16T00:00:00.000Z",
        updatedAt: "2026-03-16T00:00:00.000Z"
      },
      job: {
        id: "job_123",
        title: "Engineer",
        company: "Example",
        applyUrl: "https://example.com/apply"
      },
      resumeVersion: {
        id: "resume_123",
        headline: "Engineer candidate for Example",
        status: "completed"
      },
      unresolvedFieldCount: 1,
      failedFieldCount: 1
    });

    expect(result.success).toBe(true);
  });
});
