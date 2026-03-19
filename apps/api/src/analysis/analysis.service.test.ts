import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";

import { AnalysisService } from "./analysis.service.js";

const mockDirectAnalysisService = () => ({
  analyzeJob: vi.fn().mockResolvedValue({
    id: "analysis_1",
    jobId: "job_1",
    status: "completed",
    errorMessage: null,
    matchScore: 84,
    summary: "Strong fit for backend platform work.",
    requiredSkills: ["TypeScript"],
    missingSkills: [],
    redFlags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
});

const mockTemporalService = () => ({
  executeAnalyzeJobWorkflow: vi.fn().mockResolvedValue({
    id: "analysis_1",
    jobId: "job_1",
    status: "completed",
    errorMessage: null,
    matchScore: 84,
    summary: "Strong fit for backend platform work.",
    requiredSkills: ["TypeScript"],
    missingSkills: [],
    redFlags: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  })
});

describe("AnalysisService", () => {
  const originalTemporalEnabled = process.env.TEMPORAL_ENABLED;

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

    const directAnalysisService = mockDirectAnalysisService();
    const temporalService = mockTemporalService();

    const service = new AnalysisService(directAnalysisService as any, temporalService as any);

    const result = await service.analyzeJob("job_1");

    expect(temporalService.executeAnalyzeJobWorkflow).toHaveBeenCalledWith("job_1");
    expect(directAnalysisService.analyzeJob).not.toHaveBeenCalled();
    expect(result.status).toBe("completed");
  });

  it("keeps direct analysis behavior when TEMPORAL_ENABLED is false", async () => {
    process.env.TEMPORAL_ENABLED = "false";

    const directAnalysisService = mockDirectAnalysisService();
    const temporalService = mockTemporalService();

    const service = new AnalysisService(directAnalysisService as any, temporalService as any);

    const result = await service.analyzeJob("job_1");

    expect(directAnalysisService.analyzeJob).toHaveBeenCalledWith("job_1", {
      executionMode: "direct"
    });
    expect(temporalService.executeAnalyzeJobWorkflow).not.toHaveBeenCalled();
    expect(result.matchScore).toBe(84);
  });
});
