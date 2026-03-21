import { describe, expect, it } from "vitest";

import { extractLeverJob, matchesLeverJob } from "./lever-importer.js";

describe("Lever importer adapter", () => {
  it("matches common Lever job URLs", () => {
    expect(matchesLeverJob("https://jobs.lever.co/orbital/7b13efea")).toBe(true);
    expect(matchesLeverJob("https://boards.greenhouse.io/orbital/jobs/123")).toBe(false);
  });

  it("extracts core fields from a Lever job page", () => {
    const sourceUrl = "https://jobs.lever.co/orbital/7b13efea";
    const attempt = extractLeverJob(
      `<!doctype html>
        <html>
          <head>
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
            </div>
          </body>
        </html>`,
      sourceUrl
    );

    expect(attempt).toMatchObject({
      matched: true,
      result: {
        title: "Senior Platform Engineer",
        company: "Orbital",
        location: "Remote / Canada",
        description: expect.stringContaining("workflow systems"),
        applyUrl: sourceUrl
      }
    });
  });
});
