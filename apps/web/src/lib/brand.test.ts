import { describe, expect, it } from "vitest";

import { appBrand } from "./brand";

describe("brand copy", () => {
  it("uses Rolecraft as the visible app name", () => {
    expect(appBrand.name).toBe("Rolecraft");
  });

  it("keeps the current product positioning copy together in one place", () => {
    expect(appBrand.subtitle).toContain("reviewable automation");
    expect(appBrand.subtitle).toContain("high-trust submission prep");
    expect(appBrand.description).toBe(
      "A premium, human-in-the-loop workspace for deliberate job applications"
    );
  });
});
