import { describe, expect, it } from "vitest";

import {
  buildBulkOutcomeFailedReselection,
  buildBulkOutcomeSkippedReselection,
  buildSuccessfulBulkOutcomeRunDetailTargets
} from "./workflow-runs-bulk-follow-up";

describe("workflow-runs-bulk-follow-up helpers", () => {
  const panel = {
    title: "Bulk retry completed",
    summary: "Retried 1 run, 1 failed, 1 skipped.",
    rows: [
      {
        runId: "run-success",
        status: "success" as const,
        message: "Bulk action completed successfully.",
        tone: "success" as const,
        runDetailHref: "/workflow-runs/run-new"
      },
      {
        runId: "run-skipped",
        status: "skipped" as const,
        message: "Only failed workflow runs can be retried.",
        tone: "neutral" as const,
        runDetailHref: null
      },
      {
        runId: "run-failed",
        status: "failed" as const,
        message: "Retry failed again.",
        tone: "danger" as const,
        runDetailHref: null
      }
    ]
  };

  it("builds successful run-detail targets from the recent bulk outcome panel", () => {
    expect(buildSuccessfulBulkOutcomeRunDetailTargets(panel)).toEqual({
      urls: ["/workflow-runs/run-new"],
      error: null
    });
  });

  it("reselects skipped runs that are still present on the current loaded page", () => {
    expect(buildBulkOutcomeSkippedReselection(panel, ["run-skipped", "run-other"])).toEqual({
      runIds: ["run-skipped"],
      message: "Reselected 1 skipped run from the current loaded page.",
      error: null
    });
  });

  it("reselects failed results that are still present on the current loaded page", () => {
    expect(buildBulkOutcomeFailedReselection(panel, ["run-failed", "run-other"])).toEqual({
      runIds: ["run-failed"],
      message: "Reselected 1 failed-result run from the current loaded page.",
      error: null
    });
  });

  it("returns a clear error when no skipped runs are reloadable from the current page", () => {
    expect(buildBulkOutcomeSkippedReselection(panel, ["run-other"])).toEqual({
      runIds: [],
      message: null,
      error: "No skipped runs from the recent bulk action are available on the current loaded page."
    });
  });
});
