import { NotFoundException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { WorkflowRunsService } from "./workflow-runs.service.js";

describe("WorkflowRunsService", () => {
  it("lists global workflow runs with filters and filtered summary counts", async () => {
    const prisma = {
      workflowRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_failed_prefill",
            jobId: "job_1",
            retryOfRunId: null,
            applicationId: "app_1",
            resumeVersionId: null,
            kind: "prefill",
            status: "failed",
            executionMode: "temporal",
            workflowId: "prefill-job-job_1-123",
            workflowType: "prefillJobWorkflow",
            taskQueue: "rolecraft-analysis",
            startedAt: new Date("2026-03-17T10:00:00.000Z"),
            completedAt: new Date("2026-03-17T10:01:00.000Z"),
            errorMessage: "worker failed",
            createdAt: new Date("2026-03-17T10:00:00.000Z"),
            updatedAt: new Date("2026-03-17T10:01:00.000Z"),
            job: {
              id: "job_1",
              title: "Staff Platform Engineer",
              company: "Rolecraft"
            },
            application: {
              id: "app_1",
              status: "failed"
            },
            resumeVersion: null
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.listWorkflowRuns({
      kind: "prefill",
      status: "failed",
      executionMode: "temporal",
      limit: 25
    });

    expect(prisma.workflowRun.findMany).toHaveBeenCalledWith({
      where: {
        kind: "prefill",
        status: "failed",
        executionMode: "temporal"
      },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            company: true
          }
        },
        application: {
          select: {
            id: true,
            status: true
          }
        },
        resumeVersion: {
          select: {
            id: true,
            headline: true,
            status: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });
    expect(result.summary).toEqual({
      totalRuns: 1,
      queuedRuns: 0,
      runningRuns: 0,
      completedRuns: 0,
      failedRuns: 1,
      cancelledRuns: 0
    });
    expect(result.pageInfo).toEqual({
      nextCursor: null,
      hasMore: false,
      returnedCount: 1
    });
    expect(result.runs[0]?.job.company).toBe("Rolecraft");
    expect(result.runs[0]?.application?.id).toBe("app_1");
  });

  it("matches keyword search against run and linked context", async () => {
    const prisma = {
      workflowRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_resume_1",
            jobId: "job_1",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: "resume_1",
            kind: "generate_resume",
            status: "completed",
            executionMode: "direct",
            workflowId: "resume-job-job_1-123",
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-17T10:00:00.000Z"),
            completedAt: new Date("2026-03-17T10:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T10:00:00.000Z"),
            updatedAt: new Date("2026-03-17T10:01:00.000Z"),
            job: {
              id: "job_1",
              title: "Staff Platform Engineer",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: {
              id: "resume_1",
              headline: "Platform Resume",
              status: "completed"
            }
          },
          {
            id: "run_analyze_1",
            jobId: "job_2",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "analyze",
            status: "completed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-17T11:00:00.000Z"),
            completedAt: new Date("2026-03-17T11:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T11:00:00.000Z"),
            updatedAt: new Date("2026-03-17T11:01:00.000Z"),
            job: {
              id: "job_2",
              title: "Backend Engineer",
              company: "AnotherCo"
            },
            application: null,
            resumeVersion: null
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.listWorkflowRuns({
      q: "platform resume"
    });

    expect(result.summary.totalRuns).toBe(1);
    expect(result.runs.map((item) => item.workflowRun.id)).toEqual(["run_resume_1"]);
  });

  it("filters workflow runs by createdAt date range", async () => {
    const prisma = {
      workflowRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_in_range",
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
            startedAt: new Date("2026-03-17T10:00:00.000Z"),
            completedAt: new Date("2026-03-17T10:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T10:00:00.000Z"),
            updatedAt: new Date("2026-03-17T10:01:00.000Z"),
            job: {
              id: "job_1",
              title: "Staff Platform Engineer",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          },
          {
            id: "run_out_of_range",
            jobId: "job_2",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "analyze",
            status: "completed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-19T10:00:00.000Z"),
            completedAt: new Date("2026-03-19T10:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-19T10:00:00.000Z"),
            updatedAt: new Date("2026-03-19T10:01:00.000Z"),
            job: {
              id: "job_2",
              title: "Backend Engineer",
              company: "AnotherCo"
            },
            application: null,
            resumeVersion: null
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.listWorkflowRuns({
      from: "2026-03-17",
      to: "2026-03-17"
    });

    expect(result.summary.totalRuns).toBe(1);
    expect(result.runs.map((item) => item.workflowRun.id)).toEqual(["run_in_range"]);
  });

  it("sorts workflow runs by status using business order", async () => {
    const prisma = {
      workflowRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_completed",
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
            startedAt: new Date("2026-03-17T12:00:00.000Z"),
            completedAt: new Date("2026-03-17T12:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T12:00:00.000Z"),
            updatedAt: new Date("2026-03-17T12:01:00.000Z"),
            job: {
              id: "job_1",
              title: "Completed Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          },
          {
            id: "run_queued",
            jobId: "job_2",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "analyze",
            status: "queued",
            executionMode: "temporal",
            workflowId: "wf-queued",
            workflowType: "analyzeJobWorkflow",
            taskQueue: "rolecraft-analysis",
            startedAt: null,
            completedAt: null,
            errorMessage: null,
            createdAt: new Date("2026-03-17T13:00:00.000Z"),
            updatedAt: new Date("2026-03-17T13:00:00.000Z"),
            job: {
              id: "job_2",
              title: "Queued Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          },
          {
            id: "run_failed",
            jobId: "job_3",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "analyze",
            status: "failed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-17T11:00:00.000Z"),
            completedAt: new Date("2026-03-17T11:05:00.000Z"),
            errorMessage: "boom",
            createdAt: new Date("2026-03-17T11:00:00.000Z"),
            updatedAt: new Date("2026-03-17T11:05:00.000Z"),
            job: {
              id: "job_3",
              title: "Failed Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.listWorkflowRuns({
      sortBy: "status",
      sortOrder: "asc"
    });

    expect(result.runs.map((item) => item.workflowRun.id)).toEqual([
      "run_queued",
      "run_failed",
      "run_completed"
    ]);
  });

  it("returns cursor pagination metadata and the next slice", async () => {
    const prisma = {
      workflowRun: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "run_newest",
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
            startedAt: new Date("2026-03-17T12:00:00.000Z"),
            completedAt: new Date("2026-03-17T12:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T12:00:00.000Z"),
            updatedAt: new Date("2026-03-17T12:01:00.000Z"),
            job: {
              id: "job_1",
              title: "Newest Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          },
          {
            id: "run_middle",
            jobId: "job_2",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "prefill",
            status: "failed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-17T11:00:00.000Z"),
            completedAt: new Date("2026-03-17T11:01:00.000Z"),
            errorMessage: "boom",
            createdAt: new Date("2026-03-17T11:00:00.000Z"),
            updatedAt: new Date("2026-03-17T11:01:00.000Z"),
            job: {
              id: "job_2",
              title: "Middle Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          },
          {
            id: "run_oldest",
            jobId: "job_3",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "generate_resume",
            status: "completed",
            executionMode: "temporal",
            workflowId: "wf-oldest",
            workflowType: "generateResumeWorkflow",
            taskQueue: "rolecraft-analysis",
            startedAt: new Date("2026-03-17T10:00:00.000Z"),
            completedAt: new Date("2026-03-17T10:01:00.000Z"),
            errorMessage: null,
            createdAt: new Date("2026-03-17T10:00:00.000Z"),
            updatedAt: new Date("2026-03-17T10:01:00.000Z"),
            job: {
              id: "job_3",
              title: "Oldest Job",
              company: "Rolecraft"
            },
            application: null,
            resumeVersion: null
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const firstPage = await service.listWorkflowRuns({
      limit: 2
    });

    expect(firstPage.runs.map((item) => item.workflowRun.id)).toEqual(["run_newest", "run_middle"]);
    expect(firstPage.pageInfo).toEqual({
      nextCursor: "run_middle",
      hasMore: true,
      returnedCount: 2
    });
    expect(firstPage.summary.totalRuns).toBe(3);

    const secondPage = await service.listWorkflowRuns({
      limit: 2,
      cursor: "run_middle"
    });

    expect(secondPage.runs.map((item) => item.workflowRun.id)).toEqual(["run_oldest"]);
    expect(secondPage.pageInfo).toEqual({
      nextCursor: null,
      hasMore: false,
      returnedCount: 1
    });
    expect(secondPage.summary.totalRuns).toBe(3);
  });

  it("records a queued lifecycle event when creating a temporal workflow run", async () => {
    const workflowRunCreate = vi.fn().mockResolvedValue({
      id: "run_queued",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "analyze",
      status: "queued",
      executionMode: "temporal",
      workflowId: "analyze-job-job_1-123",
      workflowType: "analyzeJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: null,
      completedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const workflowRunEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      workflowRun: {
        create: workflowRunCreate
      },
      workflowRunEvent: {
        create: workflowRunEventCreate
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    await service.createTemporalQueuedRun({
      jobId: "job_1",
      kind: "analyze",
      workflowId: "analyze-job-job_1-123",
      workflowType: "analyzeJobWorkflow",
      taskQueue: "rolecraft-analysis"
    });

    expect(workflowRunEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workflowRunId: "run_queued",
        type: "run_queued",
        payload: expect.objectContaining({
          status: "queued",
          workflowId: "analyze-job-job_1-123"
        })
      })
    });
  });

  it("records a completion lifecycle event when marking a run completed", async () => {
    const workflowRunUpdate = vi.fn().mockResolvedValue({
      id: "run_completed",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: "app_1",
      resumeVersionId: "resume_1",
      kind: "prefill",
      status: "completed",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-123",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date(),
      completedAt: new Date(),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const workflowRunEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      workflowRun: {
        update: workflowRunUpdate
      },
      workflowRunEvent: {
        create: workflowRunEventCreate
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    await service.markCompleted("run_completed", {
      applicationId: "app_1",
      resumeVersionId: "resume_1"
    });

    expect(workflowRunEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workflowRunId: "run_completed",
        type: "run_completed",
        payload: expect.objectContaining({
          status: "completed",
          applicationId: "app_1",
          resumeVersionId: "resume_1"
        })
      })
    });
  });

  it("records a pause-request lifecycle event for temporal runs", async () => {
    const workflowRunFindUnique = vi
      .fn()
      .mockResolvedValueOnce({
        id: "run_running",
        executionMode: "temporal",
        status: "running"
      })
      .mockResolvedValueOnce({
        id: "run_running",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "prefill",
        status: "running",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: new Date("2026-03-20T10:00:00.000Z"),
        completedAt: null,
        pauseRequestedAt: new Date("2026-03-20T10:01:00.000Z"),
        pausedAt: null,
        pauseReason: "Requested from workflow detail",
        resumeRequestedAt: null,
        errorMessage: null,
        createdAt: new Date("2026-03-20T10:00:00.000Z"),
        updatedAt: new Date("2026-03-20T10:01:00.000Z")
      });
    const workflowRunUpdate = vi.fn().mockResolvedValue({
      id: "run_running",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "prefill",
      status: "running",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-123",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date("2026-03-20T10:00:00.000Z"),
      completedAt: null,
      pauseRequestedAt: new Date("2026-03-20T10:01:00.000Z"),
      pausedAt: null,
      pauseReason: "Requested from workflow detail",
      resumeRequestedAt: null,
      errorMessage: null,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T10:01:00.000Z")
    });
    const workflowRunEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      workflowRun: {
        findUnique: workflowRunFindUnique,
        update: workflowRunUpdate
      },
      workflowRunEvent: {
        create: workflowRunEventCreate
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await (service as any).requestPause("run_running", "Requested from workflow detail");

    expect(workflowRunUpdate).toHaveBeenCalledWith({
      where: { id: "run_running" },
      data: expect.objectContaining({
        pauseRequestedAt: expect.any(Date),
        pauseReason: "Requested from workflow detail"
      })
    });
    expect(workflowRunEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workflowRunId: "run_running",
        type: "run_pause_requested",
        payload: expect.objectContaining({
          status: "running",
          pauseReason: "Requested from workflow detail"
        })
      })
    });
    expect(result.pauseReason).toBe("Requested from workflow detail");
  });

  it("marks a temporal run paused and records a lifecycle event", async () => {
    const workflowRunUpdate = vi.fn().mockResolvedValue({
      id: "run_paused",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "prefill",
      status: "paused",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-123",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date("2026-03-20T10:00:00.000Z"),
      completedAt: null,
      pauseRequestedAt: new Date("2026-03-20T10:01:00.000Z"),
      pausedAt: new Date("2026-03-20T10:02:00.000Z"),
      pauseReason: "Checkpoint pause",
      resumeRequestedAt: null,
      errorMessage: null,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T10:02:00.000Z")
    });
    const workflowRunEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      workflowRun: {
        update: workflowRunUpdate
      },
      workflowRunEvent: {
        create: workflowRunEventCreate
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await (service as any).markPaused("run_paused", "Checkpoint pause");

    expect(workflowRunUpdate).toHaveBeenCalledWith({
      where: { id: "run_paused" },
      data: expect.objectContaining({
        status: "paused",
        pausedAt: expect.any(Date),
        pauseReason: "Checkpoint pause"
      })
    });
    expect(workflowRunEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workflowRunId: "run_paused",
        type: "run_paused",
        payload: expect.objectContaining({
          status: "paused",
          pauseReason: "Checkpoint pause"
        })
      })
    });
    expect(result.status).toBe("paused");
  });

  it("resumes a paused temporal run and records a lifecycle event", async () => {
    const workflowRunFindUnique = vi
      .fn()
      .mockResolvedValueOnce({
        id: "run_paused",
        executionMode: "temporal",
        status: "paused"
      })
      .mockResolvedValueOnce({
        id: "run_paused",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "prefill",
        status: "running",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: new Date("2026-03-20T10:00:00.000Z"),
        completedAt: null,
        pauseRequestedAt: null,
        pausedAt: new Date("2026-03-20T10:02:00.000Z"),
        pauseReason: null,
        resumeRequestedAt: new Date("2026-03-20T10:03:00.000Z"),
        errorMessage: null,
        createdAt: new Date("2026-03-20T10:00:00.000Z"),
        updatedAt: new Date("2026-03-20T10:03:00.000Z")
      });
    const workflowRunUpdate = vi.fn().mockResolvedValue({
      id: "run_paused",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: null,
      kind: "prefill",
      status: "running",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-123",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: new Date("2026-03-20T10:00:00.000Z"),
      completedAt: null,
      pauseRequestedAt: null,
      pausedAt: new Date("2026-03-20T10:02:00.000Z"),
      pauseReason: null,
      resumeRequestedAt: new Date("2026-03-20T10:03:00.000Z"),
      errorMessage: null,
      createdAt: new Date("2026-03-20T10:00:00.000Z"),
      updatedAt: new Date("2026-03-20T10:03:00.000Z")
    });
    const workflowRunEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      workflowRun: {
        findUnique: workflowRunFindUnique,
        update: workflowRunUpdate
      },
      workflowRunEvent: {
        create: workflowRunEventCreate
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await (service as any).markResumed("run_paused");

    expect(workflowRunUpdate).toHaveBeenCalledWith({
      where: { id: "run_paused" },
      data: expect.objectContaining({
        status: "running",
        resumeRequestedAt: expect.any(Date)
      })
    });
    expect(workflowRunEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        workflowRunId: "run_paused",
        type: "run_resumed",
        payload: expect.objectContaining({
          status: "running"
        })
      })
    });
    expect(result.status).toBe("running");
  });

  it("returns workflow run detail with linked records and retry chain", async () => {
    const prisma = {
      workflowRun: {
        findUnique: vi.fn().mockResolvedValue({
          id: "run_1",
          jobId: "job_1",
          retryOfRunId: "run_0",
          applicationId: "app_1",
          resumeVersionId: "resume_1",
          kind: "prefill",
          status: "completed",
          executionMode: "temporal",
          workflowId: "prefill-job-job_1-123",
          workflowType: "prefillJobWorkflow",
          taskQueue: "rolecraft-analysis",
          startedAt: new Date("2026-03-17T10:00:00.000Z"),
          completedAt: new Date("2026-03-17T10:01:00.000Z"),
          errorMessage: null,
          createdAt: new Date("2026-03-17T10:00:00.000Z"),
          updatedAt: new Date("2026-03-17T10:01:00.000Z"),
          job: {
            id: "job_1",
            title: "Staff Platform Engineer",
            company: "Rolecraft"
          },
          application: {
            id: "app_1",
            status: "completed",
            approvalStatus: "pending_review",
            submissionStatus: "ready_to_submit",
            createdAt: new Date("2026-03-17T10:01:00.000Z")
          },
          resumeVersion: {
            id: "resume_1",
            headline: "Platform Resume",
            status: "completed"
          },
          retryOfRun: {
            id: "run_0",
            jobId: "job_1",
            retryOfRunId: null,
            applicationId: null,
            resumeVersionId: null,
            kind: "prefill",
            status: "failed",
            executionMode: "direct",
            workflowId: null,
            workflowType: null,
            taskQueue: null,
            startedAt: new Date("2026-03-17T09:58:00.000Z"),
            completedAt: new Date("2026-03-17T09:59:00.000Z"),
            errorMessage: "first run failed",
            createdAt: new Date("2026-03-17T09:58:00.000Z"),
            updatedAt: new Date("2026-03-17T09:59:00.000Z")
          },
          retries: [
            {
              id: "run_2",
              jobId: "job_1",
              retryOfRunId: "run_1",
              applicationId: null,
              resumeVersionId: null,
              kind: "prefill",
              status: "queued",
              executionMode: "temporal",
              workflowId: "prefill-job-job_1-456",
              workflowType: "prefillJobWorkflow",
              taskQueue: "rolecraft-analysis",
              startedAt: null,
              completedAt: null,
              errorMessage: null,
              createdAt: new Date("2026-03-17T10:02:00.000Z"),
              updatedAt: new Date("2026-03-17T10:02:00.000Z")
            }
          ]
        })
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.getWorkflowRunDetail("run_1");

    expect(result.job.company).toBe("Rolecraft");
    expect(result.application?.id).toBe("app_1");
    expect(result.resumeVersion?.id).toBe("resume_1");
    expect(result.retryOfRun?.id).toBe("run_0");
    expect(result.latestRetry?.id).toBe("run_2");
  });

  it("lists workflow run events in descending order", async () => {
    const prisma = {
      workflowRun: {
        findUnique: vi.fn().mockResolvedValue({ id: "run_1" })
      },
      workflowRunEvent: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "event_2",
            workflowRunId: "run_1",
            type: "run_completed",
            payload: { status: "completed" },
            createdAt: new Date("2026-03-17T10:01:00.000Z")
          },
          {
            id: "event_1",
            workflowRunId: "run_1",
            type: "run_started",
            payload: { status: "running" },
            createdAt: new Date("2026-03-17T10:00:00.000Z")
          }
        ])
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    const result = await service.listWorkflowRunEvents("run_1");

    expect(result.map((event) => event.id)).toEqual(["event_2", "event_1"]);
  });

  it("rejects unknown workflow run ids when loading events", async () => {
    const prisma = {
      workflowRun: {
        findUnique: vi.fn().mockResolvedValue(null)
      }
    };
    const service = new WorkflowRunsService(prisma as any);

    await expect(service.listWorkflowRunEvents("missing_run")).rejects.toBeInstanceOf(
      NotFoundException
    );
  });
});
