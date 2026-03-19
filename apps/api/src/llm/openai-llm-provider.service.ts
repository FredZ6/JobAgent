import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { type LlmGenerationInput, type LlmProvider, type LlmStructuredJsonInput } from "./llm-provider.types.js";

type OpenAiResponsePayload = {
  output_text?: string;
};

@Injectable()
export class OpenAiLlmProviderService implements LlmProvider {
  readonly provider = "openai" as const;

  async generateText(input: LlmGenerationInput): Promise<string> {
    return this.generateResponse(input);
  }

  async generateStructuredJson(input: LlmStructuredJsonInput): Promise<string> {
    return this.generateResponse(input);
  }

  private async generateResponse(input: LlmGenerationInput | LlmStructuredJsonInput): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${input.apiKey}`
      },
      signal: input.signal,
      body: JSON.stringify({
        model: input.model,
        instructions: input.instructions,
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text: JSON.stringify(input.promptPayload)
              }
            ]
          }
        ],
        ...(this.isStructuredInput(input)
          ? {
              text: {
                format: {
                  type: "json_schema",
                  name: input.schemaName,
                  schema: input.jsonSchema
                }
              }
            }
          : {})
      })
    });

    if (!response.ok) {
      throw new InternalServerErrorException("OpenAI request failed");
    }

    const payload = (await response.json()) as OpenAiResponsePayload;
    if (typeof payload.output_text !== "string" || payload.output_text.trim().length === 0) {
      throw new InternalServerErrorException("OpenAI response missing output_text");
    }

    return payload.output_text;
  }

  private isStructuredInput(
    input: LlmGenerationInput | LlmStructuredJsonInput
  ): input is LlmStructuredJsonInput {
    return "schemaName" in input && "jsonSchema" in input;
  }
}
