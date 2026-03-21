import { beforeEach, describe, expect, it, vi } from "vitest";
import type { OrchestrationMetadata } from "@rolecraft/shared-types";

const workflowMocks = vi.hoisted(() => {
  const runDirectAnalysis = vi.fn();
  const runDirectResumeGeneration = vi.fn();
  const runDirectPrefill = vi.fn();
  const markWorkflowRunPaused = vi.fn();
  const defineSignal = vi.fn((name: string) => name);
  const setHandler = vi.fn();
  const condition = vi.fn();

  return {
    runDirectAnalysis,
    runDirectResumeGeneration,
    runDirectPrefill,
    markWorkflowRunPaused,
    defineSignal,
    setHandler,
    condition
  };
});

vi.mock("@temporalio/workflow", () => ({
  proxyActivities: vi.fn(() => ({
    runDirectAnalysis: workflowMocks.runDirectAnalysis,
    runDirectResumeGeneration: workflowMocks.runDirectResumeGeneration,
    runDirectPrefill: workflowMocks.runDirectPrefill,
    markWorkflowRunPaused: workflowMocks.markWorkflowRunPaused
  })),
  defineSignal: workflowMocks.defineSignal,
  setHandler: workflowMocks.setHandler,
  condition: workflowMocks.condition
}));

import { analyzeJobWorkflow, prefillJobWorkflow } from "./workflows.js";

describe("Temporal starter workflows pause/resume", () => {
  const orchestration: OrchestrationMetadata = {
    executionMode: "temporal",
    workflowId: "prefill-job-job_1-123",
    workflowType: "prefillJobWorkflow",
    taskQueue: "rolecraft-analysis"
  };

  beforeEach(() => {
    workflowMocks.runDirectAnalysis.mockReset().mockResolvedValue({ status: "ok" });
    workflowMocks.runDirectResumeGeneration.mockReset().mockResolvedValue({ status: "ok" });
    workflowMocks.runDirectPrefill.mockReset().mockResolvedValue({ status: "ok" });
    workflowMocks.markWorkflowRunPaused.mockReset().mockResolvedValue({ status: "paused" });
    workflowMocks.defineSignal.mockClear();
    workflowMocks.setHandler.mockReset();
    workflowMocks.condition.mockReset().mockResolvedValue(true);
  });

  it("registers pause and resume signal handlers before invoking a starter activity", async () => {
    await analyzeJobWorkflow("job_1", orchestration, "run_1");

    expect(workflowMocks.defineSignal).toHaveBeenCalledWith("pause");
    expect(workflowMocks.defineSignal).toHaveBeenCalledWith("resume");
    expect(workflowMocks.setHandler).toHaveBeenCalledTimes(2);
    expect(workflowMocks.runDirectAnalysis).toHaveBeenCalledWith("job_1", orchestration, "run_1");
  });

  it("waits at a safe checkpoint when pause is requested before the activity starts", async () => {
    let resumeHandler: (() => void) | undefined;
    workflowMocks.setHandler.mockImplementation((signalName: string, handler: () => void) => {
      if (signalName === "pause") {
        handler();
        return;
      }

      if (signalName === "resume") {
        resumeHandler = handler;
      }
    });
    workflowMocks.condition.mockImplementation(async (predicate: () => boolean) => {
      expect(predicate()).toBe(false);
      resumeHandler?.();
      expect(predicate()).toBe(true);
      return true;
    });

    await prefillJobWorkflow("job_1", orchestration, "run_1");

    expect(workflowMocks.condition).toHaveBeenCalledTimes(1);
    expect(workflowMocks.markWorkflowRunPaused).toHaveBeenCalledWith(
      "run_1",
      "Requested from workflow detail"
    );
    expect(workflowMocks.runDirectPrefill).toHaveBeenCalledWith("job_1", orchestration, "run_1");
  });
});
