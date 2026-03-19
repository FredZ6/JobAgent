import { InternalServerErrorException } from "@nestjs/common";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LlmGatewayService } from "./llm-gateway.service.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LlmGatewayService", () => {
  it("dispatches structured json generation to OpenAI", async () => {
    const openai = {
      generateStructuredJson: vi.fn().mockResolvedValue("openai-json")
    };
    const gemini = {
      generateStructuredJson: vi.fn(),
      generateText: vi.fn()
    };

    const service = new LlmGatewayService(openai as any, gemini as any);

    const result = await service.generateStructuredJson({
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "sk-test",
      instructions: "Return JSON only.",
      promptPayload: { prompt: "analyze this" },
      schemaName: "job_analysis",
      jsonSchema: {
        type: "object"
      }
    });

    expect(result).toBe("openai-json");
    expect(openai.generateStructuredJson).toHaveBeenCalledTimes(1);
    expect(gemini.generateStructuredJson).not.toHaveBeenCalled();
  });

  it("dispatches text generation to Gemini", async () => {
    const openai = {
      generateStructuredJson: vi.fn(),
      generateText: vi.fn()
    };
    const gemini = {
      generateStructuredJson: vi.fn(),
      generateText: vi.fn().mockResolvedValue("gemini-text")
    };

    const service = new LlmGatewayService(openai as any, gemini as any);

    const result = await service.generateText({
      provider: "gemini",
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      instructions: "Return text only.",
      promptPayload: { prompt: "say hello" }
    });

    expect(result).toBe("gemini-text");
    expect(gemini.generateText).toHaveBeenCalledTimes(1);
    expect(openai.generateText).not.toHaveBeenCalled();
  });

  it("rejects unsupported providers", async () => {
    const openai = {
      generateStructuredJson: vi.fn(),
      generateText: vi.fn()
    };
    const gemini = {
      generateStructuredJson: vi.fn(),
      generateText: vi.fn()
    };

    const service = new LlmGatewayService(openai as any, gemini as any);

    await expect(
      service.generateText({
        provider: "anthropic" as never,
        model: "claude",
        apiKey: "key",
        instructions: "Return text only.",
        promptPayload: { prompt: "say hello" }
      })
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
