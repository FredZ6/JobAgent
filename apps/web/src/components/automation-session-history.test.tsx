// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as automationSessionHelpers from "../lib/automation-session";
import { AutomationSessionHistory } from "./automation-session-history";

const compareAutomationSessionsSpy = vi.spyOn(automationSessionHelpers, "compareAutomationSessions");

const sessions = [
  {
    id: "session_old",
    applicationId: "app_1",
    workflowRunId: "run_old",
    resumeVersionId: "resume_1",
    kind: "prefill",
    status: "running" as const,
    applyUrl: "https://apply.example.com",
    formSnapshot: {},
    fieldResults: [
      {
        fieldName: "email",
        fieldType: "basic_text" as const,
        suggestedValue: "ada@example.com",
        filled: true,
        status: "filled" as const,
        source: "profile"
      }
    ],
    screenshotPaths: ["old-1.png"],
    workerLog: [{ level: "info" as const, message: "started" }],
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
    fieldResults: [
      {
        fieldName: "email",
        fieldType: "basic_text" as const,
        suggestedValue: "ada@example.com",
        filled: true,
        status: "filled" as const,
        source: "profile"
      },
      {
        fieldName: "why_company",
        fieldType: "long_text" as const,
        questionText: "Why do you want to work here?",
        suggestedValue: "I enjoy building practical internal platforms.",
        filled: false,
        status: "failed" as const,
        source: "llm_generated",
        failureReason: "field detached"
      }
    ],
    screenshotPaths: ["latest-1.png", "latest-2.png"],
    workerLog: [
      { level: "info" as const, message: "started" },
      { level: "info" as const, message: "completed" }
    ],
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
  compareAutomationSessionsSpy.mockClear();
});

describe("AutomationSessionHistory", () => {
  it("defaults to the latest session and exposes log and screenshot entry points", () => {
    render(
      <AutomationSessionHistory
        sessions={sessions}
        emptyCopy="No session history yet."
      />
    );

    expect(screen.getByText("Workflow run: run_latest")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open worker logs" })).toHaveAttribute(
      "href",
      "#automation-session-session_latest-logs"
    );
    expect(screen.getByRole("link", { name: "Open screenshots" })).toHaveAttribute(
      "href",
      "#automation-session-session_latest-screenshots"
    );
  });

  it("switches the detail panel when a different session is selected", async () => {
    const user = userEvent.setup();

    render(
      <AutomationSessionHistory
        sessions={sessions}
        emptyCopy="No session history yet."
      />
    );

    await user.click(screen.getByRole("button", { name: "View details for session_old" }));

    expect(screen.getByText("Workflow run: run_old")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open worker logs" })).toHaveAttribute(
      "href",
      "#automation-session-session_old-logs"
    );
    expect(screen.getByRole("link", { name: "Open screenshots" })).toHaveAttribute(
      "href",
      "#automation-session-session_old-screenshots"
    );
  });

  it("switches to compare mode when two sessions are selected", async () => {
    const user = userEvent.setup();

    render(
      <AutomationSessionHistory
        sessions={sessions}
        emptyCopy="No session history yet."
      />
    );

    await user.click(screen.getByRole("checkbox", { name: "Compare session session_latest" }));
    await user.click(screen.getByRole("checkbox", { name: "Compare session session_old" }));

    expect(compareAutomationSessionsSpy).toHaveBeenCalledWith(sessions[1], sessions[0]);
    expect(screen.getByText("Compare sessions")).toBeInTheDocument();
    expect(screen.getByText("Latest session")).toBeInTheDocument();
    expect(screen.getByText("Previous session")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Open latest worker logs" })).toHaveAttribute(
      "href",
      "#automation-session-session_latest-logs"
    );
    expect(screen.getByRole("link", { name: "Open previous worker logs" })).toHaveAttribute(
      "href",
      "#automation-session-session_old-logs"
    );
    expect(screen.getAllByRole("link", { name: /Open .* screenshots/ })).toHaveLength(2);
  });
});
