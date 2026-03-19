import { describe, expect, it } from "vitest";

import { defaultWorkflowRunsQueryState } from "./workflow-runs-query-state";
import {
  countActiveWorkflowRunsFilters,
  getWorkflowRunsEmptyState,
  getWorkflowRunsResultsSummary,
  getWorkflowRunsResultChips
} from "./workflow-runs-results";

describe("workflow-runs-results helpers", () => {
  it("builds removable chips for each active filter", () => {
    const chips = getWorkflowRunsResultChips({
      ...defaultWorkflowRunsQueryState,
      kindFilter: "prefill",
      statusFilter: "failed",
      executionModeFilter: "temporal",
      query: "platform",
      fromDate: "2026-03-18",
      toDate: "2026-03-19"
    });

    expect(chips).toEqual([
      { key: "kind", label: "kind: prefill" },
      { key: "status", label: "status: failed" },
      { key: "executionMode", label: "mode: temporal" },
      { key: "query", label: "q: platform" },
      { key: "fromDate", label: "from: 2026-03-18" },
      { key: "toDate", label: "to: 2026-03-19" }
    ]);
  });

  it("counts only non-default filters as active", () => {
    expect(countActiveWorkflowRunsFilters(defaultWorkflowRunsQueryState)).toBe(0);
    expect(
      countActiveWorkflowRunsFilters({
        ...defaultWorkflowRunsQueryState,
        statusFilter: "failed",
        query: "platform"
      })
    ).toBe(2);
  });

  it("builds readable result-summary copy", () => {
    expect(
      getWorkflowRunsResultsSummary({
        loadedCount: 20,
        totalCount: 73,
        sortBy: "createdAt",
        sortOrder: "desc",
        activeFilterCount: 3
      })
    ).toEqual({
      countLabel: "Showing 20 of 73 workflow runs",
      sortLabel: "Sorted by created time, descending",
      filtersLabel: "Filtered by 3 conditions"
    });
  });

  it("distinguishes filtered-empty and first-run-empty states", () => {
    expect(getWorkflowRunsEmptyState({ totalCount: 0, hasActiveFilters: true })).toEqual({
      title: "No workflow runs match the current filters.",
      detail: "Try clearing filters or widening the current search and date range."
    });

    expect(getWorkflowRunsEmptyState({ totalCount: 0, hasActiveFilters: false })).toEqual({
      title: "No workflow runs yet.",
      detail: "The next analyze, resume, or prefill action will create the first workflow run here."
    });
  });
});
