import { ConflictException, Injectable } from "@nestjs/common";
import type { OrchestrationMetadata } from "@openclaw/shared-types";
import { CancelledFailure, Client, Connection, WorkflowFailedError } from "@temporalio/client";
import { WorkflowRunsService } from "../workflow-runs/workflow-runs.service.js";
import { Inject } from "@nestjs/common";

@Injectable()
export class TemporalService {
  private clientPromise: Promise<Client> | null = null;

  constructor(@Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService) {}

  async executeAnalyzeJobWorkflow(jobId: string, options?: { retryOfRunId?: string }) {
    const client = await this.getClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "openclaw-analysis";
    const workflowId = `analyze-job-${jobId}-${Date.now()}`;
    const orchestration = this.buildOrchestrationMetadata(
      "analyzeJobWorkflow",
      workflowId,
      taskQueue
    );
    const run = await this.workflowRunsService.createTemporalQueuedRun({
      jobId,
      kind: "analyze",
      workflowId,
      workflowType: "analyzeJobWorkflow",
      taskQueue,
      retryOfRunId: options?.retryOfRunId
    });

    console.log(`Submitting AnalyzeJobWorkflow for ${jobId} on ${taskQueue}`);

    try {
      return await client.workflow.execute("analyzeJobWorkflow", {
        args: [jobId, orchestration, run.id],
        taskQueue,
        workflowId
      });
    } catch (error) {
      if (this.isTemporalCancellation(error)) {
        await this.workflowRunsService.markCancelled(run.id);
        throw new ConflictException("Workflow run was cancelled");
      }

      await this.workflowRunsService.markFailed(run.id, {
        errorMessage: error instanceof Error ? error.message : "Analyze workflow submission failed"
      });
      throw error;
    }
  }

  async executeGenerateResumeWorkflow(jobId: string, options?: { retryOfRunId?: string }) {
    const client = await this.getClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "openclaw-analysis";
    const workflowId = `generate-resume-${jobId}-${Date.now()}`;
    const orchestration = this.buildOrchestrationMetadata(
      "generateResumeWorkflow",
      workflowId,
      taskQueue
    );
    const run = await this.workflowRunsService.createTemporalQueuedRun({
      jobId,
      kind: "generate_resume",
      workflowId,
      workflowType: "generateResumeWorkflow",
      taskQueue,
      retryOfRunId: options?.retryOfRunId
    });

    console.log(`Submitting GenerateResumeWorkflow for ${jobId} on ${taskQueue}`);

    try {
      return await client.workflow.execute("generateResumeWorkflow", {
        args: [jobId, orchestration, run.id],
        taskQueue,
        workflowId
      });
    } catch (error) {
      if (this.isTemporalCancellation(error)) {
        await this.workflowRunsService.markCancelled(run.id);
        throw new ConflictException("Workflow run was cancelled");
      }

      await this.workflowRunsService.markFailed(run.id, {
        errorMessage: error instanceof Error ? error.message : "Resume workflow submission failed"
      });
      throw error;
    }
  }

  async executePrefillJobWorkflow(jobId: string, options?: { retryOfRunId?: string }) {
    const client = await this.getClient();
    const taskQueue = process.env.TEMPORAL_TASK_QUEUE ?? "openclaw-analysis";
    const workflowId = `prefill-job-${jobId}-${Date.now()}`;
    const orchestration = this.buildOrchestrationMetadata(
      "prefillJobWorkflow",
      workflowId,
      taskQueue
    );
    const run = await this.workflowRunsService.createTemporalQueuedRun({
      jobId,
      kind: "prefill",
      workflowId,
      workflowType: "prefillJobWorkflow",
      taskQueue,
      retryOfRunId: options?.retryOfRunId
    });

    console.log(`Submitting PrefillJobWorkflow for ${jobId} on ${taskQueue}`);

    try {
      return await client.workflow.execute("prefillJobWorkflow", {
        args: [jobId, orchestration, run.id],
        taskQueue,
        workflowId
      });
    } catch (error) {
      if (this.isTemporalCancellation(error)) {
        await this.workflowRunsService.markCancelled(run.id);
        throw new ConflictException("Workflow run was cancelled");
      }

      await this.workflowRunsService.markFailed(run.id, {
        errorMessage: error instanceof Error ? error.message : "Prefill workflow submission failed"
      });
      throw error;
    }
  }

  async cancelWorkflow(workflowId: string) {
    const client = await this.getClient();
    const handle = client.workflow.getHandle(workflowId);
    await handle.cancel();
  }

  private buildOrchestrationMetadata(
    workflowType: OrchestrationMetadata["workflowType"],
    workflowId: string,
    taskQueue: string
  ): OrchestrationMetadata {
    return {
      executionMode: "temporal",
      workflowId,
      workflowType,
      taskQueue
    };
  }

  private async getClient() {
    if (!this.clientPromise) {
      this.clientPromise = this.createClient();
    }

    return this.clientPromise;
  }

  private async createClient() {
    const connection = await Connection.connect({
      address: process.env.TEMPORAL_ADDRESS ?? "temporal:7233"
    });

    return new Client({
      connection,
      namespace: process.env.TEMPORAL_NAMESPACE ?? "default"
    });
  }

  private isTemporalCancellation(error: unknown) {
    return error instanceof WorkflowFailedError && error.cause instanceof CancelledFailure;
  }
}
