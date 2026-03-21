import { Body, Controller, Get, Inject, Param, Post, Query } from "@nestjs/common";

import { WorkflowRunBulkActionsService } from "./workflow-run-bulk-actions.service.js";
import { WorkflowRunCancelService } from "./workflow-run-cancel.service.js";
import { WorkflowRunPauseResumeService } from "./workflow-run-pause-resume.service.js";
import { WorkflowRunRetriesService } from "./workflow-run-retries.service.js";
import { WorkflowRunsService } from "./workflow-runs.service.js";

@Controller("workflow-runs")
export class WorkflowRunsController {
  constructor(
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Inject(WorkflowRunCancelService)
    private readonly workflowRunCancelService: WorkflowRunCancelService,
    @Inject(WorkflowRunPauseResumeService)
    private readonly workflowRunPauseResumeService: WorkflowRunPauseResumeService,
    @Inject(WorkflowRunRetriesService)
    private readonly workflowRunRetriesService: WorkflowRunRetriesService,
    @Inject(WorkflowRunBulkActionsService)
    private readonly workflowRunBulkActionsService: WorkflowRunBulkActionsService
  ) {}

  @Get()
  listWorkflowRuns(@Query() query: unknown) {
    return this.workflowRunsService.listWorkflowRuns(query);
  }

  @Post("bulk-retry")
  bulkRetryWorkflowRuns(@Body() body: unknown) {
    return this.workflowRunBulkActionsService.bulkRetryWorkflowRuns(body);
  }

  @Post("bulk-cancel")
  bulkCancelWorkflowRuns(@Body() body: unknown) {
    return this.workflowRunBulkActionsService.bulkCancelWorkflowRuns(body);
  }

  @Post(":id/cancel")
  async cancelWorkflowRun(@Param("id") id: string) {
    const run = await this.workflowRunCancelService.cancelWorkflowRun(id);
    return this.workflowRunsService.getWorkflowRunDetail(run.id);
  }

  @Post(":id/pause")
  pauseWorkflowRun(@Param("id") id: string) {
    return this.workflowRunPauseResumeService.pauseWorkflowRun(id);
  }

  @Post(":id/resume")
  resumeWorkflowRun(@Param("id") id: string) {
    return this.workflowRunPauseResumeService.resumeWorkflowRun(id);
  }

  @Post(":id/retry")
  async retryWorkflowRun(@Param("id") id: string) {
    const run = await this.workflowRunRetriesService.retryWorkflowRun(id);
    return this.workflowRunsService.getWorkflowRunDetail(run.id);
  }

  @Get(":id")
  async getWorkflowRun(@Param("id") id: string) {
    return this.workflowRunsService.getWorkflowRunDetail(id);
  }

  @Get(":id/events")
  getWorkflowRunEvents(@Param("id") id: string) {
    return this.workflowRunsService.listWorkflowRunEvents(id);
  }
}
