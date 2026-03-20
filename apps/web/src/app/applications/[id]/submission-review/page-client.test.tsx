// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import SubmissionReviewPage from "./page-client";
import { fetchApplicationEvents, fetchSubmissionReview } from "../../../../lib/api";
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
  reopenApplicationSubmission: vi.fn()
}));

const mockedUseParams = vi.mocked(useParams);
const mockedFetchApplicationEvents = vi.mocked(fetchApplicationEvents);
const mockedFetchSubmissionReview = vi.mocked(fetchSubmissionReview);

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
  mockedFetchSubmissionReview.mockResolvedValue(submissionReview);
  mockedFetchApplicationEvents.mockResolvedValue([]);
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
});
