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

  it("uses the Greenhouse adapter for richer field extraction", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <head>
            <title>Generic job page</title>
          </head>
          <body>
            <div id="app_body">
              <div class="header">
                <h1 class="app-title">Senior Platform Engineer</h1>
                <div class="company-name">Orbital</div>
                <div class="location">Remote (Canada)</div>
              </div>
              <section id="content">
                <div class="content-intro">
                  Build the internal platform that powers product delivery.
                </div>
                <div class="section-wrapper">
                  <h3>About the role</h3>
                  <p>Own platform reliability, developer workflows, and deployment foundations.</p>
                </div>
              </section>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const sourceUrl = "https://boards.greenhouse.io/orbital/jobs/1234567";
    const result = await service.importFromUrl(sourceUrl);

    expect(result).toMatchObject({
      title: "Senior Platform Engineer",
      company: "Orbital",
      location: "Remote (Canada)",
      description: expect.stringContaining("Own platform reliability"),
      applyUrl: sourceUrl,
      importStatus: "imported",
      importSource: "live_html",
      diagnostics: {
        adapter: "greenhouse",
        adapterMatched: true,
        applyUrlSource: "source_url",
        locationSource: "greenhouse_location",
        descriptionSource: "greenhouse_body"
      }
    });
  });

  it("records a Greenhouse adapter fallback when matched content is insufficient", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <body>
            <div id="app_body">
              <h1 class="app-title"></h1>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://boards.greenhouse.io/orbital/jobs/platform-engineer");

    expect(result).toMatchObject({
      importStatus: "failed",
      importSource: "synthetic_fallback",
      diagnostics: {
        adapterAttempted: "greenhouse",
        adapterMatched: true,
        adapterFallbackReason: "insufficient_greenhouse_content"
      }
    });
  });

  it("treats the Greenhouse source URL as a valid apply URL without generic warnings", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <body>
            <div id="app_body">
              <h1 class="app-title">Platform Engineer</h1>
              <div class="company-name">Orbital</div>
              <div class="location">Remote</div>
              <section id="content">
                <p>Build thoughtful workflow automation for product teams.</p>
              </section>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const sourceUrl = "https://boards.greenhouse.io/orbital/jobs/1234568";
    const result = await service.importFromUrl(sourceUrl);

    expect(result.applyUrl).toBe(sourceUrl);
    expect(result.diagnostics).toMatchObject({
      adapter: "greenhouse",
      applyUrlSource: "source_url"
    });
    expect(result.warnings).not.toContain("apply_url_not_detected");
  });

  it("uses the Lever adapter for richer field extraction", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <head>
            <title>Generic careers page</title>
            <meta property="og:site_name" content="Orbital" />
          </head>
          <body>
            <div class="posting-page">
              <div class="posting-headline">
                <h2>Senior Platform Engineer</h2>
              </div>
              <div class="posting-categories">
                <span class="sort-by-location">Remote / Canada</span>
              </div>
              <div class="section-wrapper page-full-width">
                <p>Build workflow systems that make product delivery faster and safer.</p>
              </div>
              <a href="/orbital/apply" class="postings-btn-wrapper">Apply for this job</a>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.lever.co/orbital/7b13efea");

    expect(result).toMatchObject({
      title: "Senior Platform Engineer",
      company: "Orbital",
      location: "Remote / Canada",
      description: expect.stringContaining("workflow systems"),
      applyUrl: "https://jobs.lever.co/orbital/apply",
      importStatus: "imported",
      importSource: "live_html",
      diagnostics: {
        adapter: "lever",
        adapterMatched: true,
        locationSource: "lever_location",
        descriptionSource: "lever_body",
        applyUrlSource: "lever_apply_cta"
      }
    });
  });

  it("records a Lever adapter fallback when matched content is insufficient", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <body>
            <div class="posting-page">
              <div class="posting-headline"><h2></h2></div>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.lever.co/orbital/7b13efea");

    expect(result).toMatchObject({
      importStatus: "failed",
      importSource: "synthetic_fallback",
      diagnostics: {
        adapterAttempted: "lever",
        adapterMatched: true,
        adapterFallbackReason: "insufficient_lever_content"
      }
    });
  });

  it("uses the Ashby adapter for richer field extraction", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <head>
            <title>Generic job page</title>
          </head>
          <body>
            <div data-ashby-job-posting>
              <header>
                <h1>Staff Product Engineer</h1>
                <div class="ashby-company">Orbital</div>
                <div class="ashby-location">Toronto, Canada</div>
              </header>
              <section data-ashby-job-description>
                <p>Design candidate-facing systems and internal workflow automation foundations.</p>
              </section>
              <a href="/apply/staff-product-engineer" data-ashby-apply-link>Apply</a>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.ashbyhq.com/orbital/staff-product-engineer");

    expect(result).toMatchObject({
      title: "Staff Product Engineer",
      company: "Orbital",
      location: "Toronto, Canada",
      description: expect.stringContaining("candidate-facing systems"),
      applyUrl: "https://jobs.ashbyhq.com/apply/staff-product-engineer",
      importStatus: "imported",
      importSource: "live_html",
      diagnostics: {
        adapter: "ashby",
        adapterMatched: true,
        locationSource: "ashby_location",
        descriptionSource: "ashby_body",
        applyUrlSource: "ashby_apply_cta"
      }
    });
  });

  it("records an Ashby adapter fallback when matched content is insufficient", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => `<!doctype html>
        <html>
          <body>
            <div data-ashby-job-posting>
              <header><h1></h1></header>
            </div>
          </body>
        </html>`
    });

    const service = new JobImporterService();
    const result = await service.importFromUrl("https://jobs.ashbyhq.com/orbital/staff-product-engineer");

    expect(result).toMatchObject({
      importStatus: "failed",
      importSource: "synthetic_fallback",
      diagnostics: {
        adapterAttempted: "ashby",
        adapterMatched: true,
        adapterFallbackReason: "insufficient_ashby_content"
      }
    });
  });
});
