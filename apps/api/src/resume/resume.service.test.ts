import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ResumeService } from "./resume.service.js";

const mockDirectResumeService = () => ({
  generateResume: vi.fn().mockResolvedValue({
    id: "resume_1",
    jobId: "job_1",
    sourceProfileId: "profile_1",
    status: "completed",
    headline: "Senior Backend Engineer",
    professionalSummary: "Strong platform and backend background.",
    skills: ["TypeScript"],
    experienceSections: [],
    projectSections: [],
    changeSummary: {
      highlightedStrengths: [],
      deemphasizedItems: [],
      notes: []
    },
    structuredContent: {
      headline: "Senior Backend Engineer",
      professionalSummary: "Strong platform and backend background.",
      keySkills: ["TypeScript"],
      experience: [],
      projects: [],
      changeSummary: {
        highlightedStrengths: [],
        deemphasizedItems: [],
        notes: []
      }
    },
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
});

const mockTemporalService = () => ({
  executeGenerateResumeWorkflow: vi.fn().mockResolvedValue({
    id: "resume_1",
    jobId: "job_1",
    sourceProfileId: "profile_1",
    status: "completed",
    headline: "Senior Backend Engineer",
    professionalSummary: "Strong platform and backend background.",
    skills: ["TypeScript"],
    experienceSections: [],
    projectSections: [],
    changeSummary: {
      highlightedStrengths: [],
      deemphasizedItems: [],
      notes: []
    },
    structuredContent: {
      headline: "Senior Backend Engineer",
      professionalSummary: "Strong platform and backend background.",
      keySkills: ["TypeScript"],
      experience: [],
      projects: [],
      changeSummary: {
        highlightedStrengths: [],
        deemphasizedItems: [],
        notes: []
      }
    },
    errorMessage: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
});

describe("ResumeService", () => {
  const originalTemporalEnabled = process.env.TEMPORAL_ENABLED;
  const mockPrisma = {
    resumeVersion: {
      findMany: vi.fn(),
      findUnique: vi.fn()
    }
  };

  beforeEach(() => {
    delete process.env.TEMPORAL_ENABLED;
  });

  afterEach(() => {
    if (originalTemporalEnabled === undefined) {
      delete process.env.TEMPORAL_ENABLED;
      return;
    }

    process.env.TEMPORAL_ENABLED = originalTemporalEnabled;
  });

  it("uses Temporal workflow execution when TEMPORAL_ENABLED is true", async () => {
    process.env.TEMPORAL_ENABLED = "true";

    const directResumeService = mockDirectResumeService();
    const temporalService = mockTemporalService();

    const service = new ResumeService(mockPrisma as any, directResumeService as any, temporalService as any);

    const result = await service.generateResume("job_1");

    expect(temporalService.executeGenerateResumeWorkflow).toHaveBeenCalledWith("job_1");
    expect(directResumeService.generateResume).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
  });

  it("keeps direct resume behavior when TEMPORAL_ENABLED is false", async () => {
    process.env.TEMPORAL_ENABLED = "false";

    const directResumeService = mockDirectResumeService();
    const temporalService = mockTemporalService();

    const service = new ResumeService(mockPrisma as any, directResumeService as any, temporalService as any);

    const result = await service.generateResume("job_1");

    expect(directResumeService.generateResume).toHaveBeenCalledWith("job_1", {
      executionMode: "direct"
    });
    expect(temporalService.executeGenerateResumeWorkflow).not.toHaveBeenCalled();
    expect(result.headline).toBe("Senior Backend Engineer");
  });
});
