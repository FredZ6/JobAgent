// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobDetailPage from "./page-client";
import {
  analyzeJob,
  buildResumePdfUrl,
  cancelWorkflowRun,
  fetchJob,
  fetchJobApplications,
  fetchJobWorkflowRuns,
  generateResume,
  retryWorkflowRun,
  runPrefill
} from "../../../lib/api";
import { useParams } from "next/navigation";

vi.mock("next/navigation", () => ({
  useParams: vi.fn()
}));

vi.mock("../../../lib/api", () => ({
  analyzeJob: vi.fn(),
  buildResumePdfUrl: vi.fn(),
  cancelWorkflowRun: vi.fn(),
  fetchJob: vi.fn(),
  fetchJobApplications: vi.fn(),
  fetchJobWorkflowRuns: vi.fn(),
  generateResume: vi.fn(),
  retryWorkflowRun: vi.fn(),
  runPrefill: vi.fn()
}));

const mockedUseParams = vi.mocked(useParams);
const mockedFetchJob = vi.mocked(fetchJob);
const mockedFetchJobApplications = vi.mocked(fetchJobApplications);
const mockedFetchJobWorkflowRuns = vi.mocked(fetchJobWorkflowRuns);
const mockedAnalyzeJob = vi.mocked(analyzeJob);
const mockedGenerateResume = vi.mocked(generateResume);
const mockedRunPrefill = vi.mocked(runPrefill);
const mockedRetryWorkflowRun = vi.mocked(retryWorkflowRun);
const mockedCancelWorkflowRun = vi.mocked(cancelWorkflowRun);
const mockedBuildResumePdfUrl = vi.mocked(buildResumePdfUrl);

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUseParams.mockReturnValue({ id: "job_1" } as never);
  mockedFetchJob.mockReset();
  mockedFetchJobApplications.mockReset();
  mockedFetchJobWorkflowRuns.mockReset();
  mockedAnalyzeJob.mockReset();
  mockedGenerateResume.mockReset();
  mockedRunPrefill.mockReset();
  mockedRetryWorkflowRun.mockReset();
  mockedCancelWorkflowRun.mockReset();
  mockedBuildResumePdfUrl.mockReset();

  mockedFetchJob.mockResolvedValue({
    id: "job_1",
    title: "Platform Engineer",
    company: "Orbital",
    location: "Remote",
    description: "Build internal platforms for product teams.",
    sourceUrl: "https://jobs.example.com/platform",
    applyUrl: "https://apply.example.com/platform",
    importStatus: "imported",
    importSummary: {
      source: "live_html",
      warnings: ["apply_url_not_detected"],
      hasWarnings: true,
      statusLabel: "Live import · warnings"
    },
    importDiagnostics: {
      fetchStatus: 200,
      usedJsonLd: true,
      usedBodyFallback: false,
      titleSource: "og:title",
      companySource: "json_ld",
      descriptionSource: "json_ld",
      applyUrlSource: "source_url"
    },
    analyses: [],
    resumeVersions: []
  } as never);
  mockedFetchJobApplications.mockResolvedValue([]);
  mockedFetchJobWorkflowRuns.mockResolvedValue([
    {
      id: "run_failed",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: "app_1",
      resumeVersionId: null,
      kind: "prefill",
      status: "failed",
      executionMode: "temporal",
      workflowId: "prefill-job-job_1-failed",
      workflowType: "prefillJobWorkflow",
      taskQueue: "rolecraft-analysis",
      startedAt: "2026-03-21T10:00:00.000Z",
      completedAt: "2026-03-21T10:01:00.000Z",
      pauseRequestedAt: null,
      pausedAt: null,
      pauseReason: null,
      resumeRequestedAt: null,
      errorMessage: "Resume upload control not found.",
      createdAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T10:01:00.000Z"
    },
    {
      id: "run_running",
      jobId: "job_1",
      retryOfRunId: null,
      applicationId: null,
      resumeVersionId: "resume_1",
      kind: "generate_resume",
      status: "running",
      executionMode: "direct",
      workflowId: null,
      workflowType: null,
      taskQueue: null,
      startedAt: "2026-03-21T10:02:00.000Z",
      completedAt: null,
      pauseRequestedAt: null,
      pausedAt: null,
      pauseReason: null,
      resumeRequestedAt: null,
      errorMessage: null,
      createdAt: "2026-03-21T10:02:00.000Z",
      updatedAt: "2026-03-21T10:02:30.000Z"
    }
  ] as never);
  mockedBuildResumePdfUrl.mockReturnValue("http://localhost:3001/resume-versions/resume_1/pdf");
});

describe("JobDetailPage shared workflow-run cards", () => {
  it("renders importer quality details from the latest import event summary", async () => {
    render(<JobDetailPage />);

    await waitFor(() => {
      expect(mockedFetchJob).toHaveBeenCalledWith("job_1");
    });

    expect(await screen.findByRole("heading", { name: "Case file" })).toBeInTheDocument();
    const importQualityHeading = screen.getByRole("heading", { name: "Import quality" });
    expect(importQualityHeading).toBeInTheDocument();
    const importQualityPanel = importQualityHeading.closest("section");

    expect(importQualityPanel).not.toBeNull();

    const importQuality = within(importQualityPanel as HTMLElement);
    expect(importQuality.getByText("Live import · warnings")).toBeInTheDocument();
    expect(importQuality.getByText("Apply URL not detected")).toBeInTheDocument();
    expect(importQuality.getByText("Title source: og:title")).toBeInTheDocument();
    expect(importQuality.getByText("Company source: json_ld")).toBeInTheDocument();
    expect(importQuality.getByText("Description source: json_ld")).toBeInTheDocument();
    expect(importQuality.getByText("Apply URL source: source_url")).toBeInTheDocument();
    expect(importQuality.getByText("Used JSON-LD: yes")).toBeInTheDocument();
  });

  it("renders workflow-run cards with retry and cancel controls intact", async () => {
    render(<JobDetailPage />);

    await waitFor(() => {
      expect(mockedFetchJob).toHaveBeenCalledWith("job_1");
      expect(mockedFetchJobApplications).toHaveBeenCalledWith("job_1");
      expect(mockedFetchJobWorkflowRuns).toHaveBeenCalledWith("job_1");
    });

    expect(await screen.findByRole("heading", { name: "Execution ledger" })).toBeInTheDocument();
    expect(screen.getAllByRole("link", { name: "Open run detail" })).toHaveLength(2);
    expect(screen.getByRole("link", { name: "Open application run" })).toHaveAttribute(
      "href",
      "/applications/app_1"
    );
    expect(screen.getByRole("link", { name: "Open resume version" })).toHaveAttribute(
      "href",
      "/resume-versions/resume_1"
    );
    expect(screen.getByRole("button", { name: "Retry failed run" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel run" })).toBeInTheDocument();
  });
});
