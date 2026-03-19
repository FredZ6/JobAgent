import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { describe, expect, it, vi } from "vitest";

import { InternalController } from "./internal.controller.js";

describe("InternalController long-answer generation", () => {
  it("rejects invalid long-answer generation calls", async () => {
    process.env.JWT_SECRET = "secret";

    const controller = new InternalController({} as any, {} as any, {} as any, {
      generateForApplication: vi.fn()
    } as any);

    await expect(
      controller.generateLongAnswers("app_1", "secret", {
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
      controller.generateLongAnswers("app_1", "wrong-token", {
        questions: [{ fieldName: "why_company", questionText: "Why do you want to work here?" }]
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    const result = await controller.generateLongAnswers("app_1", "secret", {
      questions: [{ fieldName: "why_company", questionText: "Why do you want to work here?" }]
    });

    expect(generateForApplication).toHaveBeenCalledWith("app_1", [
      {
        fieldName: "why_company",
        questionText: "Why do you want to work here?"
      }
    ]);
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
});
