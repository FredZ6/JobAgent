export type LlmProviderName = "openai" | "gemini";

export type LlmGenerationInput = {
  model: string;
  apiKey: string;
  instructions: string;
  promptPayload: unknown;
  signal?: AbortSignal;
};

export type LlmStructuredJsonInput = LlmGenerationInput & {
  schemaName: string;
  jsonSchema: Record<string, unknown>;
};

export interface LlmProvider {
  readonly provider: LlmProviderName;
  generateText(input: LlmGenerationInput): Promise<string>;
  generateStructuredJson(input: LlmStructuredJsonInput): Promise<string>;
}
