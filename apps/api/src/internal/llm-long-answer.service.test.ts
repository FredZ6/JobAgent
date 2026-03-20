import { afterEach, describe, expect, it, vi } from "vitest";

import { LlmLongAnswerService } from "./llm-long-answer.service.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LlmLongAnswerService", () => {
  it("generates long answers through the configured provider", async () => {
    const gateway = {
      generateText: vi.fn().mockResolvedValue("  I enjoy building reliable internal tools.  ")
    };

    const service = new LlmLongAnswerService(gateway as any);

    const result = await service.generate({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      question: {
        fieldName: "why_fit",
        questionText: "Why are you a fit for this role?"
      },
      job: {
        title: "Platform Engineer",
        company: "Orbital",
        description: "Build platform systems."
      },
      jobFocus: {
        topResponsibilities: ["Own internal platform workflows.", "Ship reliable systems."],
        topRequirements: ["Strong TypeScript experience.", "Internal tools experience."]
      },
      resumeHeadline: "Platform Engineer",
      profileSummary: "Builder of stable internal tools.",
      analysis: {
        summary: "Strong platform fit.",
        requiredSkills: ["TypeScript"],
        missingSkills: ["Kubernetes"],
        redFlags: ["Gap in infra exposure"]
      }
    });

    expect(gateway.generateText).toHaveBeenCalledTimes(1);
    expect(gateway.generateText).toHaveBeenCalledWith(
      expect.objectContaining({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        instructions: expect.stringContaining("what the role is trying to do"),
        promptPayload: expect.objectContaining({
          question: {
            fieldName: "why_fit",
            questionText: "Why are you a fit for this role?"
          },
          job: {
            title: "Platform Engineer",
            company: "Orbital",
            description: "Build platform systems."
          },
          jobFocus: {
            topResponsibilities: ["Own internal platform workflows.", "Ship reliable systems."],
            topRequirements: ["Strong TypeScript experience.", "Internal tools experience."]
          },
          resumeHeadline: "Platform Engineer",
          profileSummary: "Builder of stable internal tools.",
          analysis: {
            summary: "Strong platform fit.",
            requiredSkills: ["TypeScript"],
            missingSkills: ["Kubernetes"],
            redFlags: ["Gap in infra exposure"]
          }
        })
      })
    );
    expect(result).toBe("I enjoy building reliable internal tools.");
  });

  it("bubbles provider failures to the caller for fallback handling", async () => {
    const gateway = {
      generateText: vi.fn().mockRejectedValue(new Error("provider failed"))
    };

    const service = new LlmLongAnswerService(gateway as any);

    await expect(
      service.generate({
        provider: "openai",
        model: "gpt-5.4",
        apiKey: "sk-test",
        question: {
          fieldName: "why_fit",
          questionText: "Why are you a fit for this role?"
        },
      job: {
        title: "Platform Engineer",
        company: "Orbital",
        description: "Build platform systems."
      },
      jobFocus: {
        topResponsibilities: ["Own internal platform workflows.", "Ship reliable systems."],
        topRequirements: ["Strong TypeScript experience.", "Internal tools experience."]
      },
      resumeHeadline: "Platform Engineer",
      profileSummary: "Builder of stable internal tools.",
      analysis: {
        summary: "Strong platform fit.",
        requiredSkills: ["TypeScript"],
        missingSkills: ["Kubernetes"],
        redFlags: ["Gap in infra exposure"]
      }
      })
    ).rejects.toThrow("provider failed");
  });

  it("rejects blank provider output so callers can fall back safely", async () => {
    const gateway = {
      generateText: vi.fn().mockResolvedValue("   ")
    };

    const service = new LlmLongAnswerService(gateway as any);

    await expect(
      service.generate({
        provider: "gemini",
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        question: {
          fieldName: "why_fit",
          questionText: "Why are you a fit for this role?"
        },
      job: {
        title: "Platform Engineer",
        company: "Orbital",
        description: "Build platform systems."
      },
      jobFocus: {
        topResponsibilities: ["Own internal platform workflows.", "Ship reliable systems."],
        topRequirements: ["Strong TypeScript experience.", "Internal tools experience."]
      },
      resumeHeadline: "Platform Engineer",
      profileSummary: "Builder of stable internal tools.",
      analysis: {
        summary: "Strong platform fit.",
        requiredSkills: ["TypeScript"],
        missingSkills: ["Kubernetes"],
        redFlags: ["Gap in infra exposure"]
      }
    })
    ).rejects.toThrow("provider returned an empty answer");
  });
});
