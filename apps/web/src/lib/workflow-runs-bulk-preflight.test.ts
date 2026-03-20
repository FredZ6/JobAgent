import { describe, expect, it } from "vitest";

import { buildWorkflowRunsBulkPreflight } from "./workflow-runs-bulk-preflight";

describe("workflow-runs-bulk-preflight", () => {
  const loadedRuns = [
    {
      workflowRun: {
        id: "run-failed",
        kind: "prefill" as const,
        status: "failed" as const,
        executionMode: "direct" as const,
        workflowId: null,
        workflowType: null,
        taskQueue: null,
        retryOfRunId: null,
        jobId: "job-1",
        applicationId: "app-1",
        resumeVersionId: null,
        errorMessage: "worker failed",
        startedAt: "2026-03-18T10:00:00.000Z",
        completedAt: "2026-03-18T10:01:00.000Z",
        createdAt: "2026-03-18T10:00:00.000Z",
        updatedAt: "2026-03-18T10:01:00.000Z"
      },
      job: {
        id: "job-1",
        title: "Staff Platform Engineer",
        company: "Rolecraft"
      },
      application: {
        id: "app-1",
        status: "failed" as const
      },
      resumeVersion: null
    },
    {
      workflowRun: {
        id: "run-completed",
        kind: "analyze" as const,
        status: "completed" as const,
        executionMode: "direct" as const,
        workflowId: null,
        workflowType: null,
        taskQueue: null,
        retryOfRunId: null,
        jobId: "job-2",
        applicationId: null,
        resumeVersionId: null,
        errorMessage: null,
        startedAt: "2026-03-18T09:00:00.000Z",
        completedAt: "2026-03-18T09:01:00.000Z",
        createdAt: "2026-03-18T09:00:00.000Z",
        updatedAt: "2026-03-18T09:01:00.000Z"
      },
      job: {
        id: "job-2",
        title: "Backend Engineer",
        company: "Rolecraft"
      },
      application: null,
      resumeVersion: null
    },
    {
      workflowRun: {
        id: "run-queued-temporal",
        kind: "analyze" as const,
        status: "queued" as const,
        executionMode: "temporal" as const,
        workflowId: "wf-1",
        workflowType: "AnalyzeJobWorkflow",
        taskQueue: "job-agent",
        retryOfRunId: null,
        jobId: "job-3",
        applicationId: null,
        resumeVersionId: null,
        errorMessage: null,
        startedAt: null,
        completedAt: null,
        createdAt: "2026-03-18T11:00:00.000Z",
        updatedAt: "2026-03-18T11:00:00.000Z"
      },
      job: {
        id: "job-3",
        title: "Infra Engineer",
        company: "Rolecraft"
      },
      application: null,
      resumeVersion: null
    }
  ];

  it("builds retry preflight with process and skip groups", () => {
    expect(
      buildWorkflowRunsBulkPreflight("retry", ["run-failed", "run-completed"], loadedRuns)
    ).toEqual({
      willProcess: [
        {
          runId: "run-failed",
          kind: "prefill",
          status: "failed",
          executionMode: "direct"
        }
      ],
      willSkip: [
        {
          runId: "run-completed",
          kind: "analyze",
          status: "completed",
          executionMode: "direct",
          reason: "Only failed workflow runs can be retried."
        }
      ]
    });
  });

  it("builds cancel preflight with queued temporal rows only", () => {
    expect(
      buildWorkflowRunsBulkPreflight(
        "cancel",
        ["run-queued-temporal", "run-failed", "run-completed"],
        loadedRuns
      )
    ).toEqual({
      willProcess: [
        {
          runId: "run-queued-temporal",
          kind: "analyze",
          status: "queued",
          executionMode: "temporal"
        }
      ],
      willSkip: [
        {
          runId: "run-failed",
          kind: "prefill",
          status: "failed",
          executionMode: "direct",
          reason: "Only queued Temporal workflow runs can be cancelled."
        },
        {
          runId: "run-completed",
          kind: "analyze",
          status: "completed",
          executionMode: "direct",
          reason: "Only queued Temporal workflow runs can be cancelled."
        }
      ]
    });
  });
});
