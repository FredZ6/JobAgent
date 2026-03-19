import { describe, expect, it } from "vitest";

import {
  getFieldResultDisplayName,
  getFieldResultState,
  getFieldResultStatusLabel,
  groupFieldResults,
  summarizeFieldResults
} from "./field-results";

describe("field-results helpers", () => {
  it("uses rich status values when deriving state", () => {
    expect(
      getFieldResultState({
        fieldName: "resume",
        fieldType: "resume_upload",
        filled: false,
        status: "unhandled"
      })
    ).toBe("unresolved");

    expect(
      getFieldResultState({
        fieldName: "why_company",
        fieldType: "long_text",
        filled: false,
        status: "failed",
        failureReason: "generation failed"
      })
    ).toBe("failed");
  });

  it("groups field results by user-facing category", () => {
    const groups = groupFieldResults([
      { fieldName: "email", fieldType: "basic_text", filled: true, status: "filled" },
      { fieldName: "resume", fieldType: "resume_upload", filled: true, status: "filled" },
      {
        fieldName: "why_company",
        fieldType: "long_text",
        questionText: "Why do you want to work here?",
        filled: false,
        status: "failed",
        failureReason: "generation failed"
      }
    ]);

    expect(groups.map((group) => [group.key, group.items.length])).toEqual([
      ["resume_upload", 1],
      ["long_text", 1],
      ["basic_text", 1]
    ]);
  });

  it("builds readable display labels and summary counts", () => {
    expect(
      getFieldResultDisplayName({
        fieldName: "why_company",
        questionText: "Why do you want to work here?",
        filled: false
      })
    ).toBe("Why do you want to work here?");

    expect(
      getFieldResultStatusLabel({
        fieldName: "resume",
        fieldType: "resume_upload",
        filled: false,
        status: "unhandled"
      })
    ).toBe("unhandled");

    expect(
      summarizeFieldResults([
        { fieldName: "email", filled: true, status: "filled" },
        { fieldName: "resume", filled: false, status: "unhandled" },
        { fieldName: "why_company", filled: false, status: "failed", failureReason: "generation failed" }
      ])
    ).toEqual({
      filled: 1,
      failed: 1,
      unresolved: 1
    });
  });
});
