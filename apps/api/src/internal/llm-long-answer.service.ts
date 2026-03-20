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
  jobFocus: {
    topResponsibilities: string[];
    topRequirements: string[];
  };
  resumeHeadline: string;
  profileSummary: string;
  analysis: {
    summary?: string;
    requiredSkills: string[];
    missingSkills: string[];
    redFlags: string[];
  };
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
        "You write concise, truthful answers to application questions. First respond to what the role is trying to do. Then connect the candidate to the most relevant requirements. Close briefly and naturally. Use only the provided candidate facts and job context. Keep the answer to 2-4 sentences, usually 3. Never invent experience or personal facts.",
      promptPayload: {
        question: input.question,
        job: input.job,
        jobFocus: input.jobFocus,
        resumeHeadline: input.resumeHeadline,
        profileSummary: input.profileSummary,
        analysis: input.analysis
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
