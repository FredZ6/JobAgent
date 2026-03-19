import { Inject, Injectable, InternalServerErrorException } from "@nestjs/common";

import { GeminiLlmProviderService } from "./gemini-llm-provider.service.js";
import { type LlmGenerationInput, type LlmProviderName, type LlmStructuredJsonInput } from "./llm-provider.types.js";
import { OpenAiLlmProviderService } from "./openai-llm-provider.service.js";

type GatewayInput<T> = T & {
  provider: LlmProviderName;
};

@Injectable()
export class LlmGatewayService {
  constructor(
    @Inject(OpenAiLlmProviderService) private readonly openAiProvider: OpenAiLlmProviderService,
    @Inject(GeminiLlmProviderService) private readonly geminiProvider: GeminiLlmProviderService
  ) {}

  async generateText(input: GatewayInput<LlmGenerationInput>) {
    return this.getProvider(input.provider).generateText(input);
  }

  async generateStructuredJson(input: GatewayInput<LlmStructuredJsonInput>) {
    return this.getProvider(input.provider).generateStructuredJson(input);
  }

  private getProvider(provider: LlmProviderName) {
    switch (provider) {
      case "openai":
        return this.openAiProvider;
      case "gemini":
        return this.geminiProvider;
      default:
        throw new InternalServerErrorException(`Unsupported LLM provider configuration: ${provider}`);
    }
  }
}
