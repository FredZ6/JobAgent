import type { WorkflowRunsQueryState } from "./workflow-runs-query-state";
import { defaultWorkflowRunsQueryState } from "./workflow-runs-query-state";

type WorkflowRunsResultChipKey =
  | "kind"
  | "status"
  | "executionMode"
  | "query"
  | "fromDate"
  | "toDate";

export type WorkflowRunsResultChip = {
  key: WorkflowRunsResultChipKey;
  label: string;
};

type WorkflowRunsResultsSummaryInput = {
  loadedCount: number;
  totalCount: number;
  sortBy: WorkflowRunsQueryState["sortBy"];
  sortOrder: WorkflowRunsQueryState["sortOrder"];
  activeFilterCount: number;
};

type WorkflowRunsEmptyStateInput = {
  totalCount: number;
  hasActiveFilters: boolean;
};

export function getWorkflowRunsResultChips(
  state: WorkflowRunsQueryState
): WorkflowRunsResultChip[] {
  const chips: WorkflowRunsResultChip[] = [];

  if (state.kindFilter !== defaultWorkflowRunsQueryState.kindFilter) {
    chips.push({ key: "kind", label: `kind: ${state.kindFilter.replace(/_/g, " ")}` });
  }

  if (state.statusFilter !== defaultWorkflowRunsQueryState.statusFilter) {
    chips.push({ key: "status", label: `status: ${state.statusFilter}` });
  }

  if (state.executionModeFilter !== defaultWorkflowRunsQueryState.executionModeFilter) {
    chips.push({ key: "executionMode", label: `mode: ${state.executionModeFilter}` });
  }

  if (state.query.trim()) {
    chips.push({ key: "query", label: `q: ${state.query.trim()}` });
  }

  if (state.fromDate) {
    chips.push({ key: "fromDate", label: `from: ${state.fromDate}` });
  }

  if (state.toDate) {
    chips.push({ key: "toDate", label: `to: ${state.toDate}` });
  }

  return chips;
}

export function countActiveWorkflowRunsFilters(state: WorkflowRunsQueryState) {
  return getWorkflowRunsResultChips(state).length;
}

export function getWorkflowRunsResultsSummary({
  loadedCount,
  totalCount,
  sortBy,
  sortOrder,
  activeFilterCount
}: WorkflowRunsResultsSummaryInput) {
  return {
    countLabel: `Showing ${loadedCount} of ${totalCount} workflow runs`,
    sortLabel: `Sorted by ${getSortLabel(sortBy)}, ${sortOrder === "desc" ? "descending" : "ascending"}`,
    filtersLabel: activeFilterCount > 0 ? `Filtered by ${activeFilterCount} conditions` : ""
  };
}

export function getWorkflowRunsEmptyState({
  totalCount,
  hasActiveFilters
}: WorkflowRunsEmptyStateInput) {
  if (totalCount === 0 && hasActiveFilters) {
    return {
      title: "No workflow runs match the current filters.",
      detail: "Try clearing filters or widening the current search and date range."
    };
  }

  return {
    title: "No workflow runs yet.",
    detail: "The next analyze, resume, or prefill action will create the first workflow run here."
  };
}

function getSortLabel(sortBy: WorkflowRunsQueryState["sortBy"]) {
  switch (sortBy) {
    case "createdAt":
      return "created time";
    case "startedAt":
      return "started time";
    case "completedAt":
      return "completed time";
    case "status":
      return "status";
    case "kind":
      return "kind";
  }
}
