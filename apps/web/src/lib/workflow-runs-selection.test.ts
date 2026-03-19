import { describe, expect, it } from "vitest";

import { defaultWorkflowRunsQueryState } from "./workflow-runs-query-state";
import {
  buildWorkflowRunsSelectionScopeKey,
  countSelectedWorkflowRuns,
  selectAllLoadedWorkflowRuns,
  toggleWorkflowRunSelection
} from "./workflow-runs-selection";

describe("workflow-runs-selection helpers", () => {
  it("toggles a workflow run id into and out of selection", () => {
    const added = toggleWorkflowRunSelection([], "run_1");
    const removed = toggleWorkflowRunSelection(added, "run_1");

    expect(added).toEqual(["run_1"]);
    expect(removed).toEqual([]);
  });

  it("selects all loaded run ids while preserving existing selection", () => {
    expect(
      selectAllLoadedWorkflowRuns(["run_1"], ["run_1", "run_2", "run_3"])
    ).toEqual(["run_1", "run_2", "run_3"]);
  });

  it("counts selected workflow runs", () => {
    expect(countSelectedWorkflowRuns([])).toBe(0);
    expect(countSelectedWorkflowRuns(["run_1", "run_2"])).toBe(2);
  });

  it("builds a stable selection scope key from the current query state", () => {
    expect(buildWorkflowRunsSelectionScopeKey(defaultWorkflowRunsQueryState)).toBe("");

    expect(
      buildWorkflowRunsSelectionScopeKey({
        ...defaultWorkflowRunsQueryState,
        statusFilter: "failed",
        query: "platform",
        sortBy: "status",
        sortOrder: "asc"
      })
    ).toBe("status=failed&q=platform&sortBy=status&sortOrder=asc");
  });
});
