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
  it("uses default answers before fallback generation", async () => {
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
        answer: "I enjoy building reliable developer platforms.",
        source: "default_answer_match"
      },
      {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?",
        answer: expect.any(String),
        source: "deterministic_fallback"
      }
    ]);
    expect(fallbackSpy).toHaveBeenCalledTimes(1);
  });
});
