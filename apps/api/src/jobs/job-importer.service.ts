import { Injectable } from "@nestjs/common";

type ImportedJobRecord = {
  sourceUrl: string;
  applyUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  rawText: string;
  importStatus: "imported" | "failed";
};

export type ImportedJob = ImportedJobRecord & {
  importSource: "live_html" | "synthetic_fallback";
  warnings: string[];
  diagnostics: Record<string, unknown>;
};

@Injectable()
export class JobImporterService {
  async importFromUrl(sourceUrl: string): Promise<ImportedJob> {
    const fallback = this.syntheticJob(sourceUrl, {
      warnings: ["mock_mode_forced"],
      diagnostics: {
        mode: "mock"
      }
    });

    if (process.env.JOB_IMPORT_MODE === "mock") {
      return fallback;
    }

    try {
      const response = await fetch(sourceUrl, {
        headers: {
          "user-agent": "Rolecraft MVP"
        }
      });

      if (!response.ok) {
        return this.syntheticJob(sourceUrl, {
          warnings: ["fetch_failed"],
          diagnostics: {
            fetchStatus: response.status
          }
        });
      }

      const html = await response.text();
      const warnings: string[] = [];
      const diagnostics: Record<string, unknown> = {
        fetchStatus: response.status
      };
      const jsonLd = this.extractJobPostingJsonLd(html);
      diagnostics.usedJsonLd = jsonLd != null;

      const titleCandidate =
        this.pickFirstNonEmpty([
          this.normalizeText(jsonLd?.title),
          this.extractTag(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
          this.extractTag(html, /<meta[^>]+name="title"[^>]+content="([^"]+)"/i),
          this.extractTag(html, /<title>(.*?)<\/title>/is)
        ]) ?? fallback.title;
      diagnostics.titleSource = this.resolveSourceName(titleCandidate, {
        json_ld: this.normalizeText(jsonLd?.title),
        og_title: this.extractTag(html, /<meta[^>]+property="og:title"[^>]+content="([^"]+)"/i),
        meta_title: this.extractTag(html, /<meta[^>]+name="title"[^>]+content="([^"]+)"/i),
        title_tag: this.extractTag(html, /<title>(.*?)<\/title>/is),
        fallback: fallback.title
      });

      const descriptionFromBody = this.extractBodyText(html);
      const descriptionCandidate =
        this.pickFirstNonEmpty([
          this.normalizeText(jsonLd?.description),
          this.extractTag(html, /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i),
          this.extractTag(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i),
          descriptionFromBody
        ]) ?? fallback.description;
      diagnostics.descriptionSource = this.resolveSourceName(descriptionCandidate, {
        json_ld: this.normalizeText(jsonLd?.description),
        og_description: this.extractTag(
          html,
          /<meta[^>]+property="og:description"[^>]+content="([^"]+)"/i
        ),
        meta_description: this.extractTag(
          html,
          /<meta[^>]+name="description"[^>]+content="([^"]+)"/i
        ),
        body_text: descriptionFromBody,
        fallback: fallback.description
      });
      diagnostics.usedBodyFallback = diagnostics.descriptionSource === "body_text";
      if (diagnostics.usedBodyFallback) {
        warnings.push("used_body_text_fallback");
      }

      const companyCandidate =
        this.pickFirstNonEmpty([
          this.normalizeText(jsonLd?.hiringOrganizationName),
          this.extractTag(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i)
        ]) ?? fallback.company;
      diagnostics.companySource = this.resolveSourceName(companyCandidate, {
        json_ld: this.normalizeText(jsonLd?.hiringOrganizationName),
        og_site_name: this.extractTag(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i),
        fallback: fallback.company
      });

      const applyLink = this.extractApplyLink(html, sourceUrl);
      const applyUrlCandidate =
        this.pickFirstNonEmpty([
          this.normalizeUrl(jsonLd?.applyUrl, sourceUrl),
          applyLink
        ]) ?? sourceUrl;
      diagnostics.applyUrlSource = this.resolveApplyUrlSource(applyUrlCandidate, {
        jsonLd: this.normalizeUrl(jsonLd?.applyUrl, sourceUrl),
        applyLink,
        fallback: sourceUrl
      });
      if (diagnostics.applyUrlSource === "source_url") {
        warnings.push("apply_url_not_detected");
      }

      const normalizedDescription = descriptionCandidate.trim();
      const hasLiveContent =
        titleCandidate.trim().length > 0 &&
        companyCandidate.trim().length > 0 &&
        normalizedDescription.length > 0 &&
        normalizedDescription !== fallback.description;

      if (!hasLiveContent) {
        return this.syntheticJob(sourceUrl, {
          warnings: warnings.includes("fetch_failed")
            ? warnings
            : [...warnings, "insufficient_live_content"],
          diagnostics: {
            ...diagnostics,
            fallbackReason: "insufficient_live_content"
          }
        });
      }

      return {
        sourceUrl,
        applyUrl: applyUrlCandidate,
        title: titleCandidate.trim(),
        company: companyCandidate.trim(),
        location: fallback.location,
        description: normalizedDescription,
        rawText: normalizedDescription,
        importStatus: "imported",
        importSource: "live_html",
        warnings,
        diagnostics
      };
    } catch (error) {
      return this.syntheticJob(sourceUrl, {
        warnings: ["fetch_failed"],
        diagnostics: {
          fetchError: error instanceof Error ? error.message : "unknown_fetch_error"
        }
      });
    }
  }

  private syntheticJob(
    sourceUrl: string,
    input?: {
      warnings?: string[];
      diagnostics?: Record<string, unknown>;
    }
  ): ImportedJob {
    const url = new URL(sourceUrl);
    const slug = url.pathname
      .split("/")
      .filter(Boolean)
      .pop() ?? "job";
    const title = slug
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (value) => value.toUpperCase());

    return {
      sourceUrl,
      applyUrl: sourceUrl,
      title,
      company: url.hostname.replace(/^www\./, ""),
      location: "Remote / Unspecified",
      description:
        "Imported via synthetic fallback. Replace with live fetch data when the source page is accessible.",
      rawText:
        "Imported via synthetic fallback. Replace with live fetch data when the source page is accessible.",
      importStatus: "failed",
      importSource: "synthetic_fallback",
      warnings: input?.warnings ?? [],
      diagnostics: input?.diagnostics ?? {}
    };
  }

  private extractTag(html: string, pattern: RegExp) {
    return pattern.exec(html)?.[1] ?? null;
  }

  private extractBodyText(html: string) {
    const preferredBody =
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ??
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ??
      html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
    if (!preferredBody) {
      return null;
    }

    return preferredBody
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<a\b[^>]*>[\s\S]*?<\/a>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  }

  private extractJobPostingJsonLd(html: string) {
    const scripts = [...html.matchAll(/<script[^>]+type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi)];

    for (const match of scripts) {
      const candidate = match[1]?.trim();
      if (!candidate) {
        continue;
      }

      try {
        const parsed = JSON.parse(candidate) as unknown;
        const jobPosting = this.findJobPosting(parsed);
        if (jobPosting) {
          return {
            title: this.readString(jobPosting.title),
            description: this.readString(jobPosting.description),
            hiringOrganizationName: this.readString(
              typeof jobPosting.hiringOrganization === "object" && jobPosting.hiringOrganization !== null
                ? (jobPosting.hiringOrganization as Record<string, unknown>).name
                : undefined
            ),
            applyUrl: this.readString(jobPosting.url)
          };
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  private findJobPosting(input: unknown): Record<string, unknown> | null {
    if (Array.isArray(input)) {
      for (const item of input) {
        const match = this.findJobPosting(item);
        if (match) {
          return match;
        }
      }
      return null;
    }

    if (!input || typeof input !== "object") {
      return null;
    }

    const record = input as Record<string, unknown>;
    const typeValue = record["@type"];

    if (
      typeValue === "JobPosting" ||
      (Array.isArray(typeValue) && typeValue.some((value) => value === "JobPosting"))
    ) {
      return record;
    }

    if (record["@graph"]) {
      return this.findJobPosting(record["@graph"]);
    }

    return null;
  }

  private extractApplyLink(html: string, sourceUrl: string) {
    const anchors = [...html.matchAll(/<a\b[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi)];

    for (const anchor of anchors) {
      const href = anchor[1];
      const text = this.normalizeText(anchor[2]);
      if (!href || !text) {
        continue;
      }

      if (!/apply|application|submit/i.test(text)) {
        continue;
      }

      return this.normalizeUrl(href, sourceUrl);
    }

    return null;
  }

  private normalizeUrl(value: string | null | undefined, baseUrl: string) {
    if (!value) {
      return null;
    }

    try {
      return new URL(value, baseUrl).toString();
    } catch {
      return null;
    }
  }

  private normalizeText(value: string | null | undefined) {
    if (!value) {
      return null;
    }

    const stripped = value
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return stripped.length > 0 ? stripped : null;
  }

  private pickFirstNonEmpty(values: Array<string | null | undefined>) {
    for (const value of values) {
      const normalized = this.normalizeText(value);
      if (normalized) {
        return normalized;
      }
    }

    return null;
  }

  private resolveSourceName(
    selectedValue: string,
    candidates: Record<string, string | null | undefined>
  ) {
    const normalizedSelected = this.normalizeText(selectedValue);

    for (const [source, candidate] of Object.entries(candidates)) {
      if (this.normalizeText(candidate) === normalizedSelected) {
        return source;
      }
    }

    return "unknown";
  }

  private resolveApplyUrlSource(
    selectedValue: string,
    candidates: {
      jsonLd: string | null;
      applyLink: string | null;
      fallback: string;
    }
  ) {
    if (candidates.jsonLd === selectedValue) {
      return "json_ld";
    }

    if (candidates.applyLink === selectedValue) {
      return "apply_link";
    }

    if (candidates.fallback === selectedValue) {
      return "source_url";
    }

    return "unknown";
  }

  private readString(value: unknown) {
    return typeof value === "string" ? value : null;
  }
}
