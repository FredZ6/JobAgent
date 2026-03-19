import { BadRequestException, ConflictException, Inject, Injectable } from "@nestjs/common";

import { TemporalService } from "../temporal/temporal.service.js";
import { DirectRunCancellationRegistryService } from "./direct-run-cancellation-registry.service.js";
import { WorkflowRunsService } from "./workflow-runs.service.js";

@Injectable()
export class WorkflowRunCancelService {
  constructor(
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Inject(TemporalService) private readonly temporalService: TemporalService,
    @Inject(DirectRunCancellationRegistryService)
    private readonly directRunCancellationRegistry: DirectRunCancellationRegistryService
  ) {}

  async cancelWorkflowRun(id: string) {
    const run = await this.workflowRunsService.getWorkflowRun(id);

    if (run.executionMode === "direct") {
      if (run.status !== "running") {
        throw new BadRequestException("Only running direct workflow runs can be cancelled");
      }

      if (!this.directRunCancellationRegistry.has(run.id)) {
        throw new ConflictException("Direct workflow run is no longer cancellable in this API process");
      }

      this.directRunCancellationRegistry.cancel(run.id);
      return this.workflowRunsService.getWorkflowRun(run.id);
    }

    if (run.executionMode !== "temporal") {
      throw new BadRequestException("Only Temporal workflow runs can be cancelled");
    }

    if (run.status !== "queued" && run.status !== "running") {
      throw new BadRequestException("Only queued or running workflow runs can be cancelled");
    }

    if (!run.workflowId) {
      throw new BadRequestException("Workflow run is missing workflowId");
    }

    await this.temporalService.cancelWorkflow(run.workflowId);

    if (run.status === "queued") {
      return this.workflowRunsService.markCancelled(run.id);
    }

    return this.workflowRunsService.getWorkflowRun(run.id);
  }
}
