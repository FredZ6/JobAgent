import { BadRequestException, Inject, Injectable } from "@nestjs/common";

import { TemporalService } from "../temporal/temporal.service.js";
import { WorkflowRunsService } from "./workflow-runs.service.js";

const PAUSE_REASON = "Requested from workflow detail";

@Injectable()
export class WorkflowRunPauseResumeService {
  constructor(
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Inject(TemporalService) private readonly temporalService: TemporalService
  ) {}

  async pauseWorkflowRun(id: string) {
    const run = await this.workflowRunsService.getWorkflowRun(id);

    if (run.executionMode !== "temporal") {
      throw new BadRequestException("Only Temporal workflow runs can be paused");
    }

    if (run.status !== "queued" && run.status !== "running") {
      throw new BadRequestException("Only queued or running Temporal workflow runs can be paused");
    }

    if (!run.workflowId) {
      throw new BadRequestException("Workflow run is missing workflowId");
    }

    await this.workflowRunsService.requestPause(id, PAUSE_REASON);
    await this.temporalService.pauseWorkflow(run.workflowId);

    if (this.temporalService.usesFakeSignalMode()) {
      await this.workflowRunsService.markPaused(id, PAUSE_REASON);
    }

    return this.workflowRunsService.getWorkflowRunDetail(id);
  }

  async resumeWorkflowRun(id: string) {
    const run = await this.workflowRunsService.getWorkflowRun(id);

    if (run.executionMode !== "temporal") {
      throw new BadRequestException("Only Temporal workflow runs can be resumed");
    }

    if (run.status !== "paused") {
      throw new BadRequestException("Only paused Temporal workflow runs can be resumed");
    }

    if (!run.workflowId) {
      throw new BadRequestException("Workflow run is missing workflowId");
    }

    await this.temporalService.resumeWorkflow(run.workflowId);
    await this.workflowRunsService.markResumed(id);

    return this.workflowRunsService.getWorkflowRunDetail(id);
  }
}
