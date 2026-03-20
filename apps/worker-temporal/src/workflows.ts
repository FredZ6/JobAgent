import { proxyActivities } from "@temporalio/workflow";
import type { OrchestrationMetadata } from "@rolecraft/shared-types";

import type * as activities from "./activities.js";

const { runDirectAnalysis, runDirectResumeGeneration, runDirectPrefill } = proxyActivities<typeof activities>({
  startToCloseTimeout: "2 minutes",
  heartbeatTimeout: "5 seconds"
});

export async function analyzeJobWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  return runDirectAnalysis(jobId, orchestration, workflowRunId);
}

export async function generateResumeWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  return runDirectResumeGeneration(jobId, orchestration, workflowRunId);
}

export async function prefillJobWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  return runDirectPrefill(jobId, orchestration, workflowRunId);
}
