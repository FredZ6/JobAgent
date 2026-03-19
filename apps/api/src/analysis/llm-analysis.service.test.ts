import { describe, expect, it, vi, afterEach } from "vitest";

import { LlmAnalysisService } from "./llm-analysis.service.js";

const originalAnalysisMode = process.env.JOB_ANALYSIS_MODE;

afterEach(() => {
  vi.unstubAllGlobals();

  if (originalAnalysisMode === undefined) {
    delete process.env.JOB_ANALYSIS_MODE;
    return;
  }

  process.env.JOB_ANALYSIS_MODE = originalAnalysisMode;
});

describe("LlmAnalysisService", () => {
  it("routes structured analysis through the gateway with the saved provider", async () => {
    const gateway = {
      generateStructuredJson: vi.fn().mockResolvedValue(
        JSON.stringify({
          matchScore: 81,
          summary: "Strong fit.",
          requiredSkills: ["TypeScript"],
          missingSkills: [],
          redFlags: []
        })
      )
    };

    const service = new (LlmAnalysisService as any)(gateway);

    const result = await service.analyze({
      profile: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "555-0100",
        linkedinUrl: "https://linkedin.com/in/ada",
        githubUrl: "https://github.com/ada",
        location: "Winnipeg, MB",
        workAuthorization: "Open",
        summary: "Builder of platform tools.",
        skills: ["TypeScript"],
        experienceLibrary: [],
        projectLibrary: [],
        defaultAnswers: {}
      },
      jobDescription: "TypeScript platform role",
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test"
    });

    expect(gateway.generateStructuredJson).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        schemaName: "job_analysis"
      })
    );
    expect(result).toEqual({
      matchScore: 81,
      summary: "Strong fit.",
      requiredSkills: ["TypeScript"],
      missingSkills: [],
      redFlags: []
    });
  });

  it("keeps mock-mode behavior without calling the gateway", async () => {
    const gateway = {
      generateStructuredJson: vi.fn()
    };
    const originalMode = process.env.JOB_ANALYSIS_MODE;
    process.env.JOB_ANALYSIS_MODE = "mock";

    const service = new (LlmAnalysisService as any)(gateway);

    const result = await service.analyze({
      profile: {
        fullName: "Ada Lovelace",
        email: "ada@example.com",
        phone: "555-0100",
        linkedinUrl: "https://linkedin.com/in/ada",
        githubUrl: "https://github.com/ada",
        location: "Winnipeg, MB",
        workAuthorization: "Open",
        summary: "Builder of platform tools.",
        skills: ["TypeScript"],
        experienceLibrary: [],
        projectLibrary: [],
        defaultAnswers: {}
      },
      jobDescription: "TypeScript platform role",
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "sk-test"
    });

    expect(gateway.generateStructuredJson).not.toHaveBeenCalled();
    expect(result.matchScore).toBeGreaterThan(0);
  });
});
