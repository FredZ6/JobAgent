import { afterEach, describe, expect, it, vi } from "vitest";

import { GeminiLlmProviderService } from "./gemini-llm-provider.service.js";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("GeminiLlmProviderService", () => {
  it("returns text output from generateContent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: "hello from gemini" }]
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new GeminiLlmProviderService();

    const result = await service.generateText({
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
      instructions: "Return text only.",
      promptPayload: { prompt: "say hello" }
    });

    expect(result).toBe("hello from gemini");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("returns structured json text from generateContent", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        candidates: [
          {
            content: {
              parts: [{ text: "{\"matchScore\":88}" }]
            }
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchMock);

    const service = new GeminiLlmProviderService();

    const result = await service.generateStructuredJson({
      model: "gemini-2.5-flash",
      apiKey: "AIza-test",
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

  it("throws on malformed responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: vi.fn().mockResolvedValue({}) }));

    const service = new GeminiLlmProviderService();

    await expect(
      service.generateText({
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        instructions: "Return text only.",
        promptPayload: { prompt: "say hello" }
      })
    ).rejects.toThrowError("Gemini response missing text");
  });

  it("throws on non-ok responses", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, json: vi.fn() }));

    const service = new GeminiLlmProviderService();

    await expect(
      service.generateText({
        model: "gemini-2.5-flash",
        apiKey: "AIza-test",
        instructions: "Return text only.",
        promptPayload: { prompt: "say hello" }
      })
    ).rejects.toThrowError("Gemini request failed");
  });
});
