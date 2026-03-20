import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import {
  maxWorkflowRunsBulkMutationTargets,
  workflowRunsBulkActionRequestSchema,
  workflowRunsBulkActionResponseSchema,
  type WorkflowRun,
  type WorkflowRunDetail,
  type WorkflowRunsBulkActionResponse
} from "@rolecraft/shared-types";

import { WorkflowRunCancelService } from "./workflow-run-cancel.service.js";
import { WorkflowRunRetriesService } from "./workflow-run-retries.service.js";
import { WorkflowRunsService } from "./workflow-runs.service.js";

@Injectable()
export class WorkflowRunBulkActionsService {
  constructor(
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Inject(WorkflowRunRetriesService)
    private readonly workflowRunRetriesService: WorkflowRunRetriesService,
    @Inject(WorkflowRunCancelService)
    private readonly workflowRunCancelService: WorkflowRunCancelService
  ) {}

  bulkRetryWorkflowRuns(rawInput: unknown) {
    return this.runBulkAction({
      rawInput,
      isEligible: (run) => run.status === "failed",
      getSkipMessage: (run) =>
        run.status === "failed"
          ? null
          : "Only failed workflow runs can be retried.",
      execute: async (run) => {
        const nextRun = await this.workflowRunRetriesService.retryWorkflowRun(run.id);
        return this.workflowRunsService.getWorkflowRunDetail(nextRun.id);
      }
    });
  }

  bulkCancelWorkflowRuns(rawInput: unknown) {
    return this.runBulkAction({
      rawInput,
      isEligible: (run) => run.executionMode === "temporal" && run.status === "queued",
      getSkipMessage: (run) => {
        if (run.executionMode !== "temporal") {
          return "Only queued Temporal workflow runs can be cancelled.";
        }

        if (run.status !== "queued") {
          return "Only queued Temporal workflow runs can be cancelled.";
        }

        return null;
      },
      execute: async (run) => {
        const nextRun = await this.workflowRunCancelService.cancelWorkflowRun(run.id);
        return this.workflowRunsService.getWorkflowRunDetail(nextRun.id);
      }
    });
  }

  private async runBulkAction(input: {
    rawInput: unknown;
    isEligible: (run: WorkflowRun) => boolean;
    getSkipMessage: (run: WorkflowRun) => string | null;
    execute: (run: WorkflowRun) => Promise<WorkflowRunDetail>;
  }): Promise<WorkflowRunsBulkActionResponse> {
    const { runIds } = workflowRunsBulkActionRequestSchema.parse(input.rawInput);
    const results: WorkflowRunsBulkActionResponse["results"] = [];
    const loadedRuns = await Promise.all(
      runIds.map(async (runId) => {
        try {
          return {
            runId,
            run: await this.workflowRunsService.getWorkflowRun(runId),
            loadError: null
          };
        } catch (error) {
          return {
            runId,
            run: null,
            loadError:
              error instanceof Error ? error.message : "Failed to load the selected workflow run."
          };
        }
      })
    );

    const eligibleRuns = loadedRuns
      .filter((entry) => entry.run && input.isEligible(entry.run))
      .map((entry) => entry.run as WorkflowRun);

    if (eligibleRuns.length > maxWorkflowRunsBulkMutationTargets) {
      throw new BadRequestException(
        `Select ${maxWorkflowRunsBulkMutationTargets} eligible workflow runs or fewer at once.`
      );
    }

    for (const entry of loadedRuns) {
      if (!entry.run) {
        results.push({
          runId: entry.runId,
          status: "failed",
          message: entry.loadError ?? "Failed to load the selected workflow run.",
          workflowRun: null
        });
        continue;
      }

      if (!input.isEligible(entry.run)) {
        results.push({
          runId: entry.runId,
          status: "skipped",
          message:
            input.getSkipMessage(entry.run) ?? "Selected workflow run is not eligible.",
          workflowRun: null
        });
        continue;
      }

      try {
        const workflowRun = await input.execute(entry.run);
        results.push({
          runId: entry.runId,
          status: "success",
          message: "Bulk action completed successfully.",
          workflowRun
        });
      } catch (error) {
        results.push({
          runId: entry.runId,
          status: "failed",
          message:
            error instanceof Error ? error.message : "Bulk action failed for the selected run.",
          workflowRun: null
        });
      }
    }

    return workflowRunsBulkActionResponseSchema.parse({
      requestedCount: runIds.length,
      eligibleCount: eligibleRuns.length,
      skippedCount: results.filter((result) => result.status === "skipped").length,
      successCount: results.filter((result) => result.status === "success").length,
      failureCount: results.filter((result) => result.status === "failed").length,
      results
    });
  }
}
