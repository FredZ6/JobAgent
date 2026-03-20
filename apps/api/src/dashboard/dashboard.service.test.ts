import { beforeEach, describe, expect, it, vi } from "vitest";

import { DashboardService } from "./dashboard.service.js";

const mockPrisma = {
  job: {
    findMany: vi.fn()
  },
  workflowRun: {
    findMany: vi.fn()
  },
  jobEvent: {
    findMany: vi.fn()
  },
  application: {
    findMany: vi.fn()
  },
  applicationEvent: {
    findMany: vi.fn()
  }
};

beforeEach(() => {
  mockPrisma.job.findMany.mockReset();
  mockPrisma.workflowRun.findMany.mockReset();
  mockPrisma.jobEvent.findMany.mockReset();
  mockPrisma.application.findMany.mockReset();
  mockPrisma.applicationEvent.findMany.mockReset();
});

describe("DashboardService", () => {
  it("derives job stages and approval counts correctly", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [
          {
            id: "analysis_1",
            jobId: "job_1",
            matchScore: 80,
            summary: "summary",
            requiredSkills: [],
            missingSkills: [],
            redFlags: [],
            structuredResult: {},
            status: "completed",
            errorMessage: null,
            createdAt: new Date("2026-03-10T01:00:00.000Z"),
            updatedAt: new Date("2026-03-10T01:00:00.000Z")
          }
        ],
        resumeVersions: [
          {
            id: "resume_1",
            jobId: "job_1",
            sourceProfileId: "profile_1",
            status: "completed",
            headline: "Headline",
            professionalSummary: "",
            skills: [],
            experienceSections: [],
            projectSections: [],
            changeSummary: {},
            structuredContent: {},
            errorMessage: null,
            createdAt: new Date("2026-03-10T02:00:00.000Z"),
            updatedAt: new Date("2026-03-10T02:00:00.000Z")
          }
        ],
        applications: []
      },
      {
        id: "job_2",
        title: "Ops",
        company: "Beta",
        location: "Hybrid",
        createdAt: new Date("2026-03-11T00:00:00.000Z"),
        analyses: [],
        resumeVersions: [],
        applications: [
          {
            id: "app_2",
            jobId: "job_2",
            resumeVersionId: "resume_2",
            status: "completed",
            approvalStatus: "needs_revision",
            submissionStatus: "not_ready",
            applyUrl: "https://apply",
            formSnapshot: {},
            fieldResults: [],
            screenshotPaths: [],
            workerLog: [],
            submissionNote: "",
            submittedByUser: false,
            finalSubmissionSnapshot: null,
            submittedAt: null,
            reviewNote: "",
            errorMessage: null,
            createdAt: new Date("2026-03-11T01:00:00.000Z"),
            updatedAt: new Date("2026-03-11T01:05:00.000Z")
          }
        ]
      },
      {
        id: "job_3",
        title: "Platform",
        company: "Gamma",
        location: "Remote",
        createdAt: new Date("2026-03-12T00:00:00.000Z"),
        analyses: [],
        resumeVersions: [],
        applications: [
          {
            id: "app_3",
            jobId: "job_3",
            resumeVersionId: "resume_3",
            status: "completed",
            approvalStatus: "approved_for_submit",
            submissionStatus: "ready_to_submit",
            applyUrl: "https://apply",
            formSnapshot: {},
            fieldResults: [],
            screenshotPaths: [],
            workerLog: [],
            submissionNote: "",
            submittedByUser: false,
            finalSubmissionSnapshot: null,
            submittedAt: null,
            reviewNote: "",
            errorMessage: null,
            createdAt: new Date("2026-03-12T01:00:00.000Z"),
            updatedAt: new Date("2026-03-12T01:05:00.000Z")
          }
        ]
      }
    ];

    const applications = [
      {
        id: "app_2",
        jobId: "job_2",
        resumeVersionId: "resume_2",
        status: "completed",
        approvalStatus: "needs_revision",
        submissionStatus: "not_ready",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        submittedAt: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-11T01:00:00.000Z"),
        updatedAt: new Date("2026-03-11T01:05:00.000Z"),
        job: {
          id: "job_2",
          title: "Ops",
          company: "Beta",
          location: "Hybrid",
          description: "",
          rawText: "",
          sourceUrl: "",
          importStatus: "imported",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        resumeVersion: {
          id: "resume_2",
          jobId: "job_2",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Ops resume",
          professionalSummary: "",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      },
      {
        id: "app_3",
        jobId: "job_3",
        resumeVersionId: "resume_3",
        status: "completed",
        approvalStatus: "approved_for_submit",
        submissionStatus: "ready_to_submit",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        submittedAt: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-12T01:00:00.000Z"),
        updatedAt: new Date("2026-03-12T01:05:00.000Z"),
        job: {
          id: "job_3",
          title: "Platform",
          company: "Gamma",
          location: "Remote",
          description: "",
          rawText: "",
          sourceUrl: "",
          importStatus: "imported",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        resumeVersion: {
          id: "resume_3",
          jobId: "job_3",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Platform resume",
          professionalSummary: "",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    const applicationEvents = [
      {
        id: "event_1",
        applicationId: "app_3",
        type: "submission_reopened",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Need to re-check the form." },
        createdAt: new Date("2026-03-12T01:10:00.000Z"),
        application: {
          id: "app_3",
          jobId: "job_3"
        }
      },
      {
        id: "event_2",
        applicationId: "app_3",
        type: "submission_retry_ready",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Ready for another attempt." },
        createdAt: new Date("2026-03-12T01:11:00.000Z"),
        application: {
          id: "app_3",
          jobId: "job_3"
        }
      }
    ];

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.workflowRun.findMany.mockResolvedValueOnce([]);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce([]);
    mockPrisma.application.findMany.mockResolvedValueOnce(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce(applicationEvents);

    const service = new DashboardService(mockPrisma as any);
    const overview = await service.getOverview();

    expect(overview.metrics.totalJobs).toBe(3);
    expect(overview.pipeline.resume_ready).toBe(1);
    expect(overview.pipeline.needs_revision).toBe(1);
    expect(overview.pipeline.ready_to_submit).toBe(1);
    expect(overview.approvalBreakdown.needs_revision).toBe(1);
    expect(overview.jobs.find((row) => row.jobId === "job_1")?.stage).toBe("resume_ready");
    expect(overview.jobs.find((row) => row.jobId === "job_2")?.stage).toBe("needs_revision");
    expect(overview.jobs.find((row) => row.jobId === "job_3")?.stage).toBe("ready_to_submit");
    expect(overview.recentActivity.length).toBeGreaterThan(0);
    expect(overview.recentActivity.some((event) => event.type === "submission_reopened")).toBe(true);
    expect(overview.recentActivity.some((event) => event.type === "submission_retry_ready")).toBe(
      true
    );
    expect(overview.recentActivity.every((event) => typeof event.actorType === "string")).toBe(true);
    expect(overview.recentActivity.find((event) => event.type === "submission_reopened")?.actorLabel).toBe(
      "local-user"
    );
    expect(overview.recentActivity.find((event) => event.type === "submission_reopened")?.actorId).toBe(
      "local-user"
    );
    expect(overview.recentActivity.find((event) => event.type === "submission_reopened")?.source).toBe(
      "web-ui"
    );
    expect(overview.recentActivity.find((event) => event.type === "submission_reopened")?.summary).toContain(
      "Need to re-check the form."
    );
    expect(
      overview.recentActivity.some(
        (event) =>
          event.type === "approval_updated" &&
          event.id === "approval_updated-job_3-2026-03-12T01:05:00.000Z"
      )
    ).toBe(false);
  });

  it("returns a filtered newest-first global timeline", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [
          {
            id: "analysis_1",
            jobId: "job_1",
            matchScore: 80,
            summary: "summary",
            requiredSkills: [],
            missingSkills: [],
            redFlags: [],
            structuredResult: {},
            status: "completed",
            errorMessage: null,
            createdAt: new Date("2026-03-10T01:00:00.000Z"),
            updatedAt: new Date("2026-03-10T01:00:00.000Z")
          }
        ],
        resumeVersions: [],
        applications: [
          {
            id: "app_1",
            jobId: "job_1",
            resumeVersionId: "resume_1",
            status: "completed",
            approvalStatus: "approved_for_submit",
            submissionStatus: "ready_to_submit",
            applyUrl: "https://apply",
            formSnapshot: {},
            fieldResults: [],
            screenshotPaths: [],
            workerLog: [],
            submissionNote: "",
            submittedByUser: false,
            finalSubmissionSnapshot: null,
            submittedAt: null,
            reviewNote: "",
            errorMessage: null,
            createdAt: new Date("2026-03-10T02:00:00.000Z"),
            updatedAt: new Date("2026-03-10T02:05:00.000Z")
          }
        ]
      }
    ];

    const applications = [
      {
        id: "app_1",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "completed",
        approvalStatus: "approved_for_submit",
        submissionStatus: "ready_to_submit",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        submittedAt: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-10T02:00:00.000Z"),
        updatedAt: new Date("2026-03-10T02:05:00.000Z"),
        job: {
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          location: "Remote",
          description: "",
          rawText: "",
          sourceUrl: "",
          importStatus: "imported",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        resumeVersion: {
          id: "resume_1",
          jobId: "job_1",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Engineer resume",
          professionalSummary: "",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    const applicationEvents = [
      {
        id: "event_2",
        applicationId: "app_1",
        type: "submission_retry_ready",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Try again from the web UI." },
        createdAt: new Date("2026-03-10T03:00:00.000Z"),
        application: {
          id: "app_1",
          jobId: "job_1"
        }
      },
      {
        id: "event_1",
        applicationId: "app_1",
        type: "submission_reopened",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Check again before submission." },
        createdAt: new Date("2026-03-10T02:30:00.000Z"),
        application: {
          id: "app_1",
          jobId: "job_1"
        }
      }
    ];

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.workflowRun.findMany.mockResolvedValueOnce([]);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce([]);
    mockPrisma.application.findMany.mockResolvedValueOnce(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce(applicationEvents);

    const service = new DashboardService(mockPrisma as any);
    const timeline = await service.getTimeline({
      actorType: "user",
      entityType: "application",
      eventType: "submission_retry_ready",
      source: "web-ui",
      q: "web ui",
      from: "2026-03-10T02:45:00.000Z",
      to: "2026-03-10T03:30:00.000Z",
      limit: 5
    });

    expect(timeline).toHaveLength(1);
    expect(timeline[0]?.type).toBe("submission_retry_ready");
    expect(timeline[0]?.entityType).toBe("application");
    expect(timeline[0]?.actorType).toBe("user");
    expect(timeline[0]?.actorLabel).toBe("local-user");
    expect(timeline[0]?.actorId).toBe("local-user");
    expect(timeline[0]?.source).toBe("web-ui");
    expect(timeline[0]?.summary).toContain("Try again from the web UI.");
  });

  it("includes orchestration metadata in overview and timeline items", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [],
        resumeVersions: [],
        applications: []
      }
    ];

    const applications: never[] = [];
    const jobEvents = [
      {
        id: "job_event_analysis",
        jobId: "job_1",
        type: "analysis_completed",
        actorType: "api",
        actorLabel: "apps-api",
        actorId: "apps-api",
        source: "analysis-service",
        payload: {
          summary: "Strong fit",
          status: "completed",
          orchestration: {
            executionMode: "temporal",
            workflowId: "analyze-job-job_1-123",
            workflowType: "analyzeJobWorkflow",
            taskQueue: "rolecraft-analysis"
          }
        },
        createdAt: new Date("2026-03-10T00:10:00.000Z")
      }
    ];

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.workflowRun.findMany.mockResolvedValueOnce([]);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce(jobEvents);
    mockPrisma.application.findMany.mockResolvedValueOnce(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce([]);

    const service = new DashboardService(mockPrisma as any);
    const overview = await service.getOverview();

    expect(overview.recentActivity[0]?.orchestration).toEqual({
      executionMode: "temporal",
      workflowId: "analyze-job-job_1-123",
      workflowType: "analyzeJobWorkflow",
      taskQueue: "rolecraft-analysis"
    });

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce(jobEvents);
    mockPrisma.application.findMany.mockResolvedValueOnce(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce([]);

    const timeline = await service.getTimeline({
      eventType: "analysis_completed",
      limit: 5
    });

    expect(timeline[0]?.orchestration).toEqual({
      executionMode: "temporal",
      workflowId: "analyze-job-job_1-123",
      workflowType: "analyzeJobWorkflow",
      taskQueue: "rolecraft-analysis"
    });
  });

  it("includes latest workflow run summaries on job rows", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [],
        resumeVersions: [],
        applications: []
      }
    ];
    const workflowRuns = [
      {
        id: "run_prefill_latest",
        jobId: "job_1",
        applicationId: "app_1",
        resumeVersionId: "resume_1",
        kind: "prefill",
        status: "completed",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: new Date("2026-03-10T00:02:00.000Z"),
        completedAt: new Date("2026-03-10T00:03:00.000Z"),
        errorMessage: null,
        createdAt: new Date("2026-03-10T00:02:00.000Z"),
        updatedAt: new Date("2026-03-10T00:03:00.000Z")
      }
    ];

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.workflowRun.findMany.mockResolvedValueOnce(workflowRuns);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce([]);
    mockPrisma.application.findMany.mockResolvedValueOnce([]);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce([]);

    const service = new DashboardService(mockPrisma as any);
    const overview = await service.getOverview();

    expect(overview.jobs[0]?.latestPrefillRun).toEqual(
      expect.objectContaining({
        id: "run_prefill_latest",
        kind: "prefill",
        executionMode: "temporal"
      })
    );
  });

  it("matches timeline queries against entity ids and business context", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [],
        resumeVersions: [],
        applications: []
      }
    ];

    const jobEvents = [
      {
        id: "job_event_imported",
        jobId: "job_1",
        type: "job_imported",
        actorType: "api",
        actorLabel: "apps-api",
        actorId: "apps-api",
        source: "jobs-controller",
        payload: {
          sourceUrl: "https://example.com/jobs/staff-platform-engineer",
          importStatus: "imported"
        },
        createdAt: new Date("2026-03-10T00:00:01.000Z")
      }
    ];
    mockPrisma.job.findMany.mockResolvedValue(jobs);
    mockPrisma.jobEvent.findMany.mockResolvedValue(jobEvents);
    mockPrisma.application.findMany.mockResolvedValue([]);
    mockPrisma.applicationEvent.findMany.mockResolvedValue([]);

    const service = new DashboardService(mockPrisma as any);

    const byJobId = await service.getTimeline({
      q: "job_1",
      limit: 10
    });
    const byUrlFragment = await service.getTimeline({
      q: "staff-platform-engineer",
      limit: 10
    });

    expect(byJobId).toHaveLength(1);
    expect(byJobId[0]?.jobId).toBe("job_1");
    expect(byUrlFragment).toHaveLength(1);
    expect(byUrlFragment[0]?.source).toBe("jobs-controller");
  });

  it("returns grouped job and application timelines", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [
          {
            id: "analysis_1",
            jobId: "job_1",
            matchScore: 80,
            summary: "summary",
            requiredSkills: [],
            missingSkills: [],
            redFlags: [],
            structuredResult: {},
            status: "completed",
            errorMessage: null,
            createdAt: new Date("2026-03-10T01:00:00.000Z"),
            updatedAt: new Date("2026-03-10T01:00:00.000Z")
          }
        ],
        resumeVersions: [
          {
            id: "resume_1",
            jobId: "job_1",
            sourceProfileId: "profile_1",
            status: "completed",
            headline: "Engineer resume",
            professionalSummary: "",
            skills: [],
            experienceSections: [],
            projectSections: [],
            changeSummary: {},
            structuredContent: {},
            errorMessage: null,
            createdAt: new Date("2026-03-10T01:30:00.000Z"),
            updatedAt: new Date("2026-03-10T01:30:00.000Z")
          }
        ],
        applications: [
          {
            id: "app_1",
            jobId: "job_1",
            resumeVersionId: "resume_1",
            status: "completed",
            approvalStatus: "approved_for_submit",
            submissionStatus: "ready_to_submit",
            applyUrl: "https://apply",
            formSnapshot: {},
            fieldResults: [],
            screenshotPaths: [],
            workerLog: [],
            submissionNote: "",
            submittedByUser: false,
            finalSubmissionSnapshot: null,
            submittedAt: null,
            reviewNote: "",
            errorMessage: null,
            createdAt: new Date("2026-03-10T02:00:00.000Z"),
            updatedAt: new Date("2026-03-10T02:05:00.000Z")
          }
        ]
      }
    ];

    const applications = [
      {
        id: "app_1",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "completed",
        approvalStatus: "approved_for_submit",
        submissionStatus: "ready_to_submit",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        submittedAt: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-10T02:00:00.000Z"),
        updatedAt: new Date("2026-03-10T02:05:00.000Z"),
        job: {
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          location: "Remote",
          description: "",
          rawText: "",
          sourceUrl: "",
          importStatus: "imported",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        resumeVersion: {
          id: "resume_1",
          jobId: "job_1",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Engineer resume",
          professionalSummary: "",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    const applicationEvents = [
      {
        id: "event_1",
        applicationId: "app_1",
        type: "submission_reopened",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Check again." },
        createdAt: new Date("2026-03-10T02:30:00.000Z"),
        application: {
          id: "app_1",
          jobId: "job_1"
        }
      }
    ];

    mockPrisma.job.findMany.mockResolvedValueOnce(jobs);
    mockPrisma.jobEvent.findMany.mockResolvedValueOnce([]);
    mockPrisma.application.findMany.mockResolvedValueOnce(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValueOnce(applicationEvents);

    const service = new DashboardService(mockPrisma as any);
    const history = await service.getHistory();

    expect(history.globalTimeline.length).toBeGreaterThan(0);
    expect(history.globalTimeline[0]?.actorType).toBe("user");
    expect(history.globalTimeline[0]?.actorLabel).toBe("local-user");
    expect(history.globalTimeline[0]?.actorId).toBe("local-user");
    expect(history.globalTimeline[0]?.source).toBe("web-ui");
    expect(history.globalTimeline[0]?.summary).toContain("Check again.");
    expect(history.jobTimelines[0]?.jobId).toBe("job_1");
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "job_imported")?.actorType).toBe("api");
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "job_imported")?.actorId).toBe(
      "apps-api"
    );
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "job_imported")?.source).toBe(
      "derived-job-record"
    );
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "job_imported")?.summary).toContain(
      "Job imported"
    );
    expect(history.applicationTimelines[0]?.applicationId).toBe("app_1");
    expect(
      history.applicationTimelines[0]?.events.find((event) => event.type === "prefill_run")?.actorType
    ).toBe("worker");
    expect(
      history.applicationTimelines[0]?.events.find((event) => event.type === "prefill_run")?.actorId
    ).toBe("playwright-worker");
    expect(
      history.applicationTimelines[0]?.events.find((event) => event.type === "prefill_run")?.source
    ).toBe("derived-application-record");
    expect(
      history.applicationTimelines[0]?.events.find((event) => event.type === "submission_reopened")?.summary
    ).toContain("Check again.");
    expect(
      history.applicationTimelines[0]?.events.some((event) => event.type === "submission_reopened")
    ).toBe(true);
  });

  it("prefers explicit milestone events over derived duplicates", async () => {
    const jobs = [
      {
        id: "job_1",
        title: "Engineer",
        company: "Alpha",
        location: "Remote",
        createdAt: new Date("2026-03-10T00:00:00.000Z"),
        analyses: [
          {
            id: "analysis_1",
            jobId: "job_1",
            matchScore: 82,
            summary: "Derived analysis summary",
            requiredSkills: [],
            missingSkills: [],
            redFlags: [],
            structuredResult: {},
            status: "completed",
            errorMessage: null,
            createdAt: new Date("2026-03-10T01:00:00.000Z"),
            updatedAt: new Date("2026-03-10T01:00:00.000Z")
          }
        ],
        resumeVersions: [
          {
            id: "resume_1",
            jobId: "job_1",
            sourceProfileId: "profile_1",
            status: "completed",
            headline: "Derived resume headline",
            professionalSummary: "",
            skills: [],
            experienceSections: [],
            projectSections: [],
            changeSummary: {},
            structuredContent: {},
            errorMessage: null,
            createdAt: new Date("2026-03-10T02:00:00.000Z"),
            updatedAt: new Date("2026-03-10T02:00:00.000Z")
          }
        ],
        applications: [
          {
            id: "app_1",
            jobId: "job_1",
            resumeVersionId: "resume_1",
            status: "completed",
            approvalStatus: "pending_review",
            submissionStatus: "not_ready",
            applyUrl: "https://apply",
            formSnapshot: {},
            fieldResults: [],
            screenshotPaths: [],
            workerLog: [],
            submissionNote: "",
            submittedByUser: false,
            finalSubmissionSnapshot: null,
            submittedAt: null,
            reviewNote: "",
            errorMessage: null,
            createdAt: new Date("2026-03-10T03:00:00.000Z"),
            updatedAt: new Date("2026-03-10T03:05:00.000Z")
          }
        ]
      }
    ];

    const applications = [
      {
        id: "app_1",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "completed",
        approvalStatus: "pending_review",
        submissionStatus: "not_ready",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        submittedAt: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-10T03:00:00.000Z"),
        updatedAt: new Date("2026-03-10T03:05:00.000Z"),
        job: {
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          location: "Remote",
          description: "",
          rawText: "",
          sourceUrl: "",
          importStatus: "imported",
          createdAt: new Date(),
          updatedAt: new Date()
        },
        resumeVersion: {
          id: "resume_1",
          jobId: "job_1",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Derived resume headline",
          professionalSummary: "",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {},
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      }
    ];

    const jobEvents = [
      {
        id: "job_event_imported",
        jobId: "job_1",
        type: "job_imported",
        actorType: "api",
        actorLabel: "apps-api",
        actorId: "apps-api",
        source: "jobs-controller",
        payload: { importStatus: "imported" },
        createdAt: new Date("2026-03-10T00:00:01.000Z")
      },
      {
        id: "job_event_analysis",
        jobId: "job_1",
        type: "analysis_completed",
        actorType: "api",
        actorLabel: "apps-api",
        actorId: "apps-api",
        source: "analysis-service",
        payload: { status: "completed", summary: "Explicit analysis summary" },
        createdAt: new Date("2026-03-10T01:00:01.000Z")
      },
      {
        id: "job_event_resume",
        jobId: "job_1",
        type: "resume_generated",
        actorType: "api",
        actorLabel: "apps-api",
        actorId: "apps-api",
        source: "resume-service",
        payload: { status: "completed", headline: "Explicit resume headline" },
        createdAt: new Date("2026-03-10T02:00:01.000Z")
      }
    ];
    const applicationEvents = [
      {
        id: "app_event_prefill",
        applicationId: "app_1",
        type: "prefill_run",
        actorType: "worker",
        actorLabel: "playwright-worker",
        actorId: "playwright-worker",
        source: "worker-prefill",
        payload: { submissionStatus: "completed", note: "Prefill completed in worker" },
        createdAt: new Date("2026-03-10T03:00:01.000Z"),
        application: {
          id: "app_1",
          jobId: "job_1"
        }
      }
    ];

    mockPrisma.job.findMany.mockResolvedValue(jobs);
    mockPrisma.jobEvent.findMany.mockResolvedValue(jobEvents);
    mockPrisma.application.findMany.mockResolvedValue(applications);
    mockPrisma.applicationEvent.findMany.mockResolvedValue(applicationEvents);

    const service = new DashboardService(mockPrisma as any);
    const history = await service.getHistory();
    const globalTimeline = await service.getTimeline({ limit: 20 });

    expect(history.jobTimelines[0]?.events.filter((event) => event.type === "job_imported")).toHaveLength(1);
    expect(history.jobTimelines[0]?.events.filter((event) => event.type === "analysis_completed")).toHaveLength(1);
    expect(history.jobTimelines[0]?.events.filter((event) => event.type === "resume_generated")).toHaveLength(1);
    expect(history.applicationTimelines[0]?.events.filter((event) => event.type === "prefill_run")).toHaveLength(1);
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "analysis_completed")?.summary).toContain(
      "Explicit analysis summary"
    );
    expect(history.jobTimelines[0]?.events.find((event) => event.type === "resume_generated")?.source).toBe(
      "resume-service"
    );
    expect(
      globalTimeline.filter((event) => event.jobId === "job_1" && event.type === "job_imported")
    ).toHaveLength(1);
  });
});
