"use client";

import React from "react";
import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import { ApplicationFieldResults } from "../../../../components/application-field-results";
import { AutomationSessionSummary } from "../../../../components/automation-session-summary";
import { Panel } from "../../../../components/panel";
import { UnresolvedAutomationItems } from "../../../../components/unresolved-automation-items";
import {
  type ApplicationHistoryActorFilter,
  type ApplicationHistoryEventFilter,
  buildApplicationScreenshotUrl,
  buildResumePdfUrl,
  fetchApplicationEvents,
  fetchSubmissionReview,
  markApplicationRetryReady,
  markApplicationSubmitFailed,
  markApplicationSubmitted,
  reopenApplicationSubmission,
  updateUnresolvedAutomationItem,
  type ApplicationWithContext,
  type SubmissionReviewWithContext
} from "../../../../lib/api";
import type { ApplicationEvent, SubmissionReview } from "@rolecraft/shared-types";

const historyActorFilters: ApplicationHistoryActorFilter[] = ["all", "user", "worker", "api", "system"];
const historySourceFilters = [
  "all",
  "web-ui",
  "system",
  "derived-job-record",
  "derived-application-record"
] as const;
const historyEventFilters: ApplicationHistoryEventFilter[] = [
  "all",
  "prefill_run",
  "approval_updated",
  "submission_marked",
  "submission_failed",
  "submission_reopened",
  "submission_retry_ready",
  "unresolved_item_updated"
];

export default function SubmissionReviewPage() {
  const params = useParams<{ id: string }>();
  const applicationId = params?.id ?? "";
  const [review, setReview] = useState<SubmissionReviewWithContext | null>(null);
  const [events, setEvents] = useState<ApplicationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submissionNote, setSubmissionNote] = useState("");
  const [message, setMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [saving, setSaving] = useState(false);
  const [historyActorFilter, setHistoryActorFilter] = useState<ApplicationHistoryActorFilter>("all");
  const [historySourceFilter, setHistorySourceFilter] =
    useState<(typeof historySourceFilters)[number]>("all");
  const [historyEventFilter, setHistoryEventFilter] = useState<ApplicationHistoryEventFilter>("all");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyFrom, setHistoryFrom] = useState("");
  const [historyTo, setHistoryTo] = useState("");

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    startTransition(async () => {
      try {
        const data = await fetchSubmissionReview(applicationId);
        setReview(data);
        setSubmissionNote(data.application.submissionNote);
        try {
          const eventData = await fetchApplicationEvents(applicationId, { limit: 20 });
          setEvents(eventData);
        } catch {
          setEvents([]);
        }
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load submission review");
      } finally {
        setLoading(false);
      }
    });
  }, [applicationId]);

  useEffect(() => {
    if (!applicationId || loading) {
      return;
    }

    startTransition(async () => {
      try {
        const eventData = await fetchApplicationEvents(applicationId, {
          actorType: historyActorFilter === "all" ? undefined : historyActorFilter,
          eventType: historyEventFilter === "all" ? undefined : historyEventFilter,
          source: historySourceFilter === "all" ? undefined : historySourceFilter,
          q: historyQuery.trim() || undefined,
          from: historyFrom || undefined,
          to: historyTo || undefined,
          limit: 20
        });
        setEvents(eventData);
      } catch {
        setEvents([]);
      }
    });
  }, [applicationId, loading, historyActorFilter, historySourceFilter, historyEventFilter, historyQuery, historyFrom, historyTo]);

  async function applyUpdatedState(
    action: "submitted" | "failed" | "reopened" | "retry_ready",
    updated: ApplicationWithContext
  ) {
    setReview((current) =>
      current
        ? {
            ...current,
            application: updated.application,
            job: updated.job ?? current.job,
            resumeVersion: updated.resumeVersion ?? current.resumeVersion,
            latestAutomationSession: updated.latestAutomationSession ?? current.latestAutomationSession
          }
        : current
    );
    setSubmissionNote(updated.application.submissionNote);
    setMessage(thisActionMessage(action));

    try {
      const latestEvents = await fetchApplicationEvents(updated.application.id, {
        actorType: historyActorFilter === "all" ? undefined : historyActorFilter,
        eventType: historyEventFilter === "all" ? undefined : historyEventFilter,
        source: historySourceFilter === "all" ? undefined : historySourceFilter,
        q: historyQuery.trim() || undefined,
        from: historyFrom || undefined,
        to: historyTo || undefined,
        limit: 20
      });
      setEvents(latestEvents);
    } catch {
      // Keep the optimistic state if the history refresh fails.
    }
  }

  async function handleSubmissionAction(
    action: "submitted" | "failed",
    request: (id: string, payload: { submissionNote?: string }) => Promise<ApplicationWithContext>
  ) {
    if (!review) {
      return;
    }

    setSaving(true);
    setActionError("");
    setMessage("");

    try {
      const updated = await request(review.application.id, { submissionNote });
      await applyUpdatedState(action, updated);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "Failed to save submission outcome"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRecoveryAction(
    action: "reopened" | "retry_ready",
    request: (id: string, payload: { note?: string }) => Promise<ApplicationWithContext>
  ) {
    if (!review) {
      return;
    }

    setSaving(true);
    setActionError("");
    setMessage("");

    try {
      const updated = await request(review.application.id, { note: submissionNote });
      await applyUpdatedState(action, updated);
    } catch (requestError) {
      setActionError(
        requestError instanceof Error ? requestError.message : "Failed to save submission outcome"
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleUnresolvedItemUpdate(
    itemId: string,
    payload: { status: "resolved" | "ignored"; note?: string }
  ) {
    if (!review) {
      throw new Error("Submission review not loaded");
    }

    const updatedItem = await updateUnresolvedAutomationItem(review.application.id, itemId, payload);
    setReview((current) =>
      current
        ? {
            ...current,
            unresolvedItems: current.unresolvedItems.map((item) => (item.id === itemId ? updatedItem : item))
          }
        : current
    );

    try {
      const latestEvents = await fetchApplicationEvents(review.application.id, {
        actorType: historyActorFilter === "all" ? undefined : historyActorFilter,
        eventType: historyEventFilter === "all" ? undefined : historyEventFilter,
        source: historySourceFilter === "all" ? undefined : historySourceFilter,
        q: historyQuery.trim() || undefined,
        from: historyFrom || undefined,
        to: historyTo || undefined,
        limit: 20
      });
      setEvents(latestEvents);
    } catch {
      // Keep optimistic state if event refresh fails.
    }

    return updatedItem;
  }

  const screenshotFilenames = useMemo(() => {
    if (!review) {
      return [];
    }

    return review.application.screenshotPaths
      .map((path) => path.split("/").filter(Boolean).at(-1))
      .filter((value): value is string => Boolean(value));
  }, [review]);

  if (loading) {
    return (
      <section className="content-grid">
        <div className="inline-note">Loading submission review...</div>
      </section>
    );
  }

  if (error || !review) {
    return (
      <section className="content-grid">
        <div className="error-text">{error || "Submission review not found."}</div>
      </section>
    );
  }

  const {
    application,
    job,
    resumeVersion,
    unresolvedFieldCount,
    failedFieldCount,
    latestAutomationSession,
    unresolvedItems
  } = review;

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="Submission review"
        title={job?.title ?? "Application submission"}
        copy="This is the final human-controlled checkpoint. Open the real apply page yourself, then record what happened here."
      >
        <div className="pill-row">
          <span className="mini-pill">{application.approvalStatus}</span>
          <span className="mini-pill">{application.submissionStatus}</span>
        </div>
        <p className="muted">
          {job?.company ?? "Unknown company"} · {application.applyUrl}
        </p>
        <div className="button-row">
          <Link className="button button-secondary" href={`/applications/${application.id}`}>
            Back to approval
          </Link>
          {job ? (
            <Link className="button button-secondary" href={`/jobs/${job.id}`}>
              Back to job
            </Link>
          ) : null}
          <a className="button button-primary" href={application.applyUrl} target="_blank" rel="noreferrer">
            Open apply page
          </a>
          {resumeVersion?.status === "completed" ? (
            <a
              className="button button-secondary"
              href={buildResumePdfUrl(resumeVersion.id)}
              target="_blank"
              rel="noreferrer"
            >
              Download latest resume PDF
            </a>
          ) : null}
        </div>
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Submission summary"
        title="Final check"
        copy="Unresolved fields do not block you here, but they make the manual submission step more likely to need edits."
      >
        <div className="dashboard-metrics">
          <div className="metric-card">
            <div className="eyebrow">Unresolved fields</div>
            <div className="panel-metric">{unresolvedFieldCount}</div>
          </div>
          <div className="metric-card">
            <div className="eyebrow">Failed fields</div>
            <div className="panel-metric">{failedFieldCount}</div>
          </div>
        </div>
        <p className="muted">
          Resume version: {resumeVersion?.headline ?? "Unknown"} · current status {resumeVersion?.status ?? "unknown"}
        </p>
        {application.submittedAt ? (
          <p className="muted">Submitted at {new Date(application.submittedAt).toLocaleString()}</p>
        ) : null}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Automation session"
        title="Latest execution evidence"
        copy="Submission review is showing the newest captured browser automation evidence for this application. The fuller session browser lives on the application page."
      >
        <AutomationSessionSummary
          session={latestAutomationSession}
          emptyCopy="No automation session has been captured for this application yet."
        />
        <div className="button-row">
          <Link className="button button-secondary" href={`/applications/${application.id}#automation-sessions`}>
            Open full automation history
          </Link>
        </div>
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Evidence"
        title="What the worker found before the final step"
        copy="Use this context to decide whether the application really went through or needs more manual work."
      >
        <div className="stack">
          <p className="muted">Review note: {application.reviewNote || "No review note yet."}</p>
          <textarea
            className="field-textarea"
            name="submissionNote"
            value={submissionNote}
            onChange={(event) => setSubmissionNote(event.target.value)}
            placeholder="Capture what happened on the real apply page."
          />
          {message ? <p className="success-text">{message}</p> : null}
          {actionError ? <p className="error-text">{actionError}</p> : null}
          <div className="button-row">
            {application.submissionStatus === "ready_to_submit" ? (
              <>
                <button
                  className="button button-primary"
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmissionAction("submitted", markApplicationSubmitted)}
                >
                  {saving ? "Saving..." : "Mark as submitted"}
                </button>
                <button
                  className="button button-secondary"
                  type="button"
                  disabled={saving}
                  onClick={() => handleSubmissionAction("failed", markApplicationSubmitFailed)}
                >
                  {saving ? "Saving..." : "Mark submission failed"}
                </button>
              </>
            ) : null}
            {application.submissionStatus === "submitted" ? (
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={() => handleRecoveryAction("reopened", reopenApplicationSubmission)}
              >
                {saving ? "Saving..." : "Reopen submission"}
              </button>
            ) : null}
            {application.submissionStatus === "submit_failed" ? (
              <button
                className="button button-secondary"
                type="button"
                disabled={saving}
                onClick={() => handleRecoveryAction("retry_ready", markApplicationRetryReady)}
              >
                {saving ? "Saving..." : "Mark ready to retry"}
              </button>
            ) : null}
          </div>
        </div>
      </Panel>

      <Panel
        className="span-7"
        eyebrow="Field summary"
        title="Fields that likely need attention"
        copy="Uploads, long answers, and basic fields are grouped so you can focus on what still needs manual attention."
      >
        <ApplicationFieldResults
          results={application.fieldResults}
          emptyCopy="No field details were captured."
          summaryTitle="Submission review summary"
        />
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Manual follow-up"
        title="Needs attention"
        copy="This is the unresolved queue carried forward from automation so you can close the remaining gaps before or after submission."
      >
        <UnresolvedAutomationItems
          items={unresolvedItems}
          emptyCopy="No unresolved automation items are waiting for manual follow-up."
          onUpdateItem={handleUnresolvedItemUpdate}
        />
      </Panel>

      <Panel
        className="span-5"
        eyebrow="History"
        title="Audit events"
        copy="This is the lightweight action trail for approval, submission, recovery, and who or what triggered each step."
      >
        <div className="filter-row">
          {historyActorFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${historyActorFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setHistoryActorFilter(filter)}
            >
              {formatLabel(filter)}
            </button>
          ))}
        </div>
        <div className="filter-row">
          {historyEventFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${historyEventFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setHistoryEventFilter(filter)}
            >
              {formatLabel(filter)}
            </button>
            ))}
          </div>
        <div className="filter-row">
          {historySourceFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${historySourceFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setHistorySourceFilter(filter)}
            >
              {formatLabel(filter)}
            </button>
          ))}
        </div>
        <div className="stack">
          <input
            className="field-input"
            type="search"
            value={historyQuery}
            onChange={(event) => setHistoryQuery(event.target.value)}
            placeholder="Search event id, app id, actor, summary, note..."
          />
          <div className="field-grid">
            <input
              className="field-input"
              type="date"
              value={historyFrom}
              onChange={(event) => setHistoryFrom(event.target.value)}
            />
            <input
              className="field-input"
              type="date"
              value={historyTo}
              onChange={(event) => setHistoryTo(event.target.value)}
            />
          </div>
        </div>
        {events.length === 0 ? (
          <div className="inline-note">No recovery events yet.</div>
        ) : (
          <div className="stack">
            {events.map((event) => (
              <div key={event.id} className="application-field">
                <div className="field-result-row">
                  <strong>{formatEventLabel(event.type)}</strong>
                  <span className="mini-pill">{new Date(event.createdAt).toLocaleString()}</span>
                </div>
                <p className="muted">
                  by {event.actorType}: {event.actorLabel} · id {event.actorId}
                </p>
                <p className="muted">
                  source {event.source}
                  {event.orchestration ? ` · ${formatEventOrchestration(event)}` : ""}
                </p>
                <p className="muted">{event.summary}</p>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Screenshots"
        title="Captured page state"
        copy="This is the last machine-captured evidence before the manual submit step."
      >
        {screenshotFilenames.length === 0 ? (
          <div className="inline-note">No screenshots were captured.</div>
        ) : (
          <div className="application-screenshots">
            {screenshotFilenames.map((filename) => (
              <img
                key={filename}
                src={buildApplicationScreenshotUrl(application.id, filename)}
                alt="Submission review screenshot"
                className="application-screenshot"
              />
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function thisActionMessage(action: "submitted" | "failed" | "reopened" | "retry_ready") {
  if (action === "submitted") {
    return "Marked as submitted.";
  }

  if (action === "failed") {
    return "Marked as submit failed.";
  }

  if (action === "reopened") {
    return "Submission reopened and moved back to ready to submit.";
  }

  return "Submission moved back to ready to retry.";
}

function formatEventLabel(type: ApplicationEvent["type"]) {
  if (type === "prefill_run") {
    return "Prefill run";
  }

  if (type === "submission_reopened") {
    return "Submission reopened";
  }

  if (type === "submission_retry_ready") {
    return "Ready to retry";
  }

  if (type === "submission_failed") {
    return "Submission failed";
  }

  if (type === "submission_marked") {
    return "Submission marked";
  }

  return "Approval updated";
}

function formatEventOrchestration(event: ApplicationEvent) {
  const orchestration = event.orchestration;
  if (!orchestration) {
    return "";
  }

  const parts = [`mode ${orchestration.executionMode}`];

  if (orchestration.workflowType) {
    parts.push(orchestration.workflowType);
  }

  if (orchestration.taskQueue) {
    parts.push(`queue ${orchestration.taskQueue}`);
  }

  if (orchestration.workflowId) {
    parts.push(`workflow ${orchestration.workflowId.slice(0, 24)}`);
  }

  return parts.join(" · ");
}
