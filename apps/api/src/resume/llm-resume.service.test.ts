import { afterEach, describe, expect, it, vi } from "vitest";

import { LlmResumeService } from "./llm-resume.service.js";

const originalResumeMode = process.env.JOB_RESUME_MODE;

afterEach(() => {
  vi.unstubAllGlobals();

  if (originalResumeMode === undefined) {
    delete process.env.JOB_RESUME_MODE;
    return;
  }

  process.env.JOB_RESUME_MODE = originalResumeMode;
});

describe("LlmResumeService", () => {
  it("routes resume generation through the gateway with the saved provider", async () => {
    const gateway = {
      generateStructuredJson: vi.fn().mockResolvedValue(
        JSON.stringify({
          headline: "Platform Engineer",
          professionalSummary: "Builder.",
          keySkills: ["TypeScript"],
          experience: [],
          projects: [],
          changeSummary: {
            highlightedStrengths: ["TypeScript"],
            deemphasizedItems: [],
            notes: []
          }
        })
      )
    };

    const service = new (LlmResumeService as any)(gateway);

    const result = await service.generate({
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
      jobTitle: "Platform Engineer",
      jobCompany: "Orbital",
      jobDescription: "TypeScript platform role",
      analysis: null,
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test"
    });

    expect(gateway.generateStructuredJson).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        schemaName: "resume_content"
      })
    );
    expect(result.headline).toBe("Platform Engineer");
  });

  it("keeps mock-mode behavior without calling the gateway", async () => {
    const gateway = {
      generateStructuredJson: vi.fn()
    };
    const originalMode = process.env.JOB_RESUME_MODE;
    process.env.JOB_RESUME_MODE = "mock";

    const service = new (LlmResumeService as any)(gateway);

    const result = await service.generate({
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
      jobTitle: "Platform Engineer",
      jobCompany: "Orbital",
      jobDescription: "TypeScript platform role",
      analysis: null,
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "sk-test"
    });

    expect(gateway.generateStructuredJson).not.toHaveBeenCalled();
    expect(result.headline).toContain("Platform Engineer");

    if (originalMode === undefined) {
      delete process.env.JOB_RESUME_MODE;
      return;
    }

    process.env.JOB_RESUME_MODE = originalMode;
  });
});
