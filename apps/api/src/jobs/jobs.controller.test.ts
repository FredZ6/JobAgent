import { describe, expect, it, vi } from "vitest";

import { JobsController } from "./jobs.controller.js";

describe("JobsController importByUrl", () => {
  it("records import diagnostics in the job_imported event payload", async () => {
    const importerService = {
      importFromUrl: vi.fn().mockResolvedValue({
        sourceUrl: "https://jobs.example.com/platform-engineer",
        applyUrl: "https://jobs.example.com/apply/platform-engineer",
        title: "Platform Engineer",
        company: "Orbital",
        location: "Remote / Unspecified",
        description: "Build internal platforms.",
        rawText: "Build internal platforms.",
        importStatus: "imported",
        importSource: "live_html",
        warnings: ["used_body_text_fallback"],
        diagnostics: {
          fetchStatus: 200,
          descriptionSource: "body_text"
        }
      })
    };

    const jobCreate = vi.fn().mockResolvedValue({
      id: "job_1"
    });
    const jobEventCreate = vi.fn().mockResolvedValue({});
    const prisma = {
      $transaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) =>
        callback({
          job: {
            create: jobCreate
          },
          jobEvent: {
            create: jobEventCreate
          }
        })
      )
    };

    const controller = new JobsController(
      prisma as any,
      importerService as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await controller.importByUrl({
      sourceUrl: "https://jobs.example.com/platform-engineer"
    });

    expect(jobCreate).toHaveBeenCalledWith({
      data: {
        sourceUrl: "https://jobs.example.com/platform-engineer",
        applyUrl: "https://jobs.example.com/apply/platform-engineer",
        title: "Platform Engineer",
        company: "Orbital",
        location: "Remote / Unspecified",
        description: "Build internal platforms.",
        rawText: "Build internal platforms.",
        importStatus: "imported"
      }
    });

    expect(jobEventCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        jobId: "job_1",
        type: "job_imported",
        payload: {
          sourceUrl: "https://jobs.example.com/platform-engineer",
          importStatus: "imported",
          importSource: "live_html",
          warnings: ["used_body_text_fallback"],
          diagnostics: {
            fetchStatus: 200,
            descriptionSource: "body_text"
          }
        }
      })
    });
  });
});

describe("JobsController listJobs", () => {
  it("maps the latest job_imported event into importSummary", async () => {
    const prisma = {
      job: {
        findMany: vi.fn().mockResolvedValue([
          {
            id: "job_1",
            sourceUrl: "https://jobs.example.com/platform-engineer",
            applyUrl: "https://jobs.example.com/apply/platform-engineer",
            title: "Platform Engineer",
            company: "Orbital",
            location: "Remote",
            description: "Build internal platforms.",
            rawText: "Build internal platforms.",
            importStatus: "imported",
            createdAt: "2026-03-21T00:00:00.000Z",
            updatedAt: "2026-03-21T00:00:00.000Z",
            analyses: [],
            resumeVersions: [],
            events: [
              {
                id: "event_1",
                type: "job_imported",
                payload: {
                  importSource: "live_html",
                  warnings: ["used_body_text_fallback"],
                  diagnostics: {
                    fetchStatus: 200
                  }
                }
              }
            ]
          }
        ])
      }
    };

    const controller = new JobsController(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(controller.listJobs()).resolves.toEqual([
      expect.objectContaining({
        id: "job_1",
        importSummary: {
          source: "live_html",
          warnings: ["used_body_text_fallback"],
          hasWarnings: true,
          statusLabel: "Live import · warnings"
        }
      })
    ]);
  });
});

describe("JobsController getJob", () => {
  it("maps the latest job_imported event into importSummary and importDiagnostics", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          sourceUrl: "https://jobs.example.com/platform-engineer",
          applyUrl: "https://jobs.example.com/apply/platform-engineer",
          title: "Platform Engineer",
          company: "Orbital",
          location: "Remote",
          description: "Build internal platforms.",
          rawText: "Build internal platforms.",
          importStatus: "imported",
          createdAt: "2026-03-21T00:00:00.000Z",
          updatedAt: "2026-03-21T00:00:00.000Z",
          analyses: [],
          resumeVersions: [],
          events: [
            {
              id: "event_1",
              type: "job_imported",
              payload: {
                importSource: "live_html",
                warnings: ["apply_url_not_detected"],
                diagnostics: {
                  fetchStatus: 200,
                  usedJsonLd: true,
                  applyUrlSource: "source_url",
                  titleSource: "og:title",
                  companySource: "json_ld",
                  descriptionSource: "json_ld"
                }
              }
            }
          ]
        })
      }
    };

    const controller = new JobsController(
      prisma as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      {} as any
    );

    await expect(controller.getJob("job_1")).resolves.toEqual(
      expect.objectContaining({
        id: "job_1",
        importSummary: {
          source: "live_html",
          warnings: ["apply_url_not_detected"],
          hasWarnings: true,
          statusLabel: "Live import · warnings"
        },
        importDiagnostics: {
          fetchStatus: 200,
          usedJsonLd: true,
          applyUrlSource: "source_url",
          titleSource: "og:title",
          companySource: "json_ld",
          descriptionSource: "json_ld"
        }
      })
    );
  });
});
