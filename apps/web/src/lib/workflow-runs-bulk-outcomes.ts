import { type WorkflowRunsBulkActionResponse } from "@openclaw/shared-types";

import {
  buildWorkflowRunsBulkResultSummary,
  type WorkflowRunsBulkControlAction
} from "./workflow-runs-bulk-controls";

export type WorkflowRunsBulkOutcomeTone = "success" | "neutral" | "danger";

export type WorkflowRunsBulkOutcomeRow = {
  runId: string;
  status: "success" | "skipped" | "failed";
  message: string;
  tone: WorkflowRunsBulkOutcomeTone;
  runDetailHref: string | null;
};

export type WorkflowRunsBulkOutcomePanel = {
  title: string;
  summary: string;
  rows: WorkflowRunsBulkOutcomeRow[];
};

function getTone(status: WorkflowRunsBulkOutcomeRow["status"]): WorkflowRunsBulkOutcomeTone {
  switch (status) {
    case "success":
      return "success";
    case "failed":
      return "danger";
    default:
      return "neutral";
  }
}

export function buildWorkflowRunsBulkOutcomePanel(
  action: WorkflowRunsBulkControlAction,
  response: WorkflowRunsBulkActionResponse | null
): WorkflowRunsBulkOutcomePanel | null {
  if (response == null) {
    return null;
  }

  return {
    title: action === "retry" ? "Bulk retry completed" : "Bulk cancel completed",
    summary: buildWorkflowRunsBulkResultSummary(action, response),
    rows: response.results.map((result) => ({
      runId: result.runId,
      status: result.status,
      message: result.message,
      tone: getTone(result.status),
      runDetailHref: result.workflowRun ? `/workflow-runs/${result.workflowRun.workflowRun.id}` : null
    }))
  };
}
