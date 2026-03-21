import { describe, expect, it } from "vitest";

import { extractAshbyJob, matchesAshbyJob } from "./ashby-importer.js";

describe("Ashby importer adapter", () => {
  it("matches common Ashby job URLs", () => {
    expect(matchesAshbyJob("https://jobs.ashbyhq.com/orbital/staff-product-engineer")).toBe(true);
    expect(matchesAshbyJob("https://jobs.lever.co/orbital/7b13efea")).toBe(false);
  });

  it("extracts core fields from an Ashby job page", () => {
    const sourceUrl = "https://jobs.ashbyhq.com/orbital/staff-product-engineer";
    const attempt = extractAshbyJob(
      `<!doctype html>
        <html>
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
            </div>
          </body>
        </html>`,
      sourceUrl
    );

    expect(attempt).toMatchObject({
      matched: true,
      result: {
        title: "Staff Product Engineer",
        company: "Orbital",
        location: "Toronto, Canada",
        description: expect.stringContaining("candidate-facing systems"),
        applyUrl: sourceUrl
      }
    });
  });
});
