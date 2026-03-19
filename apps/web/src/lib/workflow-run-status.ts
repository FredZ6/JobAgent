import type { WorkflowRun } from "@openclaw/shared-types";

type WorkflowRunStatusCopy = {
  label: string;
  detail: string;
};

export function hasActiveWorkflowRuns(runs: WorkflowRun[]) {
  return runs.some((run) => run.status === "queued" || run.status === "running");
}

export function getWorkflowRunStatusCopy(run: WorkflowRun): WorkflowRunStatusCopy {
  if (run.status === "queued") {
    return {
      label: "Queued in Temporal",
      detail: "This run is waiting for a worker to pick it up."
    };
  }

  if (run.status === "running") {
    return {
      label: "Running",
      detail:
        run.executionMode === "direct"
          ? "This run is still executing inside the direct API path. You can stop it at the next safe cancellation point in this API process."
          : "This run is still executing inside a Temporal worker. You can stop it at the next safe cancellation point."
    };
  }

  if (run.status === "completed") {
    if (run.resumeVersionId) {
      return {
        label: "Completed",
        detail: "This run finished successfully. Open resume version to review the output."
      };
    }

    if (run.applicationId) {
      return {
        label: "Completed",
        detail: "This run finished successfully. Review application run to inspect the evidence."
      };
    }

    return {
      label: "Completed",
      detail: "This run finished successfully."
    };
  }

  if (run.status === "failed") {
    return {
      label: "Failed",
      detail: summarizeWorkflowRunError(run.errorMessage) || "This run failed before it could finish."
    };
  }

  if (run.startedAt) {
    return {
      label: "Cancelled during execution",
      detail: "This run was stopped at a safe cancellation point and did not roll back any existing business records."
    };
  }

  return {
    label: "Cancelled before execution",
    detail: "This run was cancelled and did not roll back any existing business records."
  };
}

export function getWorkflowRunDashboardSummary(run: WorkflowRun) {
  const kindLabel = getWorkflowRunKindLabel(run);

  return `${kindLabel} ${run.status}`;
}

function getWorkflowRunKindLabel(run: WorkflowRun) {
  return run.kind === "analyze" ? "Analyze" : run.kind === "generate_resume" ? "Resume" : "Prefill";
}

function summarizeWorkflowRunError(errorMessage: string | null) {
  if (!errorMessage) {
    return "";
  }

  return errorMessage
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length > 0) ?? "";
}
