"use client";

import Image from "next/image";
import React, { useMemo, useState } from "react";
import type { AutomationSession } from "@rolecraft/shared-types";

import { buildApplicationScreenshotUrl } from "../lib/api";
import {
  filterAutomationSessions,
  type AutomationSessionAttentionFilter,
  type AutomationSessionFilterState,
  type AutomationSessionStatusFilter,
  compareAutomationSessions,
  getAutomationSessionPhaseLabel,
  summarizeAutomationSessionEvidence
} from "../lib/automation-session";
import { AutomationSessionSummary } from "./automation-session-summary";

type AutomationSessionHistoryProps = {
  sessions: AutomationSession[];
  emptyCopy: string;
};

type AutomationSessionPair = {
  latest: AutomationSession;
  previous: AutomationSession;
};

const defaultFilters: AutomationSessionFilterState = {
  query: "",
  status: "all",
  attention: "all"
};

const statusOptions: Array<{ value: AutomationSessionStatusFilter; label: string }> = [
  { value: "all", label: "All statuses" },
  { value: "completed", label: "Completed" },
  { value: "running", label: "Running" },
  { value: "queued", label: "Queued" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" }
];

const attentionOptions: Array<{ value: AutomationSessionAttentionFilter; label: string }> = [
  { value: "all", label: "All sessions" },
  { value: "has_failures", label: "Has failures" },
  { value: "has_unresolved", label: "Has unresolved" },
  { value: "has_screenshots", label: "Has screenshots" },
  { value: "has_worker_logs", label: "Has worker logs" }
];

function formatTimestamp(value: string | null) {
  if (!value) {
    return "not recorded";
  }

  return new Date(value).toLocaleString();
}

function formatDelta(value: number) {
  if (value > 0) {
    return `+${value}`;
  }

  return String(value);
}

function sortSessionsByRecency(sessions: AutomationSession[]) {
  return [...sessions].sort((left, right) => {
    const leftTime = new Date(left.createdAt).getTime();
    const rightTime = new Date(right.createdAt).getTime();

    if (leftTime !== rightTime) {
      return rightTime - leftTime;
    }

    return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
  });
}

function getSelectedPair(sessionIds: string[], sessions: AutomationSession[]): AutomationSessionPair | null {
  if (sessionIds.length !== 2) {
    return null;
  }

  const selectedSessions = sessionIds
    .map((sessionId) => sessions.find((session) => session.id === sessionId))
    .filter((session): session is AutomationSession => Boolean(session));

  if (selectedSessions.length !== 2) {
    return null;
  }

  const [first, second] = selectedSessions;
  const firstTime = new Date(first.createdAt).getTime();
  const secondTime = new Date(second.createdAt).getTime();

  if (firstTime > secondTime) {
    return { latest: first, previous: second };
  }

  if (secondTime > firstTime) {
    return { latest: second, previous: first };
  }

  return { latest: first, previous: second };
}

function SessionEvidenceBlock(props: {
  session: AutomationSession;
  title: string;
  logId: string;
  screenshotId: string;
  linkPrefix?: string;
}) {
  const { session, title, logId, screenshotId, linkPrefix } = props;
  const summary = summarizeAutomationSessionEvidence(session);
  const logLinkLabel = linkPrefix ? `Open ${linkPrefix} worker logs` : "Open worker logs";
  const screenshotLinkLabel = linkPrefix ? `Open ${linkPrefix} screenshots` : "Open screenshots";

  return (
    <div className="stack">
      <AutomationSessionSummary session={session} emptyCopy="" title={title} />
      <div className="button-row">
        <a className="button button-secondary" href={`#${logId}`}>
          {logLinkLabel}
        </a>
        <a className="button button-secondary" href={`#${screenshotId}`}>
          {screenshotLinkLabel}
        </a>
      </div>
      <div id={logId} className="application-card">
        <div className="field-result-row">
          <strong>Worker logs</strong>
          <div className="pill-row">
            <span className="mini-pill">{summary.logCount}</span>
            <span className="mini-pill">{session.status}</span>
          </div>
        </div>
        {session.workerLog.length === 0 ? (
          <div className="inline-note">No worker log entries were captured.</div>
        ) : (
          <div className="stack">
            {session.workerLog.map((entry, index) => (
              <div key={`${session.id}-log-${index}`} className="log-entry">
                <div className="field-result-row">
                  <strong>{entry.level}</strong>
                  {entry.timestamp ? <span className="mini-pill">{formatTimestamp(entry.timestamp)}</span> : null}
                </div>
                <p className="panel-copy">{entry.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div id={screenshotId} className="application-card">
        <div className="field-result-row">
          <strong>Screenshots</strong>
          <div className="pill-row">
            <span className="mini-pill">{summary.screenshotCount}</span>
            <span className="mini-pill">{session.applicationId}</span>
          </div>
        </div>
        {session.screenshotPaths.length === 0 ? (
          <div className="inline-note">No screenshots were captured.</div>
        ) : (
          <div className="screenshot-grid">
            {session.screenshotPaths.map((screenshotPath) => {
              const filename = screenshotPath.split("/").filter(Boolean).at(-1) ?? screenshotPath;

              return (
                <div key={`${session.id}-${screenshotPath}`} className="screenshot-card">
                  <p className="panel-copy">{filename}</p>
                  <Image
                    src={buildApplicationScreenshotUrl(session.applicationId, screenshotPath)}
                    alt={`${title} screenshot ${filename}`}
                    className="screenshot-image"
                    width={1200}
                    height={900}
                    unoptimized
                    style={{ width: "100%", height: "auto" }}
                  />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function AutomationSessionHistory(props: AutomationSessionHistoryProps) {
  const { sessions, emptyCopy } = props;
  const orderedSessions = useMemo(() => sortSessionsByRecency(sessions), [sessions]);
  const [filters, setFilters] = useState<AutomationSessionFilterState>(defaultFilters);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [compareSessionIds, setCompareSessionIds] = useState<string[]>([]);
  const filteredSessions = useMemo(() => filterAutomationSessions(orderedSessions, filters), [orderedSessions, filters]);
  const hasActiveFilters =
    filters.query.trim().length > 0 || filters.status !== "all" || filters.attention !== "all";
  const visibleCompareSessionIds = useMemo(
    () =>
      compareSessionIds.filter((sessionId) =>
        filteredSessions.some((session) => session.id === sessionId)
      ),
    [compareSessionIds, filteredSessions]
  );
  const activeSelectedSessionId = useMemo(() => {
    if (filteredSessions.length === 0) {
      return "";
    }

    if (visibleCompareSessionIds.length === 1) {
      return visibleCompareSessionIds[0];
    }

    return filteredSessions.some((session) => session.id === selectedSessionId)
      ? selectedSessionId
      : filteredSessions[0].id;
  }, [filteredSessions, selectedSessionId, visibleCompareSessionIds]);
  const selectedSession =
    filteredSessions.find((session) => session.id === activeSelectedSessionId) ?? null;
  const selectedPair = getSelectedPair(visibleCompareSessionIds, filteredSessions);
  const comparison = selectedPair ? compareAutomationSessions(selectedPair.latest, selectedPair.previous) : null;

  function toggleCompare(sessionId: string) {
    setCompareSessionIds((current) => {
      if (current.includes(sessionId)) {
        return current.filter((value) => value !== sessionId);
      }

      if (current.length < 2) {
        return [...current, sessionId];
      }

      return [current[1], sessionId];
    });
  }

  if (orderedSessions.length === 0) {
    return <div className="inline-note">{emptyCopy}</div>;
  }

  return (
    <div className="stack">
      <div className="field-result-row">
        <strong>Automation sessions</strong>
        <div className="pill-row">
          <span className="mini-pill">{orderedSessions.length} sessions</span>
          {filteredSessions.length !== orderedSessions.length ? (
            <span className="mini-pill">{filteredSessions.length} shown</span>
          ) : null}
          {selectedSession ? <span className="mini-pill">Latest selected</span> : null}
        </div>
      </div>
      <p className="muted">
        Select one session to inspect it, or select two sessions to compare evidence side by side.
      </p>

      <div className="stack">
        <label className="stack" htmlFor="automation-session-search">
          <span className="muted">Search automation sessions</span>
          <input
            id="automation-session-search"
            type="search"
            className="field-input"
            aria-label="Search automation sessions"
            placeholder="Search run id, status, error, or log text"
            value={filters.query}
            onChange={(event) =>
              setFilters((current) => ({
                ...current,
                query: event.target.value
              }))
            }
          />
        </label>
        <div className="filter-row">
          <label className="stack" htmlFor="automation-session-status-filter">
            <span className="muted">Filter by status</span>
            <select
              id="automation-session-status-filter"
              className="field-input"
              aria-label="Filter by status"
              value={filters.status}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  status: event.target.value as AutomationSessionStatusFilter
                }))
              }
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack" htmlFor="automation-session-attention-filter">
            <span className="muted">Filter by attention</span>
            <select
              id="automation-session-attention-filter"
              className="field-input"
              aria-label="Filter by attention"
              value={filters.attention}
              onChange={(event) =>
                setFilters((current) => ({
                  ...current,
                  attention: event.target.value as AutomationSessionAttentionFilter
                }))
              }
            >
              {attentionOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      {filteredSessions.length === 0 ? (
        <div className="application-card">
          <div className="stack">
            <strong>No sessions match the current search or filters.</strong>
            <p className="muted">Try a broader query or clear the current filters to see the full history again.</p>
            {hasActiveFilters ? (
              <div className="button-row">
                <button className="button button-secondary" type="button" onClick={() => setFilters(defaultFilters)}>
                  Clear filters
                </button>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {filteredSessions.length > 0 ? (
        <div className="stack">
          {filteredSessions.map((session, index) => {
          const summary = summarizeAutomationSessionEvidence(session);
          const isSelected =
            session.id === activeSelectedSessionId || visibleCompareSessionIds.includes(session.id);

          return (
            <div key={session.id} className={`application-card ${isSelected ? "featured" : ""}`.trim()}>
              <div className="field-result-row">
                <strong>Session {index + 1}</strong>
                <div className="pill-row">
                  <span className="mini-pill">{session.status}</span>
                  <span className="mini-pill">{getAutomationSessionPhaseLabel(session)}</span>
                  {index === 0 ? <span className="mini-pill">Latest</span> : null}
                </div>
              </div>
              <p className="muted">
                Started {formatTimestamp(session.startedAt ?? session.createdAt)} · completed{" "}
                {formatTimestamp(session.completedAt)}
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
              <div className="button-row">
                <button
                  className="button button-secondary"
                  type="button"
                  onClick={() => setSelectedSessionId(session.id)}
                >
                  View details for {session.id}
                </button>
                <label className="selection-row">
                  <input
                    type="checkbox"
                    className="selection-checkbox"
                    checked={visibleCompareSessionIds.includes(session.id)}
                    onChange={() => toggleCompare(session.id)}
                    aria-label={`Compare session ${session.id}`}
                  />
                  <span>Compare</span>
                </label>
              </div>
            </div>
          );
          })}
        </div>
      ) : null}

      {comparison && selectedPair ? (
        <div className="stack">
          <div className="field-result-row">
            <strong>Compare sessions</strong>
            <div className="pill-row">
              <span className="mini-pill">{comparison.latestStatus}</span>
              <span className="mini-pill">{comparison.previousStatus}</span>
            </div>
          </div>
          <div className="comparison-grid">
            <div className="comparison-card">
              <strong>Filled delta</strong>
              <span className="mini-pill">{formatDelta(comparison.filledDelta)}</span>
            </div>
            <div className="comparison-card">
              <strong>Failed delta</strong>
              <span className="mini-pill">{formatDelta(comparison.failedDelta)}</span>
            </div>
            <div className="comparison-card">
              <strong>Unresolved delta</strong>
              <span className="mini-pill">{formatDelta(comparison.unresolvedDelta)}</span>
            </div>
            <div className="comparison-card">
              <strong>Screenshots delta</strong>
              <span className="mini-pill">{formatDelta(comparison.screenshotDelta)}</span>
            </div>
            <div className="comparison-card">
              <strong>Worker logs delta</strong>
              <span className="mini-pill">{formatDelta(comparison.logDelta)}</span>
            </div>
          </div>
          <div className="comparison-grid">
            <div className="comparison-card">
              <SessionEvidenceBlock
                session={selectedPair.latest}
                title="Latest session"
                logId={`automation-session-${selectedPair.latest.id}-logs`}
                screenshotId={`automation-session-${selectedPair.latest.id}-screenshots`}
                linkPrefix="latest"
              />
            </div>
            <div className="comparison-card">
              <SessionEvidenceBlock
                session={selectedPair.previous}
                title="Previous session"
                logId={`automation-session-${selectedPair.previous.id}-logs`}
                screenshotId={`automation-session-${selectedPair.previous.id}-screenshots`}
                linkPrefix="previous"
              />
            </div>
          </div>
        </div>
      ) : selectedSession ? (
        <div className="stack">
          <div className="field-result-row">
            <strong>Selected session</strong>
            <div className="pill-row">
              <span className="mini-pill">{selectedSession.status}</span>
              <span className="mini-pill">{selectedSession.kind}</span>
            </div>
          </div>
          <SessionEvidenceBlock
            session={selectedSession}
            title="Selected session"
            logId={`automation-session-${selectedSession.id}-logs`}
            screenshotId={`automation-session-${selectedSession.id}-screenshots`}
          />
        </div>
      ) : null}
    </div>
  );
}
