import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { InternalController } from "./internal.controller.js";

const originalNodeEnv = process.env.NODE_ENV;
const originalJwtSecret = process.env.JWT_SECRET;
const originalInternalApiToken = process.env.INTERNAL_API_TOKEN;

function createRequest() {
  return {
    aborted: false,
    destroyed: false,
    once: vi.fn()
  };
}

describe("InternalController long-answer generation", () => {
  afterEach(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
    }

    if (originalInternalApiToken === undefined) {
      delete process.env.INTERNAL_API_TOKEN;
    } else {
      process.env.INTERNAL_API_TOKEN = originalInternalApiToken;
    }
  });

  it("rejects invalid long-answer generation calls", async () => {
    process.env.JWT_SECRET = "secret";
    delete process.env.INTERNAL_API_TOKEN;
    process.env.NODE_ENV = "test";
    const request = createRequest();

    const controller = new InternalController(
      {} as any,
      {} as any,
      {} as any,
      {
        generateForApplication: vi.fn()
      } as any,
      {} as any
    );

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
    delete process.env.INTERNAL_API_TOKEN;
    process.env.NODE_ENV = "test";
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
    const controller = new InternalController(
      {} as any,
      {} as any,
      {} as any,
      {
        generateForApplication
      } as any,
      {} as any
    );

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
    delete process.env.INTERNAL_API_TOKEN;
    process.env.NODE_ENV = "test";
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
    const controller = new InternalController(
      {} as any,
      {} as any,
      {} as any,
      {
        generateForApplication
      } as any,
      {} as any
    );

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

  it("prefers INTERNAL_API_TOKEN over JWT_SECRET when both are set", async () => {
    process.env.NODE_ENV = "test";
    process.env.JWT_SECRET = "jwt-secret";
    process.env.INTERNAL_API_TOKEN = "internal-secret";
    const request = createRequest();

    const generateForApplication = vi.fn().mockResolvedValue({
      applicationId: "app_3",
      answers: []
    });
    const controller = new InternalController(
      {} as any,
      {} as any,
      {} as any,
      {
        generateForApplication
      } as any,
      {} as any
    );

    await expect(
      controller.generateLongAnswers("app_3", request as any, "jwt-secret", {
        questions: [{ fieldName: "why_company", questionText: "Why?" }]
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);

    await expect(
      controller.generateLongAnswers("app_3", request as any, "internal-secret", {
        questions: [{ fieldName: "why_company", questionText: "Why?" }]
      })
    ).resolves.toEqual({
      applicationId: "app_3",
      answers: []
    });
  });

  it("rejects JWT_SECRET fallback in production when INTERNAL_API_TOKEN is unset", async () => {
    process.env.NODE_ENV = "production";
    process.env.JWT_SECRET = "jwt-secret";
    delete process.env.INTERNAL_API_TOKEN;
    const request = createRequest();

    const controller = new InternalController(
      {} as any,
      {} as any,
      {} as any,
      {
        generateForApplication: vi.fn()
      } as any,
      {} as any
    );

    await expect(
      controller.generateLongAnswers("app_4", request as any, "jwt-secret", {
        questions: [{ fieldName: "why_company", questionText: "Why?" }]
      })
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
