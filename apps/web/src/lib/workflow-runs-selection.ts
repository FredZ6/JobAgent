import type { WorkflowRunsQueryState } from "./workflow-runs-query-state";
import { serializeWorkflowRunsQueryState } from "./workflow-runs-query-state";

export function toggleWorkflowRunSelection(selectedRunIds: string[], runId: string) {
  if (selectedRunIds.includes(runId)) {
    return selectedRunIds.filter((selectedRunId) => selectedRunId !== runId);
  }

  return [...selectedRunIds, runId];
}

export function selectAllLoadedWorkflowRuns(selectedRunIds: string[], loadedRunIds: string[]) {
  return Array.from(new Set([...selectedRunIds, ...loadedRunIds]));
}

export function countSelectedWorkflowRuns(selectedRunIds: string[]) {
  return selectedRunIds.length;
}

export function buildWorkflowRunsSelectionScopeKey(state: WorkflowRunsQueryState) {
  return serializeWorkflowRunsQueryState(state).toString();
}
