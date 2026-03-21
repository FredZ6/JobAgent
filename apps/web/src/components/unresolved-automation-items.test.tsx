// @vitest-environment jsdom

import "@testing-library/jest-dom/vitest";

import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { UnresolvedAutomationItems } from "./unresolved-automation-items";

const unresolvedItem = {
  id: "item_1",
  automationSessionId: "session_1",
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
  createdAt: "2026-03-21T09:00:00.000Z",
  updatedAt: "2026-03-21T09:00:00.000Z"
};

afterEach(() => {
  cleanup();
});

describe("UnresolvedAutomationItems", () => {
  it("shows action buttons for unresolved items and submits the chosen action with an optional note", async () => {
    const user = userEvent.setup();
    let resolveUpdate: ((value: typeof unresolvedItem & {
      status: "resolved";
      resolutionKind: "manual_answer";
      metadata: { note: string };
      resolvedAt: string;
      updatedAt: string;
    }) => void) | null = null;
    const onUpdateItem = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    render(
      <UnresolvedAutomationItems
        items={[unresolvedItem]}
        emptyCopy="Nothing to do."
        onUpdateItem={onUpdateItem}
      />
    );

    await user.type(screen.getByLabelText("Add note for Resume"), "Handled manually");
    await user.click(screen.getByRole("button", { name: "Mark resolved for Resume" }));

    await waitFor(() => {
      expect(onUpdateItem).toHaveBeenCalledWith("item_1", {
        status: "resolved",
        note: "Handled manually"
      });
    });

    expect(screen.getByDisplayValue("Handled manually")).toBeDisabled();

    resolveUpdate?.({
      ...unresolvedItem,
      status: "resolved",
      resolutionKind: "manual_answer",
      metadata: { note: "Handled manually" },
      resolvedAt: "2026-03-21T10:00:00.000Z",
      updatedAt: "2026-03-21T10:00:00.000Z"
    });
  });

  it("does not show action buttons for handled items", () => {
    render(
      <UnresolvedAutomationItems
        items={[
          {
            ...unresolvedItem,
            status: "ignored",
            resolutionKind: "skipped_by_user",
            resolvedAt: "2026-03-21T10:00:00.000Z"
          }
        ]}
        emptyCopy="Nothing to do."
        onUpdateItem={vi.fn()}
      />
    );

    expect(screen.queryByRole("button", { name: /Mark resolved/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Ignore/i })).not.toBeInTheDocument();
  });
});
