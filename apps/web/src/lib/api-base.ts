type WebApiEnv = Record<string, string | undefined>;

type ResolveWebApiBaseUrlOptions = {
  browser?: boolean;
};

const defaultApiBaseUrl = "http://localhost:3001";

function normalizeBaseUrl(value: string | undefined) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }

  return trimmed.replace(/\/+$/, "");
}

export function resolveWebApiBaseUrl(
  env: WebApiEnv,
  options: ResolveWebApiBaseUrlOptions = {}
) {
  const nextPublicApiUrl = normalizeBaseUrl(env.NEXT_PUBLIC_API_URL);
  if (nextPublicApiUrl) {
    return nextPublicApiUrl;
  }

  const browser = options.browser ?? (typeof window !== "undefined");
  if (browser) {
    return defaultApiBaseUrl;
  }

  return normalizeBaseUrl(env.API_URL) ?? defaultApiBaseUrl;
}
