"use client";

import { startTransition, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

import { Panel } from "../../../components/panel";
import {
  cancelWorkflowRun,
  fetchWorkflowRun,
  fetchWorkflowRunEvents,
  retryWorkflowRun,
  type WorkflowRunDetail
} from "../../../lib/api";
import { getWorkflowRunStatusCopy, hasActiveWorkflowRuns } from "../../../lib/workflow-run-status";

export default function WorkflowRunDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const runId = params.id;
  const [detail, setDetail] = useState<WorkflowRunDetail | null>(null);
  const [events, setEvents] = useState<Awaited<ReturnType<typeof fetchWorkflowRunEvents>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [actionError, setActionError] = useState("");
  const [retrying, setRetrying] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!runId) {
      return;
    }

    void loadRunDetail(runId);
  }, [runId]);

  const hasActiveRun = useMemo(
    () => (detail ? hasActiveWorkflowRuns([detail.workflowRun]) : false),
    [detail]
  );

  useEffect(() => {
    if (!runId || !hasActiveRun) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        void loadRunDetail(runId, false);
      });
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [runId, hasActiveRun]);

  async function loadRunDetail(currentRunId: string, resetLoading = true) {
    if (resetLoading) {
      setLoading(true);
    }

    try {
      const [runDetail, runEvents] = await Promise.all([
        fetchWorkflowRun(currentRunId),
        fetchWorkflowRunEvents(currentRunId)
      ]);
      setDetail(runDetail);
      setEvents(runEvents);
      setError("");
    } catch (loadError) {
      setDetail(null);
      setEvents([]);
      setError(loadError instanceof Error ? loadError.message : "Failed to load workflow run");
    } finally {
      if (resetLoading) {
        setLoading(false);
      }
    }
  }

  async function retryRun() {
    if (!runId) {
      return;
    }

    setRetrying(true);
    setActionError("");
    setActionMessage("");

    try {
      const next = await retryWorkflowRun(runId);
      setActionMessage(`Created retry run ${next.workflowRun.id}.`);
      router.push(`/workflow-runs/${next.workflowRun.id}`);
    } catch (retryError) {
      setActionError(retryError instanceof Error ? retryError.message : "Retry failed");
    } finally {
      setRetrying(false);
    }
  }

  async function cancelRun() {
    if (!runId) {
      return;
    }

    setCancelling(true);
    setActionError("");
    setActionMessage("");

    try {
      const next = await cancelWorkflowRun(runId);
      setActionMessage(
        next.workflowRun.status === "cancelled"
          ? `Cancelled run ${next.workflowRun.id}.`
          : next.workflowRun.executionMode === "direct"
            ? `Cancellation requested for run ${next.workflowRun.id}. It will stop at the next safe cancellation point in this API process.`
            : `Cancellation requested for run ${next.workflowRun.id}. It will stop at the next safe cancellation point.`
      );
      await loadRunDetail(next.workflowRun.id, false);
    } catch (cancelError) {
      setActionError(cancelError instanceof Error ? cancelError.message : "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  const workflowRun = detail?.workflowRun;
  const statusCopy = workflowRun ? getWorkflowRunStatusCopy(workflowRun) : null;

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="Workflow run"
        title={workflowRun ? `${workflowRun.kind.replace(/_/g, " ")} · ${workflowRun.id}` : "Workflow run detail"}
        copy={
          workflowRun
            ? "One execution attempt, its linked business records, and the lifecycle that got it here."
            : "Loading workflow run detail..."
        }
      >
        {loading ? <div className="inline-note">Loading workflow run detail...</div> : null}
        {!loading && error ? <div className="error-text">{error}</div> : null}
        {!loading && detail && workflowRun && statusCopy ? (
          <>
            <div className="pill-row">
              <span className="mini-pill">{workflowRun.kind.replace(/_/g, " ")}</span>
              <span className="mini-pill">{statusCopy.label}</span>
              <span className="mini-pill">{workflowRun.executionMode}</span>
            </div>
            {hasActiveRun ? (
              <div className="inline-note">
                Live updates on. This page refreshes automatically while the run is queued or running.
              </div>
            ) : null}
            <p className="muted">{statusCopy.detail}</p>
            <div className="stack">
              <span className="muted">
                Started {workflowRun.startedAt ? new Date(workflowRun.startedAt).toLocaleString() : "not started yet"}
              </span>
              <span className="muted">
                Completed {workflowRun.completedAt ? new Date(workflowRun.completedAt).toLocaleString() : "not finished yet"}
              </span>
              <span className="muted">
                {workflowRun.workflowType ? `${workflowRun.workflowType} · ` : ""}
                {workflowRun.taskQueue ? `queue ${workflowRun.taskQueue} · ` : ""}
                {workflowRun.workflowId ? `workflow ${workflowRun.workflowId}` : "direct execution"}
              </span>
              {workflowRun.errorMessage ? <span className="error-text">{workflowRun.errorMessage}</span> : null}
            </div>
          </>
        ) : null}
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Actions"
        title="Controls"
        copy="Retry or cancel from the run itself when that action is valid."
      >
        {actionMessage ? <div className="success-text">{actionMessage}</div> : null}
        {actionError ? <div className="error-text">{actionError}</div> : null}
        {workflowRun?.status === "failed" ? (
          <button className="button button-primary" type="button" onClick={retryRun} disabled={retrying}>
            {retrying ? "Retrying..." : "Retry failed run"}
          </button>
        ) : null}
        {((workflowRun?.executionMode === "temporal" &&
          (workflowRun.status === "queued" || workflowRun.status === "running")) ||
          (workflowRun?.executionMode === "direct" && workflowRun.status === "running")) ? (
          <button
            className="button button-secondary"
            type="button"
            onClick={cancelRun}
            disabled={cancelling}
          >
            {cancelling ? "Cancelling..." : "Cancel run"}
          </button>
        ) : null}
        {workflowRun?.executionMode === "temporal" && workflowRun.status === "running" ? (
          <div className="inline-note">Stops the run at the next safe cancellation point.</div>
        ) : null}
        {workflowRun?.executionMode === "direct" && workflowRun.status === "running" ? (
          <div className="inline-note">
            Stops the run at the next safe cancellation point in this API process.
          </div>
        ) : null}
        {!workflowRun ? <div className="inline-note">Run controls appear once the detail loads.</div> : null}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Linked records"
        title="Business context"
        copy="These links connect the execution attempt to the job, output records, and retry chain."
      >
        {detail ? (
          <div className="job-list">
            <Link href={`/jobs/${detail.job.id}`} className="job-card">
              <h3>{detail.job.title}</h3>
              <p className="muted">{detail.job.company}</p>
              <div className="pill-row">
                <span className="mini-pill">job</span>
                <span className="mini-pill">{detail.job.id}</span>
              </div>
            </Link>
            {detail.application ? (
              <Link href={`/applications/${detail.application.id}`} className="job-card">
                <h3>Application run</h3>
                <p className="muted">
                  {detail.application.status} · {detail.application.approvalStatus} · {detail.application.submissionStatus}
                </p>
                <div className="pill-row">
                  <span className="mini-pill">application</span>
                  <span className="mini-pill">{detail.application.id}</span>
                </div>
              </Link>
            ) : null}
            {detail.resumeVersion ? (
              <Link href={`/resume-versions/${detail.resumeVersion.id}`} className="job-card">
                <h3>{detail.resumeVersion.headline}</h3>
                <p className="muted">{detail.resumeVersion.status}</p>
                <div className="pill-row">
                  <span className="mini-pill">resume</span>
                  <span className="mini-pill">{detail.resumeVersion.id}</span>
                </div>
              </Link>
            ) : null}
            {detail.retryOfRun ? (
              <Link href={`/workflow-runs/${detail.retryOfRun.id}`} className="job-card">
                <h3>Retry of previous run</h3>
                <p className="muted">
                  {detail.retryOfRun.kind.replace(/_/g, " ")} · {detail.retryOfRun.status}
                </p>
                <div className="pill-row">
                  <span className="mini-pill">previous run</span>
                  <span className="mini-pill">{detail.retryOfRun.id}</span>
                </div>
              </Link>
            ) : null}
            {detail.latestRetry ? (
              <Link href={`/workflow-runs/${detail.latestRetry.id}`} className="job-card">
                <h3>Latest retry</h3>
                <p className="muted">
                  {detail.latestRetry.kind.replace(/_/g, " ")} · {detail.latestRetry.status}
                </p>
                <div className="pill-row">
                  <span className="mini-pill">latest retry</span>
                  <span className="mini-pill">{detail.latestRetry.id}</span>
                </div>
              </Link>
            ) : null}
          </div>
        ) : (
          <div className="inline-note">No linked records available yet.</div>
        )}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Lifecycle"
        title="Run history"
        copy="A run-level timeline of queueing, execution, completion, failure, cancellation, and retry handoff."
      >
        {events.length > 0 ? (
          <div className="job-list">
            {events.map((event) => (
              <div key={event.id} className="job-card">
                <h3>{event.type.replace(/_/g, " ")}</h3>
                <p className="muted">{new Date(event.createdAt).toLocaleString()}</p>
                <div className="stack">
                  {Object.keys(event.payload).length > 0 ? (
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                      {JSON.stringify(event.payload, null, 2)}
                    </pre>
                  ) : (
                    <span className="inline-note">No additional payload for this lifecycle event.</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-note">No lifecycle events recorded yet.</div>
        )}
      </Panel>
    </section>
  );
}
