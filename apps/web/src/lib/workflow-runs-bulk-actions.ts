import type { WorkflowRunListItem } from "@openclaw/shared-types";

export const maxWorkflowRunBulkOpenTargets = 5;

type WorkflowRunsBulkActionResult = {
  urls: string[];
  error: string | null;
};

export function buildSelectedRunDetailTargets(selectedRunIds: string[]): WorkflowRunsBulkActionResult {
  if (selectedRunIds.length > maxWorkflowRunBulkOpenTargets) {
    return {
      urls: [],
      error: `Select ${maxWorkflowRunBulkOpenTargets} runs or fewer to open details at once.`
    };
  }

  return {
    urls: selectedRunIds.map((runId) => `/workflow-runs/${runId}`),
    error: null
  };
}

export function buildSelectedJobTargets(
  loadedRuns: WorkflowRunListItem[],
  selectedRunIds: string[]
): WorkflowRunsBulkActionResult {
  const selectedRunIdSet = new Set(selectedRunIds);
  const urls = Array.from(
    new Set(
      loadedRuns
        .filter((item) => selectedRunIdSet.has(item.workflowRun.id))
        .map((item) => `/jobs/${item.job.id}`)
    )
  );

  if (urls.length > maxWorkflowRunBulkOpenTargets) {
    return {
      urls: [],
      error: `Select ${maxWorkflowRunBulkOpenTargets} jobs or fewer to open at once.`
    };
  }

  return {
    urls,
    error: null
  };
}
