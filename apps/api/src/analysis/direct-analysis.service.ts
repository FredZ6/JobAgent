import { ConflictException, Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { jobAnalysisResultSchema, type OrchestrationMetadata } from "@openclaw/shared-types";
import { Prisma } from "@prisma/client";

import {
  isWorkflowRunCancelledError,
  mergeWorkflowRunCancellationSignals,
  throwIfWorkflowRunCancelled
} from "../lib/workflow-run-cancellation.js";
import { PrismaService } from "../lib/prisma.service.js";
import { ProfileService } from "../profile/profile.service.js";
import { SettingsService } from "../settings/settings.service.js";
import { DirectRunCancellationRegistryService } from "../workflow-runs/direct-run-cancellation-registry.service.js";
import { WorkflowRunsService } from "../workflow-runs/workflow-runs.service.js";
import { type LlmProviderName } from "../llm/llm-provider.types.js";
import { LlmAnalysisService } from "./llm-analysis.service.js";

@Injectable()
export class DirectAnalysisService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProfileService) private readonly profileService: ProfileService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(LlmAnalysisService) private readonly llmAnalysisService: LlmAnalysisService,
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Optional()
    @Inject(DirectRunCancellationRegistryService)
    private readonly directRunCancellationRegistry?: DirectRunCancellationRegistryService
  ) {}

  async analyzeJob(
    jobId: string,
    orchestration?: OrchestrationMetadata,
    workflowRunId?: string,
    signal?: AbortSignal
  ) {
    const isDirectRun = orchestration?.executionMode === "direct";
    const run = workflowRunId
      ? await this.workflowRunsService.markRunning(workflowRunId)
      : await this.workflowRunsService.createDirectRun({
          jobId,
          kind: "analyze"
        });
    const directCancellationSignal =
      isDirectRun && this.directRunCancellationRegistry
        ? this.directRunCancellationRegistry.register(run.id)
        : undefined;
    const mergedSignal = mergeWorkflowRunCancellationSignals(signal, directCancellationSignal);

    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId }
      });

      if (!job) {
        await this.workflowRunsService.markFailed(run.id, {
          errorMessage: "Job not found"
        });
        throw new NotFoundException("Job not found");
      }

      throwIfWorkflowRunCancelled(mergedSignal);

      const [profile, settings] = await Promise.all([
        this.profileService.getProfile(),
        this.settingsService.getSettings()
      ]);

      const parsedProfile = {
        ...profile,
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        defaultAnswers:
          profile.defaultAnswers && typeof profile.defaultAnswers === "object"
            ? (profile.defaultAnswers as Record<string, string>)
            : {}
      };

      const result = jobAnalysisResultSchema.parse(
        await this.llmAnalysisService.analyze({
          profile: parsedProfile,
          jobDescription: job.description,
          provider: settings.provider as LlmProviderName,
          model: settings.model,
          apiKey: settings.apiKey,
          signal: mergedSignal
        })
      );

      throwIfWorkflowRunCancelled(mergedSignal);

      const saved = await this.prisma.$transaction(async (transaction) => {
        const tx = transaction as Prisma.TransactionClient & {
          jobEvent: {
            create(args: {
              data: {
                jobId: string;
                type: string;
                actorType: string;
                actorLabel: string;
                actorId: string;
                source: string;
                payload: Prisma.InputJsonValue;
              };
            }): Promise<unknown>;
          };
        };

        const analysis = await tx.jobAnalysis.create({
          data: {
            jobId,
            matchScore: result.matchScore,
            summary: result.summary,
            requiredSkills: result.requiredSkills,
            missingSkills: result.missingSkills,
            redFlags: result.redFlags,
            structuredResult: result,
            status: "completed"
          }
        });

        await tx.jobEvent.create({
          data: {
            jobId,
            type: "analysis_completed",
            actorType: "api",
            actorLabel: "apps-api",
            actorId: "apps-api",
            source: "analysis-service",
            payload: {
              matchScore: result.matchScore,
              summary: result.summary,
              status: "completed",
              orchestration: orchestration ?? {
                executionMode: "direct"
              }
            } as Prisma.InputJsonValue
          }
        });

        return analysis;
      });

      await this.workflowRunsService.markCompleted(run.id, {});

      return {
        id: saved.id,
        jobId: saved.jobId,
        status: saved.status,
        errorMessage: saved.errorMessage,
        createdAt: saved.createdAt,
        updatedAt: saved.updatedAt,
        ...result
      };
    } catch (error) {
      if (isWorkflowRunCancelledError(error, mergedSignal)) {
        if (isDirectRun) {
          await this.workflowRunsService.markCancelled(run.id);
          throw new ConflictException("Workflow run was cancelled");
        }

        throw error;
      }

      await this.workflowRunsService.markFailed(run.id, {
        errorMessage: error instanceof Error ? error.message : "Analysis failed"
      });
      throw error;
    } finally {
      if (isDirectRun) {
        this.directRunCancellationRegistry?.cleanup(run.id);
      }
    }
  }
}
