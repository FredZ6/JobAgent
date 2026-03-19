import { z } from "zod";

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  LLM_PROVIDER: z.string().default("openai"),
  LLM_MODEL: z.string().default("gpt-5.4"),
  LLM_API_KEY: z.string().default(""),
  JWT_SECRET: z.string().default("dev-secret"),
  FILE_STORAGE_PATH: z.string().default("/app/storage")
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(source: Record<string, string | undefined>): AppEnv {
  return appEnvSchema.parse(source);
}
