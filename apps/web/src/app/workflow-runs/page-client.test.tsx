// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import WorkflowRunsPage from "./page-client";
import {
  bulkCancelWorkflowRuns,
  bulkRetryWorkflowRuns,
  fetchWorkflowRuns
} from "../../lib/api";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(),
  useSearchParams: vi.fn()
}));

vi.mock("../../lib/api", () => ({
  bulkCancelWorkflowRuns: vi.fn(),
  bulkRetryWorkflowRuns: vi.fn(),
  fetchWorkflowRuns: vi.fn()
}));

const mockedUsePathname = vi.mocked(usePathname);
const mockedUseRouter = vi.mocked(useRouter);
const mockedUseSearchParams = vi.mocked(useSearchParams);
const mockedFetchWorkflowRuns = vi.mocked(fetchWorkflowRuns);
const mockedBulkRetryWorkflowRuns = vi.mocked(bulkRetryWorkflowRuns);
const mockedBulkCancelWorkflowRuns = vi.mocked(bulkCancelWorkflowRuns);
const replace = vi.fn();

const workflowRunsResponse = {
  summary: {
    totalRuns: 1,
    queuedRuns: 0,
    runningRuns: 1,
    pausedRuns: 0,
    completedRuns: 0,
    failedRuns: 0,
    cancelledRuns: 0
  },
  pageInfo: {
    nextCursor: null,
    hasMore: false
  },
  runs: [
    {
      workflowRun: {
        id: "run_1",
        jobId: "job_1",
        retryOfRunId: null,
        applicationId: "app_1",
        resumeVersionId: "resume_1",
        kind: "prefill" as const,
        status: "running" as const,
        executionMode: "temporal" as const,
        workflowId: "prefill-job-job_1-123",
        workflowType: "prefillJobWorkflow",
        taskQueue: "rolecraft-analysis",
        startedAt: "2026-03-21T10:00:00.000Z",
        completedAt: null,
        pauseRequestedAt: null,
        pausedAt: null,
        pauseReason: null,
        resumeRequestedAt: null,
        errorMessage: null,
        createdAt: "2026-03-21T10:00:00.000Z",
        updatedAt: "2026-03-21T10:05:00.000Z"
      },
      job: {
        id: "job_1",
        title: "Platform Engineer",
        company: "Orbital"
      },
      application: {
        id: "app_1"
      },
      resumeVersion: {
        id: "resume_1"
      }
    }
  ]
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUsePathname.mockReturnValue("/workflow-runs");
  mockedUseRouter.mockReturnValue({ replace } as never);
  mockedUseSearchParams.mockReturnValue(new URLSearchParams() as never);
  mockedFetchWorkflowRuns.mockReset();
  mockedBulkRetryWorkflowRuns.mockReset();
  mockedBulkCancelWorkflowRuns.mockReset();
  replace.mockReset();
  mockedFetchWorkflowRuns.mockResolvedValue(workflowRunsResponse as never);
});

describe("WorkflowRunsPage shared workflow-run cards", () => {
  it("renders shared workflow-run cards with selection and drill-down links", async () => {
    const user = userEvent.setup();

    render(<WorkflowRunsPage />);

    await waitFor(() => {
      expect(mockedFetchWorkflowRuns).toHaveBeenCalledWith({
        cursor: undefined,
        executionMode: undefined,
        from: undefined,
        kind: undefined,
        limit: 20,
        q: undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
        status: undefined,
        to: undefined
      });
    });

    expect(await screen.findByRole("heading", { name: "Platform Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Orbital")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open run detail" })).toHaveAttribute(
      "href",
      "/workflow-runs/run_1"
    );
    expect(screen.getByRole("link", { name: "Open job" })).toHaveAttribute("href", "/jobs/job_1");
    expect(screen.getByRole("link", { name: "Open application" })).toHaveAttribute(
      "href",
      "/applications/app_1"
    );
    expect(screen.getByRole("link", { name: "Open resume" })).toHaveAttribute(
      "href",
      "/resume-versions/resume_1"
    );

    await user.click(screen.getByRole("checkbox"));

    expect(screen.getByText("1 runs selected")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Open selected run details" })).toBeInTheDocument();
  });
});
