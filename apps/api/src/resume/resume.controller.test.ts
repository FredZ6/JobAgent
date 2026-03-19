import { describe, expect, it } from "vitest";

import { buildResumePdfStreamOptions, normalizeResumePdfTemplate } from "./resume.controller.js";

describe("resume controller pdf response options", () => {
  it("builds attachment headers for downloads", () => {
    expect(buildResumePdfStreamOptions("resume.pdf", "attachment")).toEqual({
      type: "application/pdf",
      disposition: 'attachment; filename="resume.pdf"'
    });
  });

  it("builds inline headers for browser preview", () => {
    expect(buildResumePdfStreamOptions("resume.pdf", "inline")).toEqual({
      type: "application/pdf",
      disposition: 'inline; filename="resume.pdf"'
    });
  });

  it("normalizes missing or invalid templates back to classic", () => {
    expect(normalizeResumePdfTemplate(undefined)).toBe("classic");
    expect(normalizeResumePdfTemplate("modern")).toBe("modern");
    expect(normalizeResumePdfTemplate("nope")).toBe("classic");
  });
});
