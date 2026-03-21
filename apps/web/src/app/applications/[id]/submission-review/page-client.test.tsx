// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SubmissionReviewPage from "./page-client";
import {
  fetchApplicationEvents,
  fetchSubmissionReview,
  updateUnresolvedAutomationItem
} from "../../../../lib/api";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn()
}));

vi.mock("../../../../lib/api", () => ({
  buildResumePdfUrl: (id: string) => `/resume-versions/${id}/pdf`,
  fetchApplicationEvents: vi.fn(),
  fetchSubmissionReview: vi.fn(),
  markApplicationRetryReady: vi.fn(),
  markApplicationSubmitFailed: vi.fn(),
  markApplicationSubmitted: vi.fn(),
  reopenApplicationSubmission: vi.fn(),
  updateUnresolvedAutomationItem: vi.fn()
}));

const mockedUseParams = vi.mocked(useParams);
const mockedFetchApplicationEvents = vi.mocked(fetchApplicationEvents);
const mockedFetchSubmissionReview = vi.mocked(fetchSubmissionReview);
const mockedUpdateUnresolvedAutomationItem = vi.mocked(updateUnresolvedAutomationItem);

const submissionReview = {
  application: {
    id: "app_1",
    jobId: "job_1",
    resumeVersionId: "resume_1",
    status: "completed" as const,
    approvalStatus: "approved_for_submit" as const,
    applyUrl: "https://apply.example.com",
    formSnapshot: {},
    fieldResults: [],
    screenshotPaths: [],
    workerLog: [],
    submissionStatus: "ready_to_submit" as const,
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
  latestAutomationSession: {
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
  },
  unresolvedItems: [
    {
      id: "unresolved_1",
      automationSessionId: "session_latest",
      applicationId: "app_1",
      fieldName: "why_company",
      fieldLabel: "Why do you want to work here?",
      fieldType: "long_text" as const,
      questionText: "Why do you want to work here?",
      status: "unresolved" as const,
      resolutionKind: null,
      failureReason: "high-risk question requires saved default answer",
      source: "manual_review_required",
      suggestedValue: null,
      metadata: {},
      resolvedAt: null,
      createdAt: "2026-03-20T09:03:00.000Z",
      updatedAt: "2026-03-20T09:03:00.000Z"
    }
  ],
  unresolvedFieldCount: 0,
  failedFieldCount: 0
};

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUseParams.mockReturnValue({ id: "app_1" } as never);
  mockedFetchSubmissionReview.mockReset();
  mockedFetchApplicationEvents.mockReset();
  mockedUpdateUnresolvedAutomationItem.mockReset();
  mockedFetchSubmissionReview.mockResolvedValue(submissionReview);
  mockedFetchApplicationEvents.mockResolvedValue([]);
  mockedUpdateUnresolvedAutomationItem.mockResolvedValue({
    ...submissionReview.unresolvedItems[0],
    status: "ignored",
    resolutionKind: "skipped_by_user",
    metadata: { note: "Handled in review" },
    resolvedAt: "2026-03-20T09:10:00.000Z",
    updatedAt: "2026-03-20T09:10:00.000Z"
  });
});

describe("SubmissionReviewPage automation session navigation", () => {
  it("keeps the latest session summary lightweight and links to the full history", async () => {
    render(<SubmissionReviewPage />);

    await waitFor(() => {
      expect(mockedFetchSubmissionReview).toHaveBeenCalledWith("app_1");
      expect(mockedFetchApplicationEvents).toHaveBeenCalledWith("app_1", { limit: 20 });
    });

    expect(await screen.findByText("Workflow run: run_latest")).toBeInTheDocument();
    const fullHistoryLink = screen.getByRole("link", { name: "Open full automation history" });

    expect(fullHistoryLink).toHaveAttribute("href", "/applications/app_1#automation-sessions");
  });

  it("shows the unresolved follow-up queue when review still needs manual work", async () => {
    render(<SubmissionReviewPage />);

    expect(await screen.findByRole("heading", { name: "Needs attention" })).toBeInTheDocument();
    expect(screen.getByText("high-risk question requires saved default answer")).toBeInTheDocument();
  });

  it("lets submission review ignore an unresolved item in place", async () => {
    const user = userEvent.setup();

    render(<SubmissionReviewPage />);

    await screen.findByRole("heading", { name: "Needs attention" });
    await user.type(
      screen.getByLabelText("Add note for Why do you want to work here?"),
      "Handled in review"
    );
    await user.click(screen.getByRole("button", { name: "Ignore for Why do you want to work here?" }));

    await waitFor(() => {
      expect(mockedUpdateUnresolvedAutomationItem).toHaveBeenCalledWith("app_1", "unresolved_1", {
        status: "ignored",
        note: "Handled in review"
      });
    });

    expect(screen.getByText("ignored")).toBeInTheDocument();
  });
});
