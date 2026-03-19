import { z } from "zod";
import { auditActorTypeSchema } from "./application.js";
import { workflowRunSchema } from "./job.js";

export const orchestrationMetadataSchema = z.object({
  executionMode: z.enum(["direct", "temporal"]),
  workflowId: z.string().min(1).optional(),
  workflowType: z.string().min(1).optional(),
  taskQueue: z.string().min(1).optional()
});

export const jobStageSchema = z.enum([
  "imported",
  "analyzed",
  "resume_ready",
  "prefill_run",
  "pending_review",
  "approved_for_submit",
  "ready_to_submit",
  "submitted",
  "submit_failed",
  "needs_revision",
  "rejected"
]);

export const dashboardMetricsSchema = z.object({
  totalJobs: z.number().int().nonnegative(),
  analyzedJobs: z.number().int().nonnegative(),
  resumeReadyJobs: z.number().int().nonnegative(),
  totalApplications: z.number().int().nonnegative(),
  pendingReviewApplications: z.number().int().nonnegative()
});

export const pipelineCountsSchema = z.object({
  imported: z.number().int().nonnegative(),
  analyzed: z.number().int().nonnegative(),
  resume_ready: z.number().int().nonnegative(),
  prefill_run: z.number().int().nonnegative(),
  pending_review: z.number().int().nonnegative(),
  approved_for_submit: z.number().int().nonnegative(),
  ready_to_submit: z.number().int().nonnegative(),
  submitted: z.number().int().nonnegative(),
  submit_failed: z.number().int().nonnegative(),
  needs_revision: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative()
});

export const approvalBreakdownSchema = z.object({
  pending_review: z.number().int().nonnegative(),
  approved_for_submit: z.number().int().nonnegative(),
  needs_revision: z.number().int().nonnegative(),
  rejected: z.number().int().nonnegative()
});

export const jobTrackerRowSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  stage: jobStageSchema,
  analysisScore: z.number().int().nullable().optional(),
  resumeStatus: z.string().nullable().optional(),
  approvalStatus: z.string().nullable().optional(),
  submissionStatus: z.string().nullable().optional(),
  resumeHeadline: z.string().nullable().optional(),
  latestAnalyzeRun: workflowRunSchema.nullable().optional(),
  latestResumeRun: workflowRunSchema.nullable().optional(),
  latestPrefillRun: workflowRunSchema.nullable().optional()
});

export const dashboardEventTypeSchema = z.enum([
  "job_imported",
  "analysis_completed",
  "resume_generated",
  "prefill_run",
  "approval_updated",
  "submission_marked",
  "submission_failed",
  "submission_reopened",
  "submission_retry_ready"
]);

export const recentActivitySchema = z.object({
  id: z.string().min(1),
  type: dashboardEventTypeSchema,
  label: z.string().min(1),
  jobId: z.string().min(1),
  timestamp: z.string(),
  actorType: auditActorTypeSchema,
  actorLabel: z.string().min(1),
  actorId: z.string().min(1),
  source: z.string().min(1),
  summary: z.string().min(1),
  orchestration: orchestrationMetadataSchema.nullable().optional()
});

export const timelineEntityTypeSchema = z.enum(["job", "application"]);

export const timelineItemSchema = z.object({
  id: z.string().min(1),
  entityType: timelineEntityTypeSchema,
  entityId: z.string().min(1),
  jobId: z.string().min(1),
  applicationId: z.string().nullable(),
  type: dashboardEventTypeSchema,
  label: z.string().min(1),
  timestamp: z.string(),
  actorType: auditActorTypeSchema,
  actorLabel: z.string().min(1),
  actorId: z.string().min(1),
  source: z.string().min(1),
  summary: z.string().min(1),
  orchestration: orchestrationMetadataSchema.nullable().optional(),
  status: z.string().nullable().default(null),
  meta: z.record(z.unknown()).default({})
});

export const jobTimelineSchema = z.object({
  jobId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  location: z.string().min(1),
  events: z.array(timelineItemSchema)
});

export const applicationTimelineSchema = z.object({
  applicationId: z.string().min(1),
  jobId: z.string().min(1),
  title: z.string().min(1),
  company: z.string().min(1),
  approvalStatus: z.string().nullable().default(null),
  submissionStatus: z.string().nullable().default(null),
  events: z.array(timelineItemSchema)
});

export const dashboardOverviewSchema = z.object({
  metrics: dashboardMetricsSchema,
  pipeline: pipelineCountsSchema,
  approvalBreakdown: approvalBreakdownSchema,
  jobs: z.array(jobTrackerRowSchema),
  recentActivity: z.array(recentActivitySchema)
});

export const dashboardHistorySchema = z.object({
  globalTimeline: z.array(timelineItemSchema),
  jobTimelines: z.array(jobTimelineSchema),
  applicationTimelines: z.array(applicationTimelineSchema)
});

export type JobStage = z.infer<typeof jobStageSchema>;
export type OrchestrationMetadata = z.infer<typeof orchestrationMetadataSchema>;
export type DashboardEventType = z.infer<typeof dashboardEventTypeSchema>;
export type DashboardMetrics = z.infer<typeof dashboardMetricsSchema>;
export type PipelineCounts = z.infer<typeof pipelineCountsSchema>;
export type ApprovalBreakdown = z.infer<typeof approvalBreakdownSchema>;
export type JobTrackerRow = z.infer<typeof jobTrackerRowSchema>;
export type RecentActivity = z.infer<typeof recentActivitySchema>;
export type DashboardOverview = z.infer<typeof dashboardOverviewSchema>;
export type TimelineEntityType = z.infer<typeof timelineEntityTypeSchema>;
export type TimelineItem = z.infer<typeof timelineItemSchema>;
export type JobTimeline = z.infer<typeof jobTimelineSchema>;
export type ApplicationTimeline = z.infer<typeof applicationTimelineSchema>;
export type DashboardHistory = z.infer<typeof dashboardHistorySchema>;
