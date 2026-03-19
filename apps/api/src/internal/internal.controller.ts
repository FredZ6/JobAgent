import { Body, Controller, Headers, Inject, Param, Post, Req, UnauthorizedException } from "@nestjs/common";
import { orchestrationMetadataSchema, type OrchestrationMetadata } from "@openclaw/shared-types";
import { z } from "zod";

import { DirectAnalysisService } from "../analysis/direct-analysis.service.js";
import { ApplicationsService } from "../applications/applications.service.js";
import { buildRequestAbortSignal } from "../lib/workflow-run-cancellation.js";
import { parseOrThrow } from "../lib/zod.js";
import { DirectResumeService } from "../resume/direct-resume.service.js";
import { LongAnswerService } from "./long-answer.service.js";

const longAnswerQuestionSchema = z.object({
  fieldName: z.string().trim().min(1),
  fieldLabel: z.string().trim().min(1).optional(),
  questionText: z.string().trim().min(1).optional(),
  hints: z.array(z.string().trim().min(1)).optional()
});

const generateLongAnswersRequestSchema = z.object({
  questions: z.array(longAnswerQuestionSchema).min(1)
});

@Controller("internal")
export class InternalController {
  constructor(
    @Inject(DirectAnalysisService) private readonly directAnalysisService: DirectAnalysisService,
    @Inject(DirectResumeService) private readonly directResumeService: DirectResumeService,
    @Inject(ApplicationsService) private readonly applicationsService: ApplicationsService,
    @Inject(LongAnswerService) private readonly longAnswerService: LongAnswerService
  ) {}

  private assertInternalToken(internalToken?: string) {
    if (!process.env.JWT_SECRET || internalToken !== process.env.JWT_SECRET) {
      throw new UnauthorizedException("Invalid internal token");
    }
  }

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
    this.assertInternalToken(internalToken);

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
    this.assertInternalToken(internalToken);

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
    this.assertInternalToken(internalToken);

    return this.applicationsService.prefillJobDirect(
      id,
      this.parseOrchestration(body),
      this.parseWorkflowRunId(body),
      buildRequestAbortSignal(request)
    );
  }

  @Post("applications/:id/generate-long-answers")
  async generateLongAnswers(
    @Param("id") id: string,
    @Headers("x-internal-token") internalToken?: string,
    @Body() body?: unknown
  ) {
    this.assertInternalToken(internalToken);
    const input = parseOrThrow(generateLongAnswersRequestSchema, body);
    return this.longAnswerService.generateForApplication(id, input.questions);
  }
}
