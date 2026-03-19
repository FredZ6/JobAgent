import { ConflictException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { DirectAnalysisService } from "./direct-analysis.service.js";

describe("DirectAnalysisService", () => {
  it("creates and completes a direct workflow run around analysis", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          description: "TypeScript platform role"
        })
      },
      jobAnalysis: {
        create: vi.fn().mockResolvedValue({
          id: "analysis_1",
          jobId: "job_1",
          status: "completed",
          errorMessage: null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
      },
      $transaction: vi.fn(async (callback: (client: unknown) => Promise<unknown>) =>
        callback({
          jobAnalysis: {
            create: prisma.jobAnalysis.create
          },
          jobEvent: {
            create: vi.fn().mockResolvedValue({})
          }
        })
      )
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "555-123-4567",
        linkedinUrl: "https://linkedin.com/in/ada",
        githubUrl: "https://github.com/ada",
        location: "Winnipeg, MB",
        workAuthorization: "Open",
        summary: "Builder",
        skills: ["TypeScript"],
        defaultAnswers: {}
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmAnalysisService = {
      analyze: vi.fn().mockResolvedValue({
        matchScore: 80,
        summary: "Strong fit.",
        requiredSkills: ["TypeScript"],
        missingSkills: [],
        redFlags: []
      })
    };
    const workflowRunsService = {
      createDirectRun: vi.fn().mockResolvedValue({ id: "run_1" }),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({})
    };

    const service = new DirectAnalysisService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmAnalysisService as any,
      workflowRunsService as any
    );

    await service.analyzeJob("job_1", { executionMode: "direct" });

    expect(workflowRunsService.createDirectRun).toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).toHaveBeenCalledWith(
      "run_1",
      expect.objectContaining({})
    );
  });

  it("stops at a safe cancellation point for an aborted workflow signal without marking the run failed", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          description: "TypeScript platform role"
        })
      }
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "555-123-4567",
        linkedinUrl: "https://linkedin.com/in/ada",
        githubUrl: "https://github.com/ada",
        location: "Winnipeg, MB",
        workAuthorization: "Open",
        summary: "Builder",
        skills: ["TypeScript"],
        defaultAnswers: {}
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmAnalysisService = {
      analyze: vi.fn()
    };
    const workflowRunsService = {
      markRunning: vi.fn().mockResolvedValue({ id: "run_1" }),
      createDirectRun: vi.fn(),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({})
    };
    const controller = new AbortController();

    const service = new DirectAnalysisService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmAnalysisService as any,
      workflowRunsService as any
    );

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.analyzeJob("job_1", { executionMode: "temporal" }, "run_1", controller.signal)
    ).rejects.toMatchObject({
      name: "WorkflowRunCancelledError"
    });

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_1");
    expect(llmAnalysisService.analyze).not.toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
  });

  it("marks direct runs cancelled and returns a conflict when a direct workflow signal is aborted", async () => {
    const prisma = {
      job: {
        findUnique: vi.fn().mockResolvedValue({
          id: "job_1",
          description: "TypeScript platform role"
        })
      }
    };
    const profileService = {
      getProfile: vi.fn().mockResolvedValue({
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "555-123-4567",
        linkedinUrl: "https://linkedin.com/in/ada",
        githubUrl: "https://github.com/ada",
        location: "Winnipeg, MB",
        workAuthorization: "Open",
        summary: "Builder",
        skills: ["TypeScript"],
        defaultAnswers: {}
      })
    };
    const settingsService = {
      getSettings: vi.fn().mockResolvedValue({
        model: "gpt-5.4",
        apiKey: "test-key"
      })
    };
    const llmAnalysisService = {
      analyze: vi.fn()
    };
    const workflowRunsService = {
      markRunning: vi.fn().mockResolvedValue({ id: "run_1" }),
      createDirectRun: vi.fn(),
      markCompleted: vi.fn().mockResolvedValue({}),
      markFailed: vi.fn().mockResolvedValue({}),
      markCancelled: vi.fn().mockResolvedValue({})
    };
    const controller = new AbortController();

    const service = new DirectAnalysisService(
      prisma as any,
      profileService as any,
      settingsService as any,
      llmAnalysisService as any,
      workflowRunsService as any
    );

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.analyzeJob("job_1", { executionMode: "direct" }, "run_1", controller.signal)
    ).rejects.toBeInstanceOf(ConflictException);

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_1");
    expect(llmAnalysisService.analyze).not.toHaveBeenCalled();
    expect(workflowRunsService.markCancelled).toHaveBeenCalledWith("run_1");
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
  });
});
