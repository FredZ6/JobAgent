import React from "react";
import type { AutomationSession } from "@rolecraft/shared-types";

import {
  getAutomationSessionPhaseLabel,
  summarizeAutomationSessionEvidence
} from "../lib/automation-session";

function formatTimestamp(value: string | null) {
  if (!value) {
    return null;
  }

  return new Date(value).toLocaleString();
}

export function AutomationSessionSummary(props: {
  session: AutomationSession | null;
  emptyCopy: string;
  title?: string;
}) {
  const { session, emptyCopy, title = "Latest automation session" } = props;

  if (!session) {
    return <div className="inline-note">{emptyCopy}</div>;
  }

  const summary = summarizeAutomationSessionEvidence(session);
  const startedLabel = formatTimestamp(session.startedAt ?? session.createdAt);
  const completedLabel = formatTimestamp(session.completedAt);

  return (
    <div className="stack">
      <div className="field-result-row">
        <strong>{title}</strong>
        <div className="pill-row">
          <span className="mini-pill">{session.status}</span>
          <span className="mini-pill">{session.kind}</span>
          <span className="mini-pill">{getAutomationSessionPhaseLabel(session)}</span>
        </div>
      </div>
      <p className="muted">
        Started: {startedLabel ?? "not recorded"} · Completed: {completedLabel ?? "still in progress"}
      </p>
      <div className="field-grid">
        <div className="application-field">
          <div className="field-result-row">
            <strong>Filled</strong>
            <span className="mini-pill">{summary.filled}</span>
          </div>
        </div>
        <div className="application-field">
          <div className="field-result-row">
            <strong>Failed</strong>
            <span className="mini-pill">{summary.failed}</span>
          </div>
        </div>
        <div className="application-field">
          <div className="field-result-row">
            <strong>Unresolved</strong>
            <span className="mini-pill">{summary.unresolved}</span>
          </div>
        </div>
        <div className="application-field">
          <div className="field-result-row">
            <strong>Screenshots</strong>
            <span className="mini-pill">{summary.screenshotCount}</span>
          </div>
        </div>
        <div className="application-field">
          <div className="field-result-row">
            <strong>Worker logs</strong>
            <span className="mini-pill">{summary.logCount}</span>
          </div>
        </div>
      </div>
      {session.workflowRunId ? <p className="muted">Workflow run: {session.workflowRunId}</p> : null}
      {session.resumeVersionId ? <p className="muted">Resume version: {session.resumeVersionId}</p> : null}
      {session.errorMessage ? <p className="error-text">Latest automation error: {session.errorMessage}</p> : null}
    </div>
  );
}
