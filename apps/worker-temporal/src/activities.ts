import "reflect-metadata";
import { Context } from "@temporalio/activity";
import { resolveInternalApiToken } from "@rolecraft/config";
import type { OrchestrationMetadata } from "@rolecraft/shared-types";

type DirectInvocationBody = {
  orchestration?: OrchestrationMetadata;
  workflowRunId?: string;
};

function buildInternalHeaders() {
  return {
    "Content-Type": "application/json",
    "x-internal-token": resolveInternalApiToken(process.env) ?? ""
  };
}

async function runCancellableInternalRequest<T>(label: string, fn: (signal: AbortSignal) => Promise<T>) {
  const context = Context.current();
  context.heartbeat();
  const timer = setInterval(() => {
    try {
      context.heartbeat();
    } catch {
      // Cancellation propagation is handled via the activity cancellation signal.
    }
  }, 1000);

  try {
    return await fn(context.cancellationSignal);
  } finally {
    clearInterval(timer);
    console.log(`worker-temporal ${label} activity finished`);
  }
}

export async function runDirectAnalysis(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  console.log(`worker-temporal running direct analysis for ${jobId}`);

  try {
    return await runCancellableInternalRequest("analysis", async (signal) => {
      const response = await fetch(
        `${process.env.API_URL ?? "http://api:3001"}/internal/jobs/${jobId}/analyze-direct`,
        {
          method: "POST",
          signal,
          headers: buildInternalHeaders(),
          body: JSON.stringify({
            orchestration,
            workflowRunId
          } satisfies DirectInvocationBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Internal direct-analysis request failed with ${response.status}`);
      }

      return response.json();
    });
  } catch (error) {
    console.error("worker-temporal analysis activity failed", error);
    throw error;
  }
}

export async function runDirectResumeGeneration(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  console.log(`worker-temporal running direct resume generation for ${jobId}`);

  try {
    return await runCancellableInternalRequest("resume", async (signal) => {
      const response = await fetch(
        `${process.env.API_URL ?? "http://api:3001"}/internal/jobs/${jobId}/generate-resume-direct`,
        {
          method: "POST",
          signal,
          headers: buildInternalHeaders(),
          body: JSON.stringify({
            orchestration,
            workflowRunId
          } satisfies DirectInvocationBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Internal direct-resume request failed with ${response.status}`);
      }

      return response.json();
    });
  } catch (error) {
    console.error("worker-temporal resume activity failed", error);
    throw error;
  }
}

export async function runDirectPrefill(
  jobId: string,
  orchestration: OrchestrationMetadata,
  workflowRunId: string
) {
  console.log(`worker-temporal running direct prefill for ${jobId}`);

  try {
    return await runCancellableInternalRequest("prefill", async (signal) => {
      const response = await fetch(
        `${process.env.API_URL ?? "http://api:3001"}/internal/jobs/${jobId}/prefill-direct`,
        {
          method: "POST",
          signal,
          headers: buildInternalHeaders(),
          body: JSON.stringify({
            orchestration,
            workflowRunId
          } satisfies DirectInvocationBody)
        }
      );

      if (!response.ok) {
        throw new Error(`Internal direct-prefill request failed with ${response.status}`);
      }

      return response.json();
    });
  } catch (error) {
    console.error("worker-temporal prefill activity failed", error);
    throw error;
  }
}
