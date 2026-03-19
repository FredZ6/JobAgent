import { describe, expect, it } from "vitest";

describe("runtime API smoke", () => {
  it.skipIf(!process.env.RUN_RUNTIME_SMOKE)("serves profile and settings endpoints from the running stack", async () => {
    const [profileResponse, settingsResponse] = await Promise.all([
      fetch("http://localhost:3001/profile"),
      fetch("http://localhost:3001/settings/llm")
    ]);

    expect(profileResponse.status).toBe(200);
    expect(settingsResponse.status).toBe(200);
  });
});
