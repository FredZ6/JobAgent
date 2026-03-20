import { type WorkflowRunsBulkActionResponse } from "@rolecraft/shared-types";

import type { WorkflowRunsEligibilitySummary } from "./workflow-runs-eligibility";

export type WorkflowRunsBulkControlAction = "retry" | "cancel";
export const maxWorkflowRunsBulkMutationTargets = 5;

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function getWorkflowRunsBulkEligibleCount(
  action: WorkflowRunsBulkControlAction,
  summary: WorkflowRunsEligibilitySummary
) {
  return action === "retry" ? summary.retryEligibleCount : summary.cancelEligibleCount;
}

export function buildWorkflowRunsBulkConfirmationCopy(
  action: WorkflowRunsBulkControlAction,
  summary: WorkflowRunsEligibilitySummary
) {
  const eligibleCount = getWorkflowRunsBulkEligibleCount(action, summary);
  const ineligibleCount = Math.max(summary.selectedCount - eligibleCount, 0);
  const verb = action === "retry" ? "Retry" : "Cancel";

  if (eligibleCount === 0) {
    return `No selected runs are eligible for ${action}.`;
  }

  if (ineligibleCount > 0) {
    return `${verb} ${pluralize(eligibleCount, "eligible run")} and ignore ${pluralize(ineligibleCount, "ineligible run")}?`;
  }

  return `${verb} ${pluralize(eligibleCount, "eligible run")}?`;
}

export function buildWorkflowRunsBulkResultSummary(
  action: WorkflowRunsBulkControlAction,
  response: WorkflowRunsBulkActionResponse
) {
  const verb = action === "retry" ? "Retried" : "Cancelled";
  return `${verb} ${response.successCount} ${response.successCount === 1 ? "run" : "runs"}, ${response.failureCount} failed, ${response.skippedCount} skipped.`;
}

export function getWorkflowRunsBulkLimitMessage(
  action: WorkflowRunsBulkControlAction,
  summary: WorkflowRunsEligibilitySummary
) {
  const eligibleCount = getWorkflowRunsBulkEligibleCount(action, summary);
  if (eligibleCount <= maxWorkflowRunsBulkMutationTargets) {
    return null;
  }

  return `Select ${maxWorkflowRunsBulkMutationTargets} eligible runs or fewer to ${action} at once.`;
}
