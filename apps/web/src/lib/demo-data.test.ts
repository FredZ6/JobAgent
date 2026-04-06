import { describe, expect, it } from "vitest";

import { getDemoGetResponse } from "./demo-data";

describe("getDemoGetResponse", () => {
  it("returns the built-in Job A detail for the demo job route", () => {
    const result = getDemoGetResponse("/jobs/job_demo_a") as { title: string; analyses: unknown[] };

    expect(result.title).toBe("Senior Product Platform Engineer");
    expect(result.analyses).toHaveLength(1);
  });

  it("returns the built-in workflow runs list response for the global runs route", () => {
    const result = getDemoGetResponse("/workflow-runs") as {
      summary: { totalRuns: number };
      runs: Array<{ workflowRun: { id: string } }>;
    };

    expect(result.summary.totalRuns).toBe(4);
    expect(result.runs[0]?.workflowRun.id).toBe("run_demo_prefill_a1");
  });
});
