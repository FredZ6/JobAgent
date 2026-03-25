import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, Optional } from "@nestjs/common";
import { access } from "node:fs/promises";
import { constants as fsConstants } from "node:fs";
import { basename, resolve } from "node:path";
import { Prisma } from "@prisma/client";
import type { Application, AutomationSession, Job, ResumeVersion, UnresolvedAutomationItem } from "@prisma/client";
import { resolveApplicationStorageDir, resolveTemporalRuntime, resolveWorkerRuntime } from "@rolecraft/config";
import {
  isWorkflowRunCancelledError,
  mergeWorkflowRunCancellationSignals,
  throwIfWorkflowRunCancelled
} from "../lib/workflow-run-cancellation.js";
import { PrismaService } from "../lib/prisma.service.js";
import { buildResumePdfDownloadUrl, buildWorkerResumePdfFileName } from "../resume/resume.service.js";
import { TemporalService } from "../temporal/temporal.service.js";
import { DirectRunCancellationRegistryService } from "../workflow-runs/direct-run-cancellation-registry.service.js";
import { WorkflowRunsService } from "../workflow-runs/workflow-runs.service.js";
import {
  applicationEventSchema,
  automationSessionSchema,
  ApprovalRequest,
  ApplicationEventType,
  applicationContextSchema,
  MarkRetryReadyRequest,
  MarkSubmitFailedRequest,
  MarkSubmittedRequest,
  ReopenSubmissionRequest,
  applicationStatusSchema,
  approvalStatusSchema,
  approvalRequestSchema,
  candidateProfileSchema,
  markRetryReadyRequestSchema,
  reopenSubmissionRequestSchema,
  submissionReviewSchema,
  submissionStatusSchema,
  unresolvedAutomationItemSchema,
  updateUnresolvedAutomationItemRequestSchema,
  type UpdateUnresolvedAutomationItemRequest,
  type WorkflowRun,
  type WorkflowRunKind,
  type OrchestrationMetadata,
  type CandidateProfile
} from "@rolecraft/shared-types";

const defaultCandidateProfile = candidateProfileSchema.parse({
  fullName: "",
  email: "",
  phone: "",
  linkedinUrl: "",
  githubUrl: "",
  location: "",
  workAuthorization: "",
  summary: "",
  skills: [],
  experienceLibrary: [],
  projectLibrary: [],
  defaultAnswers: {}
});

type WorkerResponse = {
  status: "completed" | "failed";
  formSnapshot: Record<string, unknown>;
  fieldResults: unknown[];
  screenshotPaths: string[];
  workerLog: unknown[];
  errorMessage: string | null;
};

type WorkerErrorResponse = {
  errorMessage?: string | null;
  error?: string | null;
  message?: string | null;
  workerLog?: Array<{
    level?: string;
    message?: string | null;
  }>;
};

type ApplicationEventRecord = {
  id: string;
  applicationId: string;
  type: string;
  actorType?: string;
  actorLabel?: string;
  actorId?: string | null;
  source?: string;
  payload: Prisma.JsonValue;
  createdAt: Date;
};

const defaultUserActor = {
  actorType: "user",
  actorLabel: "local-user"
} as const;

const workerPrefillActor = {
  actorType: "worker",
  actorLabel: "playwright-worker",
  actorId: "playwright-worker",
  source: "worker-prefill"
} as const;

type ApplicationEventFilters = {
  actorType?: "system" | "user" | "worker" | "api";
  eventType?: ApplicationEventType;
  source?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
};

type WorkflowRunsLike = {
  createDirectRun(input: { jobId: string; kind: WorkflowRunKind }): Promise<Pick<WorkflowRun, "id">>;
  markRunning(id: string): Promise<Pick<WorkflowRun, "id">>;
  markCancelled(id: string): Promise<unknown>;
  markCompleted(
    id: string,
    input?: {
      applicationId?: string | null;
      resumeVersionId?: string | null;
    }
  ): Promise<unknown>;
  markFailed(
    id: string,
    input: {
      errorMessage: string;
      applicationId?: string | null;
      resumeVersionId?: string | null;
    }
  ): Promise<unknown>;
  listJobRuns(jobId: string): Promise<WorkflowRun[]>;
  getWorkflowRun(id: string): Promise<WorkflowRun>;
};

@Injectable()
export class ApplicationsService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Optional() @Inject(TemporalService) private readonly temporalService?: TemporalService,
    @Inject(WorkflowRunsService) private readonly workflowRunsService?: WorkflowRunsService,
    @Optional()
    @Inject(DirectRunCancellationRegistryService)
    private readonly directRunCancellationRegistry?: DirectRunCancellationRegistryService
  ) {}

  async prefillJob(jobId: string) {
    if (resolveTemporalRuntime(process.env).enabled) {
      if (!this.temporalService) {
        throw new BadRequestException("TemporalService is not available");
      }

      return this.temporalService.executePrefillJobWorkflow(jobId);
    }

    return this.prefillJobDirect(jobId, {
      executionMode: "direct"
    });
  }

  async prefillJobDirect(
    jobId: string,
    orchestration?: OrchestrationMetadata,
    workflowRunId?: string,
    signal?: AbortSignal
  ) {
    const workflowRunsService = this.requireWorkflowRunsService();
    const isDirectRun = orchestration?.executionMode === "direct";
    const run = workflowRunId
      ? await workflowRunsService.markRunning(workflowRunId)
      : await workflowRunsService.createDirectRun({
          jobId,
          kind: "prefill"
        });
    const directCancellationSignal =
      isDirectRun && this.directRunCancellationRegistry
        ? this.directRunCancellationRegistry.register(run.id)
        : undefined;
    const mergedSignal = mergeWorkflowRunCancellationSignals(signal, directCancellationSignal);
    let applicationId: string | undefined;
    let automationSessionId: string | undefined;

    try {
      throwIfWorkflowRunCancelled(mergedSignal);

      const job = await this.prisma.job.findUnique({ where: { id: jobId } });
      if (!job) {
        throw new NotFoundException("Job not found");
      }

      if (!job.applyUrl) {
        throw new BadRequestException("Job is missing applyUrl");
      }

      const resumeVersion = await this.prisma.resumeVersion.findFirst({
        where: {
          jobId,
          status: "completed"
        },
        orderBy: {
          createdAt: "desc"
        },
        include: {
          job: {
            select: {
              title: true,
              company: true
            }
          },
          sourceProfile: {
            select: {
              fullName: true
            }
          }
        }
      });

      if (!resumeVersion) {
        throw new BadRequestException("No completed resume version available");
      }

      throwIfWorkflowRunCancelled(mergedSignal);

      const application = await this.prisma.application.create({
        data: {
          jobId,
          resumeVersionId: resumeVersion.id,
          status: applicationStatusSchema.parse("queued"),
          approvalStatus: approvalStatusSchema.parse("pending_review"),
          applyUrl: job.applyUrl,
          formSnapshot: {} as Prisma.InputJsonValue,
          fieldResults: [] as Prisma.InputJsonValue,
          screenshotPaths: [] as Prisma.InputJsonValue,
          workerLog: [] as Prisma.InputJsonValue,
          submissionStatus: submissionStatusSchema.parse("not_ready"),
          submittedAt: null,
          submissionNote: "",
          submittedByUser: false,
          finalSubmissionSnapshot: Prisma.JsonNull,
          reviewNote: "",
          errorMessage: null
        },
        include: {
          job: true,
          resumeVersion: true
        }
      });
      applicationId = application.id;
      const automationSession = await this.prisma.automationSession.create({
        data: {
          applicationId: application.id,
          workflowRunId: run.id,
          kind: "prefill",
          status: "running",
          applyUrl: job.applyUrl,
          resumeVersionId: resumeVersion.id,
          formSnapshot: {} as Prisma.InputJsonValue,
          fieldResults: [] as Prisma.InputJsonValue,
          screenshotPaths: [] as Prisma.InputJsonValue,
          workerLog: [] as Prisma.InputJsonValue,
          errorMessage: null,
          startedAt: new Date(),
          completedAt: null
        }
      });
      automationSessionId = automationSession.id;

      const storedProfile = await this.prisma.candidateProfile.findFirst({
        orderBy: {
          createdAt: "asc"
        }
      });
      const candidateProfile =
        storedProfile != null ? candidateProfileSchema.parse(storedProfile) : defaultCandidateProfile;
      const workerProfile = this.toWorkerProfile(candidateProfile);
      const latestAnalysis = await this.prisma.jobAnalysis.findFirst({
        where: {
          jobId,
          status: "completed"
        },
        orderBy: {
          createdAt: "desc"
        }
      });

      await this.prisma.application.update({
        where: { id: application.id },
        data: {
          status: applicationStatusSchema.parse("running")
        }
      });

      throwIfWorkflowRunCancelled(mergedSignal);

      const workerResult = await this.callWorker({
        applicationId: application.id,
        applyUrl: job.applyUrl,
        profile: workerProfile,
        resume: {
          id: resumeVersion.id,
          headline: resumeVersion.headline,
          status: resumeVersion.status,
          pdfDownloadUrl: buildResumePdfDownloadUrl(resumeVersion.id),
          pdfFileName: buildWorkerResumePdfFileName({
            fullName: candidateProfile.fullName || resumeVersion.sourceProfile?.fullName || "candidate",
            company: job.company,
            title: job.title
          })
        },
        job: {
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          description: job.description,
          applyUrl: job.applyUrl
        },
        analysis: latestAnalysis
          ? {
              matchScore: latestAnalysis.matchScore,
              summary: latestAnalysis.summary,
              requiredSkills: Array.isArray(latestAnalysis.requiredSkills)
                ? latestAnalysis.requiredSkills
                : [],
              missingSkills: Array.isArray(latestAnalysis.missingSkills)
                ? latestAnalysis.missingSkills
                : [],
              redFlags: Array.isArray(latestAnalysis.redFlags) ? latestAnalysis.redFlags : []
            }
          : null,
        defaultAnswers:
          candidateProfile.defaultAnswers && typeof candidateProfile.defaultAnswers === "object"
            ? candidateProfile.defaultAnswers
            : {},
        signal: mergedSignal
      });

      const updated = await this.prisma.$transaction(async (transaction) => {
        const tx = this.prismaMutationClient(transaction);
        const nextStatus = workerResult.status === "completed" ? "completed" : "failed";
        const savedApplication = await tx.application.update({
          where: { id: application.id },
          data: {
            status: nextStatus,
            formSnapshot: workerResult.formSnapshot as Prisma.InputJsonValue,
            fieldResults: workerResult.fieldResults as Prisma.InputJsonValue,
            screenshotPaths: workerResult.screenshotPaths as Prisma.InputJsonValue,
            workerLog: workerResult.workerLog as Prisma.InputJsonValue,
            errorMessage: workerResult.errorMessage
          },
          include: {
            job: true,
            resumeVersion: true
          }
        });

        await this.recordApplicationEvent(
          tx,
          application.id,
          "prefill_run",
          {
            submissionStatus: nextStatus,
            note:
              workerResult.errorMessage ??
              `Prefill ${nextStatus === "completed" ? "completed" : "failed"} in worker`,
            screenshotCount: workerResult.screenshotPaths.length,
            fieldResultCount: Array.isArray(workerResult.fieldResults)
              ? workerResult.fieldResults.length
              : 0,
            orchestration: orchestration ?? {
              executionMode: "direct"
            }
          },
          workerPrefillActor
        );

        if (automationSessionId) {
          await tx.automationSession.update({
            where: { id: automationSessionId },
            data: {
              status: workerResult.status === "completed" ? "completed" : "failed",
              formSnapshot: workerResult.formSnapshot as Prisma.InputJsonValue,
              fieldResults: workerResult.fieldResults as Prisma.InputJsonValue,
              screenshotPaths: workerResult.screenshotPaths as Prisma.InputJsonValue,
              workerLog: workerResult.workerLog as Prisma.InputJsonValue,
              errorMessage: workerResult.errorMessage,
              completedAt: new Date()
            }
          });

          await this.syncUnresolvedAutomationItems(tx, {
            applicationId: application.id,
            automationSessionId,
            fieldResults: workerResult.fieldResults
          });
        }

        return savedApplication;
      });

      if (workerResult.status === "completed") {
        await workflowRunsService.markCompleted(run.id, {
          applicationId: application.id
        });
      } else {
        await workflowRunsService.markFailed(run.id, {
          applicationId: application.id,
          errorMessage: workerResult.errorMessage ?? "Prefill failed"
        });
      }

      return this.formatApplicationWithLatestAutomationSession(updated);
    } catch (error) {
      if (automationSessionId) {
        await this.prisma.automationSession
          .update({
            where: { id: automationSessionId },
            data: {
              status: isWorkflowRunCancelledError(error, mergedSignal) ? "cancelled" : "failed",
              errorMessage: error instanceof Error ? error.message : "Prefill failed",
              completedAt: new Date()
            }
          })
          .catch(() => undefined);
      }

      if (isWorkflowRunCancelledError(error, mergedSignal)) {
        if (applicationId) {
          await this.prisma.application.update({
            where: { id: applicationId },
            data: {
              status: "failed",
              workerLog: [
                {
                  level: "warn",
                  message: "Workflow run was cancelled",
                  timestamp: new Date().toISOString()
                }
              ] as Prisma.InputJsonValue,
              errorMessage: "Workflow run was cancelled"
            }
          });
        }

        if (isDirectRun) {
          await workflowRunsService.markCancelled(run.id);
          throw new ConflictException("Workflow run was cancelled");
        }

        throw error;
      }

      if (applicationId) {
        await this.prisma.application.update({
          where: { id: applicationId },
          data: {
            status: "failed",
            workerLog: [
              { level: "error", message: (error as Error).message, timestamp: new Date().toISOString() }
            ] as Prisma.InputJsonValue,
            errorMessage: error instanceof Error ? error.message : "Prefill failed"
          }
        });
      }

      await workflowRunsService.markFailed(run.id, {
        applicationId: applicationId ?? null,
        errorMessage: error instanceof Error ? error.message : "Prefill failed"
      });

      throw error;
    } finally {
      if (isDirectRun) {
        this.directRunCancellationRegistry?.cleanup(run.id);
      }
    }
  }

  async listJobWorkflowRuns(jobId: string) {
    return this.requireWorkflowRunsService().listJobRuns(jobId);
  }

  async listApplications(jobId: string) {
    const job = await this.prisma.job.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new NotFoundException("Job not found");
    }

    const applications = await this.prisma.application.findMany({
      where: { jobId },
      include: {
        job: true,
        resumeVersion: true
      },
      orderBy: { createdAt: "desc" }
    });

    return applications.map((application) => this.formatApplication(application));
  }

  async listAllApplications() {
    const applications = await this.prisma.application.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    return applications.map((application) => this.formatApplication(application));
  }

  async getApplication(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const latestAutomationSession = await this.getLatestAutomationSession(id);
    const unresolvedItems = await this.listUnresolvedAutomationItems(id);

    return this.formatApplication(application, latestAutomationSession, unresolvedItems);
  }

  async listAutomationSessions(applicationId: string) {
    const application = await this.prisma.application.findUnique({
      where: { id: applicationId },
      select: { id: true }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const sessions = await this.prisma.automationSession.findMany({
      where: { applicationId },
      orderBy: { createdAt: "desc" }
    });

    return sessions.map((session) => this.formatAutomationSession(session));
  }

  async updateApproval(id: string, payload: ApprovalRequest) {
    const application = await this.prisma.application.findUnique({ where: { id } });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const parsed = approvalRequestSchema.parse(payload);

    const updated = await this.runApplicationMutationWithEvent(
      id,
      {
        approvalStatus: parsed.approvalStatus,
        submissionStatus: this.getSubmissionStatusForApproval(
          application.submissionStatus,
          parsed.approvalStatus
        ),
        reviewNote: parsed.reviewNote ?? application.reviewNote
      },
      "approval_updated",
      {
        approvalStatus: parsed.approvalStatus,
        note: parsed.reviewNote ?? application.reviewNote
      }
    );

    return this.formatApplicationWithLatestAutomationSession(updated);
  }

  async getSubmissionReview(id: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const latestAutomationSession = await this.getLatestAutomationSession(id);
    const unresolvedItems = await this.listUnresolvedAutomationItems(id);

    return this.buildSubmissionReview(application, latestAutomationSession, unresolvedItems);
  }

  async updateUnresolvedAutomationItem(
    applicationId: string,
    itemId: string,
    payload: UpdateUnresolvedAutomationItemRequest
  ) {
    const parsed = updateUnresolvedAutomationItemRequestSchema.parse(payload);
    const item = await this.prisma.unresolvedAutomationItem.findUnique({
      where: { id: itemId }
    });

    if (!item || item.applicationId !== applicationId) {
      throw new NotFoundException("Unresolved automation item not found");
    }

    if (item.status !== "unresolved") {
      throw new ConflictException("Unresolved automation item has already been handled");
    }

    const resolutionKind = parsed.status === "resolved" ? "manual_answer" : "skipped_by_user";
    const resolvedAt = new Date();
    const note = parsed.note?.trim();
    const nextMetadata = {
      ...(item.metadata && typeof item.metadata === "object" && !Array.isArray(item.metadata) ? item.metadata : {}),
      ...(note ? { note } : {})
    };

    const updated = await this.prisma.$transaction(async (transaction) => {
      const tx = this.prismaMutationClient(transaction);
      const nextItem = await tx.unresolvedAutomationItem.update({
        where: { id: itemId },
        data: {
          status: parsed.status,
          resolutionKind,
          resolvedAt,
          metadata: nextMetadata as Prisma.InputJsonValue
        }
      });

      await this.recordApplicationEvent(
        tx,
        applicationId,
        "unresolved_item_updated",
        {
          itemId: item.id,
          fieldName: item.fieldName,
          fromStatus: item.status,
          toStatus: parsed.status,
          resolutionKind,
          note: note ?? ""
        },
        defaultUserActor
      );

      return nextItem;
    });

    return this.formatUnresolvedAutomationItem(updated);
  }

  async markSubmitted(id: string, payload: MarkSubmittedRequest) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    this.assertReadyForSubmission(application.approvalStatus, application.submissionStatus);
    const latestAutomationSession = await this.getLatestAutomationSession(id);
    const applicationForSnapshot = this.applyAutomationSessionExecutionState(
      application,
      latestAutomationSession
    );

    const updated = await this.runApplicationMutationWithEvent(
      id,
      {
        submissionStatus: "submitted",
        submittedAt: new Date(),
        submissionNote: payload.submissionNote ?? application.submissionNote,
        submittedByUser: true,
        finalSubmissionSnapshot: this.buildSubmissionSnapshot(applicationForSnapshot) as Prisma.InputJsonValue
      },
      "submission_marked",
      {
        submissionStatus: "submitted",
        note: payload.submissionNote ?? application.submissionNote
      }
    );

    return this.formatApplicationWithLatestAutomationSession(updated);
  }

  async markSubmitFailed(id: string, payload: MarkSubmitFailedRequest) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    this.assertReadyForSubmission(application.approvalStatus, application.submissionStatus);
    const latestAutomationSession = await this.getLatestAutomationSession(id);
    const applicationForSnapshot = this.applyAutomationSessionExecutionState(
      application,
      latestAutomationSession
    );

    const updated = await this.runApplicationMutationWithEvent(
      id,
      {
        submissionStatus: "submit_failed",
        submissionNote: payload.submissionNote ?? application.submissionNote,
        submittedByUser: true,
        finalSubmissionSnapshot: this.buildSubmissionSnapshot(applicationForSnapshot) as Prisma.InputJsonValue
      },
      "submission_failed",
      {
        submissionStatus: "submit_failed",
        note: payload.submissionNote ?? application.submissionNote
      }
    );

    return this.formatApplicationWithLatestAutomationSession(updated);
  }

  async reopenSubmission(id: string, payload: ReopenSubmissionRequest) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const parsed = reopenSubmissionRequestSchema.parse(payload);
    this.assertApprovedForRecovery(application.approvalStatus);
    if (application.submissionStatus !== "submitted") {
      throw new BadRequestException("Only submitted applications can be reopened");
    }

    const updated = await this.runApplicationMutationWithEvent(
      id,
      {
        submissionStatus: "ready_to_submit",
        submissionNote: parsed.note ?? application.submissionNote,
        submittedAt: null,
        submittedByUser: false,
        finalSubmissionSnapshot: Prisma.JsonNull
      },
      "submission_reopened",
      {
        fromStatus: application.submissionStatus,
        toStatus: "ready_to_submit",
        note: parsed.note ?? application.submissionNote
      }
    );

    return this.formatApplicationWithLatestAutomationSession(updated);
  }

  async markRetryReady(id: string, payload: MarkRetryReadyRequest) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      include: {
        job: true,
        resumeVersion: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const parsed = markRetryReadyRequestSchema.parse(payload);
    this.assertApprovedForRecovery(application.approvalStatus);
    if (application.submissionStatus !== "submit_failed") {
      throw new BadRequestException("Only failed submissions can be marked ready to retry");
    }

    const updated = await this.runApplicationMutationWithEvent(
      id,
      {
        submissionStatus: "ready_to_submit",
        submissionNote: parsed.note ?? application.submissionNote,
        submittedAt: null,
        submittedByUser: false,
        finalSubmissionSnapshot: Prisma.JsonNull
      },
      "submission_retry_ready",
      {
        fromStatus: application.submissionStatus,
        toStatus: "ready_to_submit",
        note: parsed.note ?? application.submissionNote
      }
    );

    return this.formatApplicationWithLatestAutomationSession(updated);
  }

  async getApplicationEvents(id: string, filters?: ApplicationEventFilters) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const events = await this.prismaWithApplicationEvents().applicationEvent.findMany({
      where: { applicationId: id },
      orderBy: { createdAt: "desc" }
    });

    const formatted = (events as ApplicationEventRecord[]).map((event) => this.formatApplicationEvent(event));
    const range = this.parseDateRange(filters?.from, filters?.to);

    return formatted
      .filter((event) => !filters?.actorType || event.actorType === filters.actorType)
      .filter((event) => !filters?.eventType || event.type === filters.eventType)
      .filter((event) => !filters?.source || event.source === filters.source)
      .filter((event) => this.matchesDateRange(event.createdAt, range))
      .filter((event) => this.matchesApplicationEventQuery(event, filters?.q))
      .slice(0, filters?.limit ?? 100);
  }

  async getScreenshotFile(id: string, name: string) {
    const application = await this.prisma.application.findUnique({
      where: { id },
      select: {
        id: true,
        screenshotPaths: true
      }
    });

    if (!application) {
      throw new NotFoundException("Application not found");
    }

    const latestAutomationSession = await this.getLatestAutomationSession(id);
    const screenshotPaths = [
      ...this.toScreenshotPaths(application.screenshotPaths),
      ...this.toScreenshotPaths(latestAutomationSession?.screenshotPaths)
    ];
    const filename = basename(name);
    const matchedPath = screenshotPaths.find((path) => basename(path) === filename);

    if (!matchedPath) {
      throw new NotFoundException("Screenshot not found");
    }

    const filePath = resolve(this.getApplicationStorageDir(), id, filename);
    await access(filePath, fsConstants.R_OK).catch(() => {
      throw new NotFoundException("Screenshot file is unavailable");
    });

    return {
      filePath,
      filename
    };
  }

  private formatApplication(
    application: Application & { job?: Job; resumeVersion?: ResumeVersion | null },
    latestAutomationSession?: AutomationSession | null,
    unresolvedItems: UnresolvedAutomationItem[] = []
  ) {
    const effectiveApplication = this.applyAutomationSessionExecutionState(application, latestAutomationSession);
    return applicationContextSchema.parse({
      application: {
        ...effectiveApplication,
        submittedAt: effectiveApplication.submittedAt?.toISOString() ?? null,
        createdAt: effectiveApplication.createdAt.toISOString(),
        updatedAt: effectiveApplication.updatedAt.toISOString()
      },
      job: this.includeJobSummary(application.job),
      resumeVersion: this.includeResumeSummary(application.resumeVersion),
      latestAutomationSession: latestAutomationSession
        ? this.formatAutomationSession(latestAutomationSession)
        : null,
      unresolvedItems: unresolvedItems.map((item) => this.formatUnresolvedAutomationItem(item))
    });
  }

  private async formatApplicationWithLatestAutomationSession(
    application: Application & { job?: Job; resumeVersion?: ResumeVersion | null }
  ) {
    const latestAutomationSession = await this.getLatestAutomationSession(application.id);
    const unresolvedItems = await this.listUnresolvedAutomationItems(application.id);

    return this.formatApplication(application, latestAutomationSession, unresolvedItems);
  }

  private formatAutomationSession(session: AutomationSession) {
    return automationSessionSchema.parse({
      ...session,
      workflowRunId: session.workflowRunId ?? null,
      resumeVersionId: session.resumeVersionId ?? null,
      errorMessage: session.errorMessage ?? null,
      startedAt: session.startedAt?.toISOString() ?? null,
      completedAt: session.completedAt?.toISOString() ?? null,
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString()
    });
  }

  private formatUnresolvedAutomationItem(item: UnresolvedAutomationItem) {
    return unresolvedAutomationItemSchema.parse({
      ...item,
      fieldLabel: item.fieldLabel ?? null,
      questionText: item.questionText ?? null,
      resolutionKind: item.resolutionKind ?? null,
      failureReason: item.failureReason ?? null,
      source: item.source ?? null,
      suggestedValue: item.suggestedValue ?? null,
      resolvedAt: item.resolvedAt?.toISOString() ?? null,
      createdAt: item.createdAt.toISOString(),
      updatedAt: item.updatedAt.toISOString()
    });
  }

  private formatApplicationEvent(event: ApplicationEventRecord) {
    const payloadRecord = this.toEventPayloadRecord(event.payload);
    return applicationEventSchema.parse({
      ...event,
      actorType: event.actorType ?? "system",
      actorLabel: event.actorLabel ?? "system",
      actorId: event.actorId ?? event.actorLabel ?? "system",
      source: event.source ?? "system",
      summary: this.buildApplicationEventSummary(event.type, payloadRecord),
      orchestration: this.toEventOrchestration(payloadRecord),
      createdAt: event.createdAt.toISOString()
    });
  }

  private includeJobSummary(job?: Job) {
    if (!job) {
      return null;
    }

    return {
      id: job.id,
      title: job.title,
      company: job.company,
      applyUrl: job.applyUrl
    };
  }

  private includeResumeSummary(resume?: ResumeVersion | null) {
    if (!resume) {
      return null;
    }

    return {
      id: resume.id,
      headline: resume.headline,
      status: resume.status
    };
  }

  private toWorkerProfile(profile: CandidateProfile) {
    return {
      fullName: profile.fullName,
      email: profile.email,
      phone: profile.phone,
      linkedinUrl: profile.linkedinUrl,
      githubUrl: profile.githubUrl,
      location: profile.location
    };
  }

  private async callWorker(payload: {
    applicationId: string;
    applyUrl: string;
    profile: { fullName: string; email: string; phone: string; linkedinUrl: string; githubUrl: string; location: string };
    resume: {
      id: string;
      headline: string;
      status: string;
      pdfDownloadUrl: string;
      pdfFileName: string;
    };
    job: {
      id: string;
      title: string;
      company: string;
      location: string;
      description: string;
      applyUrl: string;
    };
    analysis: {
      matchScore: number;
      summary: string;
      requiredSkills: unknown[];
      missingSkills: unknown[];
      redFlags: unknown[];
    } | null;
    defaultAnswers: Record<string, string>;
    signal?: AbortSignal;
  }) {
    const workerUrl = resolveWorkerRuntime(process.env);
    const response = await fetch(`${workerUrl}/prefill`, {
      method: "POST",
      signal: payload.signal,
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        applicationId: payload.applicationId,
        applyUrl: payload.applyUrl,
        profile: payload.profile,
        resume: payload.resume,
        job: payload.job,
        analysis: payload.analysis,
        defaultAnswers: payload.defaultAnswers
      })
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(this.extractWorkerErrorMessage(errorText, response.status));
    }

    return (await response.json()) as WorkerResponse;
  }

  private extractWorkerErrorMessage(errorText: string, statusCode: number) {
    const trimmed = errorText.trim();

    if (!trimmed) {
      return `Worker prefill failed with ${statusCode}`;
    }

    try {
      const parsed = JSON.parse(trimmed) as WorkerErrorResponse;
      const directMessage = [parsed.errorMessage, parsed.error, parsed.message].find(
        (value): value is string => typeof value === "string" && value.trim().length > 0
      );

      if (directMessage) {
        return (
          directMessage
            .split("\n")
            .map((line) => line.trim())
            .find((line) => line.length > 0) ?? directMessage
        );
      }

      const loggedMessage = parsed.workerLog?.find(
        (entry): entry is { message: string } =>
          typeof entry?.message === "string" && entry.message.trim().length > 0
      )?.message;

      if (loggedMessage) {
        return loggedMessage;
      }
    } catch {
      // Fall back to the raw worker response body below.
    }

    return trimmed;
  }

  private buildSubmissionReview(
    application: Application & { job?: Job; resumeVersion?: ResumeVersion | null },
    latestAutomationSession?: AutomationSession | null,
    unresolvedItems: UnresolvedAutomationItem[] = []
  ) {
    const formatted = this.formatApplication(application, latestAutomationSession, unresolvedItems);
    const fieldSummary = this.summarizeFieldStates(formatted.application.fieldResults);
    const unresolvedCount =
      formatted.unresolvedItems.length > 0
        ? formatted.unresolvedItems.filter((item) => item.status === "unresolved").length
        : fieldSummary.unresolved;
    const failedCount =
      formatted.unresolvedItems.length > 0
        ? formatted.unresolvedItems.filter((item) => item.status === "unresolved" && item.failureReason)
            .length
        : fieldSummary.failed;

    const review = submissionReviewSchema.parse({
      ...formatted,
      unresolvedFieldCount: unresolvedCount,
      failedFieldCount: failedCount
    });

    return {
      ...review,
      latestAutomationSession: formatted.latestAutomationSession
    };
  }

  private async getLatestAutomationSession(applicationId: string) {
    return (
      (await this.prisma.automationSession.findFirst({
        where: { applicationId },
        orderBy: { createdAt: "desc" }
      })) ?? null
    );
  }

  private async listUnresolvedAutomationItems(applicationId: string) {
    return this.prisma.unresolvedAutomationItem.findMany({
      where: { applicationId },
      orderBy: [{ createdAt: "desc" }]
    });
  }

  private applyAutomationSessionExecutionState(
    application: Application & { job?: Job; resumeVersion?: ResumeVersion | null },
    latestAutomationSession?: AutomationSession | null
  ) {
    if (!latestAutomationSession) {
      return application;
    }

    return {
      ...application,
      formSnapshot: latestAutomationSession.formSnapshot,
      fieldResults: latestAutomationSession.fieldResults,
      screenshotPaths: latestAutomationSession.screenshotPaths,
      workerLog: latestAutomationSession.workerLog,
      errorMessage: latestAutomationSession.errorMessage,
      updatedAt:
        latestAutomationSession.updatedAt > application.updatedAt
          ? latestAutomationSession.updatedAt
          : application.updatedAt
    };
  }

  private getFieldResultState(result: {
    filled: boolean;
    status?: string | null;
    failureReason?: string | null;
  }) {
    if (result.status === "filled" || result.filled) {
      return "filled" as const;
    }

    if (result.status === "failed" || result.failureReason) {
      return "failed" as const;
    }

    return "unresolved" as const;
  }

  private summarizeFieldStates(
    results: Array<{
      filled?: boolean;
      status?: string | null;
      failureReason?: string | null;
    }>
  ) {
    return results.reduce(
      (summary, result) => {
        const state = this.getFieldResultState({
          filled: result.filled === true,
          status: result.status ?? null,
          failureReason: result.failureReason ?? null
        });

        if (state === "failed") {
          summary.failed += 1;
        } else if (state === "unresolved") {
          summary.unresolved += 1;
        }

        return summary;
      },
      { unresolved: 0, failed: 0 }
    );
  }

  private async syncUnresolvedAutomationItems(
    tx: ReturnType<typeof this.prismaMutationClient>,
    input: {
      applicationId: string;
      automationSessionId: string;
      fieldResults: unknown[];
    }
  ) {
    const unresolvedItems = this.buildUnresolvedAutomationItems(input);
    const resolvedFieldNames = this.extractResolvedFieldNames(input.fieldResults);

    if (resolvedFieldNames.length > 0) {
      await tx.unresolvedAutomationItem.updateMany({
        where: {
          applicationId: input.applicationId,
          fieldName: { in: resolvedFieldNames },
          status: "unresolved"
        },
        data: {
          status: "resolved",
          resolutionKind: "fixed_by_rerun",
          resolvedAt: new Date()
        }
      });
    }

    if (unresolvedItems.length > 0) {
      await tx.unresolvedAutomationItem.createMany({
        data: unresolvedItems
      });
    }
  }

  private buildUnresolvedAutomationItems(input: {
    applicationId: string;
    automationSessionId: string;
    fieldResults: unknown[];
  }) {
    return input.fieldResults
      .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null)
      .flatMap((result) => {
        const fieldName = typeof result.fieldName === "string" ? result.fieldName : "";
        if (!fieldName || this.isFieldResultFilled(result)) {
          return [];
        }

        const fieldType =
          result.fieldType === "resume_upload" || result.fieldType === "long_text"
            ? result.fieldType
            : "basic_text";

        return [
          {
            automationSessionId: input.automationSessionId,
            applicationId: input.applicationId,
            fieldName,
            fieldLabel: typeof result.fieldLabel === "string" ? result.fieldLabel : null,
            fieldType,
            questionText: typeof result.questionText === "string" ? result.questionText : null,
            status: "unresolved",
            resolutionKind: null,
            failureReason: typeof result.failureReason === "string" ? result.failureReason : null,
            source: typeof result.source === "string" ? result.source : null,
            suggestedValue: typeof result.suggestedValue === "string" ? result.suggestedValue : null,
            metadata:
              result.metadata && typeof result.metadata === "object"
                ? (result.metadata as Prisma.InputJsonValue)
                : ({} as Prisma.InputJsonValue),
            resolvedAt: null
          }
        ];
      });
  }

  private extractResolvedFieldNames(fieldResults: unknown[]) {
    return fieldResults
      .filter((value): value is Record<string, unknown> => typeof value === "object" && value !== null)
      .flatMap((result) => {
        const fieldName = typeof result.fieldName === "string" ? result.fieldName : "";
        return fieldName && this.isFieldResultFilled(result) ? [fieldName] : [];
      });
  }

  private isFieldResultFilled(result: Record<string, unknown>) {
    return result.filled === true || result.status === "filled";
  }

  private buildSubmissionSnapshot(
    application: Pick<Application, "approvalStatus" | "resumeVersionId" | "applyUrl" | "fieldResults">
  ) {
    const fieldResults = Array.isArray(application.fieldResults)
      ? application.fieldResults.filter(
          (value): value is { filled?: boolean; status?: string | null; failureReason?: string | null } =>
            typeof value === "object" && value !== null
        )
      : [];
    const fieldSummary = this.summarizeFieldStates(fieldResults);

    return {
      approvalStatus: application.approvalStatus,
      resumeVersionId: application.resumeVersionId,
      applyUrl: application.applyUrl,
      unresolvedFieldCount: fieldSummary.unresolved,
      failedFieldCount: fieldSummary.failed
    };
  }

  private toScreenshotPaths(value: unknown) {
    return Array.isArray(value) ? value.filter((path): path is string => typeof path === "string") : [];
  }

  private getSubmissionStatusForApproval(currentStatus: string, approvalStatus: string) {
    if (currentStatus === "submitted" || currentStatus === "submit_failed") {
      return currentStatus;
    }

    if (approvalStatus === "approved_for_submit") {
      return "ready_to_submit";
    }

    return "not_ready";
  }

  private assertReadyForSubmission(approvalStatus: string, submissionStatus: string) {
    if (approvalStatus !== "approved_for_submit") {
      throw new BadRequestException("Application is not approved for submission");
    }

    if (submissionStatus !== "ready_to_submit") {
      throw new BadRequestException("Application is not ready to submit");
    }
  }

  private assertApprovedForRecovery(approvalStatus: string) {
    if (approvalStatus !== "approved_for_submit") {
      throw new BadRequestException("Application is not approved for submission");
    }
  }

  private async runApplicationMutationWithEvent(
    applicationId: string,
    data: Prisma.ApplicationUpdateInput,
    type: ApplicationEventType,
    payload: Record<string, unknown>,
    actor: {
      actorType: "system" | "user" | "worker" | "api";
      actorLabel: string;
      actorId?: string;
      source?: string;
    } = defaultUserActor
  ) {
    return this.prisma.$transaction(async (transaction) => {
      const tx = this.prismaMutationClient(transaction);
      const updated = await tx.application.update({
        where: { id: applicationId },
        data,
        include: {
          job: true,
          resumeVersion: true
        }
      });

      await this.recordApplicationEvent(tx, applicationId, type, payload, actor);

      return updated;
    });
  }

  private async recordApplicationEvent(
    client: ReturnType<typeof this.prismaMutationClient>,
    applicationId: string,
    type: ApplicationEventType,
    payload: Record<string, unknown>,
    actor: {
      actorType: "system" | "user" | "worker" | "api";
      actorLabel: string;
      actorId?: string;
      source?: string;
    } = defaultUserActor
  ) {
    await client.applicationEvent.create({
      data: {
        applicationId,
        type,
        actorType: actor.actorType,
        actorLabel: actor.actorLabel,
        actorId: actor.actorId ?? actor.actorLabel,
        source: actor.source ?? "web-ui",
        payload: payload as Prisma.InputJsonValue
      }
    });
  }

  private getApplicationStorageDir() {
    return resolveApplicationStorageDir(process.env);
  }

  private buildApplicationEventSummary(type: string, payload: Record<string, unknown>) {
    const note =
      typeof payload.note === "string" && payload.note.length > 0
        ? payload.note
        : typeof payload.reviewNote === "string" && payload.reviewNote.length > 0
          ? payload.reviewNote
          : "";
    const fromStatus =
      typeof payload.fromStatus === "string" && payload.fromStatus.length > 0 ? payload.fromStatus : "";
    const toStatus = typeof payload.toStatus === "string" && payload.toStatus.length > 0 ? payload.toStatus : "";
    const approvalStatus =
      typeof payload.approvalStatus === "string" && payload.approvalStatus.length > 0
        ? payload.approvalStatus
        : "";
    const submissionStatus =
      typeof payload.submissionStatus === "string" && payload.submissionStatus.length > 0
        ? payload.submissionStatus
        : "";
    const reasonCode =
      typeof payload.reasonCode === "string" && payload.reasonCode.length > 0 ? payload.reasonCode : "";
    const screenshotCount =
      typeof payload.screenshotCount === "number" && Number.isFinite(payload.screenshotCount)
        ? payload.screenshotCount
        : null;
    const fieldResultCount =
      typeof payload.fieldResultCount === "number" && Number.isFinite(payload.fieldResultCount)
        ? payload.fieldResultCount
        : null;

    if (type === "prefill_run") {
      const base = submissionStatus || "prefill_run";
      const detailParts = [
        fieldResultCount != null ? `${fieldResultCount} fields` : "",
        screenshotCount != null ? `${screenshotCount} screenshots` : ""
      ].filter((value) => value.length > 0);
      const detail = detailParts.join(", ");
      const statusLine = detail ? `${base} · ${detail}` : base;
      return note ? `${statusLine} · ${note}` : statusLine;
    }

    if (fromStatus && toStatus) {
      return note ? `${fromStatus} -> ${toStatus} · ${note}` : `${fromStatus} -> ${toStatus}`;
    }

    if (approvalStatus) {
      return note ? `${approvalStatus} · ${note}` : approvalStatus;
    }

    if (submissionStatus) {
      const base = reasonCode ? `${submissionStatus} (${reasonCode})` : submissionStatus;
      return note ? `${base} · ${note}` : base;
    }

    return note || this.getDefaultApplicationEventLabel(type);
  }

  private getDefaultApplicationEventLabel(type: string) {
    if (type === "prefill_run") {
      return "Prefill run";
    }

    if (type === "approval_updated") {
      return "Approval updated";
    }

    if (type === "submission_marked") {
      return "Submission marked as submitted";
    }

    if (type === "submission_failed") {
      return "Submission marked failed";
    }

    if (type === "submission_reopened") {
      return "Submission reopened";
    }

    if (type === "unresolved_item_updated") {
      return "Unresolved item updated";
    }

    return "Submission ready to retry";
  }

  private toEventOrchestration(payload: Record<string, unknown>) {
    const candidate = payload.orchestration;
    if (candidate == null) {
      return null;
    }

    const parsed = applicationEventSchema.shape.orchestration.safeParse(candidate);
    return parsed.success ? parsed.data : null;
  }

  private toEventPayloadRecord(payload: Prisma.JsonValue) {
    return payload && typeof payload === "object" && !Array.isArray(payload)
      ? (payload as Record<string, unknown>)
      : {};
  }

  private matchesApplicationEventQuery(
    event: ReturnType<typeof applicationEventSchema.parse>,
    query?: string
  ) {
    const normalized = query?.trim().toLowerCase();
    if (!normalized) {
      return true;
    }

    const note =
      typeof event.payload.note === "string"
        ? event.payload.note
        : typeof event.payload.reviewNote === "string"
          ? event.payload.reviewNote
          : "";
    const payloadText = this.flattenSearchValues(event.payload).join(" ");

    const haystack = [
      event.id,
      event.applicationId,
      event.type,
      this.getDefaultApplicationEventLabel(event.type),
      event.summary,
      event.actorType,
      event.actorLabel,
      event.actorId,
      event.source,
      note,
      payloadText
    ]
      .filter((value) => typeof value === "string" && value.length > 0)
      .join(" ")
      .toLowerCase();

    return haystack.includes(normalized);
  }

  private parseDateRange(from?: string, to?: string) {
    return {
      from: this.parseFilterDate(from, "from"),
      to: this.parseFilterDate(to, "to")
    };
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
      throw new BadRequestException(`Invalid ${side} date filter`);
    }

    return parsed;
  }

  private matchesDateRange(
    timestamp: string,
    range: {
      from: Date | null;
      to: Date | null;
    }
  ) {
    const time = new Date(timestamp).getTime();
    if (Number.isNaN(time)) {
      return false;
    }

    if (range.from && time < range.from.getTime()) {
      return false;
    }

    if (range.to && time > range.to.getTime()) {
      return false;
    }

    return true;
  }

  private flattenSearchValues(value: unknown): string[] {
    if (typeof value === "string") {
      return value.length > 0 ? [value] : [];
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return [String(value)];
    }

    if (Array.isArray(value)) {
      return value.flatMap((entry) => this.flattenSearchValues(entry));
    }

    if (value && typeof value === "object") {
      return Object.values(value).flatMap((entry) => this.flattenSearchValues(entry));
    }

    return [];
  }

  private prismaWithApplicationEvents() {
    return this.prisma as PrismaService & {
      applicationEvent: {
        create(args: {
          data: {
            applicationId: string;
            type: string;
            actorType: string;
            actorLabel: string;
            actorId?: string | null;
            source?: string;
            payload: Prisma.InputJsonValue;
          };
        }): Promise<unknown>;
        findMany(args: {
          where: { applicationId: string };
          orderBy: { createdAt: "desc" };
        }): Promise<ApplicationEventRecord[]>;
      };
    };
  }

  private prismaMutationClient(client: unknown) {
    return client as {
      application: {
        update(args: {
          where: { id: string };
          data: Prisma.ApplicationUpdateInput;
          include: { job: true; resumeVersion: true };
        }): Promise<Application & { job: Job; resumeVersion: ResumeVersion }>;
      };
      applicationEvent: {
        create(args: {
          data: {
            applicationId: string;
            type: string;
            actorType: string;
            actorLabel: string;
            actorId?: string | null;
            source?: string;
            payload: Prisma.InputJsonValue;
          };
        }): Promise<unknown>;
      };
      automationSession: {
        update(args: {
          where: { id: string };
          data: {
            status?: string;
            formSnapshot?: Prisma.InputJsonValue;
            fieldResults?: Prisma.InputJsonValue;
            screenshotPaths?: Prisma.InputJsonValue;
            workerLog?: Prisma.InputJsonValue;
            errorMessage?: string | null;
            completedAt?: Date;
          };
        }): Promise<unknown>;
      };
      unresolvedAutomationItem: {
        update(args: {
          where: { id: string };
          data: {
            status: string;
            resolutionKind: string;
            resolvedAt: Date;
            metadata: Prisma.InputJsonValue;
          };
        }): Promise<UnresolvedAutomationItem>;
        updateMany(args: {
          where: {
            applicationId: string;
            fieldName: { in: string[] };
            status: string;
          };
          data: {
            status: string;
            resolutionKind: string;
            resolvedAt: Date;
          };
        }): Promise<unknown>;
        createMany(args: {
          data: Array<{
            automationSessionId: string;
            applicationId: string;
            fieldName: string;
            fieldLabel: string | null;
            fieldType: string;
            questionText: string | null;
            status: string;
            resolutionKind: string | null;
            failureReason: string | null;
            source: string | null;
            suggestedValue: string | null;
            metadata: Prisma.InputJsonValue;
            resolvedAt: null;
          }>;
        }): Promise<unknown>;
      };
    };
  }

  private requireWorkflowRunsService() {
    if (this.workflowRunsService) {
      return this.workflowRunsService;
    }

    return this.buildNoopWorkflowRunsService();
  }

  private buildNoopWorkflowRunsService(): WorkflowRunsLike {
    return {
      createDirectRun: async ({ jobId, kind }) => ({
        id: `noop-${kind}-${jobId}`
      }),
      markRunning: async (id) => ({
        id
      }),
      markCancelled: async () => ({}),
      markCompleted: async () => ({}),
      markFailed: async () => ({}),
      listJobRuns: async () => [],
      getWorkflowRun: async () => {
        throw new NotFoundException("Workflow run not found");
      }
    };
  }
}
