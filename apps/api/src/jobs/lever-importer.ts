import type { JobImportAdapterAttempt, JobImporterAdapter } from "./job-importer-adapters.js";

export const leverImporterAdapter: JobImporterAdapter = {
  name: "lever",
  matches: matchesLeverJob,
  extract: extractLeverJob
};

export function matchesLeverJob(sourceUrl: string, html?: string) {
  try {
    const url = new URL(sourceUrl);
    const knownHost = ["jobs.lever.co"].includes(url.hostname);
    const knownPath = url.pathname.split("/").filter(Boolean).length >= 2;
    const htmlSignals = html
      ? /posting-page|posting-headline|postings-btn-wrapper|lever/i.test(html)
      : false;
    return (knownHost && knownPath) || htmlSignals;
  } catch {
    return false;
  }
}

export function extractLeverJob(html: string, sourceUrl: string): JobImportAdapterAttempt {
  if (!matchesLeverJob(sourceUrl, html)) {
    return {
      matched: false,
      result: null,
      warnings: [],
      diagnostics: {}
    };
  }

  const title =
    pickFirstNonEmpty([
      extractTag(html, /<div[^>]*class="[^"]*posting-headline[^"]*"[^>]*>[\s\S]*?<h[12][^>]*>([\s\S]*?)<\/h[12]>/i),
      extractTag(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
      extractTag(html, /<title>(.*?)<\/title>/is)
    ]) ?? "";
  const company =
    pickFirstNonEmpty([
      extractTag(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i),
      deriveBoardCompany(sourceUrl)
    ]) ?? "";
  const location =
    pickFirstNonEmpty([
      extractTag(html, /<span[^>]*class="[^"]*sort-by-location[^"]*"[^>]*>([\s\S]*?)<\/span>/i),
      extractTag(html, /<div[^>]*class="[^"]*posting-categories[^"]*"[^>]*>[\s\S]*?<span[^>]*>([\s\S]*?)<\/span>/i)
    ]) ?? "";
  const description =
    pickFirstNonEmpty([
      extractTag(html, /<div[^>]*class="[^"]*section-wrapper[^"]*page-full-width[^"]*"[^>]*>([\s\S]*?)<\/div>/i),
      extractTag(html, /<div[^>]*class="[^"]*posting-page[^"]*"[^>]*>([\s\S]*?)<\/div>/i)
    ]) ?? "";
  const applyCta = extractApplyLink(html, sourceUrl);
  const applyUrl = applyCta ?? sourceUrl;

  const warnings: string[] = [];
  if (!location) {
    warnings.push("lever_location_not_detected");
  }

  const diagnostics = {
    adapter: "lever",
    adapterMatched: true,
    usedStructuredPosting: false,
    descriptionSource: description ? "lever_body" : null,
    locationSource: location ? "lever_location" : "fallback",
    applyUrlSource: applyCta ? "lever_apply_cta" : "source_url"
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
        adapterAttempted: "lever",
        adapterFallbackReason: "insufficient_lever_content"
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
