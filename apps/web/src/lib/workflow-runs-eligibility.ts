import type { WorkflowRunListItem } from "@openclaw/shared-types";

export type WorkflowRunsEligibilitySummary = {
  selectedCount: number;
  retryEligibleIds: string[];
  cancelEligibleIds: string[];
  ineligibleIds: string[];
  retryEligibleCount: number;
  cancelEligibleCount: number;
  ineligibleCount: number;
};

export function buildWorkflowRunsEligibilitySummary(
  loadedRuns: WorkflowRunListItem[],
  selectedRunIds: string[]
): WorkflowRunsEligibilitySummary {
  const selectedRunIdSet = new Set(selectedRunIds);
  const retryEligibleIds: string[] = [];
  const cancelEligibleIds: string[] = [];
  const ineligibleIds: string[] = [];

  loadedRuns.forEach((item) => {
    if (!selectedRunIdSet.has(item.workflowRun.id)) {
      return;
    }

    if (item.workflowRun.status === "failed") {
      retryEligibleIds.push(item.workflowRun.id);
      return;
    }

    if (
      item.workflowRun.executionMode === "temporal" &&
      item.workflowRun.status === "queued"
    ) {
      cancelEligibleIds.push(item.workflowRun.id);
      return;
    }

    ineligibleIds.push(item.workflowRun.id);
  });

  return {
    selectedCount: retryEligibleIds.length + cancelEligibleIds.length + ineligibleIds.length,
    retryEligibleIds,
    cancelEligibleIds,
    ineligibleIds,
    retryEligibleCount: retryEligibleIds.length,
    cancelEligibleCount: cancelEligibleIds.length,
    ineligibleCount: ineligibleIds.length
  };
}

export function getWorkflowRunsEligibilityMessages(
  summary: WorkflowRunsEligibilitySummary
) {
  if (summary.selectedCount === 0) {
    return [];
  }

  if (summary.retryEligibleCount === 0 && summary.cancelEligibleCount === 0) {
    return ["No selected runs are eligible for retry or cancel."];
  }

  const messages: string[] = [];

  if (summary.retryEligibleCount < summary.selectedCount) {
    messages.push("Only failed runs are retry eligible.");
  }

  if (summary.cancelEligibleCount < summary.selectedCount) {
    messages.push("Only queued Temporal runs are cancel eligible.");
  }

  return messages;
}
