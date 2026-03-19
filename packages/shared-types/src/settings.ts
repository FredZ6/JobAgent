import { z } from "zod";

export const llmSettingsSchema = z.object({
  provider: z.string().min(1),
  model: z.string().min(1),
  apiKey: z.string(),
  isConfigured: z.boolean().default(true)
});

export type LlmSettingsInput = z.infer<typeof llmSettingsSchema>;
