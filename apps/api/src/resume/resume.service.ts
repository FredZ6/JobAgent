import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { resumeVersionSchema, type OrchestrationMetadata } from "@openclaw/shared-types";
import { ResumeVersion as PrismaResumeVersion } from "@prisma/client";

import { PrismaService } from "../lib/prisma.service.js";
import { TemporalService } from "../temporal/temporal.service.js";
import { DirectResumeService } from "./direct-resume.service.js";

@Injectable()
export class ResumeService {
  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(DirectResumeService) private readonly directResumeService: DirectResumeService,
    @Inject(TemporalService) private readonly temporalService: TemporalService
  ) {}

  async generateResume(jobId: string) {
    if (process.env.TEMPORAL_ENABLED === "true") {
      return this.temporalService.executeGenerateResumeWorkflow(jobId);
    }

    return this.directResumeService.generateResume(jobId, {
      executionMode: "direct"
    } satisfies OrchestrationMetadata);
  }

  async listJobResumeVersions(jobId: string) {
    const versions = await this.prisma.resumeVersion.findMany({
      where: { jobId },
      orderBy: {
        createdAt: "desc"
      }
    });

    return versions.map((version) => this.mapResumeVersion(version));
  }

  async getResumeVersion(id: string) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id }
    });

    if (!version) {
      throw new NotFoundException("Resume version not found");
    }

    return this.mapResumeVersion(version);
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
