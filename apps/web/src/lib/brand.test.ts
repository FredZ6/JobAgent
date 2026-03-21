import { describe, expect, it } from "vitest";

import { appBrand } from "./brand";

describe("brand copy", () => {
  it("uses Rolecraft as the visible app name", () => {
    expect(appBrand.name).toBe("Rolecraft");
  });

  it("keeps the current product positioning copy together in one place", () => {
    expect(appBrand.subtitle).toContain("human-in-the-loop");
    expect(appBrand.description).toBe("Semi-automated job application MVP");
  });
});
