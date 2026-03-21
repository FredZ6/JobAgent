import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { JobImporterService } from "./job-importer.service.js";

const mockFetch = vi.fn();
const originalJobImportMode = process.env.JOB_IMPORT_MODE;

beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockReset();
  delete process.env.JOB_IMPORT_MODE;
});

afterEach(() => {
  vi.unstubAllGlobals();

  if (originalJobImportMode === undefined) {
    delete process.env.JOB_IMPORT_MODE;
    return;
  }

  process.env.JOB_IMPORT_MODE = originalJobImportMode;
});

describe("JobImporterService", () => {
  it("returns an explicit synthetic fallback in mock mode", async () => {
    process.env.JOB_IMPORT_MODE = "mock";
    const service = new JobImporterService();

    const result = await service.importFromUrl("https://jobs.example.com/platform-engineer");

    expect(mockFetch).not.toHaveBeenCalled();
    expect(result).toMatchObject({
      sourceUrl: "https://jobs.example.com/platform-engineer",
      importStatus: "failed",
      importSource: "synthetic_fallback",
      warnings: ["mock_mode_forced"],
      diagnostics: {
        mode: "mock"
      }
    });
  });

  it("prefers JobPosting JSON-LD over weaker metadata sources", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <head>
            <title>Generic Careers Title</title>
            <meta property="og:title" content="OG Platform Engineer" />
            <meta property="og:description" content="OG description" />
            <meta property="og:site_name" content="OG Company" />
            <script type="application/ld+json">
              {
                "@context": "https://schema.org",
                "@type": "JobPosting",
                "title": "Senior Platform Engineer",
                "description": "Own platform reliability and workflow automation.",
                "hiringOrganization": { "name": "Orbital IO" }
              }
            </script>
          </head>
          <body>
            <a href="/apply/platform-engineer">Apply now</a>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.example.com/platform-engineer");

    expect(result).toMatchObject({
      title: "Senior Platform Engineer",
      company: "Orbital IO",
      description: "Own platform reliability and workflow automation.",
      applyUrl: "https://jobs.example.com/apply/platform-engineer",
      importStatus: "imported",
      importSource: "live_html",
      warnings: [],
      diagnostics: {
        fetchStatus: 200,
        usedJsonLd: true,
        titleSource: "json_ld",
        companySource: "json_ld",
        descriptionSource: "json_ld",
        applyUrlSource: "apply_link"
      }
    });
  });

  it("extracts a common apply link and reports body-text fallback warnings when needed", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <head>
            <title>Platform Engineer</title>
            <meta property="og:site_name" content="Orbital" />
          </head>
          <body>
            <main>
              Build internal platforms for product teams.
              Partner with engineering leads to improve delivery workflows.
            </main>
            <a href="/careers/platform-engineer/apply">Apply for this job</a>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.example.com/platform-engineer");

    expect(result).toMatchObject({
      title: "Platform Engineer",
      company: "Orbital",
      applyUrl: "https://jobs.example.com/careers/platform-engineer/apply",
      importStatus: "imported",
      importSource: "live_html"
    });
    expect(result.warnings).toContain("used_body_text_fallback");
    expect(result.diagnostics).toMatchObject({
      applyUrlSource: "apply_link",
      descriptionSource: "body_text",
      usedBodyFallback: true
    });
  });

  it("falls back honestly when fetch fails", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.example.com/platform-engineer");

    expect(result).toMatchObject({
      importStatus: "failed",
      importSource: "synthetic_fallback"
    });
    expect(result.warnings).toContain("fetch_failed");
    expect(result.diagnostics).toMatchObject({
      fetchError: "network down"
    });
  });
});
