import { describe, expect, it } from "vitest";

import { DirectRunCancellationRegistryService } from "./direct-run-cancellation-registry.service.js";

describe("DirectRunCancellationRegistryService", () => {
  it("registers, cancels, and cleans up direct workflow run signals", () => {
    const service = new DirectRunCancellationRegistryService();

    const signal = service.register("run_direct_1");

    expect(service.has("run_direct_1")).toBe(true);
    expect(signal.aborted).toBe(false);

    service.cancel("run_direct_1");

    expect(signal.aborted).toBe(true);

    service.cleanup("run_direct_1");

    expect(service.has("run_direct_1")).toBe(false);
  });
});
