import { ConflictException, Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { resumeContentSchema, resumeVersionSchema, type OrchestrationMetadata } from "@openclaw/shared-types";
import { Prisma, ResumeVersion as PrismaResumeVersion } from "@prisma/client";

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
import { LlmResumeService } from "./llm-resume.service.js";

@Injectable()
export class DirectResumeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(ProfileService) private readonly profileService: ProfileService,
    @Inject(SettingsService) private readonly settingsService: SettingsService,
    @Inject(LlmResumeService) private readonly llmResumeService: LlmResumeService,
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService,
    @Optional()
    @Inject(DirectRunCancellationRegistryService)
    private readonly directRunCancellationRegistry?: DirectRunCancellationRegistryService
  ) {}

  async generateResume(
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
          kind: "generate_resume"
        });
    const directCancellationSignal =
      isDirectRun && this.directRunCancellationRegistry
        ? this.directRunCancellationRegistry.register(run.id)
        : undefined;
    const mergedSignal = mergeWorkflowRunCancellationSignals(signal, directCancellationSignal);

    try {
      const job = await this.prisma.job.findUnique({
        where: { id: jobId },
        include: {
          analyses: {
            orderBy: {
              createdAt: "desc"
            },
            take: 1
          }
        }
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

      const content = resumeContentSchema.parse(
        await this.llmResumeService.generate({
          profile,
          jobTitle: job.title,
          jobCompany: job.company,
          jobDescription: job.description,
          analysis: job.analyses[0]
            ? {
                matchScore: job.analyses[0].matchScore,
                summary: job.analyses[0].summary,
                requiredSkills: job.analyses[0].requiredSkills as string[],
                missingSkills: job.analyses[0].missingSkills as string[],
                redFlags: job.analyses[0].redFlags as string[]
              }
            : null,
          model: settings.model,
          apiKey: settings.apiKey,
          signal: mergedSignal
        })
      );

      throwIfWorkflowRunCancelled(mergedSignal);

      const sourceProfile = await this.prisma.candidateProfile.findFirst({
        orderBy: { createdAt: "asc" }
      });

      if (!sourceProfile) {
        await this.workflowRunsService.markFailed(run.id, {
          errorMessage: "Profile not found"
        });
        throw new NotFoundException("Profile not found");
      }

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

        const resumeVersion = await tx.resumeVersion.create({
          data: {
            jobId,
            sourceProfileId: sourceProfile.id,
            status: "completed",
            headline: content.headline,
            professionalSummary: content.professionalSummary,
            skills: content.keySkills,
            experienceSections: content.experience,
            projectSections: content.projects,
            changeSummary: content.changeSummary,
            structuredContent: content
          }
        });

        await tx.jobEvent.create({
          data: {
            jobId,
            type: "resume_generated",
            actorType: "api",
            actorLabel: "apps-api",
            actorId: "apps-api",
            source: "resume-service",
            payload: {
              headline: content.headline,
              status: "completed",
              orchestration: orchestration ?? {
                executionMode: "direct"
              }
            } as Prisma.InputJsonValue
          }
        });

        return resumeVersion;
      });

      await this.workflowRunsService.markCompleted(run.id, {
        resumeVersionId: saved.id
      });

      return this.mapResumeVersion(saved);
    } catch (error) {
      if (isWorkflowRunCancelledError(error, mergedSignal)) {
        if (isDirectRun) {
          await this.workflowRunsService.markCancelled(run.id);
          throw new ConflictException("Workflow run was cancelled");
        }

        throw error;
      }

      await this.workflowRunsService.markFailed(run.id, {
        errorMessage: error instanceof Error ? error.message : "Resume generation failed"
      });
      throw error;
    } finally {
      if (isDirectRun) {
        this.directRunCancellationRegistry?.cleanup(run.id);
      }
    }
  }

  private mapResumeVersion(version: PrismaResumeVersion | null) {
    if (!version) {
      throw new NotFoundException("Resume version not found");
    }

    return resumeVersionSchema.parse({
      id: version.id,
      jobId: version.jobId,
      sourceProfileId: version.sourceProfileId,
      status: version.status,
      headline: version.headline,
      professionalSummary: version.professionalSummary,
      skills: version.skills,
      experienceSections: version.experienceSections,
      projectSections: version.projectSections,
      changeSummary: version.changeSummary,
      structuredContent: version.structuredContent,
      errorMessage: version.errorMessage,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString()
    });
  }
}
