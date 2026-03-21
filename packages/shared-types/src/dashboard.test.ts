import { describe, expect, it } from "vitest";
import {
  approvalBreakdownSchema,
  applicationTimelineSchema,
  dashboardOverviewSchema,
  dashboardHistorySchema,
  dashboardMetricsSchema,
  jobStageSchema,
  jobTimelineSchema,
  jobTrackerRowSchema,
  pipelineCountsSchema,
  recentActivitySchema,
  timelineEntityTypeSchema,
  timelineItemSchema
} from "./dashboard.js";

describe("jobStageSchema", () => {
  it("parses valid stage", () => {
    expect(jobStageSchema.parse("prefill_run")).toBe("prefill_run");
  });

  it("parses submission-safe stages", () => {
    expect(jobStageSchema.parse("ready_to_submit")).toBe("ready_to_submit");
    expect(jobStageSchema.parse("submitted")).toBe("submitted");
    expect(jobStageSchema.parse("submit_failed")).toBe("submit_failed");
  });

  it("rejects unknown stage", () => {
    expect(() => jobStageSchema.parse("finalized")).toThrow();
  });
});

describe("dashboard metrics schema", () => {
  it("accepts non-negative integers", () => {
    const metrics = {
      totalJobs: 3,
      analyzedJobs: 2,
      resumeReadyJobs: 1,
      totalApplications: 4,
      pendingReviewApplications: 1
    };
    expect(dashboardMetricsSchema.parse(metrics)).toEqual(metrics);
  });
});

describe("pipeline counts", () => {
  it("enforces every stage count", () => {
    const pipeline = {
      imported: 1,
      analyzed: 1,
      resume_ready: 1,
      prefill_run: 1,
      pending_review: 1,
      approved_for_submit: 0,
      ready_to_submit: 0,
      submitted: 0,
      submit_failed: 0,
      needs_revision: 0,
      rejected: 0
    };
    expect(pipelineCountsSchema.parse(pipeline)).toEqual(pipeline);
  });
});

describe("approval breakdown", () => {
  it("returns the same object", () => {
    const breakdown = {
      pending_review: 2,
      approved_for_submit: 1,
      needs_revision: 0,
      rejected: 0
    };
    expect(approvalBreakdownSchema.parse(breakdown)).toEqual(breakdown);
  });
});

describe("jobTrackerRow schema", () => {
  it("rejects empty title", () => {
    expect(() =>
      jobTrackerRowSchema.parse({
        jobId: "job",
        title: "",
        company: "C",
        location: "here",
        stage: "imported"
      })
    ).toThrow();
  });

  it("accepts latest workflow run summaries", () => {
    const row = {
      jobId: "job_1",
      title: "Engineer",
      company: "Alpha",
      location: "Remote",
      stage: "resume_ready",
      latestAnalyzeRun: {
        id: "run_analysis",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "analyze",
        status: "completed",
        executionMode: "direct",
        workflowId: null,
        workflowType: null,
        taskQueue: null,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        pauseRequestedAt: null,
        pausedAt: null,
        pauseReason: null,
        resumeRequestedAt: null,
        errorMessage: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      latestResumeRun: null,
      latestPrefillRun: null
    };

    expect(jobTrackerRowSchema.parse(row)).toEqual(row);
  });
});

describe("recentActivity schema", () => {
  it("accepts valid activity items", () => {
    const activity = {
      id: "evt",
      type: "job_imported",
      label: "Imported Job",
      jobId: "job",
      timestamp: new Date().toISOString(),
      actorType: "api",
      actorLabel: "apps-api",
      actorId: "apps-api",
      source: "derived-job-record",
      summary: "Imported Job",
      orchestration: {
        executionMode: "direct"
      }
    };
    expect(recentActivitySchema.parse(activity)).toEqual(activity);
  });

  it("accepts recovery activity items", () => {
    const activity = {
      id: "evt-reopen",
      type: "submission_reopened",
      label: "Submission reopened",
      jobId: "job",
      timestamp: new Date().toISOString(),
      actorType: "user",
      actorLabel: "local-user",
      actorId: "local-user",
      source: "web-ui",
      summary: "submitted -> ready_to_submit · Marked for another manual pass.",
      orchestration: null
    };
    expect(recentActivitySchema.parse(activity)).toEqual(activity);
  });
});

describe("timeline schemas", () => {
  it("accepts valid entity types", () => {
    expect(timelineEntityTypeSchema.parse("job")).toBe("job");
    expect(timelineEntityTypeSchema.parse("application")).toBe("application");
  });

  it("accepts a valid timeline item", () => {
    const item = {
      id: "timeline_1",
      entityType: "application",
      entityId: "app_1",
      jobId: "job_1",
      applicationId: "app_1",
      type: "submission_reopened",
      label: "Submission reopened",
      timestamp: new Date().toISOString(),
      actorType: "user",
      actorLabel: "local-user",
      actorId: "local-user",
      source: "web-ui",
      summary: "submitted -> ready_to_submit · Needs one more manual check.",
      orchestration: {
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis"
      },
      status: "ready_to_submit",
      meta: {
        note: "Needs one more manual check."
      }
    };

    expect(timelineItemSchema.parse(item)).toEqual(item);
  });

  it("accepts a grouped job timeline", () => {
    const timeline = {
      jobId: "job_1",
      title: "Engineer",
      company: "Alpha",
      location: "Remote",
      events: [
        {
          id: "timeline_1",
          entityType: "job",
          entityId: "job_1",
          jobId: "job_1",
          applicationId: null,
          type: "job_imported",
          label: "Job imported",
          timestamp: new Date().toISOString(),
          actorType: "api",
          actorLabel: "apps-api",
          actorId: "apps-api",
          source: "derived-job-record",
          summary: "Job imported",
          orchestration: null,
          status: "imported",
          meta: {}
        }
      ]
    };

    expect(jobTimelineSchema.parse(timeline)).toEqual(timeline);
  });

  it("accepts a grouped application timeline", () => {
    const timeline = {
      applicationId: "app_1",
      jobId: "job_1",
      title: "Engineer",
      company: "Alpha",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      events: [
        {
          id: "timeline_1",
          entityType: "application",
          entityId: "app_1",
          jobId: "job_1",
          applicationId: "app_1",
          type: "prefill_run",
          label: "Prefill run",
          timestamp: new Date().toISOString(),
          actorType: "worker",
          actorLabel: "playwright-worker",
          actorId: "playwright-worker",
          source: "derived-application-record",
          summary: "completed",
          orchestration: {
            executionMode: "direct"
          },
          status: "completed",
          meta: {}
        }
      ]
    };

    expect(applicationTimelineSchema.parse(timeline)).toEqual(timeline);
  });
});

describe("dashboard overview schema", () => {
  it("passes with valid data", () => {
    const overview = {
      metrics: {
        totalJobs: 1,
        analyzedJobs: 1,
        resumeReadyJobs: 1,
        totalApplications: 1,
        pendingReviewApplications: 0
      },
      pipeline: {
        imported: 1,
        analyzed: 1,
        resume_ready: 1,
        prefill_run: 1,
        pending_review: 0,
        approved_for_submit: 0,
        ready_to_submit: 0,
        submitted: 0,
        submit_failed: 0,
        needs_revision: 0,
        rejected: 0
      },
      approvalBreakdown: {
        pending_review: 0,
        approved_for_submit: 0,
        needs_revision: 0,
        rejected: 0
      },
      jobs: [
        {
          jobId: "job",
          title: "Job",
          company: "Co",
          location: "remote",
          stage: "imported"
        }
      ],
      recentActivity: [
        {
          id: "evt",
          type: "job_imported",
          label: "Imported Job",
          jobId: "job",
          timestamp: new Date().toISOString(),
          actorType: "api",
          actorLabel: "apps-api",
          actorId: "apps-api",
          source: "derived-job-record",
          summary: "Imported Job"
        }
      ]
    };
    expect(dashboardOverviewSchema.parse(overview)).toEqual(overview);
  });
});

describe("dashboard history schema", () => {
  it("passes with valid grouped history", () => {
    const history = {
      globalTimeline: [
        {
          id: "timeline_1",
          entityType: "job",
          entityId: "job_1",
          jobId: "job_1",
          applicationId: null,
          type: "job_imported",
          label: "Job imported",
          timestamp: new Date().toISOString(),
          actorType: "api",
          actorLabel: "apps-api",
          actorId: "apps-api",
          source: "derived-job-record",
          summary: "Job imported",
          status: "imported",
          meta: {}
        }
      ],
      jobTimelines: [
        {
          jobId: "job_1",
          title: "Engineer",
          company: "Alpha",
          location: "Remote",
          events: [
            {
              id: "timeline_1",
              entityType: "job",
              entityId: "job_1",
              jobId: "job_1",
              applicationId: null,
              type: "job_imported",
              label: "Job imported",
              timestamp: new Date().toISOString(),
              actorType: "api",
              actorLabel: "apps-api",
              actorId: "apps-api",
              source: "derived-job-record",
              summary: "Job imported",
              status: "imported",
              meta: {}
            }
          ]
        }
      ],
      applicationTimelines: [
        {
          applicationId: "app_1",
          jobId: "job_1",
          title: "Engineer",
          company: "Alpha",
          approvalStatus: "approved_for_submit",
          submissionStatus: "ready_to_submit",
          events: [
            {
              id: "timeline_2",
              entityType: "application",
              entityId: "app_1",
              jobId: "job_1",
              applicationId: "app_1",
              type: "prefill_run",
              label: "Prefill run",
              timestamp: new Date().toISOString(),
              actorType: "worker",
              actorLabel: "playwright-worker",
              actorId: "playwright-worker",
              source: "derived-application-record",
              summary: "completed",
              status: "completed",
              meta: {}
            }
          ]
        }
      ]
    };

    expect(dashboardHistorySchema.parse(history)).toEqual(history);
  });
});
