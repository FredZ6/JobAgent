// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkflowRunDetailPage from "./page-client";
import {
  cancelWorkflowRun,
  fetchWorkflowRun,
  fetchWorkflowRunEvents,
  retryWorkflowRun
} from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn()
}));

vi.mock("../../../lib/api", () => ({
  cancelWorkflowRun: vi.fn(),
  fetchWorkflowRun: vi.fn(),
  fetchWorkflowRunEvents: vi.fn(),
  pauseWorkflowRun: vi.fn(),
  resumeWorkflowRun: vi.fn(),
  retryWorkflowRun: vi.fn()
}));

const mockedUseParams = vi.mocked(useParams);
const mockedUseRouter = vi.mocked(useRouter);
const mockedFetchWorkflowRun = vi.mocked(fetchWorkflowRun);
const mockedFetchWorkflowRunEvents = vi.mocked(fetchWorkflowRunEvents);
const mockedRetryWorkflowRun = vi.mocked(retryWorkflowRun);
const mockedCancelWorkflowRun = vi.mocked(cancelWorkflowRun);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUseParams.mockReturnValue({ id: "run_1" } as never);
  mockedUseRouter.mockReturnValue({ push: vi.fn() } as never);
  mockedFetchWorkflowRun.mockReset();
  mockedFetchWorkflowRunEvents.mockReset();
  mockedRetryWorkflowRun.mockReset();
  mockedCancelWorkflowRun.mockReset();
  mockedFetchWorkflowRunEvents.mockResolvedValue([]);
});

describe("WorkflowRunDetailPage pause/resume controls", () => {
  it("shows Pause run for active Temporal runs", async () => {
    mockedFetchWorkflowRun.mockResolvedValue({
      workflowRun: {
        id: "run_1",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "prefill",
        status: "running",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: "2026-03-20T09:00:00.000Z",
        completedAt: null,
        errorMessage: null,
        createdAt: "2026-03-20T09:00:00.000Z",
        updatedAt: "2026-03-20T09:00:30.000Z"
      },
      job: {
        id: "job_1",
        title: "Platform Engineer",
        company: "Orbital"
      },
      application: null,
      resumeVersion: null,
      retryOfRun: null,
      latestRetry: null
    });

    render(<WorkflowRunDetailPage />);

    await waitFor(() => {
      expect(mockedFetchWorkflowRun).toHaveBeenCalledWith("run_1");
    });

    expect(await screen.findByRole("button", { name: "Pause run" })).toBeInTheDocument();
  });

  it("shows Resume run for paused Temporal runs", async () => {
    mockedFetchWorkflowRun.mockResolvedValue({
      workflowRun: {
        id: "run_1",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: null,
        resumeVersionId: null,
        kind: "prefill",
        status: "paused",
        executionMode: "temporal",
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: "2026-03-20T09:00:00.000Z",
        completedAt: null,
        pauseRequestedAt: "2026-03-20T09:01:00.000Z",
        pausedAt: "2026-03-20T09:01:05.000Z",
        pauseReason: "Requested from workflow detail",
        resumeRequestedAt: null,
        errorMessage: null,
        createdAt: "2026-03-20T09:00:00.000Z",
        updatedAt: "2026-03-20T09:01:05.000Z"
      },
      job: {
        id: "job_1",
        title: "Platform Engineer",
        company: "Orbital"
      },
      application: null,
      resumeVersion: null,
      retryOfRun: null,
      latestRetry: null
    } as any);

    render(<WorkflowRunDetailPage />);

    expect(await screen.findByRole("button", { name: "Resume run" })).toBeInTheDocument();
  });
});
