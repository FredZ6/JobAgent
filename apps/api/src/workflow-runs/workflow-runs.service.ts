import { BadRequestException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import {
  workflowRunDetailSchema,
  workflowRunExecutionModeSchema,
  workflowRunEventSchema,
  workflowRunKindSchema,
  workflowRunListItemSchema,
  workflowRunSortBySchema,
  workflowRunSortOrderSchema,
  workflowRunSchema,
  workflowRunStatusSchema,
  workflowRunsListQuerySchema,
  workflowRunsListResponseSchema,
  type WorkflowRunDetail,
  type WorkflowRunEvent,
  type WorkflowRunListItem,
  type WorkflowRun,
  type WorkflowRunKind,
  type WorkflowRunSortBy,
  type WorkflowRunSortOrder,
  type WorkflowRunsListResponse
} from "@rolecraft/shared-types";

import { PrismaService } from "../lib/prisma.service.js";

@Injectable()
export class WorkflowRunsService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async createDirectRun(input: {
    jobId: string;
    kind: WorkflowRunKind;
    retryOfRunId?: string | null;
  }) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.create({
        data: {
          jobId: input.jobId,
          retryOfRunId: input.retryOfRunId ?? null,
          kind: workflowRunKindSchema.parse(input.kind),
          status: workflowRunStatusSchema.parse("running"),
          executionMode: workflowRunExecutionModeSchema.parse("direct"),
          startedAt: new Date()
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_started", {
      status: run.status
    });

    return run;
  }

  async createTemporalQueuedRun(input: {
    jobId: string;
    kind: WorkflowRunKind;
    workflowId: string;
    workflowType: string;
    taskQueue: string;
    retryOfRunId?: string | null;
  }) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.create({
        data: {
          jobId: input.jobId,
          retryOfRunId: input.retryOfRunId ?? null,
          kind: workflowRunKindSchema.parse(input.kind),
          status: workflowRunStatusSchema.parse("queued"),
          executionMode: workflowRunExecutionModeSchema.parse("temporal"),
          workflowId: input.workflowId,
          workflowType: input.workflowType,
          taskQueue: input.taskQueue
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_queued", {
      status: run.status,
      workflowId: run.workflowId,
      workflowType: run.workflowType,
      taskQueue: run.taskQueue
    });

    return run;
  }

  async markRunning(id: string) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("running"),
          startedAt: new Date(),
          pauseRequestedAt: null,
          pausedAt: null,
          pauseReason: null
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_started", {
      status: run.status
    });

    return run;
  }

  async markCompleted(
    id: string,
    input?: {
      applicationId?: string | null;
      resumeVersionId?: string | null;
    }
  ) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("completed"),
          applicationId: input?.applicationId,
          resumeVersionId: input?.resumeVersionId,
          errorMessage: null,
          completedAt: new Date()
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_completed", {
      status: run.status,
      applicationId: run.applicationId,
      resumeVersionId: run.resumeVersionId
    });

    return run;
  }

  async markFailed(
    id: string,
    input: {
      errorMessage: string;
      applicationId?: string | null;
      resumeVersionId?: string | null;
    }
  ) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("failed"),
          applicationId: input.applicationId,
          resumeVersionId: input.resumeVersionId,
          errorMessage: input.errorMessage,
          completedAt: new Date()
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_failed", {
      status: run.status,
      errorMessage: run.errorMessage,
      applicationId: run.applicationId,
      resumeVersionId: run.resumeVersionId
    });

    return run;
  }

  async markCancelled(id: string) {
    const run = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("cancelled"),
          errorMessage: null,
          completedAt: new Date()
        }
      })
    );

    await this.recordLifecycleEvent(run.id, "run_cancelled", {
      status: run.status
    });

    return run;
  }

  async requestPause(id: string, pauseReason?: string | null) {
    const run = await this.requireTemporalControllableRun(id, ["queued", "running"]);
    const pauseRequestedAt = new Date();
    const updated = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          pauseRequestedAt,
          pauseReason: pauseReason ?? null
        }
      })
    );

    await this.recordLifecycleEvent(updated.id, "run_pause_requested", {
      status: run.status,
      pauseReason: pauseReason ?? null
    });

    return updated;
  }

  async markPaused(id: string, pauseReason?: string | null) {
    const pausedAt = new Date();
    const updated = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("paused"),
          pausedAt,
          pauseReason: pauseReason ?? null
        }
      })
    );

    await this.recordLifecycleEvent(updated.id, "run_paused", {
      status: updated.status,
      pauseReason: pauseReason ?? updated.pauseReason ?? null
    });

    return updated;
  }

  async markResumed(id: string) {
    await this.requireTemporalControllableRun(id, ["paused"]);
    const resumeRequestedAt = new Date();
    const updated = this.mapWorkflowRun(
      await this.prisma.workflowRun.update({
        where: { id },
        data: {
          status: workflowRunStatusSchema.parse("running"),
          resumeRequestedAt,
          pauseRequestedAt: null,
          pauseReason: null
        }
      })
    );

    await this.recordLifecycleEvent(updated.id, "run_resumed", {
      status: updated.status
    });

    return updated;
  }

  async markRetried(id: string, newRunId: string) {
    await this.ensureWorkflowRunExists(id);
    await this.recordLifecycleEvent(id, "run_retried", {
      retryRunId: newRunId
    });
  }

  async listJobRuns(jobId: string) {
    const job = await this.prisma.job.findUnique({
      where: { id: jobId },
      select: { id: true }
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const runs = await this.prisma.workflowRun.findMany({
      where: { jobId },
      orderBy: {
        createdAt: "desc"
      }
    });

    return runs.map((run) => this.mapWorkflowRun(run));
  }

  async listWorkflowRuns(rawFilters?: unknown): Promise<WorkflowRunsListResponse> {
    const filters = workflowRunsListQuerySchema.parse(rawFilters ?? {});
    const fromDate = this.parseFilterDate(filters.from, "from");
    const toDate = this.parseFilterDate(filters.to, "to");
    const sortBy = workflowRunSortBySchema.parse(filters.sortBy ?? "createdAt");
    const sortOrder = workflowRunSortOrderSchema.parse(filters.sortOrder ?? "desc");
    const limit = filters.limit ?? 20;
    const runs = await this.prisma.workflowRun.findMany({
      where: {
        kind: filters.kind,
        status: filters.status,
        executionMode: filters.executionMode,
        ...(fromDate || toDate
          ? {
              createdAt: {
                gte: fromDate ?? undefined,
                lte: toDate ?? undefined
              }
            }
          : {})
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

    const filteredItems = runs
      .map((run) => this.mapWorkflowRunListItem(run))
      .filter((item) => this.matchesWorkflowRunQuery(item, filters.q))
      .filter((item) => this.matchesWorkflowRunDateRange(item.workflowRun.createdAt, filters.from, filters.to));

    const sortedItems = [...filteredItems].sort((left, right) =>
      this.compareWorkflowRunItems(left, right, sortBy, sortOrder)
    );
    const pagedItems = this.paginateWorkflowRunItems(sortedItems, filters.cursor, limit);

    return workflowRunsListResponseSchema.parse({
      summary: this.buildWorkflowRunsSummary(filteredItems.map((item) => item.workflowRun)),
      pageInfo: {
        nextCursor: pagedItems.hasMore ? pagedItems.items.at(-1)?.workflowRun.id ?? null : null,
        hasMore: pagedItems.hasMore,
        returnedCount: pagedItems.items.length
      },
      runs: pagedItems.items
    });
  }

  async getLatestRetryRun(retryOfRunId: string) {
    const run = await this.prisma.workflowRun.findFirst({
      where: { retryOfRunId },
      orderBy: {
        createdAt: "desc"
      }
    });

    if (!run) {
      throw new NotFoundException("Retry workflow run not found");
    }

    return this.mapWorkflowRun(run);
  }

  async getWorkflowRun(id: string) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id }
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    return this.mapWorkflowRun(run);
  }

  async getWorkflowRunDetail(id: string): Promise<WorkflowRunDetail> {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id },
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
            status: true,
            approvalStatus: true,
            submissionStatus: true,
            createdAt: true
          }
        },
        resumeVersion: {
          select: {
            id: true,
            headline: true,
            status: true
          }
        },
        retryOfRun: true,
        retries: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    return workflowRunDetailSchema.parse({
      workflowRun: this.mapWorkflowRun(run),
      job: run.job,
      application: run.application
        ? {
            ...run.application,
            createdAt: run.application.createdAt.toISOString()
          }
        : null,
      resumeVersion: run.resumeVersion,
      retryOfRun: run.retryOfRun ? this.mapWorkflowRun(run.retryOfRun) : null,
      latestRetry: run.retries[0] ? this.mapWorkflowRun(run.retries[0]) : null
    });
  }

  async listWorkflowRunEvents(id: string): Promise<WorkflowRunEvent[]> {
    await this.ensureWorkflowRunExists(id);

    const events = await this.workflowRunEvents().findMany({
      where: { workflowRunId: id },
      orderBy: {
        createdAt: "desc"
      }
    });

    return events.map((event) => this.mapWorkflowRunEvent(event));
  }

  private async ensureWorkflowRunExists(id: string) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id },
      select: { id: true }
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    return run;
  }

  private async recordLifecycleEvent(
    workflowRunId: string,
    type: WorkflowRunEvent["type"],
    payload: Record<string, unknown>
  ) {
    await this.workflowRunEvents().create({
      data: {
        workflowRunId,
        type,
        payload
      }
    });
  }

  private mapWorkflowRunEvent(event: {
    id: string;
    workflowRunId: string;
    type: string;
    payload: unknown;
    createdAt: Date;
  }): WorkflowRunEvent {
    return workflowRunEventSchema.parse({
      ...event,
      payload:
        event.payload && typeof event.payload === "object" && !Array.isArray(event.payload)
          ? event.payload
          : {},
      createdAt: event.createdAt.toISOString()
    });
  }

  private buildWorkflowRunsSummary(runs: WorkflowRun[]) {
    return {
      totalRuns: runs.length,
      queuedRuns: runs.filter((run) => run.status === "queued").length,
      runningRuns: runs.filter((run) => run.status === "running").length,
      completedRuns: runs.filter((run) => run.status === "completed").length,
      failedRuns: runs.filter((run) => run.status === "failed").length,
      cancelledRuns: runs.filter((run) => run.status === "cancelled").length
    };
  }

  private paginateWorkflowRunItems(items: WorkflowRunListItem[], cursor: string | undefined, limit: number) {
    if (!cursor) {
      const pageItems = items.slice(0, limit);
      return {
        items: pageItems,
        hasMore: items.length > pageItems.length
      };
    }

    const cursorIndex = items.findIndex((item) => item.workflowRun.id === cursor);
    if (cursorIndex === -1) {
      throw new BadRequestException("Invalid cursor");
    }

    const pageItems = items.slice(cursorIndex + 1, cursorIndex + 1 + limit);
    return {
      items: pageItems,
      hasMore: cursorIndex + 1 + pageItems.length < items.length
    };
  }

  private compareWorkflowRunItems(
    left: WorkflowRunListItem,
    right: WorkflowRunListItem,
    sortBy: WorkflowRunSortBy,
    sortOrder: WorkflowRunSortOrder
  ) {
    const direction = sortOrder === "asc" ? 1 : -1;
    const primary = this.compareWorkflowRunSortField(left.workflowRun, right.workflowRun, sortBy);
    if (primary !== 0) {
      return primary * direction;
    }

    const createdAtFallback =
      this.compareWorkflowRunDateValue(left.workflowRun.createdAt, right.workflowRun.createdAt, "desc");
    if (createdAtFallback !== 0) {
      return createdAtFallback;
    }

    return left.workflowRun.id.localeCompare(right.workflowRun.id) * -1;
  }

  private compareWorkflowRunSortField(left: WorkflowRun, right: WorkflowRun, sortBy: WorkflowRunSortBy) {
    switch (sortBy) {
      case "createdAt":
        return this.compareWorkflowRunDateValue(left.createdAt, right.createdAt, "asc");
      case "startedAt":
        return this.compareWorkflowRunDateValue(left.startedAt, right.startedAt, "asc");
      case "completedAt":
        return this.compareWorkflowRunDateValue(left.completedAt, right.completedAt, "asc");
      case "status":
        return this.compareWorkflowRunOrderValue(
          left.status,
          right.status,
          ["queued", "running", "paused", "failed", "cancelled", "completed"] satisfies WorkflowRun["status"][]
        );
      case "kind":
        return this.compareWorkflowRunOrderValue(
          left.kind,
          right.kind,
          ["analyze", "generate_resume", "prefill"] satisfies WorkflowRun["kind"][]
        );
    }
  }

  private compareWorkflowRunOrderValue<T extends string>(left: T, right: T, order: T[]) {
    return order.indexOf(left) - order.indexOf(right);
  }

  private compareWorkflowRunDateValue(
    left: string | null,
    right: string | null,
    baseOrder: "asc" | "desc"
  ) {
    if (left === right) {
      return 0;
    }

    if (left == null) {
      return 1;
    }

    if (right == null) {
      return -1;
    }

    const leftTime = new Date(left).getTime();
    const rightTime = new Date(right).getTime();
    if (leftTime === rightTime) {
      return 0;
    }

    return baseOrder === "asc" ? leftTime - rightTime : rightTime - leftTime;
  }

  private matchesWorkflowRunQuery(item: WorkflowRunListItem, query?: string) {
    const normalized = query?.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    const haystack = [
      item.workflowRun.id,
      item.workflowRun.workflowId ?? "",
      item.job.id,
      item.job.title,
      item.job.company,
      item.application?.id ?? "",
      item.resumeVersion?.id ?? "",
      item.resumeVersion?.headline ?? ""
    ]
      .filter((value) => value.length > 0)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  }

  private matchesWorkflowRunDateRange(timestamp: string, from?: string, to?: string) {
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
      throw new BadRequestException(`Invalid ${side} date`);
    }

    return parsed;
  }

  private mapWorkflowRunListItem(run: {
    id: string;
    jobId: string;
    retryOfRunId: string | null;
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
    job: {
      id: string;
      title: string;
      company: string;
    };
    application: {
      id: string;
      status: string;
    } | null;
    resumeVersion: {
      id: string;
      headline: string;
      status: string;
    } | null;
  }): WorkflowRunListItem {
    return workflowRunListItemSchema.parse({
      workflowRun: this.mapWorkflowRun(run),
      job: run.job,
      application: run.application,
      resumeVersion: run.resumeVersion
    });
  }

  private workflowRunEvents(): {
    create(args: {
      data: {
        workflowRunId: string;
        type: string;
        payload: Record<string, unknown>;
      };
    }): Promise<unknown>;
    findMany(args: {
      where: {
        workflowRunId: string;
      };
      orderBy: {
        createdAt: "desc";
      };
    }): Promise<
      Array<{
        id: string;
        workflowRunId: string;
        type: string;
        payload: unknown;
        createdAt: Date;
      }>
    >;
  } {
    return (this.prisma as PrismaService & {
      workflowRunEvent: {
        create(args: {
          data: {
            workflowRunId: string;
            type: string;
            payload: Record<string, unknown>;
          };
        }): Promise<unknown>;
        findMany(args: {
          where: {
            workflowRunId: string;
          };
          orderBy: {
            createdAt: "desc";
          };
        }): Promise<
          Array<{
            id: string;
            workflowRunId: string;
            type: string;
            payload: unknown;
            createdAt: Date;
          }>
        >;
      };
    }).workflowRunEvent;
  }

  private async requireTemporalControllableRun(
    id: string,
    allowedStatuses: WorkflowRun["status"][]
  ) {
    const run = await this.prisma.workflowRun.findUnique({
      where: { id },
      select: {
        id: true,
        executionMode: true,
        status: true
      }
    });

    if (!run) {
      throw new NotFoundException("Workflow run not found");
    }

    if (run.executionMode !== "temporal") {
      throw new BadRequestException("Only Temporal workflow runs support pause or resume");
    }

    if (!allowedStatuses.includes(run.status as WorkflowRun["status"])) {
      throw new BadRequestException("Workflow run is not in a pause/resume-compatible state");
    }

    return run;
  }

  private mapWorkflowRun(run: {
    id: string;
    jobId: string;
    retryOfRunId: string | null;
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
    pauseRequestedAt?: Date | null;
    pausedAt?: Date | null;
    pauseReason?: string | null;
    resumeRequestedAt?: Date | null;
    errorMessage: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): WorkflowRun {
    return workflowRunSchema.parse({
      ...run,
      startedAt: run.startedAt?.toISOString() ?? null,
      completedAt: run.completedAt?.toISOString() ?? null,
      pauseRequestedAt: run.pauseRequestedAt?.toISOString() ?? null,
      pausedAt: run.pausedAt?.toISOString() ?? null,
      pauseReason: run.pauseReason ?? null,
      resumeRequestedAt: run.resumeRequestedAt?.toISOString() ?? null,
      createdAt: run.createdAt.toISOString(),
      updatedAt: run.updatedAt.toISOString()
    });
  }
}
