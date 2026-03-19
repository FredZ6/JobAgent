import { describe, expect, it } from "vitest";

import {
  buildWorkflowRunsBulkConfirmationCopy,
  buildWorkflowRunsBulkResultSummary,
  getWorkflowRunsBulkLimitMessage
} from "./workflow-runs-bulk-controls";

describe("workflow-runs-bulk-controls helpers", () => {
  it("builds mixed-selection confirmation copy for retry", () => {
    expect(
      buildWorkflowRunsBulkConfirmationCopy("retry", {
        selectedCount: 4,
        retryEligibleIds: ["a", "b"],
        cancelEligibleIds: ["c"],
        ineligibleIds: ["d"],
        retryEligibleCount: 2,
        cancelEligibleCount: 1,
        ineligibleCount: 1
      })
    ).toBe("Retry 2 eligible runs and ignore 2 ineligible runs?");
  });

  it("builds simple confirmation copy when all selected runs are eligible", () => {
    expect(
      buildWorkflowRunsBulkConfirmationCopy("cancel", {
        selectedCount: 2,
        retryEligibleIds: [],
        cancelEligibleIds: ["a", "b"],
        ineligibleIds: [],
        retryEligibleCount: 0,
        cancelEligibleCount: 2,
        ineligibleCount: 0
      })
    ).toBe("Cancel 2 eligible runs?");
  });

  it("builds compact result-summary copy", () => {
    expect(
      buildWorkflowRunsBulkResultSummary("retry", {
        requestedCount: 4,
        eligibleCount: 2,
        skippedCount: 2,
        successCount: 1,
        failureCount: 1,
        results: []
      })
    ).toBe("Retried 1 run, 1 failed, 2 skipped.");
  });

  it("returns a limit message when too many eligible runs are selected", () => {
    expect(
      getWorkflowRunsBulkLimitMessage("retry", {
        selectedCount: 7,
        retryEligibleIds: ["1", "2", "3", "4", "5", "6"],
        cancelEligibleIds: [],
        ineligibleIds: ["7"],
        retryEligibleCount: 6,
        cancelEligibleCount: 0,
        ineligibleCount: 1
      })
    ).toBe("Select 5 eligible runs or fewer to retry at once.");
  });
});
