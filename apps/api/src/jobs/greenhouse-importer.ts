type GreenhouseImportResult = {
  title: string;
  company: string;
  location: string;
  description: string;
  applyUrl: string;
  warnings: string[];
  diagnostics: Record<string, unknown>;
};

type GreenhouseImportAttempt = {
  matched: boolean;
  result: GreenhouseImportResult | null;
  warnings: string[];
  diagnostics: Record<string, unknown>;
};

export function matchesGreenhouseJob(sourceUrl: string, html?: string) {
  try {
    const url = new URL(sourceUrl);
    const knownHost = ["boards.greenhouse.io", "job-boards.greenhouse.io"].includes(url.hostname);
    const knownPath = /\/jobs\//i.test(url.pathname);
    const htmlSignals = html ? /id="app_body"|class="app-title"|greenhouse/i.test(html) : false;
    return (knownHost && knownPath) || htmlSignals;
  } catch {
    return false;
  }
}

export function extractGreenhouseJob(html: string, sourceUrl: string): GreenhouseImportAttempt {
  if (!matchesGreenhouseJob(sourceUrl, html)) {
    return {
      matched: false,
      result: null,
      warnings: [],
      diagnostics: {}
    };
  }

  const title =
    pickFirstNonEmpty([
      extractTag(html, /<h1[^>]*class="[^"]*app-title[^"]*"[^>]*>([\s\S]*?)<\/h1>/i),
      extractTag(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
      extractTag(html, /<title>(.*?)<\/title>/is)
    ]) ?? "";
  const company =
    pickFirstNonEmpty([
      extractTag(html, /<div[^>]*class="[^"]*company-name[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
      extractTag(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i),
      deriveBoardCompany(sourceUrl)
    ]) ?? "";
  const location =
    pickFirstNonEmpty([
      extractTag(html, /<div[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
      extractTag(html, /<span[^>]*class="[^"]*location[^"]*"[^>]*>([\s\S]*?)<\/span>/i)
    ]) ?? "";
  const descriptionBlock =
    extractTag(html, /<section[^>]*id="content"[^>]*>([\s\S]*?)<\/section>/i) ??
    extractTag(html, /<div[^>]*class="[^"]*content[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
  const description = normalizeText(descriptionBlock) ?? "";

  const applyCta = extractApplyLink(html, sourceUrl);
  const applyUrl = applyCta ?? sourceUrl;
  const warnings: string[] = [];
  if (!location) {
    warnings.push("greenhouse_location_not_detected");
  }

  const diagnostics = {
    adapter: "greenhouse",
    adapterMatched: true,
    usedStructuredPosting: false,
    descriptionSource: description ? "greenhouse_body" : null,
    locationSource: location ? "greenhouse_location" : "fallback",
    applyUrlSource: applyCta ? "greenhouse_apply_cta" : "source_url"
  } satisfies Record<string, unknown>;

  const hasCoreContent = title.length > 0 && description.length > 0;
  const hasSupportingSignal = company.length > 0 || location.length > 0 || applyUrl.length > 0;

  if (!hasCoreContent || !hasSupportingSignal) {
    return {
      matched: true,
      result: null,
      warnings,
      diagnostics: {
        ...diagnostics,
        adapterAttempted: "greenhouse",
        adapterFallbackReason: "insufficient_greenhouse_content"
      }
    };
  }

  return {
    matched: true,
    result: {
      title,
      company: company || deriveBoardCompany(sourceUrl) || "Unknown company",
      location: location || "Remote / Unspecified",
      description,
      applyUrl,
      warnings,
      diagnostics
    },
    warnings,
    diagnostics
  };
}

function extractTag(html: string, pattern: RegExp) {
  return pattern.exec(html)?.[1] ?? null;
}

function normalizeText(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const stripped = value
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return stripped.length > 0 ? stripped : null;
}

function pickFirstNonEmpty(values: Array<string | null | undefined>) {
  for (const value of values) {
    const normalized = normalizeText(value);
    if (normalized) {
      return normalized;
    }
  }

  return null;
}

function normalizeUrl(value: string | null | undefined, baseUrl: string) {
  if (!value) {
    return null;
  }

  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
}

function extractApplyLink(html: string, sourceUrl: string) {
  const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

  for (const anchor of anchors) {
    const href = anchor[1];
    const text = normalizeText(anchor[2]);
    if (!href || !text) {
      continue;
    }

    if (!/apply|application|submit/i.test(text)) {
      continue;
    }

    return normalizeUrl(href, sourceUrl);
  }

  return null;
}

function deriveBoardCompany(sourceUrl: string) {
  try {
    const url = new URL(sourceUrl);
    const boardSlug = url.pathname.split("/").filter(Boolean)[0];
    if (!boardSlug) {
      return null;
    }

    return boardSlug
      .split(/[-_]/g)
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join(" ");
  } catch {
    return null;
  }
}
