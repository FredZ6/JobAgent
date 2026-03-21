import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import {
  jobImportDiagnosticsSchema,
  jobImportRequestSchema,
  jobImportSourceSchema,
  type JobImportDiagnostics,
  type JobImportSummary
} from "@rolecraft/shared-types";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { AnalysisService } from "../analysis/analysis.service.js";
import { ApplicationsService } from "../applications/applications.service.js";
import { PrismaService } from "../lib/prisma.service.js";
import { parseOrThrow } from "../lib/zod.js";
import { ResumeService } from "../resume/resume.service.js";
import { WorkflowRunsService } from "../workflow-runs/workflow-runs.service.js";
import { JobImporterService } from "./job-importer.service.js";

@Controller("jobs")
export class JobsController {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(JobImporterService) private readonly importerService: JobImporterService,
    @Inject(AnalysisService) private readonly analysisService: AnalysisService,
    @Inject(ResumeService) private readonly resumeService: ResumeService,
    @Inject(ApplicationsService) private readonly applicationsService: ApplicationsService,
    @Inject(WorkflowRunsService) private readonly workflowRunsService: WorkflowRunsService
  ) {}

  @Get()
  async listJobs() {
    const jobs = await this.prisma.job.findMany({
      orderBy: {
        createdAt: "desc"
      },
      include: {
        events: {
          where: {
            type: "job_imported"
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        analyses: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        resumeVersions: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        }
      }
    });

    return jobs.map((job) => ({
      ...job,
      ...this.buildImportQuality(job.events[0]?.payload),
      latestAnalysis: job.analyses[0]
        ? {
            matchScore: job.analyses[0].matchScore,
            summary: job.analyses[0].summary,
            status: job.analyses[0].status
          }
        : null,
      latestResumeVersion: job.resumeVersions[0]
        ? {
            id: job.resumeVersions[0].id,
            headline: job.resumeVersions[0].headline,
            status: job.resumeVersions[0].status
          }
        : null
    }));
  }

  @Get(":id")
  async getJob(@Param("id") id: string) {
    const job = await this.prisma.job.findUnique({
      where: { id },
      include: {
        events: {
          where: {
            type: "job_imported"
          },
          orderBy: {
            createdAt: "desc"
          },
          take: 1
        },
        analyses: {
          orderBy: {
            createdAt: "desc"
          }
        },
        resumeVersions: {
          orderBy: {
            createdAt: "desc"
          }
        }
      }
    });

    if (!job) {
      throw new NotFoundException("Job not found");
    }

    return {
      ...job,
      ...this.buildImportQuality(job.events[0]?.payload),
      analyses: job.analyses,
      resumeVersions: job.resumeVersions
    };
  }

  @Post("import-by-url")
  async importByUrl(@Body() body: unknown) {
    const input = parseOrThrow(jobImportRequestSchema, body);
    const imported = await this.importerService.importFromUrl(input.sourceUrl);
    const {
      importSource,
      warnings,
      diagnostics,
      ...jobData
    } = imported;

    return this.prisma.$transaction(async (transaction) => {
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

      const job = await tx.job.create({
        data: jobData
      });

      await tx.jobEvent.create({
        data: {
          jobId: job.id,
          type: "job_imported",
          actorType: "api",
          actorLabel: "apps-api",
          actorId: "apps-api",
          source: "jobs-controller",
          payload: {
            sourceUrl: imported.sourceUrl,
            importStatus: imported.importStatus,
            importSource,
            warnings,
            diagnostics
          } as Prisma.InputJsonValue
        }
      });

      return job;
    });
  }

  @Post(":id/analyze")
  analyzeJob(@Param("id") id: string) {
    return this.analysisService.analyzeJob(id);
  }

  @Post(":id/generate-resume")
  generateResume(@Param("id") id: string) {
    return this.resumeService.generateResume(id);
  }

  @Post(":id/prefill")
  prefillJob(@Param("id") id: string) {
    return this.applicationsService.prefillJob(id);
  }

  @Get(":id/applications")
  listApplications(@Param("id") id: string) {
    return this.applicationsService.listApplications(id);
  }

  @Get(":id/workflow-runs")
  listWorkflowRuns(@Param("id") id: string) {
    return this.workflowRunsService.listJobRuns(id);
  }

  @Get(":id/resume-versions")
  listResumeVersions(@Param("id") id: string) {
    return this.resumeService.listJobResumeVersions(id);
  }

  private buildImportQuality(payload: Prisma.JsonValue | undefined) {
    const parsedPayload = jobImportEventPayloadSchema.safeParse(payload);

    if (!parsedPayload.success) {
      return {};
    }

    const warnings = parsedPayload.data.warnings;
    const importSummary: JobImportSummary = {
      source: parsedPayload.data.importSource,
      warnings,
      hasWarnings: warnings.length > 0,
      statusLabel: this.buildImportStatusLabel(parsedPayload.data.importSource, warnings.length > 0)
    };
    const importDiagnostics = this.buildImportDiagnostics(parsedPayload.data.diagnostics);

    return {
      importSummary,
      ...(importDiagnostics ? { importDiagnostics } : {})
    };
  }

  private buildImportStatusLabel(source: z.infer<typeof jobImportSourceSchema>, hasWarnings: boolean) {
    if (source === "synthetic_fallback") {
      return "Fallback import";
    }

    return hasWarnings ? "Live import · warnings" : "Live import";
  }

  private buildImportDiagnostics(diagnostics: unknown): JobImportDiagnostics | undefined {
    const parsedDiagnostics = jobImportDiagnosticsSchema.safeParse(diagnostics);
    return parsedDiagnostics.success ? parsedDiagnostics.data : undefined;
  }
}

const jobImportEventPayloadSchema = z.object({
  importSource: jobImportSourceSchema,
  warnings: z.array(z.string().min(1)).default([]),
  diagnostics: z.unknown().optional()
});
