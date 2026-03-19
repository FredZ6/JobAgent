import { describe, expect, it } from "vitest";

import { extractApiErrorMessage } from "./api-error";

describe("extractApiErrorMessage", () => {
  it("returns the message field from a JSON error body", () => {
    expect(
      extractApiErrorMessage(
        "{\"message\":\"Workflow run was cancelled\",\"error\":\"Conflict\",\"statusCode\":409}",
        409
      )
    ).toBe("Workflow run was cancelled");
  });

  it("falls back to plain text when the body is not JSON", () => {
    expect(extractApiErrorMessage("Something went wrong", 500)).toBe("Something went wrong");
  });

  it("falls back to the status code when the body is empty", () => {
    expect(extractApiErrorMessage("", 503)).toBe("Request failed with 503");
  });
});
