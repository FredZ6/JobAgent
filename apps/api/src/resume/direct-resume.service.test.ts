import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DirectResumeService } from "./direct-resume.service.js";

describe("DirectResumeService", () => {
  it("creates and completes a direct workflow run around resume generation", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          description: "TypeScript role",
          analyses: []
        })
      },
      candidateProfile: {
        findFirst: vi.fn().mockResolvedValue({
          id: "profile_1"
        })
      },
      resumeVersion: {
        create: vi.fn().mockResolvedValue({
          id: "resume_1",
          jobId: "job_1",
          sourceProfileId: "profile_1",
          status: "completed",
          headline: "Engineer",
          professionalSummary: "Summary",
          skills: [],
          experienceSections: [],
          projectSections: [],
          changeSummary: {},
          structuredContent: {
            headline: "Engineer",
            professionalSummary: "Summary",
            keySkills: [],
            experience: [],
            projects: [],
            changeSummary: {
              highlightedStrengths: [],
              deemphasizedItems: [],
              notes: []
            }
          },
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      $transaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) =>
        callback({
          resumeVersion: {
            create: prisma.resumeVersion.create
          },
          jobEvent: {
            create: vi.fn().mockResolvedValue({})
          }
        })
      )
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace"
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmResumeService = {
      generate: vi.fn().mockResolvedValue({
        headline: "Engineer",
        professionalSummary: "Summary",
        keySkills: [],
        experience: [],
        projects: [],
        changeSummary: {
          highlightedStrengths: [],
          deemphasizedItems: [],
          notes: []
        }
      })
    };
    const workflowRunsService = {
      createDirectRun: vi.fn().mockResolvedValue({ id: "run_1" }),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({})
    };

    const service = new DirectResumeService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmResumeService as any,
      workflowRunsService as any
    );

    await service.generateResume("job_1", { executionMode: "direct" });

    expect(workflowRunsService.createDirectRun).toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).toHaveBeenCalledWith(
      "run_1",
      expect.objectContaining({
        resumeVersionId: "resume_1"
      })
    );
  });

  it("stops at a safe cancellation point for an aborted workflow signal without marking the run failed", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          description: "TypeScript role",
          analyses: []
        })
      }
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace"
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmResumeService = {
      generate: vi.fn()
    };
    const workflowRunsService = {
      markRunning: vi.fn().mockResolvedValue({ id: "run_1" }),
      createDirectRun: vi.fn(),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({})
    };
    const controller = new AbortController();

    const service = new DirectResumeService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmResumeService as any,
      workflowRunsService as any
    );

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.generateResume("job_1", { executionMode: "temporal" }, "run_1", controller.signal)
    ).rejects.toMatchObject({
      name: "WorkflowRunCancelledError"
    });

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_1");
    expect(llmResumeService.generate).not.toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
  });

  it("marks direct runs cancelled and returns a conflict when a direct workflow signal is aborted", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          title: "Engineer",
          company: "Alpha",
          description: "TypeScript role",
          analyses: []
        })
      }
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace"
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmResumeService = {
      generate: vi.fn()
    };
    const workflowRunsService = {
      markRunning: vi.fn().mockResolvedValue({ id: "run_1" }),
      createDirectRun: vi.fn(),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({}),
      markCancelled: vi.fn().mockResolvedValue({})
    };
    const controller = new AbortController();

    const service = new DirectResumeService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmResumeService as any,
      workflowRunsService as any
    );

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.generateResume("job_1", { executionMode: "direct" }, "run_1", controller.signal)
    ).rejects.toBeInstanceOf(ConflictException);

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_1");
    expect(llmResumeService.generate).not.toHaveBeenCalled();
    expect(workflowRunsService.markCancelled).toHaveBeenCalledWith("run_1");
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
  });
});
