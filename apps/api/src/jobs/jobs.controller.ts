import { Body, Controller, Get, Inject, NotFoundException, Param, Post } from "@nestjs/common";
import { jobImportRequestSchema } from "@openclaw/shared-types";
import { Prisma } from "@prisma/client";

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
      analyses: job.analyses,
      resumeVersions: job.resumeVersions
    };
  }

  @Post("import-by-url")
  async importByUrl(@Body() body: unknown) {
    const input = parseOrThrow(jobImportRequestSchema, body);
    const imported = await this.importerService.importFromUrl(input.sourceUrl);

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
        data: imported
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
            importStatus: imported.importStatus
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
}
