import { Injectable, InternalServerErrorException } from "@nestjs/common";

import { type LlmGenerationInput, type LlmProvider, type LlmStructuredJsonInput } from "./llm-provider.types.js";

type GeminiResponsePayload = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

@Injectable()
export class GeminiLlmProviderService implements LlmProvider {
  readonly provider = "gemini" as const;

  async generateText(input: LlmGenerationInput): Promise<string> {
    return this.generateResponse(input);
  }

  async generateStructuredJson(input: LlmStructuredJsonInput): Promise<string> {
    return this.generateResponse(input);
  }

  private async generateResponse(input: LlmGenerationInput | LlmStructuredJsonInput): Promise<string> {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(input.model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": input.apiKey
        },
        signal: input.signal,
        body: JSON.stringify({
          systemInstruction: {
            parts: [
              {
                text: input.instructions
              }
            ]
          },
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: JSON.stringify(input.promptPayload)
                }
              ]
            }
          ],
          ...(this.isStructuredInput(input)
            ? {
                generationConfig: {
                  responseMimeType: "application/json",
                  responseJsonSchema: input.jsonSchema
                }
              }
            : {})
        })
      }
    );

    if (!response.ok) {
      throw new InternalServerErrorException("Gemini request failed");
    }

    const payload = (await response.json()) as GeminiResponsePayload;
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("") ?? "";

    if (text.trim().length === 0) {
      throw new InternalServerErrorException("Gemini response missing text");
    }

    return text;
  }

  private isStructuredInput(
    input: LlmGenerationInput | LlmStructuredJsonInput
  ): input is LlmStructuredJsonInput {
    return "schemaName" in input && "jsonSchema" in input;
  }
}
