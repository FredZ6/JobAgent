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
