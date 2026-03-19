import { describe, expect, it } from "vitest";

import {
  defaultWorkflowRunsQueryState,
  parseWorkflowRunsQueryState,
  serializeWorkflowRunsQueryState
} from "./workflow-runs-query-state";

describe("workflow-runs-query-state", () => {
  it("parses workflow-runs state from search params", () => {
    const state = parseWorkflowRunsQueryState(
      new URLSearchParams({
        kind: "prefill",
        status: "failed",
        executionMode: "temporal",
        q: "platform",
        from: "2026-03-18",
        to: "2026-03-19",
        sortBy: "status",
        sortOrder: "asc"
      })
    );

    expect(state).toEqual({
      kindFilter: "prefill",
      statusFilter: "failed",
      executionModeFilter: "temporal",
      query: "platform",
      fromDate: "2026-03-18",
      toDate: "2026-03-19",
      sortBy: "status",
      sortOrder: "asc"
    });
  });

  it("falls back to defaults for unknown values", () => {
    const state = parseWorkflowRunsQueryState(
      new URLSearchParams({
        kind: "weird",
        status: "unknown",
        executionMode: "sideways",
        sortBy: "updatedAt",
        sortOrder: "up",
        q: ""
      })
    );

    expect(state).toEqual(defaultWorkflowRunsQueryState);
  });

  it("omits default values when serializing", () => {
    const params = serializeWorkflowRunsQueryState(defaultWorkflowRunsQueryState);

    expect(params.toString()).toBe("");
  });

  it("preserves non-default filters when serializing", () => {
    const params = serializeWorkflowRunsQueryState({
      kindFilter: "prefill",
      statusFilter: "failed",
      executionModeFilter: "temporal",
      query: "platform",
      fromDate: "2026-03-18",
      toDate: "2026-03-19",
      sortBy: "status",
      sortOrder: "asc"
    });

    expect(params.toString()).toBe(
      "kind=prefill&status=failed&executionMode=temporal&q=platform&from=2026-03-18&to=2026-03-19&sortBy=status&sortOrder=asc"
    );
  });
});
