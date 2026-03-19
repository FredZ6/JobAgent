import { afterEach, describe, expect, it, vi } from "vitest";

import { LongAnswerService } from "./long-answer.service.js";

const mockPrisma = () => ({
  application: {
    findUnique: vi.fn()
  },
  jobAnalysis: {
    findFirst: vi.fn()
  }
});

const createApplication = (overrides?: Partial<any>) => ({
  id: "app_1",
  job: {
    id: "job_1",
    title: "Platform Engineer",
    company: "Orbital",
    description: "Build platform systems."
  },
  resumeVersion: {
    id: "resume_1",
    headline: "Platform Engineer",
    professionalSummary: "Builder of stable internal tools.",
    sourceProfile: {
      fullName: "Ada Lovelace",
      summary: "Platform engineer.",
      defaultAnswers: {}
    }
  },
  ...overrides
});

const createCompletedAnalysis = () => ({
  matchScore: 88,
  summary: "Strong platform fit.",
  requiredSkills: ["TypeScript"],
  missingSkills: [],
  redFlags: []
});

const createSettingsService = (overrides?: Partial<any>) => ({
  getSettings: vi.fn().mockResolvedValue({
    provider: "openai",
    model: "gpt-5.4",
    apiKey: "",
    isConfigured: false,
    ...overrides
  })
});

const createLlmLongAnswerService = (overrides?: Partial<any>) => ({
  generate: vi.fn().mockResolvedValue("I enjoy building reliable internal tools."),
  ...overrides
});

const originalAnalysisMode = process.env.JOB_ANALYSIS_MODE;
const originalResumeMode = process.env.JOB_RESUME_MODE;

afterEach(() => {
  vi.restoreAllMocks();

  if (originalAnalysisMode === undefined) {
    delete process.env.JOB_ANALYSIS_MODE;
  } else {
    process.env.JOB_ANALYSIS_MODE = originalAnalysisMode;
  }

  if (originalResumeMode === undefined) {
    delete process.env.JOB_RESUME_MODE;
  } else {
    process.env.JOB_RESUME_MODE = originalResumeMode;
  }
});

describe("LongAnswerService", () => {
  it("returns matched default answers without calling the llm path", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(
      createApplication({
        resumeVersion: {
          id: "resume_1",
          headline: "Platform Engineer",
          professionalSummary: "Builder of stable internal tools.",
          sourceProfile: {
            fullName: "Ada Lovelace",
            summary: "Platform engineer.",
            defaultAnswers: {
              "Why do you want to work here?": "I enjoy building reliable developer platforms."
            }
          }
        }
      })
    );
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService();
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_1", [
      {
        fieldName: "why_company",
        questionText: "Why do you want to work here?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).not.toHaveBeenCalled();
    expect(result.answers).toEqual([
      {
        fieldName: "why_company",
        questionText: "Why do you want to work here?",
        decision: "fill",
        answer: "I enjoy building reliable developer platforms.",
        source: "default_answer_match"
      }
    ]);
    expect(fallbackSpy).not.toHaveBeenCalled();
  });

  it("requires manual review for unmatched high-risk prompts", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_2" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      isConfigured: true
    });
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_2", [
      {
        fieldName: "salary_expectation",
        questionText: "What is your salary expectation?"
      },
      {
        fieldName: "work_authorization",
        questionText: "Will you require sponsorship now or in the future?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).not.toHaveBeenCalled();
    expect(result.answers).toEqual([
      {
        fieldName: "salary_expectation",
        questionText: "What is your salary expectation?",
        decision: "manual_review_required",
        source: "manual_review_required",
        manualReason: "high_risk_question_missing_default_answer",
        matchedRiskCategory: "salary_expectation"
      },
      {
        fieldName: "work_authorization",
        questionText: "Will you require sponsorship now or in the future?",
        decision: "manual_review_required",
        source: "manual_review_required",
        manualReason: "high_risk_question_missing_default_answer",
        matchedRiskCategory: "sponsorship"
      }
    ]);
    expect(fallbackSpy).not.toHaveBeenCalled();
  });

  it("uses the llm long-answer service for unmatched non-high-risk prompts when settings are usable", async () => {
    process.env.JOB_ANALYSIS_MODE = "live";
    process.env.JOB_RESUME_MODE = "live";

    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_3" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      isConfigured: true
    });
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_3", [
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).not.toHaveBeenCalled();
    expect(result.answers).toEqual([
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        decision: "fill",
        answer: "I enjoy building reliable internal tools.",
        source: "llm_generated"
      }
    ]);
  });

  it("falls back deterministically when demo mode is enabled", async () => {
    process.env.JOB_ANALYSIS_MODE = "mock";
    process.env.JOB_RESUME_MODE = "mock";

    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_4" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      isConfigured: true
    });
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_4", [
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).not.toHaveBeenCalled();
    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(result.answers).toEqual([
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        decision: "fill",
        answer: expect.any(String),
        source: "deterministic_fallback"
      }
    ]);
  });

  it("falls back deterministically when provider settings are unusable", async () => {
    process.env.JOB_ANALYSIS_MODE = "live";
    process.env.JOB_RESUME_MODE = "live";

    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_5" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "",
      isConfigured: false
    });
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_5", [
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).not.toHaveBeenCalled();
    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(result.answers).toEqual([
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        decision: "fill",
        answer: expect.any(String),
        source: "deterministic_fallback"
      }
    ]);
  });

  it("falls back deterministically when provider-backed generation fails", async () => {
    process.env.JOB_ANALYSIS_MODE = "live";
    process.env.JOB_RESUME_MODE = "live";

    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_6" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "sk-test",
      isConfigured: true
    });
    const llmLongAnswerService = createLlmLongAnswerService({
      generate: vi.fn().mockRejectedValue(new Error("provider failure"))
    });
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_6", [
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      }
    ]);

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).toHaveBeenCalledTimes(1);
    expect(fallbackSpy).toHaveBeenCalledTimes(1);
    expect(result.answers).toEqual([
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        decision: "fill",
        answer: expect.any(String),
        source: "deterministic_fallback"
      }
    ]);
  });

  it("rejects unsupported provider settings instead of silently falling back", async () => {
    process.env.JOB_ANALYSIS_MODE = "live";
    process.env.JOB_RESUME_MODE = "live";

    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(createApplication({ id: "app_7" }));
    prisma.jobAnalysis.findFirst.mockResolvedValue(createCompletedAnalysis());

    const settingsService = createSettingsService({
      provider: "anthropic",
      model: "claude-test",
      apiKey: "test-key",
      isConfigured: true
    });
    const llmLongAnswerService = createLlmLongAnswerService();
    const service = new LongAnswerService(
      prisma as any,
      settingsService as any,
      llmLongAnswerService as any
    );
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    await expect(
      service.generateForApplication("app_7", [
        {
          fieldName: "why_fit",
          questionText: "Why are you a fit for this role?"
        }
      ])
    ).rejects.toThrow("Unsupported LLM provider configuration");

    expect(settingsService.getSettings).toHaveBeenCalledTimes(1);
    expect(llmLongAnswerService.generate).not.toHaveBeenCalled();
    expect(fallbackSpy).not.toHaveBeenCalled();
  });
});
