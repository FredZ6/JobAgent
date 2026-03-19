import { describe, expect, it } from "vitest";

import { buildResumePdfInlineUrl, buildResumePdfUrl } from "./api";

describe("resume pdf links", () => {
  it("builds the existing download url", () => {
    expect(buildResumePdfUrl("resume-123")).toBe(
      "http://localhost:3001/resume-versions/resume-123/pdf"
    );
  });

  it("builds the inline preview url", () => {
    expect(buildResumePdfInlineUrl("resume-123")).toBe(
      "http://localhost:3001/resume-versions/resume-123/pdf/inline"
    );
  });

  it("adds template params to preview and download urls", () => {
    expect(buildResumePdfUrl("resume-123", "modern")).toBe(
      "http://localhost:3001/resume-versions/resume-123/pdf?template=modern"
    );
    expect(buildResumePdfInlineUrl("resume-123", "modern")).toBe(
      "http://localhost:3001/resume-versions/resume-123/pdf/inline?template=modern"
    );
  });
});
