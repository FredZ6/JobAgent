import { describe, expect, it, vi } from "vitest";

import { LongAnswerService } from "./long-answer.service.js";

const mockPrisma = () => ({
  application: {
    findUnique: vi.fn()
  },
  jobAnalysis: {
    findFirst: vi.fn()
  }
});

describe("LongAnswerService", () => {
  it("returns fill decisions for matched defaults and fallback only for non-high-risk misses", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
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
          defaultAnswers: {
            "Why do you want to work here?": "I enjoy building reliable developer platforms."
          }
        }
      }
    });
    prisma.jobAnalysis.findFirst.mockResolvedValue({
      matchScore: 88,
      summary: "Strong platform fit.",
      requiredSkills: ["TypeScript"],
      missingSkills: [],
      redFlags: []
    });

    const service = new LongAnswerService(prisma as any);
    const fallbackSpy = vi.spyOn(service as any, "generateFallbackAnswer");

    const result = await service.generateForApplication("app_1", [
      {
        fieldName: "why_company",
        questionText: "Why do you want to work here?"
      },
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      }
    ]);

    expect(result.answers).toEqual([
      {
        fieldName: "why_company",
        questionText: "Why do you want to work here?",
        decision: "fill",
        answer: "I enjoy building reliable developer platforms.",
        source: "default_answer_match"
      },
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        decision: "fill",
        answer: expect.any(String),
        source: "deterministic_fallback"
      }
    ]);
    expect(fallbackSpy).toHaveBeenCalledTimes(1);
  });

  it("requires manual review for unmatched high-risk prompts", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_2",
      job: {
        id: "job_2",
        title: "Platform Engineer",
        company: "Orbital",
        description: "Build platform systems."
      },
      resumeVersion: {
        id: "resume_2",
        headline: "Platform Engineer",
        professionalSummary: "Builder of stable internal tools.",
        sourceProfile: {
          fullName: "Ada Lovelace",
          summary: "Platform engineer.",
          defaultAnswers: {}
        }
      }
    });
    prisma.jobAnalysis.findFirst.mockResolvedValue({
      matchScore: 88,
      summary: "Strong platform fit.",
      requiredSkills: ["TypeScript"],
      missingSkills: [],
      redFlags: []
    });

    const service = new LongAnswerService(prisma as any);
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
});
