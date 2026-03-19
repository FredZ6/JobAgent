import { Inject, Injectable } from "@nestjs/common";

import { LlmGatewayService } from "../llm/llm-gateway.service.js";
import { type LlmProviderName } from "../llm/llm-provider.types.js";

export type LongAnswerGenerationInput = {
  provider: LlmProviderName;
  model: string;
  apiKey: string;
  question: {
    fieldName: string;
    fieldLabel?: string;
    questionText?: string;
    hints?: string[];
  };
  job: {
    title: string;
    company: string;
    description: string;
  };
  resumeHeadline: string;
  profileSummary: string;
  analysisSummary?: string;
  signal?: AbortSignal;
};

@Injectable()
export class LlmLongAnswerService {
  constructor(@Inject(LlmGatewayService) private readonly llmGatewayService: LlmGatewayService) {}

  async generate(input: LongAnswerGenerationInput) {
    const responseText = await this.llmGatewayService.generateText({
      provider: input.provider,
      model: input.model,
      apiKey: input.apiKey,
      instructions:
        "You write concise, truthful answers to application questions. Use only the provided candidate facts and job context. Never invent experience or personal facts.",
      promptPayload: {
        question: input.question,
        job: input.job,
        resumeHeadline: input.resumeHeadline,
        profileSummary: input.profileSummary,
        analysisSummary: input.analysisSummary
      },
      signal: input.signal
    });

    const trimmedResponse = responseText.trim();
    if (trimmedResponse.length === 0) {
      throw new Error("provider returned an empty answer");
    }

    return trimmedResponse;
  }
}
