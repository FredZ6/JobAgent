import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { Prisma } from "@prisma/client";
import { z } from "zod";

import type {
  ApplicationTimeline,
  DashboardEventType,
  DashboardHistory,
  DashboardOverview,
  JobStage,
  JobTimeline,
  OrchestrationMetadata,
  TimelineEntityType,
  TimelineItem,
  WorkflowRun
} from "@rolecraft/shared-types";
import { auditActorTypeSchema, orchestrationMetadataSchema, workflowRunSchema } from "@rolecraft/shared-types";
import { PrismaService } from "../lib/prisma.service.js";

type JobWithRelations = Prisma.JobGetPayload<{
  include: {
    analyses: { orderBy: { createdAt: "desc" }; take: 1 };
    resumeVersions: { orderBy: { createdAt: "desc" }; take: 1 };
    applications: { orderBy: { createdAt: "desc" }; take: 1 };
  };
}>;

type ApplicationWithContext = Prisma.ApplicationGetPayload<{
  include: { job: true; resumeVersion: true };
}>;

type ApplicationEventWithApplication = {
  id: string;
  applicationId: string;
  type: string;
  actorType?: string;
  actorLabel?: string;
  actorId?: string | null;
  source?: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
  application: {
    jobId: string;
  };
};

type JobEventRecord = {
  id: string;
  jobId: string;
  type: string;
  actorType?: string;
  actorLabel?: string;
  actorId?: string | null;
  source?: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
};

type WorkflowRunRecord = {
  id: string;
  jobId: string;
  applicationId: string | null;
  resumeVersionId: string | null;
  kind: string;
  status: string;
  executionMode: string;
  workflowId: string | null;
  workflowType: string | null;
  taskQueue: string | null;
  startedAt: Date | null;
  completedAt: Date | null;
  errorMessage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const dashboardTimelineQuerySchema = z.object({
  actorType: auditActorTypeSchema.optional(),
  entityType: z.enum(["job", "application"]).optional(),
  eventType: z
    .enum([
      "job_imported",
      "analysis_completed",
      "resume_generated",
      "prefill_run",
      "approval_updated",
      "submission_marked",
      "submission_failed",
      "submission_reopened",
      "submission_retry_ready"
    ])
    .optional(),
  source: z.string().min(1).optional(),
  q: z.string().trim().optional(),
  from: z.string().min(1).optional(),
  to: z.string().min(1).optional(),
  limit: z.coerce.number().int().positive().max(100).optional()
});

@Injectable()
export class DashboardService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async getOverview(): Promise<DashboardOverview> {
    const { jobs, applications, applicationEvents, jobEvents, workflowRuns } =
      await this.loadDashboardRecords({ includeWorkflowRuns: true });

    const metrics = this.buildMetrics(jobs, applications);
    const pipeline = this.buildPipeline(jobs);
    const approvalBreakdown = this.buildApprovalBreakdown(applications);
    const latestRunsByJob = this.buildLatestWorkflowRunsByJob(workflowRuns);
    const jobRows = jobs.map((job) => this.buildJobTrackerRow(job, latestRunsByJob.get(job.id)));
    const recentActivity = this.buildRecentActivity(jobs, applications, applicationEvents, jobEvents);

    return {
      metrics,
      pipeline,
      approvalBreakdown,
      jobs: jobRows,
      recentActivity
    };
  }

  async getTimeline(rawFilters?: unknown): Promise<TimelineItem[]> {
    const filters = dashboardTimelineQuerySchema.parse(rawFilters ?? {});
    const { jobs, applications, applicationEvents, jobEvents } = await this.loadDashboardRecords();
    const timeline = this.buildTimelineItems(jobs, applications, applicationEvents, jobEvents);

    return timeline
      .filter((item) => !filters.actorType || item.actorType === filters.actorType)
      .filter((item) => !filters.entityType || item.entityType === filters.entityType)
      .filter((item) => !filters.eventType || item.type === filters.eventType)
      .filter((item) => !filters.source || item.source === filters.source)
      .filter((item) => this.matchesTimelineDateRange(item.timestamp, filters.from, filters.to))
      .filter((item) => this.matchesTimelineQuery(item, filters.q))
      .slice(0, filters.limit ?? 20);
  }

  async getHistory(): Promise<DashboardHistory> {
    const { jobs, applications, applicationEvents, jobEvents } = await this.loadDashboardRecords();
    const timeline = this.buildTimelineItems(jobs, applications, applicationEvents, jobEvents);

    return {
      globalTimeline: timeline.slice(0, 20),
      jobTimelines: this.buildJobTimelines(jobs, timeline),
      applicationTimelines: this.buildApplicationTimelines(applications, timeline)
    };
  }

  private buildMetrics(jobs: JobWithRelations[], applications: ApplicationWithContext[]) {
    const totalJobs = jobs.length;
    const analyzedJobs = jobs.filter((job) => job.analyses[0]?.status === "completed").length;
    const resumeReadyJobs = jobs.filter((job) => job.resumeVersions[0]?.status === "completed").length;
    const totalApplications = applications.length;
    const pendingReviewApplications = applications.filter(
      (application) => application.approvalStatus === "pending_review"
    ).length;

    return {
      totalJobs,
      analyzedJobs,
      resumeReadyJobs,
      totalApplications,
      pendingReviewApplications
    };
  }

  private buildPipeline(jobs: JobWithRelations[]) {
    const counts: Record<JobStage, number> = {
      imported: 0,
      analyzed: 0,
      resume_ready: 0,
      prefill_run: 0,
      pending_review: 0,
      approved_for_submit: 0,
      ready_to_submit: 0,
      submitted: 0,
      submit_failed: 0,
      needs_revision: 0,
      rejected: 0
    };

    jobs.forEach((job) => {
      const stage = this.deriveStage(job);
      counts[stage] += 1;
    });

    return counts;
  }

  private buildApprovalBreakdown(applications: ApplicationWithContext[]) {
    const breakdown = {
      pending_review: 0,
      approved_for_submit: 0,
      needs_revision: 0,
      rejected: 0
    };

    applications.forEach((application) => {
      const status = application.approvalStatus;
      if (status === "pending_review" || status === "approved_for_submit" || status === "needs_revision" || status === "rejected") {
        breakdown[status] += 1;
      }
    });

    return breakdown;
  }

  private buildJobTrackerRow(
    job: JobWithRelations,
    latestRuns?: Partial<Record<"analyze" | "generate_resume" | "prefill", WorkflowRun>>
  ) {
    const latestAnalysis = job.analyses[0];
    const latestResume = job.resumeVersions[0];
    const latestApplication = job.applications[0];
    const stage = this.deriveStage(job);

    return {
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      stage,
      analysisScore: latestAnalysis?.matchScore ?? null,
      resumeStatus: latestResume?.status ?? null,
      approvalStatus: latestApplication?.approvalStatus ?? null,
      submissionStatus: latestApplication?.submissionStatus ?? null,
      resumeHeadline: latestResume?.headline ?? null,
      latestAnalyzeRun: latestRuns?.analyze ?? null,
      latestResumeRun: latestRuns?.generate_resume ?? null,
      latestPrefillRun: latestRuns?.prefill ?? null
    };
  }

  private buildRecentActivity(
    jobs: JobWithRelations[],
    applications: ApplicationWithContext[],
    applicationEvents: ApplicationEventWithApplication[],
    jobEvents: JobEventRecord[]
  ) {
    return this.buildTimelineItems(jobs, applications, applicationEvents, jobEvents)
      .map((item) => ({
        id: item.id,
        type: item.type,
        label: item.label,
        jobId: item.jobId,
        timestamp: item.timestamp,
        actorType: item.actorType,
        actorLabel: item.actorLabel,
        actorId: item.actorId,
        source: item.source,
        summary: item.summary,
        orchestration: item.orchestration ?? null
      }))
      .slice(0, 10);
  }

  private async loadDashboardRecords(options?: { includeWorkflowRuns?: boolean }) {
    const jobs = await this.prisma.job.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        analyses: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        resumeVersions: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        applications: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    const applications = await this.prisma.application.findMany({
      orderBy: {
        updatedAt: "desc"
      },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    const applicationEvents = await this.prismaWithApplicationEvents().applicationEvent.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        application: {
          select: {
            jobId: true
          }
        }
      },
      take: 100
    });

    const jobEvents = await this.prismaWithJobEvents().jobEvent.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 100
    });

    const workflowRuns =
      options?.includeWorkflowRuns && jobs.length > 0
        ? await this.prisma.workflowRun.findMany({
            where: {
              jobId: {
                in: jobs.map((job) => job.id)
              }
            },
            orderBy: {
              createdAt: "desc"
            }
          })
        : [];

    return { jobs, applications, applicationEvents, jobEvents, workflowRuns };
  }

  private buildLatestWorkflowRunsByJob(workflowRuns: WorkflowRunRecord[]) {
    const latestRunsByJob = new Map<
      string,
      Partial<Record<"analyze" | "generate_resume" | "prefill", WorkflowRun>>
    >();

    workflowRuns.forEach((run) => {
      if (run.kind !== "analyze" && run.kind !== "generate_resume" && run.kind !== "prefill") {
        return;
      }

      if (!latestRunsByJob.has(run.jobId)) {
        latestRunsByJob.set(run.jobId, {});
      }

      const jobRuns = latestRunsByJob.get(run.jobId);
      if (jobRuns && jobRuns[run.kind] == null) {
        jobRuns[run.kind] = this.mapWorkflowRun(run);
      }
    });

    return latestRunsByJob;
  }

  private buildTimelineItems(
    jobs: JobWithRelations[],
    applications: ApplicationWithContext[],
    applicationEvents: ApplicationEventWithApplication[],
    jobEvents: JobEventRecord[]
  ): TimelineItem[] {
    const items: TimelineItem[] = [];
    const jobMilestones = new Map<string, Set<string>>();
    const applicationMilestones = new Map<string, Set<string>>();

    jobEvents.forEach((event) => {
      if (!this.isMilestoneJobEventType(event.type)) {
        return;
      }

      if (!jobMilestones.has(event.jobId)) {
        jobMilestones.set(event.jobId, new Set<string>());
      }
      jobMilestones.get(event.jobId)?.add(event.type);

      items.push(
        this.createTimelineItem({
          id: event.id,
          entityType: "job",
          entityId: event.jobId,
          jobId: event.jobId,
          applicationId: null,
          type: event.type,
          label: this.getJobEventLabel(event.type),
          timestamp: event.createdAt.toISOString(),
          actorType: this.toActorType(event.actorType),
          actorLabel: event.actorLabel ?? "system",
          actorId: event.actorId ?? event.actorLabel ?? "system",
          source: event.source ?? "system",
          summary: this.getJobEventSummary(event.type, event.payload),
          orchestration: this.getOrchestrationMetadata(event.payload),
          status: this.getJobEventStatus(event.payload),
          meta: this.toMetaRecord(event.payload)
        })
      );
    });

    applicationEvents.forEach((event) => {
      if (event.type !== "prefill_run") {
        return;
      }

      if (!applicationMilestones.has(event.applicationId)) {
        applicationMilestones.set(event.applicationId, new Set<string>());
      }

      applicationMilestones.get(event.applicationId)?.add(event.type);
    });

    jobs.forEach((job) => {
      const jobEventTypes = jobMilestones.get(job.id) ?? new Set<string>();

      if (!jobEventTypes.has("job_imported")) {
        items.push(
          this.createTimelineItem({
            id: `job_imported-${job.id}-${job.createdAt.toISOString()}`,
            entityType: "job",
            entityId: job.id,
            jobId: job.id,
            applicationId: null,
            type: "job_imported",
            label: "Job imported",
            timestamp: job.createdAt.toISOString(),
            actorType: "api",
            actorLabel: "apps-api",
            actorId: "apps-api",
            source: "derived-job-record",
            summary: "Job imported",
            orchestration: null,
            status: "imported",
            meta: {
              title: job.title,
              company: job.company
            }
          })
        );
      }

      const latestAnalysis = job.analyses[0];
      if (latestAnalysis?.status === "completed" && !jobEventTypes.has("analysis_completed")) {
        items.push(
          this.createTimelineItem({
            id: `analysis_completed-${job.id}-${latestAnalysis.createdAt.toISOString()}`,
            entityType: "job",
            entityId: job.id,
            jobId: job.id,
            applicationId: null,
            type: "analysis_completed",
            label: "Analysis completed",
            timestamp: latestAnalysis.createdAt.toISOString(),
            actorType: "api",
            actorLabel: "apps-api",
            actorId: "apps-api",
            source: "derived-job-record",
            summary: latestAnalysis.summary || "Analysis completed",
            orchestration: null,
            status: latestAnalysis.status,
            meta: {
              matchScore: latestAnalysis.matchScore
            }
          })
        );
      }

      const latestResume = job.resumeVersions[0];
      if (latestResume?.status === "completed" && !jobEventTypes.has("resume_generated")) {
        items.push(
          this.createTimelineItem({
            id: `resume_generated-${job.id}-${latestResume.createdAt.toISOString()}`,
            entityType: "job",
            entityId: job.id,
            jobId: job.id,
            applicationId: null,
            type: "resume_generated",
            label: "Resume generated",
            timestamp: latestResume.createdAt.toISOString(),
            actorType: "api",
            actorLabel: "apps-api",
            actorId: "apps-api",
            source: "derived-job-record",
            summary: latestResume.headline || "Resume generated",
            orchestration: null,
            status: latestResume.status,
            meta: {
              headline: latestResume.headline
            }
          })
        );
      }
    });

    applications.forEach((application) => {
      if (!(applicationMilestones.get(application.id)?.has("prefill_run") ?? false)) {
        items.push(
          this.createTimelineItem({
            id: `prefill_run-${application.id}-${application.createdAt.toISOString()}`,
            entityType: "application",
            entityId: application.id,
            jobId: application.jobId,
            applicationId: application.id,
            type: "prefill_run",
            label: "Prefill run",
            timestamp: application.createdAt.toISOString(),
            actorType: "worker",
            actorLabel: "playwright-worker",
            actorId: "playwright-worker",
            source: "derived-application-record",
            summary: application.status,
            orchestration: null,
            status: application.status,
            meta: {
              title: application.job.title,
              company: application.job.company
            }
          })
        );
      }
    });

    applicationEvents.forEach((event) => {
      if (!this.isDashboardEventType(event.type)) {
        return;
      }

      items.push(
        this.createTimelineItem({
          id: event.id,
          entityType: "application",
          entityId: event.applicationId,
          jobId: event.application.jobId,
          applicationId: event.applicationId,
          type: event.type,
          label: this.getApplicationEventLabel(event.type, event.payload),
          timestamp: event.createdAt.toISOString(),
          actorType: this.toActorType(event.actorType),
          actorLabel: event.actorLabel ?? "system",
          actorId: event.actorId ?? event.actorLabel ?? "system",
          source: event.source ?? "system",
          summary: this.getApplicationEventSummary(event.type, event.payload),
          orchestration: this.getOrchestrationMetadata(event.payload),
          status: this.getApplicationEventStatus(event.payload),
          meta: this.toMetaRecord(event.payload)
        })
      );
    });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  private buildJobTimelines(jobs: JobWithRelations[], timeline: TimelineItem[]): JobTimeline[] {
    return jobs.map((job) => ({
      jobId: job.id,
      title: job.title,
      company: job.company,
      location: job.location,
      events: timeline
        .filter((item) => item.jobId === job.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }));
  }

  private buildApplicationTimelines(
    applications: ApplicationWithContext[],
    timeline: TimelineItem[]
  ): ApplicationTimeline[] {
    return applications.map((application) => ({
      applicationId: application.id,
      jobId: application.jobId,
      title: application.job.title,
      company: application.job.company,
      approvalStatus: application.approvalStatus,
      submissionStatus: application.submissionStatus,
      events: timeline
        .filter((item) => item.applicationId === application.id)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
    }));
  }

  private prismaWithApplicationEvents() {
    return this.prisma as PrismaService & {
      applicationEvent: {
        findMany(args: {
          orderBy: { createdAt: "desc" };
          include: { application: { select: { jobId: true } } };
          take: number;
        }): Promise<ApplicationEventWithApplication[]>;
      };
    };
  }

  private prismaWithJobEvents() {
    return this.prisma as PrismaService & {
      jobEvent: {
        findMany(args: {
          orderBy: { createdAt: "desc" };
          take: number;
        }): Promise<JobEventRecord[]>;
      };
    };
  }

  private mapWorkflowRun(run: WorkflowRunRecord) {
    return workflowRunSchema.parse({
      ...run,
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString()
    });
  }

  private getApplicationEventLabel(type: string, payload: Prisma.JsonValue) {
    const payloadRecord =
      payload && typeof payload === "object" && !Array.isArray(payload)
        ? (payload as Record<string, unknown>)
        : {};

    if (type === "approval_updated") {
      return `Approval ${String(payloadRecord.approvalStatus ?? "updated")}`;
    }

    if (type === "prefill_run") {
      return "Prefill run";
    }

    if (type === "submission_marked") {
      return "Submission marked as submitted";
    }

    if (type === "submission_failed") {
      return "Submission marked failed";
    }

    if (type === "submission_reopened") {
      return "Submission reopened";
    }

    return "Submission ready to retry";
  }

  private getApplicationEventStatus(payload: Prisma.JsonValue) {
    const payloadRecord = this.toMetaRecord(payload);

    if (typeof payloadRecord.toStatus === "string") {
      return payloadRecord.toStatus;
    }

    if (typeof payloadRecord.submissionStatus === "string") {
      return payloadRecord.submissionStatus;
    }

    if (typeof payloadRecord.approvalStatus === "string") {
      return payloadRecord.approvalStatus;
    }

    return null;
  }

  private isDashboardEventType(type: string): type is DashboardEventType {
    return (
      type === "prefill_run" ||
      type === "approval_updated" ||
      type === "submission_marked" ||
      type === "submission_failed" ||
      type === "submission_reopened" ||
      type === "submission_retry_ready"
    );
  }

  private isMilestoneJobEventType(type: string): type is "job_imported" | "analysis_completed" | "resume_generated" {
    return type === "job_imported" || type === "analysis_completed" || type === "resume_generated";
  }

  private toActorType(actorType: string | undefined): "system" | "user" | "worker" | "api" {
    return actorType === "system" || actorType === "user" || actorType === "worker" || actorType === "api"
      ? actorType
      : "system";
  }

  private getJobEventLabel(type: string) {
    if (type === "analysis_completed") {
      return "Analysis completed";
    }

    if (type === "resume_generated") {
      return "Resume generated";
    }

    return "Job imported";
  }

  private getJobEventStatus(payload: Prisma.JsonValue) {
    const payloadRecord = this.toMetaRecord(payload);
    if (typeof payloadRecord.status === "string") {
      return payloadRecord.status;
    }

    if (typeof payloadRecord.importStatus === "string") {
      return payloadRecord.importStatus;
    }

    return null;
  }

  private getJobEventSummary(type: string, payload: Prisma.JsonValue) {
    const payloadRecord = this.toMetaRecord(payload);
    if (type === "analysis_completed") {
      return typeof payloadRecord.summary === "string" && payloadRecord.summary.length > 0
        ? payloadRecord.summary
        : "Analysis completed";
    }

    if (type === "resume_generated") {
      return typeof payloadRecord.headline === "string" && payloadRecord.headline.length > 0
        ? payloadRecord.headline
        : "Resume generated";
    }

    return "Job imported";
  }

  private createTimelineItem(input: {
    id: string;
    entityType: TimelineEntityType;
    entityId: string;
    jobId: string;
    applicationId: string | null;
    type: DashboardEventType;
    label: string;
    timestamp: string;
    actorType: "system" | "user" | "worker" | "api";
    actorLabel: string;
    actorId: string;
    source: string;
    summary: string;
    orchestration: OrchestrationMetadata | null;
    status: string | null;
    meta: Record<string, unknown>;
  }): TimelineItem {
    return input;
  }

  private getOrchestrationMetadata(payload: Prisma.JsonValue) {
    const metaRecord = this.toMetaRecord(payload);
    if (!("orchestration" in metaRecord)) {
      return null;
    }

    const result = orchestrationMetadataSchema.safeParse(metaRecord.orchestration);
    return result.success ? result.data : null;
  }

  private getApplicationEventSummary(type: string, payload: Prisma.JsonValue) {
    const payloadRecord = this.toMetaRecord(payload);
    const note =
      typeof payloadRecord.note === "string" && payloadRecord.note.length > 0
        ? payloadRecord.note
        : typeof payloadRecord.reviewNote === "string" && payloadRecord.reviewNote.length > 0
          ? payloadRecord.reviewNote
          : "";
    const fromStatus =
      typeof payloadRecord.fromStatus === "string" && payloadRecord.fromStatus.length > 0
        ? payloadRecord.fromStatus
        : "";
    const toStatus =
      typeof payloadRecord.toStatus === "string" && payloadRecord.toStatus.length > 0
        ? payloadRecord.toStatus
        : "";
    const approvalStatus =
      typeof payloadRecord.approvalStatus === "string" && payloadRecord.approvalStatus.length > 0
        ? payloadRecord.approvalStatus
        : "";
    const submissionStatus =
      typeof payloadRecord.submissionStatus === "string" && payloadRecord.submissionStatus.length > 0
        ? payloadRecord.submissionStatus
        : "";
    const reasonCode =
      typeof payloadRecord.reasonCode === "string" && payloadRecord.reasonCode.length > 0
        ? payloadRecord.reasonCode
        : "";
    const screenshotCount =
      typeof payloadRecord.screenshotCount === "number" && Number.isFinite(payloadRecord.screenshotCount)
        ? payloadRecord.screenshotCount
        : null;
    const fieldResultCount =
      typeof payloadRecord.fieldResultCount === "number" && Number.isFinite(payloadRecord.fieldResultCount)
        ? payloadRecord.fieldResultCount
        : null;

    if (type === "prefill_run") {
      const base = submissionStatus || "prefill_run";
      const details = [
        fieldResultCount != null ? `${fieldResultCount} fields` : "",
        screenshotCount != null ? `${screenshotCount} screenshots` : ""
      ].filter((value) => value.length > 0);
      const statusLine = details.length > 0 ? `${base} · ${details.join(", ")}` : base;
      return note ? `${statusLine} · ${note}` : statusLine;
    }

    if (fromStatus && toStatus) {
      return note ? `${fromStatus} -> ${toStatus} · ${note}` : `${fromStatus} -> ${toStatus}`;
    }

    if (approvalStatus) {
      return note ? `${approvalStatus} · ${note}` : approvalStatus;
    }

    if (submissionStatus) {
      const base = reasonCode ? `${submissionStatus} (${reasonCode})` : submissionStatus;
      return note ? `${base} · ${note}` : base;
    }

    return note || this.getApplicationEventLabel(type, payload);
  }

  private toMetaRecord(payload: Prisma.JsonValue) {
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  }

  private matchesTimelineQuery(item: TimelineItem, query?: string) {
    const normalized = query?.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    const metaText = this.flattenSearchValues(item.meta).join(" ");
    const haystack = [
      item.id,
      item.entityId,
      item.jobId,
      item.applicationId ?? "",
      item.label,
      item.summary,
      item.actorType,
      item.actorLabel,
      item.actorId,
      item.source,
      item.status ?? "",
      metaText
    ]
      .filter((value) => value.length > 0)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  }

  private flattenSearchValues(value: unknown): string[] {
    if (typeof value === "string") {
      return value.length > 0 ? [value] : [];
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return [String(value)];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.flattenSearchValues(entry));
    }

    if (value && typeof value === "object") {
      return Object.values(value).flatMap((entry) => this.flattenSearchValues(entry));
    }

    return [];
  }

  private matchesTimelineDateRange(timestamp: string, from?: string, to?: string) {
    const time = new Date(timestamp).getTime();
    if (Number.isNaN(time)) {
      return false;
    }

    const fromTime = this.parseFilterDate(from, "from");
    if (fromTime && time < fromTime.getTime()) {
      return false;
    }

    const toTime = this.parseFilterDate(to, "to");
    if (toTime && time > toTime.getTime()) {
      return false;
    }

    return true;
  }

  private parseFilterDate(value: string | undefined, side: "from" | "to") {
    if (!value) {
      return null;
    }

    const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
    const normalized = dateOnlyMatch
      ? `${value}${side === "from" ? "T00:00:00.000Z" : "T23:59:59.999Z"}`
      : value;
    const parsed = new Date(normalized);

    if (Number.isNaN(parsed.getTime())) {
      throw new BadRequestException(`Invalid ${side} date filter`);
    }

    return parsed;
  }

  private deriveStage(job: JobWithRelations): JobStage {
    const application = job.applications[0];
    if (application) {
      if (application.submissionStatus === "submitted") {
        return "submitted";
      }

      if (application.submissionStatus === "submit_failed") {
        return "submit_failed";
      }

      if (
        application.submissionStatus === "ready_to_submit" ||
        application.approvalStatus === "approved_for_submit"
      ) {
        return "ready_to_submit";
      }

      if (application.approvalStatus && application.approvalStatus !== "pending_review") {
        return application.approvalStatus as JobStage;
      }

      if (application.approvalStatus === "pending_review") {
        return "pending_review";
      }

      return "prefill_run";
    }

    const resume = job.resumeVersions[0];
    if (resume?.status === "completed") {
      return "resume_ready";
    }

    const analysis = job.analyses[0];
    if (analysis?.status === "completed") {
      return "analyzed";
    }

    return "imported";
  }
}
