import type { WorkflowRunsBulkOutcomePanel } from "./workflow-runs-bulk-outcomes";
import { maxWorkflowRunBulkOpenTargets } from "./workflow-runs-bulk-actions";

function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function buildSuccessfulBulkOutcomeRunDetailTargets(
  panel: WorkflowRunsBulkOutcomePanel | null
) {
  if (panel == null) {
    return {
      urls: [],
      error: null as string | null
    };
  }

  const urls = panel.rows
    .filter((row) => row.status === "success" && row.runDetailHref)
    .map((row) => row.runDetailHref as string);

  if (urls.length > maxWorkflowRunBulkOpenTargets) {
    return {
      urls: [],
      error: `Open ${maxWorkflowRunBulkOpenTargets} successful runs or fewer at once.`
    };
  }

  return {
    urls,
    error: null as string | null
  };
}

export function buildBulkOutcomeSkippedReselection(
  panel: WorkflowRunsBulkOutcomePanel | null,
  loadedRunIds: string[]
) {
  const loadedRunIdSet = new Set(loadedRunIds);
  const runIds =
    panel?.rows
      .filter((row) => row.status === "skipped" && loadedRunIdSet.has(row.runId))
      .map((row) => row.runId) ?? [];

  if (runIds.length === 0) {
    return {
      runIds,
      message: null as string | null,
      error:
        "No skipped runs from the recent bulk action are available on the current loaded page."
    };
  }

  return {
    runIds,
    message: `Reselected ${pluralize(runIds.length, "skipped run")} from the current loaded page.`,
    error: null as string | null
  };
}

export function buildBulkOutcomeFailedReselection(
  panel: WorkflowRunsBulkOutcomePanel | null,
  loadedRunIds: string[]
) {
  const loadedRunIdSet = new Set(loadedRunIds);
  const runIds =
    panel?.rows
      .filter((row) => row.status === "failed" && loadedRunIdSet.has(row.runId))
      .map((row) => row.runId) ?? [];

  if (runIds.length === 0) {
    return {
      runIds,
      message: null as string | null,
      error:
        "No failed-result runs from the recent bulk action are available on the current loaded page."
    };
  }

  return {
    runIds,
    message: `Reselected ${pluralize(runIds.length, "failed-result run")} from the current loaded page.`,
    error: null as string | null
  };
}
