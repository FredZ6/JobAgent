import { describe, expect, it, vi, afterEach } from "vitest";

import { OpenAiLlmProviderService } from "./openai-llm-provider.service.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("OpenAiLlmProviderService", () => {
  it("returns text output from Responses API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        output_text: "hello from openai"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new OpenAiLlmProviderService();

    const result = await service.generateText({
      model: "gpt-5.4",
      apiKey: "sk-test",
      instructions: "Return text only.",
      promptPayload: { prompt: "say hello" }
    });

    expect(result).toBe("hello from openai");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns structured json text from Responses API", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        output_text: "{\"matchScore\":88}"
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new OpenAiLlmProviderService();

    const result = await service.generateStructuredJson({
      model: "gpt-5.4",
      apiKey: "sk-test",
      instructions: "Return JSON only.",
      promptPayload: { prompt: "analyze this" },
      schemaName: "job_analysis",
      jsonSchema: {
        type: "object",
        properties: {
          matchScore: { type: "integer" }
        }
      }
    });

    expect(result).toBe("{\"matchScore\":88}");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws on non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }));

    const service = new OpenAiLlmProviderService();

    await expect(
      service.generateText({
        model: "gpt-5.4",
        apiKey: "sk-test",
        instructions: "Return text only.",
        promptPayload: { prompt: "say hello" }
      })
    ).rejects.toThrowError("OpenAI request failed");
  });

  it("throws when output_text is missing from a successful response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({})
      })
    );

    const service = new OpenAiLlmProviderService();

    await expect(
      service.generateText({
        model: "gpt-5.4",
        apiKey: "sk-test",
        instructions: "Return text only.",
        promptPayload: { prompt: "say hello" }
      })
    ).rejects.toThrowError("OpenAI response missing output_text");
  });
});
