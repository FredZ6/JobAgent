import type { WorkflowRunListItem } from "@rolecraft/shared-types";

import type { WorkflowRunsBulkControlAction } from "./workflow-runs-bulk-controls";

export type WorkflowRunsBulkPreflightRow = {
  runId: string;
  kind: WorkflowRunListItem["workflowRun"]["kind"];
  status: WorkflowRunListItem["workflowRun"]["status"];
  executionMode: WorkflowRunListItem["workflowRun"]["executionMode"];
};

export type WorkflowRunsBulkPreflightSkippedRow = WorkflowRunsBulkPreflightRow & {
  reason: string;
};

export type WorkflowRunsBulkPreflight = {
  willProcess: WorkflowRunsBulkPreflightRow[];
  willSkip: WorkflowRunsBulkPreflightSkippedRow[];
};

function buildPreflightRow(item: WorkflowRunListItem): WorkflowRunsBulkPreflightRow {
  return {
    runId: item.workflowRun.id,
    kind: item.workflowRun.kind,
    status: item.workflowRun.status,
    executionMode: item.workflowRun.executionMode
  };
}

function getSkipReason(action: WorkflowRunsBulkControlAction) {
  return action === "retry"
    ? "Only failed workflow runs can be retried."
    : "Only queued Temporal workflow runs can be cancelled.";
}

function isEligible(action: WorkflowRunsBulkControlAction, item: WorkflowRunListItem) {
  if (action === "retry") {
    return item.workflowRun.status === "failed";
  }

  return item.workflowRun.executionMode === "temporal" && item.workflowRun.status === "queued";
}

export function buildWorkflowRunsBulkPreflight(
  action: WorkflowRunsBulkControlAction,
  selectedRunIds: string[],
  loadedRuns: WorkflowRunListItem[]
): WorkflowRunsBulkPreflight {
  const loadedRunMap = new Map(loadedRuns.map((item) => [item.workflowRun.id, item]));
  const willProcess: WorkflowRunsBulkPreflightRow[] = [];
  const willSkip: WorkflowRunsBulkPreflightSkippedRow[] = [];

  selectedRunIds.forEach((runId) => {
    const item = loadedRunMap.get(runId);
    if (!item) {
      return;
    }

    if (isEligible(action, item)) {
      willProcess.push(buildPreflightRow(item));
      return;
    }

    willSkip.push({
      ...buildPreflightRow(item),
      reason: getSkipReason(action)
    });
  });

  return {
    willProcess,
    willSkip
  };
}
