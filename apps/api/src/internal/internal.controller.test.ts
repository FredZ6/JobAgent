import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { InternalController } from "./internal.controller.js";

function createRequest() {
  return {
    aborted: false,
    destroyed: false,
    once: vi.fn()
  };
}

describe("InternalController long-answer generation", () => {
  it("rejects invalid long-answer generation calls", async () => {
    process.env.JWT_SECRET = "secret";
    const request = createRequest();

    const controller = new InternalController({} as any, {} as any, {} as any, {
      generateForApplication: vi.fn()
    } as any);

    await expect(
      controller.generateLongAnswers("app_1", request as any, "secret", {
        questions: [
          {
            fieldName: ""
          }
        ]
      })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns structured answers for valid long-answer generation calls", async () => {
    process.env.JWT_SECRET = "secret";
    const request = createRequest();

    const generateForApplication = vi.fn().mockResolvedValue({
      applicationId: "app_1",
      answers: [
        {
          fieldName: "why_company",
          questionText: "Why do you want to work here?",
          decision: "fill",
          answer: "I enjoy building stable internal tools.",
          source: "default_answer_match"
        }
      ]
    });
    const controller = new InternalController({} as any, {} as any, {} as any, {
      generateForApplication
    } as any);

    await expect(
      controller.generateLongAnswers("app_1", request as any, "wrong-token", {
        questions: [{ fieldName: "why_company", questionText: "Why do you want to work here?" }]
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const result = await controller.generateLongAnswers("app_1", request as any, "secret", {
      questions: [{ fieldName: "why_company", questionText: "Why do you want to work here?" }]
    });

    expect(generateForApplication).toHaveBeenCalledWith(
      "app_1",
      [
        {
          fieldName: "why_company",
          questionText: "Why do you want to work here?"
        }
      ],
      expect.any(AbortSignal)
    );
    expect(result).toEqual({
      applicationId: "app_1",
      answers: [
        {
          fieldName: "why_company",
          questionText: "Why do you want to work here?",
          decision: "fill",
          answer: "I enjoy building stable internal tools.",
          source: "default_answer_match"
        }
      ]
    });
  });

  it("preserves llm-generated answers from the long-answer service", async () => {
    process.env.JWT_SECRET = "secret";
    const request = createRequest();

    const generateForApplication = vi.fn().mockResolvedValue({
      applicationId: "app_2",
      answers: [
        {
          fieldName: "why_fit",
          questionText: "Why are you a fit for this role?",
          decision: "fill",
          answer: "I enjoy building reliable internal tools.",
          source: "llm_generated"
        }
      ]
    });
    const controller = new InternalController({} as any, {} as any, {} as any, {
      generateForApplication
    } as any);

    const result = await controller.generateLongAnswers("app_2", request as any, "secret", {
      questions: [{ fieldName: "why_fit", questionText: "Why are you a fit for this role?" }]
    });

    expect(result).toEqual({
      applicationId: "app_2",
      answers: [
        {
          fieldName: "why_fit",
          questionText: "Why are you a fit for this role?",
          decision: "fill",
          answer: "I enjoy building reliable internal tools.",
          source: "llm_generated"
        }
      ]
    });
  });
});
