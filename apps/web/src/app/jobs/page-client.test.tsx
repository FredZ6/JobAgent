// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import JobsPage from "./page-client";
import { fetchJobs, importJob } from "../../lib/api";
import { useRouter } from "next/navigation";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn()
}));

vi.mock("../../lib/api", () => ({
  fetchJobs: vi.fn(),
  importJob: vi.fn()
}));

const mockedUseRouter = vi.mocked(useRouter);
const mockedFetchJobs = vi.mocked(fetchJobs);
const mockedImportJob = vi.mocked(importJob);
const push = vi.fn();

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mockedUseRouter.mockReturnValue({ push } as never);
  mockedFetchJobs.mockReset();
  mockedImportJob.mockReset();
  push.mockReset();
  mockedFetchJobs.mockResolvedValue([
    {
      id: "job_live",
      sourceUrl: "https://jobs.example.com/live",
      applyUrl: "https://jobs.example.com/apply/live",
      title: "Platform Engineer",
      company: "Orbital",
      location: "Remote",
      description: "Build internal platforms.",
      rawText: "Build internal platforms.",
      importStatus: "imported",
      importSummary: {
        source: "live_html",
        warnings: [],
        hasWarnings: false,
        statusLabel: "Live import"
      },
      latestAnalysis: null,
      latestResumeVersion: null,
      createdAt: "2026-03-21T00:00:00.000Z",
      updatedAt: "2026-03-21T00:00:00.000Z"
    },
    {
      id: "job_warn",
      sourceUrl: "https://jobs.example.com/warn",
      applyUrl: "https://jobs.example.com/apply/warn",
      title: "Design Systems Engineer",
      company: "Orbital",
      location: "Remote",
      description: "Own the design systems platform.",
      rawText: "Own the design systems platform.",
      importStatus: "imported",
      importSummary: {
        source: "live_html",
        warnings: ["used_body_text_fallback"],
        hasWarnings: true,
        statusLabel: "Live import · warnings"
      },
      latestAnalysis: null,
      latestResumeVersion: null,
      createdAt: "2026-03-21T00:00:00.000Z",
      updatedAt: "2026-03-21T00:00:00.000Z"
    },
    {
      id: "job_fallback",
      sourceUrl: "https://jobs.example.com/fallback",
      applyUrl: null,
      title: "Product Engineer",
      company: "Unknown company",
      location: "Remote / Unspecified",
      description: "Fallback content.",
      rawText: "Fallback content.",
      importStatus: "failed",
      importSummary: {
        source: "synthetic_fallback",
        warnings: ["fetch_failed"],
        hasWarnings: true,
        statusLabel: "Fallback import"
      },
      latestAnalysis: null,
      latestResumeVersion: null,
      createdAt: "2026-03-21T00:00:00.000Z",
      updatedAt: "2026-03-21T00:00:00.000Z"
    }
  ] as never);
});

describe("JobsPage importer quality hints", () => {
  it("shows the redesigned intake page with importer quality labels", async () => {
    render(<JobsPage />);

    await waitFor(() => {
      expect(mockedFetchJobs).toHaveBeenCalled();
    });

    expect(await screen.findByRole("heading", { name: /role intake/i })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: /case queue/i })).toBeInTheDocument();
    expect(await screen.findByText("Live import")).toBeInTheDocument();
    expect(screen.getByText("Live import · warnings")).toBeInTheDocument();
    expect(screen.getByText("Fallback import")).toBeInTheDocument();
  });
});
