import { BadRequestException, Inject, Injectable } from "@nestjs/common";
import type { OrchestrationMetadata, WorkflowRun } from "@openclaw/shared-types";

import { DirectAnalysisService } from "../analysis/direct-analysis.service.js";
import { ApplicationsService } from "../applications/applications.service.js";
import { DirectResumeService } from "../resume/direct-resume.service.js";
import { TemporalService } from "../temporal/temporal.service.js";
import { WorkflowRunsService } from "./workflow-runs.service.js";

@Injectable()
export class WorkflowRunRetriesService {
  constructor(
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Inject(DirectAnalysisService) private readonly directAnalysisService: DirectAnalysisService,
    @Inject(DirectResumeService) private readonly directResumeService: DirectResumeService,
    @Inject(ApplicationsService) private readonly applicationsService: ApplicationsService,
    @Inject(TemporalService) private readonly temporalService: TemporalService
  ) {}

  async retryWorkflowRun(id: string) {
    const originalRun = await this.workflowRunsService.getWorkflowRun(id);

    if (originalRun.status !== "failed") {
      throw new BadRequestException("Only failed workflow runs can be retried");
    }

    try {
      if (process.env.TEMPORAL_ENABLED === "true") {
        await this.retryWithTemporal(originalRun);
        const latestRetry = await this.workflowRunsService.getLatestRetryRun(originalRun.id);
        await this.workflowRunsService.markRetried(originalRun.id, latestRetry.id);
        return latestRetry;
      }

      return await this.retryDirect(originalRun);
    } catch (error) {
      try {
        return await this.workflowRunsService.getLatestRetryRun(originalRun.id);
      } catch {
        throw error;
      }
    }
  }

  private async retryDirect(originalRun: WorkflowRun) {
    const run = await this.workflowRunsService.createDirectRun({
      jobId: originalRun.jobId,
      kind: originalRun.kind,
      retryOfRunId: originalRun.id
    });
    const orchestration = {
      executionMode: "direct"
    } satisfies OrchestrationMetadata;

    switch (originalRun.kind) {
      case "analyze":
        await this.directAnalysisService.analyzeJob(originalRun.jobId, orchestration, run.id);
        break;
      case "generate_resume":
        await this.directResumeService.generateResume(originalRun.jobId, orchestration, run.id);
        break;
      case "prefill":
        await this.applicationsService.prefillJobDirect(originalRun.jobId, orchestration, run.id);
        break;
      default:
        throw new BadRequestException(`Unsupported workflow run kind: ${originalRun.kind}`);
    }

    await this.workflowRunsService.markRetried(originalRun.id, run.id);

    return this.workflowRunsService.getWorkflowRun(run.id);
  }

  private async retryWithTemporal(originalRun: WorkflowRun) {
    const options = {
      retryOfRunId: originalRun.id
    };

    switch (originalRun.kind) {
      case "analyze":
        await this.temporalService.executeAnalyzeJobWorkflow(originalRun.jobId, options);
        return;
      case "generate_resume":
        await this.temporalService.executeGenerateResumeWorkflow(originalRun.jobId, options);
        return;
      case "prefill":
        await this.temporalService.executePrefillJobWorkflow(originalRun.jobId, options);
        return;
      default:
        throw new BadRequestException(`Unsupported workflow run kind: ${originalRun.kind}`);
    }
  }
}
