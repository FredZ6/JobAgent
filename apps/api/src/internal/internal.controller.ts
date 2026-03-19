import { Body, Controller, Headers, Inject, Param, Post, Req, UnauthorizedException } from "@nestjs/common";
import { orchestrationMetadataSchema, type OrchestrationMetadata } from "@openclaw/shared-types";

import { DirectAnalysisService } from "../analysis/direct-analysis.service.js";
import { ApplicationsService } from "../applications/applications.service.js";
import { buildRequestAbortSignal } from "../lib/workflow-run-cancellation.js";
import { DirectResumeService } from "../resume/direct-resume.service.js";

@Controller("internal")
export class InternalController {
  constructor(
    @Inject(DirectAnalysisService) private readonly directAnalysisService: DirectAnalysisService,
    @Inject(DirectResumeService) private readonly directResumeService: DirectResumeService,
    @Inject(ApplicationsService) private readonly applicationsService: ApplicationsService
  ) {}

  private parseOrchestration(
    body: { orchestration?: OrchestrationMetadata; workflowRunId?: string } | undefined
  ) {
    if (!body?.orchestration) {
      return undefined;
    }

    return orchestrationMetadataSchema.parse(body.orchestration);
  }

  private parseWorkflowRunId(
    body: { orchestration?: OrchestrationMetadata; workflowRunId?: string } | undefined
  ) {
    return typeof body?.workflowRunId === "string" && body.workflowRunId.length > 0
      ? body.workflowRunId
      : undefined;
  }

  @Post("jobs/:id/analyze-direct")
  analyzeDirect(
    @Param("id") id: string,
    @Req() request: { aborted?: boolean; destroyed?: boolean; once(event: "aborted" | "close", listener: () => void): unknown },
    @Headers("x-internal-token") internalToken?: string,
    @Body() body?: { orchestration?: OrchestrationMetadata; workflowRunId?: string }
  ) {
    if (!process.env.JWT_SECRET || internalToken !== process.env.JWT_SECRET) {
      throw new UnauthorizedException("Invalid internal token");
    }

    return this.directAnalysisService.analyzeJob(
      id,
      this.parseOrchestration(body),
      this.parseWorkflowRunId(body),
      buildRequestAbortSignal(request)
    );
  }

  @Post("jobs/:id/generate-resume-direct")
  generateResumeDirect(
    @Param("id") id: string,
    @Req() request: { aborted?: boolean; destroyed?: boolean; once(event: "aborted" | "close", listener: () => void): unknown },
    @Headers("x-internal-token") internalToken?: string,
    @Body() body?: { orchestration?: OrchestrationMetadata; workflowRunId?: string }
  ) {
    if (!process.env.JWT_SECRET || internalToken !== process.env.JWT_SECRET) {
      throw new UnauthorizedException("Invalid internal token");
    }

    return this.directResumeService.generateResume(
      id,
      this.parseOrchestration(body),
      this.parseWorkflowRunId(body),
      buildRequestAbortSignal(request)
    );
  }

  @Post("jobs/:id/prefill-direct")
  prefillDirect(
    @Param("id") id: string,
    @Req() request: { aborted?: boolean; destroyed?: boolean; once(event: "aborted" | "close", listener: () => void): unknown },
    @Headers("x-internal-token") internalToken?: string,
    @Body() body?: { orchestration?: OrchestrationMetadata; workflowRunId?: string }
  ) {
    if (!process.env.JWT_SECRET || internalToken !== process.env.JWT_SECRET) {
      throw new UnauthorizedException("Invalid internal token");
    }

    return this.applicationsService.prefillJobDirect(
      id,
      this.parseOrchestration(body),
      this.parseWorkflowRunId(body),
      buildRequestAbortSignal(request)
    );
  }
}
