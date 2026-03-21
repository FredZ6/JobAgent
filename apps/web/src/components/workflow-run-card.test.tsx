// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import type { WorkflowRun } from "@rolecraft/shared-types";

import { WorkflowRunCard } from "./workflow-run-card";

function buildRun(overrides: Partial<WorkflowRun> = {}): WorkflowRun {
  return {
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
    startedAt: "2026-03-21T10:00:00.000Z",
    completedAt: null,
    pauseRequestedAt: null,
    pausedAt: null,
    pauseReason: null,
    resumeRequestedAt: null,
    errorMessage: null,
    createdAt: "2026-03-21T10:00:00.000Z",
    updatedAt: "2026-03-21T10:05:00.000Z",
    ...overrides
  };
}

afterEach(() => {
  cleanup();
});

describe("WorkflowRunCard", () => {
  it("renders shared workflow-run metadata and action links", () => {
    render(
      <WorkflowRunCard
        run={buildRun()}
        title="Staff Platform Engineer"
        subtitle="Orbital"
        links={[
          { href: "/workflow-runs/run_1", label: "Open run detail" },
          { href: "/applications/app_1", label: "Open application" }
        ]}
      />
    );

    expect(screen.getByRole("heading", { name: "Staff Platform Engineer" })).toBeInTheDocument();
    expect(screen.getByText("Orbital")).toBeInTheDocument();
    expect(screen.queryByText("Queued", { selector: ".mini-pill" })).not.toBeInTheDocument();
    expect(screen.getByText("Running", { selector: ".mini-pill" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open run detail" })).toHaveAttribute(
      "href",
      "/workflow-runs/run_1"
    );
    expect(screen.getByRole("link", { name: "Open application" })).toHaveAttribute(
      "href",
      "/applications/app_1"
    );
    expect(screen.getAllByText(/safe cancellation point/i)).toHaveLength(2);
  });
});
