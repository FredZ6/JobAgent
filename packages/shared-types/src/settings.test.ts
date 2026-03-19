import { describe, expect, it } from "vitest";

import { llmSettingsSchema } from "./settings";

describe("llmSettingsSchema", () => {
  it("accepts valid settings", () => {
    const result = llmSettingsSchema.safeParse({
      provider: "openai",
      model: "gpt-5.4",
      apiKey: "sk-test",
      isConfigured: true
    });

    expect(result.success).toBe(true);
  });

  it("allows an empty apiKey for first-run state", () => {
    const result = llmSettingsSchema.safeParse({
      provider: "openai",
      model: "gpt-5.4",
      apiKey: ""
    });

    expect(result.success).toBe(true);
  });
});
