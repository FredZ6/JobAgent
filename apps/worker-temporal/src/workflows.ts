import { condition, defineSignal, proxyActivities, setHandler } from "@temporalio/workflow";
import type { OrchestrationMetadata } from "@rolecraft/shared-types";

import type * as activities from "./activities.js";

const { runDirectAnalysis, runDirectResumeGeneration, runDirectPrefill, markWorkflowRunPaused } = proxyActivities<
  typeof activities
>({
  startToCloseTimeout: "2 minutes",
  heartbeatTimeout: "5 seconds"
});

async function waitForSafeResumeCheckpoint(workflowRunId: string) {
  const pauseSignal = defineSignal("pause");
  const resumeSignal = defineSignal("resume");
  let pauseRequested = false;

  setHandler(pauseSignal, () => {
    pauseRequested = true;
  });

  setHandler(resumeSignal, () => {
    pauseRequested = false;
  });

  if (!pauseRequested) {
    return;
  }

  await markWorkflowRunPaused(workflowRunId, "Requested from workflow detail");
  await condition(() => !pauseRequested);
}

export async function analyzeJobWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  await waitForSafeResumeCheckpoint(workflowRunId);
  return runDirectAnalysis(jobId, orchestration, workflowRunId);
}

export async function generateResumeWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  await waitForSafeResumeCheckpoint(workflowRunId);
  return runDirectResumeGeneration(jobId, orchestration, workflowRunId);
}

export async function prefillJobWorkflow(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  await waitForSafeResumeCheckpoint(workflowRunId);
  return runDirectPrefill(jobId, orchestration, workflowRunId);
}
