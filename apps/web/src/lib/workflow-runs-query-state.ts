import type {
  WorkflowRunExecutionMode,
  WorkflowRunKind,
  WorkflowRunSortBy,
  WorkflowRunSortOrder,
  WorkflowRunStatus
} from "@openclaw/shared-types";

const kindValues = ["all", "analyze", "generate_resume", "prefill"] as const;
const statusValues = ["all", "queued", "running", "completed", "failed", "cancelled"] as const;
const executionModeValues = ["all", "direct", "temporal"] as const;
const sortByValues = ["createdAt", "startedAt", "completedAt", "status", "kind"] as const;
const sortOrderValues = ["desc", "asc"] as const;

export type WorkflowRunsKindFilter = "all" | WorkflowRunKind;
export type WorkflowRunsStatusFilter = "all" | WorkflowRunStatus;
export type WorkflowRunsExecutionModeFilter = "all" | WorkflowRunExecutionMode;

export type WorkflowRunsQueryState = {
  kindFilter: WorkflowRunsKindFilter;
  statusFilter: WorkflowRunsStatusFilter;
  executionModeFilter: WorkflowRunsExecutionModeFilter;
  query: string;
  fromDate: string;
  toDate: string;
  sortBy: WorkflowRunSortBy;
  sortOrder: WorkflowRunSortOrder;
};

export const defaultWorkflowRunsQueryState: WorkflowRunsQueryState = {
  kindFilter: "all",
  statusFilter: "all",
  executionModeFilter: "all",
  query: "",
  fromDate: "",
  toDate: "",
  sortBy: "createdAt",
  sortOrder: "desc"
};

export function parseWorkflowRunsQueryState(
  searchParams: Pick<URLSearchParams, "get">
): WorkflowRunsQueryState {
  return {
    kindFilter: parseEnumValue(searchParams.get("kind"), kindValues, defaultWorkflowRunsQueryState.kindFilter),
    statusFilter: parseEnumValue(
      searchParams.get("status"),
      statusValues,
      defaultWorkflowRunsQueryState.statusFilter
    ),
    executionModeFilter: parseEnumValue(
      searchParams.get("executionMode"),
      executionModeValues,
      defaultWorkflowRunsQueryState.executionModeFilter
    ),
    query: searchParams.get("q")?.trim() ?? "",
    fromDate: searchParams.get("from") ?? "",
    toDate: searchParams.get("to") ?? "",
    sortBy: parseEnumValue(
      searchParams.get("sortBy"),
      sortByValues,
      defaultWorkflowRunsQueryState.sortBy
    ),
    sortOrder: parseEnumValue(
      searchParams.get("sortOrder"),
      sortOrderValues,
      defaultWorkflowRunsQueryState.sortOrder
    )
  };
}

export function serializeWorkflowRunsQueryState(state: WorkflowRunsQueryState) {
  const params = new URLSearchParams();

  if (state.kindFilter !== defaultWorkflowRunsQueryState.kindFilter) {
    params.set("kind", state.kindFilter);
  }

  if (state.statusFilter !== defaultWorkflowRunsQueryState.statusFilter) {
    params.set("status", state.statusFilter);
  }

  if (state.executionModeFilter !== defaultWorkflowRunsQueryState.executionModeFilter) {
    params.set("executionMode", state.executionModeFilter);
  }

  if (state.query.trim()) {
    params.set("q", state.query.trim());
  }

  if (state.fromDate) {
    params.set("from", state.fromDate);
  }

  if (state.toDate) {
    params.set("to", state.toDate);
  }

  if (state.sortBy !== defaultWorkflowRunsQueryState.sortBy) {
    params.set("sortBy", state.sortBy);
  }

  if (state.sortOrder !== defaultWorkflowRunsQueryState.sortOrder) {
    params.set("sortOrder", state.sortOrder);
  }

  return params;
}

function parseEnumValue<T extends string>(
  value: string | null,
  allowedValues: readonly T[],
  fallback: T
) {
  if (value && allowedValues.includes(value as T)) {
    return value as T;
  }

  return fallback;
}
