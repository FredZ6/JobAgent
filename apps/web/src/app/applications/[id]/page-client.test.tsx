// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import ApplicationReviewPage from "./page-client";
import {
  fetchApplication,
  fetchAutomationSessions,
  runPrefill,
  updateApplicationApproval,
  updateUnresolvedAutomationItem
} from "../../../lib/api";
import { useParams, useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn(),
  useRouter: vi.fn()
}));

vi.mock("../../../lib/api", () => ({
  fetchApplication: vi.fn(),
  fetchAutomationSessions: vi.fn(),
  runPrefill: vi.fn(),
  updateApplicationApproval: vi.fn(),
  updateUnresolvedAutomationItem: vi.fn()
}));

const mockedUseParams = vi.mocked(useParams);
const mockedUseRouter = vi.mocked(useRouter);
const mockedFetchApplication = vi.mocked(fetchApplication);
const mockedFetchAutomationSessions = vi.mocked(fetchAutomationSessions);
const mockedRunPrefill = vi.mocked(runPrefill);
const mockedUpdateApplicationApproval = vi.mocked(updateApplicationApproval);
const mockedUpdateUnresolvedAutomationItem = vi.mocked(updateUnresolvedAutomationItem);
const push = vi.fn();

const applicationContext = {
  application: {
    id: "app_1",
    jobId: "job_1",
    resumeVersionId: "resume_1",
    status: "completed" as const,
    approvalStatus: "pending_review" as const,
    applyUrl: "https://apply.example.com",
    formSnapshot: {},
    fieldResults: [],
    screenshotPaths: [],
    workerLog: [],
    submissionStatus: "not_ready" as const,
    submittedAt: null,
    submissionNote: "",
    submittedByUser: false,
    finalSubmissionSnapshot: null,
    reviewNote: "",
    errorMessage: null,
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T09:05:00.000Z",
    latestAutomationSession: null
  },
  job: {
    id: "job_1",
    title: "Platform Engineer",
    company: "Orbital",
    applyUrl: "https://apply.example.com"
  },
  resumeVersion: {
    id: "resume_1",
    headline: "Platform Engineer resume",
    status: "completed"
  },
  latestAutomationSession: null,
  unresolvedItems: [
    {
      id: "unresolved_1",
      automationSessionId: "session_latest",
      applicationId: "app_1",
      fieldName: "resume",
      fieldLabel: "Resume",
      fieldType: "resume_upload" as const,
      questionText: null,
      status: "unresolved" as const,
      resolutionKind: null,
      failureReason: "resume upload control not found",
      source: "resume_pdf",
      suggestedValue: "resume.pdf",
      metadata: {},
      resolvedAt: null,
      createdAt: "2026-03-20T09:03:00.000Z",
      updatedAt: "2026-03-20T09:03:00.000Z"
    }
  ]
};

const automationSessions = [
  {
    id: "session_old",
    applicationId: "app_1",
    workflowRunId: "run_old",
    resumeVersionId: "resume_1",
    kind: "prefill",
    status: "running" as const,
    applyUrl: "https://apply.example.com",
    formSnapshot: {},
    fieldResults: [],
    screenshotPaths: [],
    workerLog: [],
    errorMessage: null,
    startedAt: "2026-03-20T08:00:00.000Z",
    completedAt: null,
    createdAt: "2026-03-20T08:00:00.000Z",
    updatedAt: "2026-03-20T08:10:00.000Z"
  },
  {
    id: "session_latest",
    applicationId: "app_1",
    workflowRunId: "run_latest",
    resumeVersionId: "resume_1",
    kind: "prefill",
    status: "completed" as const,
    applyUrl: "https://apply.example.com",
    formSnapshot: {},
    fieldResults: [],
    screenshotPaths: [],
    workerLog: [],
    errorMessage: null,
    startedAt: "2026-03-20T09:00:00.000Z",
    completedAt: "2026-03-20T09:05:00.000Z",
    createdAt: "2026-03-20T09:00:00.000Z",
    updatedAt: "2026-03-20T09:05:00.000Z"
  }
];

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUseParams.mockReturnValue({ id: "app_1" } as never);
  mockedUseRouter.mockReturnValue({ push } as never);
  mockedFetchApplication.mockReset();
  mockedFetchAutomationSessions.mockReset();
  mockedRunPrefill.mockReset();
  mockedUpdateApplicationApproval.mockReset();
  mockedUpdateUnresolvedAutomationItem.mockReset();
  push.mockReset();
  mockedFetchApplication.mockResolvedValue(applicationContext);
  mockedFetchAutomationSessions.mockResolvedValue(automationSessions);
  mockedRunPrefill.mockResolvedValue(applicationContext);
  mockedUpdateApplicationApproval.mockResolvedValue(applicationContext);
  mockedUpdateUnresolvedAutomationItem.mockResolvedValue({
    ...applicationContext.unresolvedItems[0],
    status: "resolved",
    resolutionKind: "manual_answer",
    metadata: { note: "Handled manually" },
    resolvedAt: "2026-03-20T09:10:00.000Z",
    updatedAt: "2026-03-20T09:10:00.000Z"
  });
});

describe("ApplicationReviewPage automation session history", () => {
  it("loads automation sessions and renders the full session browser", async () => {
    render(<ApplicationReviewPage />);

    await waitFor(() => {
      expect(mockedFetchApplication).toHaveBeenCalledWith("app_1");
      expect(mockedFetchAutomationSessions).toHaveBeenCalledWith("app_1");
    });

    expect(await screen.findByRole("heading", { name: "Automation sessions" })).toBeInTheDocument();
    expect(await screen.findByText("Workflow run: run_latest")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "View details for session_old" })).toBeInTheDocument();
    expect(document.querySelector("#automation-sessions")).toBeInTheDocument();
  });

  it("keeps the approval and evidence areas intact alongside the session history", async () => {
    render(<ApplicationReviewPage />);

    expect(await screen.findByRole("heading", { name: "What the worker tried to fill" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Automation sessions" })).toBeInTheDocument();
  });

  it("shows a manual follow-up section when unresolved items are present", async () => {
    render(<ApplicationReviewPage />);

    expect(await screen.findByRole("heading", { name: "Needs attention" })).toBeInTheDocument();
    expect(screen.getByText("resume upload control not found")).toBeInTheDocument();
  });

  it("lets the reviewer mark an unresolved item as resolved without reloading the page", async () => {
    const user = userEvent.setup();

    render(<ApplicationReviewPage />);

    await screen.findByRole("heading", { name: "Needs attention" });
    await user.type(screen.getByLabelText("Add note for Resume"), "Handled manually");
    await user.click(screen.getByRole("button", { name: "Mark resolved for Resume" }));

    await waitFor(() => {
      expect(mockedUpdateUnresolvedAutomationItem).toHaveBeenCalledWith("app_1", "unresolved_1", {
        status: "resolved",
        note: "Handled manually"
      });
    });

    expect(screen.getByText("resolved")).toBeInTheDocument();
  });
});
