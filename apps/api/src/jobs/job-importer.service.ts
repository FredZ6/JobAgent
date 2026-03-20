import { Injectable } from "@nestjs/common";

type ImportedJob = {
  sourceUrl: string;
  applyUrl: string;
  title: string;
  company: string;
  location: string;
  description: string;
  rawText: string;
  importStatus: "imported" | "failed";
};

@Injectable()
export class JobImporterService {
  async importFromUrl(sourceUrl: string): Promise<ImportedJob> {
    const fallback = this.syntheticJob(sourceUrl);

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
        return fallback;
      }

      const html = await response.text();
      const title = this.extractTag(html, /<title>(.*?)<\/title>/is) ?? fallback.title;
      const description =
        this.extractTag(html, /<meta[^>]+name="description"[^>]+content="([^"]+)"/i) ??
        this.extractBodyText(html) ??
        fallback.description;
      const company =
        this.extractTag(html, /<meta[^>]+property="og:site_name"[^>]+content="([^"]+)"/i) ??
        fallback.company;

      return {
        ...fallback,
        title: title.trim(),
        company: company.trim(),
        description: description.trim(),
        rawText: description.trim()
      };
    } catch {
      return fallback;
    }
  }

  private syntheticJob(sourceUrl: string): ImportedJob {
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
      importStatus: "imported"
    };
  }

  private extractTag(html: string, pattern: RegExp) {
    return pattern.exec(html)?.[1] ?? null;
  }

  private extractBodyText(html: string) {
    const body = html.match(/<body[^>]*>([\s\S]*)<\/body>/i)?.[1];
    if (!body) {
      return null;
    }

    return body
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 6000);
  }
}
