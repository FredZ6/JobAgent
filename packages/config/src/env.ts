import { z } from "zod";

export const appEnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  API_URL: z.string().url().default("http://localhost:3001"),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().min(1),
  TEMPORAL_ENABLED: z.string().default("false"),
  TEMPORAL_ADDRESS: z.string().default("temporal:7233"),
  TEMPORAL_NAMESPACE: z.string().default("default"),
  TEMPORAL_TASK_QUEUE: z.string().default("rolecraft-analysis"),
  LLM_PROVIDER: z.string().default("openai"),
  LLM_MODEL: z.string().default("gpt-5.4"),
  LLM_API_KEY: z.string().default(""),
  JWT_SECRET: z.string().default("dev-secret"),
  INTERNAL_API_TOKEN: z.string().default(""),
  FILE_STORAGE_PATH: z.string().default("/app/storage")
});

export type AppEnv = z.infer<typeof appEnvSchema>;

export function parseAppEnv(source: Record<string, string | undefined>): AppEnv {
  return appEnvSchema.parse(source);
}

export function resolveInternalApiToken(
  env: Partial<Record<"NODE_ENV" | "INTERNAL_API_TOKEN" | "JWT_SECRET", string | undefined>>
) {
  const explicitToken = env.INTERNAL_API_TOKEN?.trim() ?? "";
  if (explicitToken.length > 0) {
    return explicitToken;
  }

  if ((env.NODE_ENV ?? "development") !== "production") {
    const fallbackToken = env.JWT_SECRET?.trim() ?? "";
    return fallbackToken.length > 0 ? fallbackToken : undefined;
  }

  return undefined;
}

export function resolveTemporalRuntime(
  env: Partial<
    Record<
      "TEMPORAL_ENABLED" | "TEMPORAL_ADDRESS" | "TEMPORAL_NAMESPACE" | "TEMPORAL_TASK_QUEUE",
      string | undefined
    >
  >
) {
  return {
    enabled: env.TEMPORAL_ENABLED === "true",
    address: env.TEMPORAL_ADDRESS?.trim() || "temporal:7233",
    namespace: env.TEMPORAL_NAMESPACE?.trim() || "default",
    taskQueue: env.TEMPORAL_TASK_QUEUE?.trim() || "rolecraft-analysis"
  };
}

function resolveMockOrLiveMode(value: string | undefined) {
  return {
    mode: value?.trim().toLowerCase() === "mock" ? ("mock" as const) : ("live" as const)
  };
}

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return (trimmed && trimmed.length > 0 ? trimmed : fallback).replace(/\/+$/, "");
}

function normalizePath(value: string | undefined, fallback: string) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
}

export function resolveJobImportRuntime(
  env: Partial<Record<"JOB_IMPORT_MODE", string | undefined>>
) {
  return resolveMockOrLiveMode(env.JOB_IMPORT_MODE);
}

export function resolveAnalysisRuntime(
  env: Partial<Record<"JOB_ANALYSIS_MODE", string | undefined>>
) {
  return resolveMockOrLiveMode(env.JOB_ANALYSIS_MODE);
}

export function resolveResumeRuntime(
  env: Partial<Record<"JOB_RESUME_MODE", string | undefined>>
) {
  return resolveMockOrLiveMode(env.JOB_RESUME_MODE);
}

export function resolveApiBaseUrl(
  env: Partial<Record<"API_URL", string | undefined>>,
  fallback = "http://localhost:3001"
) {
  return normalizeBaseUrl(env.API_URL, fallback);
}

export function resolveWorkerRuntime(
  env: Partial<Record<"WORKER_URL", string | undefined>>,
  fallback = "http://worker-playwright:4000"
) {
  return normalizeBaseUrl(env.WORKER_URL, fallback);
}

export function resolveApplicationStorageDir(
  env: Partial<Record<"APPLICATION_STORAGE_DIR", string | undefined>>,
  fallback = "/app/storage/applications"
) {
  return normalizePath(env.APPLICATION_STORAGE_DIR, fallback);
}

export function resolveServicePort(
  env: Partial<Record<"PORT", string | undefined>>,
  fallback: number
) {
  const rawValue = env.PORT?.trim();
  if (!rawValue) {
    return fallback;
  }

  const parsed = Number.parseInt(rawValue, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}
