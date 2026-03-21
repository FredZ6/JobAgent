import { z } from "zod";

import {
  approvalStatusSchema,
  applicationStatusSchema,
  submissionStatusSchema
} from "./application.js";

export const jobImportRequestSchema = z.object({
  sourceUrl: z.string().url()
});

export const jobImportSourceSchema = z.enum(["live_html", "synthetic_fallback"]);

export const jobImportSummarySchema = z.object({
  source: jobImportSourceSchema,
  warnings: z.array(z.string().min(1)),
  hasWarnings: z.boolean(),
  statusLabel: z.string().min(1)
});

export const jobImportDiagnosticsSchema = z.object({
  fetchStatus: z.number().int().nullable().optional(),
  usedJsonLd: z.boolean().optional(),
  usedBodyFallback: z.boolean().optional(),
  applyUrlSource: z.string().nullable().optional(),
  titleSource: z.string().nullable().optional(),
  companySource: z.string().nullable().optional(),
  descriptionSource: z.string().nullable().optional()
});

export const jobSchema = z.object({
  id: z.string().min(1),
  sourceUrl: z.string().url(),
  applyUrl: z.string().url().nullable(),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  description: z.string().min(1),
  rawText: z.string().min(1),
  importStatus: z.enum(["imported", "failed"]),
  importSummary: jobImportSummarySchema.optional(),
  importDiagnostics: jobImportDiagnosticsSchema.optional(),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const jobAnalysisResultSchema = z.object({
  matchScore: z.number().int().min(0).max(100),
  summary: z.string().min(1),
  requiredSkills: z.array(z.string().min(1)),
  missingSkills: z.array(z.string().min(1)),
  redFlags: z.array(z.string().min(1))
});

export const workflowRunKindSchema = z.enum(["analyze", "generate_resume", "prefill"]);
export const workflowRunStatusSchema = z.enum([
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled"
]);
export const maxWorkflowRunsBulkMutationTargets = 5;
export const workflowRunExecutionModeSchema = z.enum(["direct", "temporal"]);
export const workflowRunSortBySchema = z.enum([
  "createdAt",
  "startedAt",
  "completedAt",
  "status",
  "kind"
]);
export const workflowRunSortOrderSchema = z.enum(["asc", "desc"]);
export const workflowRunEventTypeSchema = z.enum([
  "run_queued",
  "run_started",
  "run_pause_requested",
  "run_paused",
  "run_resumed",
  "run_completed",
  "run_failed",
  "run_cancelled",
  "run_retried"
]);
export const workflowRunBulkActionStatusSchema = z.enum(["success", "skipped", "failed"]);
export const workflowRunsListQuerySchema = z.object({
  kind: workflowRunKindSchema.optional(),
  status: workflowRunStatusSchema.optional(),
  executionMode: workflowRunExecutionModeSchema.optional(),
  q: z.string().trim().optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  sortBy: workflowRunSortBySchema.optional(),
  sortOrder: workflowRunSortOrderSchema.optional(),
  cursor: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});
export const workflowRunsBulkActionRequestSchema = z.object({
  runIds: z.array(z.string().min(1)).min(1)
});

export const workflowRunSchema = z.object({
  id: z.string().min(1),
  jobId: z.string().min(1),
  retryOfRunId: z.string().nullable().default(null),
  applicationId: z.string().nullable().default(null),
  resumeVersionId: z.string().nullable().default(null),
  kind: workflowRunKindSchema,
  status: workflowRunStatusSchema,
  executionMode: workflowRunExecutionModeSchema,
  workflowId: z.string().nullable().default(null),
  workflowType: z.string().nullable().default(null),
  taskQueue: z.string().nullable().default(null),
  startedAt: z.string().nullable().default(null),
  completedAt: z.string().nullable().default(null),
  pauseRequestedAt: z.string().nullable().default(null),
  pausedAt: z.string().nullable().default(null),
  pauseReason: z.string().nullable().default(null),
  resumeRequestedAt: z.string().nullable().default(null),
  errorMessage: z.string().nullable().default(null),
  createdAt: z.string(),
  updatedAt: z.string()
});

export const workflowRunEventSchema = z.object({
  id: z.string().min(1),
  workflowRunId: z.string().min(1),
  type: workflowRunEventTypeSchema,
  payload: z.record(z.unknown()).default({}),
  createdAt: z.string()
});

export const workflowRunJobSummarySchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1)
});

export const workflowRunApplicationSummarySchema = z.object({
  id: z.string().min(1),
  status: applicationStatusSchema,
  approvalStatus: approvalStatusSchema,
  submissionStatus: submissionStatusSchema,
  createdAt: z.string()
});

export const workflowRunResumeSummarySchema = z.object({
  id: z.string().min(1),
  headline: z.string().min(1),
  status: z.enum(["draft", "completed", "failed"])
});

export const workflowRunsListSummarySchema = z.object({
  totalRuns: z.number().int().nonnegative(),
  queuedRuns: z.number().int().nonnegative(),
  runningRuns: z.number().int().nonnegative(),
  completedRuns: z.number().int().nonnegative(),
  failedRuns: z.number().int().nonnegative(),
  cancelledRuns: z.number().int().nonnegative()
});

export const workflowRunsPageInfoSchema = z.object({
  nextCursor: z.string().nullable(),
  hasMore: z.boolean(),
  returnedCount: z.number().int().nonnegative()
});

export const workflowRunListApplicationSummarySchema = z.object({
  id: z.string().min(1),
  status: applicationStatusSchema
});

export const workflowRunListItemSchema = z.object({
  workflowRun: workflowRunSchema,
  job: workflowRunJobSummarySchema,
  application: workflowRunListApplicationSummarySchema.nullable(),
  resumeVersion: workflowRunResumeSummarySchema.nullable()
});

export const workflowRunsListResponseSchema = z.object({
  summary: workflowRunsListSummarySchema,
  pageInfo: workflowRunsPageInfoSchema,
  runs: z.array(workflowRunListItemSchema)
});
export const workflowRunBulkActionResultSchema = z.object({
  runId: z.string().min(1),
  status: workflowRunBulkActionStatusSchema,
  message: z.string().min(1),
  workflowRun: z.lazy(() => workflowRunDetailSchema).nullable().default(null)
});
export const workflowRunsBulkActionResponseSchema = z.object({
  requestedCount: z.number().int().nonnegative(),
  eligibleCount: z.number().int().nonnegative(),
  skippedCount: z.number().int().nonnegative(),
  successCount: z.number().int().nonnegative(),
  failureCount: z.number().int().nonnegative(),
  results: z.array(workflowRunBulkActionResultSchema)
});

export const workflowRunDetailSchema = z.object({
  workflowRun: workflowRunSchema,
  job: workflowRunJobSummarySchema,
  application: workflowRunApplicationSummarySchema.nullable(),
  resumeVersion: workflowRunResumeSummarySchema.nullable(),
  retryOfRun: z.lazy(() => workflowRunSchema).nullable(),
  latestRetry: z.lazy(() => workflowRunSchema).nullable()
});

export type JobImportRequest = z.infer<typeof jobImportRequestSchema>;
export type JobImportSource = z.infer<typeof jobImportSourceSchema>;
export type JobImportSummary = z.infer<typeof jobImportSummarySchema>;
export type JobImportDiagnostics = z.infer<typeof jobImportDiagnosticsSchema>;
export type JobDto = z.infer<typeof jobSchema>;
export type JobAnalysisResult = z.infer<typeof jobAnalysisResultSchema>;
export type WorkflowRunKind = z.infer<typeof workflowRunKindSchema>;
export type WorkflowRunStatus = z.infer<typeof workflowRunStatusSchema>;
export type WorkflowRunExecutionMode = z.infer<typeof workflowRunExecutionModeSchema>;
export type WorkflowRunSortBy = z.infer<typeof workflowRunSortBySchema>;
export type WorkflowRunSortOrder = z.infer<typeof workflowRunSortOrderSchema>;
export type WorkflowRun = z.infer<typeof workflowRunSchema>;
export type WorkflowRunEventType = z.infer<typeof workflowRunEventTypeSchema>;
export type WorkflowRunEvent = z.infer<typeof workflowRunEventSchema>;
export type WorkflowRunBulkActionStatus = z.infer<typeof workflowRunBulkActionStatusSchema>;
export type WorkflowRunsBulkActionRequest = z.infer<typeof workflowRunsBulkActionRequestSchema>;
export type WorkflowRunBulkActionResult = z.infer<typeof workflowRunBulkActionResultSchema>;
export type WorkflowRunsBulkActionResponse = z.infer<
  typeof workflowRunsBulkActionResponseSchema
>;
export type WorkflowRunDetail = z.infer<typeof workflowRunDetailSchema>;
export type WorkflowRunsListQuery = z.infer<typeof workflowRunsListQuerySchema>;
export type WorkflowRunsListSummary = z.infer<typeof workflowRunsListSummarySchema>;
export type WorkflowRunsPageInfo = z.infer<typeof workflowRunsPageInfoSchema>;
export type WorkflowRunListItem = z.infer<typeof workflowRunListItemSchema>;
export type WorkflowRunsListResponse = z.infer<typeof workflowRunsListResponseSchema>;
