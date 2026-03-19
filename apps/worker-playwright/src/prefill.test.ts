import { describe, expect, it } from "vitest";

import { buildSuggestions } from "./prefill.js";

describe("prefill helpers", () => {
  it("builds suggestions that mirror the profile fields", () => {
    const profile = {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg"
    };

    const suggestions = buildSuggestions(profile);
    expect(suggestions.name).toBe("Ada Lovelace");
    expect(suggestions.email).toBe("ada@example.com");
    expect(suggestions.linkedin).toContain("linkedin.com");
  });
});
