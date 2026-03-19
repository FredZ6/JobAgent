import { z } from "zod";

export const applicationStatusSchema = z.enum(["queued", "running", "completed", "failed"]);
export const approvalStatusSchema = z.enum([
  "pending_review",
  "approved_for_submit",
  "needs_revision",
  "rejected"
]);
export const submissionStatusSchema = z.enum([
  "not_ready",
  "ready_to_submit",
  "submitted",
  "submit_failed"
]);
export const applicationEventTypeSchema = z.enum([
  "prefill_run",
  "approval_updated",
  "submission_marked",
  "submission_failed",
  "submission_reopened",
  "submission_retry_ready"
]);
export const auditActorTypeSchema = z.enum(["system", "user", "worker", "api"]);
const applicationEventOrchestrationSchema = z.object({
  executionMode: z.enum(["direct", "temporal"]),
  workflowId: z.string().min(1).optional(),
  workflowType: z.string().min(1).optional(),
  taskQueue: z.string().min(1).optional()
});

export const fieldResultSchema = z.object({
  fieldName: z.string().min(1),
  fieldLabel: z.string().min(1).optional(),
  fieldType: z.enum(["basic_text", "resume_upload", "long_text"]).optional(),
  questionText: z.string().min(1).optional(),
  suggestedValue: z.string().optional(),
  filled: z.boolean(),
  status: z.enum(["filled", "unhandled", "failed", "skipped"]).optional(),
  strategy: z.string().min(1).optional(),
  source: z.string().min(1).optional(),
  metadata: z.record(z.unknown()).optional(),
  failureReason: z.string().optional()
});

export const workerLogEntrySchema = z.object({
  level: z.enum(["debug", "info", "warn", "error"]),
  message: z.string().min(1),
  timestamp: z.string().optional()
});

export const finalSubmissionSnapshotSchema = z.object({
  approvalStatus: approvalStatusSchema,
  resumeVersionId: z.string().min(1),
  applyUrl: z.string().url(),
  unresolvedFieldCount: z.number().int().nonnegative(),
  failedFieldCount: z.number().int().nonnegative()
});

export const applicationEventSchema = z.object({
  id: z.string().min(1),
  applicationId: z.string().min(1),
  type: applicationEventTypeSchema,
  actorType: auditActorTypeSchema,
  actorLabel: z.string().min(1),
  actorId: z.string().min(1),
  source: z.string().min(1),
  summary: z.string().min(1),
  orchestration: applicationEventOrchestrationSchema.nullable().optional(),
  payload: z.record(z.unknown()).default({}),
  createdAt: z.string()
});

export const applicationSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  resumeVersionId: z.string().min(1),
  status: applicationStatusSchema,
  approvalStatus: approvalStatusSchema,
  applyUrl: z.string().url(),
  formSnapshot: z.record(z.unknown()).default({}),
  fieldResults: z.array(fieldResultSchema).default([]),
  screenshotPaths: z.array(z.string().min(1)).default([]),
  workerLog: z.array(workerLogEntrySchema).default([]),
  submissionStatus: submissionStatusSchema.default("not_ready"),
  submittedAt: z.string().nullable().default(null),
  submissionNote: z.string().default(""),
  submittedByUser: z.boolean().default(false),
  finalSubmissionSnapshot: finalSubmissionSnapshotSchema.nullable().default(null),
  reviewNote: z.string().default(""),
  errorMessage: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const approvalRequestSchema = z.object({
  approvalStatus: approvalStatusSchema,
  reviewNote: z.string().optional()
});

export const markSubmittedRequestSchema = z.object({
  submissionNote: z.string().optional()
});

export const markSubmitFailedRequestSchema = z.object({
  submissionNote: z.string().optional()
});

export const reopenSubmissionRequestSchema = z.object({
  note: z.string().optional()
});

export const markRetryReadyRequestSchema = z.object({
  note: z.string().optional()
});

export const applicationJobSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  applyUrl: z.string().nullable()
});

export const applicationResumeSummarySchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1),
  status: z.string().min(1)
});

export const submissionReviewSchema = z.object({
  application: applicationSchema,
  job: applicationJobSummarySchema.nullable(),
  resumeVersion: applicationResumeSummarySchema.nullable(),
  unresolvedFieldCount: z.number().int().nonnegative(),
  failedFieldCount: z.number().int().nonnegative()
});

export type ApplicationStatus = z.infer<typeof applicationStatusSchema>;
export type ApprovalStatus = z.infer<typeof approvalStatusSchema>;
export type SubmissionStatus = z.infer<typeof submissionStatusSchema>;
export type ApplicationEventType = z.infer<typeof applicationEventTypeSchema>;
export type AuditActorType = z.infer<typeof auditActorTypeSchema>;
export type FieldResult = z.infer<typeof fieldResultSchema>;
export type WorkerLogEntry = z.infer<typeof workerLogEntrySchema>;
export type FinalSubmissionSnapshot = z.infer<typeof finalSubmissionSnapshotSchema>;
export type ApplicationEvent = z.infer<typeof applicationEventSchema>;
export type ApplicationDto = z.infer<typeof applicationSchema>;
export type ApprovalRequest = z.infer<typeof approvalRequestSchema>;
export type MarkSubmittedRequest = z.infer<typeof markSubmittedRequestSchema>;
export type MarkSubmitFailedRequest = z.infer<typeof markSubmitFailedRequestSchema>;
export type ReopenSubmissionRequest = z.infer<typeof reopenSubmissionRequestSchema>;
export type MarkRetryReadyRequest = z.infer<typeof markRetryReadyRequestSchema>;
export type SubmissionReview = z.infer<typeof submissionReviewSchema>;
