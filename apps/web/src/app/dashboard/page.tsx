"use client";

import Link from "next/link";
import { startTransition, useEffect, useMemo, useState } from "react";

import { Panel } from "../../components/panel";
import {
  fetchApplicationsList,
  fetchDashboardHistory,
  fetchDashboardOverview,
  fetchDashboardTimeline,
  type ApplicationTableRow,
  type DashboardApprovalFilter,
  type DashboardTimelineActorFilter,
  type DashboardStageFilter,
  type DashboardTimelineEntityFilter,
  type DashboardTimelineEventFilter
} from "../../lib/api";
import type { DashboardHistory, TimelineItem } from "@openclaw/shared-types";
import { getWorkflowRunDashboardSummary } from "../../lib/workflow-run-status";

const stageFilters: DashboardStageFilter[] = [
  "all",
  "imported",
  "analyzed",
  "resume_ready",
  "prefill_run",
  "pending_review",
  "approved_for_submit",
  "ready_to_submit",
  "submitted",
  "submit_failed",
  "needs_revision",
  "rejected"
];

const approvalFilters: DashboardApprovalFilter[] = [
  "all",
  "pending_review",
  "approved_for_submit",
  "needs_revision",
  "rejected"
];

const timelineEntityFilters: DashboardTimelineEntityFilter[] = ["all", "job", "application"];
const timelineActorFilters: DashboardTimelineActorFilter[] = ["all", "user", "worker", "api", "system"];
const timelineSourceFilters = [
  "all",
  "web-ui",
  "system",
  "derived-job-record",
  "derived-application-record"
] as const;
const timelineEventFilters: DashboardTimelineEventFilter[] = [
  "all",
  "job_imported",
  "analysis_completed",
  "resume_generated",
  "prefill_run",
  "approval_updated",
  "submission_marked",
  "submission_failed",
  "submission_reopened",
  "submission_retry_ready"
];

export default function DashboardPage() {
  const [overview, setOverview] = useState<Awaited<ReturnType<typeof fetchDashboardOverview>> | null>(null);
  const [history, setHistory] = useState<DashboardHistory | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [applications, setApplications] = useState<ApplicationTableRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [stageFilter, setStageFilter] = useState<DashboardStageFilter>("all");
  const [approvalFilter, setApprovalFilter] = useState<DashboardApprovalFilter>("all");
  const [timelineActorFilter, setTimelineActorFilter] = useState<DashboardTimelineActorFilter>("all");
  const [timelineSourceFilter, setTimelineSourceFilter] = useState<(typeof timelineSourceFilters)[number]>("all");
  const [timelineEntityFilter, setTimelineEntityFilter] = useState<DashboardTimelineEntityFilter>("all");
  const [timelineEventFilter, setTimelineEventFilter] = useState<DashboardTimelineEventFilter>("all");
  const [timelineQuery, setTimelineQuery] = useState("");
  const [timelineFrom, setTimelineFrom] = useState("");
  const [timelineTo, setTimelineTo] = useState("");
  const [timelineLoading, setTimelineLoading] = useState(false);

  useEffect(() => {
    startTransition(async () => {
      try {
        const [overviewData, applicationData, historyData, timelineData] = await Promise.all([
          fetchDashboardOverview(),
          fetchApplicationsList(),
          fetchDashboardHistory(),
          fetchDashboardTimeline({ limit: 20 })
        ]);
        setOverview(overviewData);
        setApplications(applicationData);
        setHistory(historyData);
        setTimeline(timelineData);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load tracker dashboard");
      } finally {
        setLoading(false);
      }
    });
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    setTimelineLoading(true);
    startTransition(async () => {
      try {
        const timelineData = await fetchDashboardTimeline({
          actorType: timelineActorFilter === "all" ? undefined : timelineActorFilter,
          source: timelineSourceFilter === "all" ? undefined : timelineSourceFilter,
          entityType: timelineEntityFilter === "all" ? undefined : timelineEntityFilter,
          eventType: timelineEventFilter === "all" ? undefined : timelineEventFilter,
          q: timelineQuery.trim() || undefined,
          from: timelineFrom || undefined,
          to: timelineTo || undefined,
          limit: 20
        });
        setTimeline(timelineData);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to refresh timeline");
      } finally {
        setTimelineLoading(false);
      }
    });
  }, [loading, timelineActorFilter, timelineSourceFilter, timelineEntityFilter, timelineEventFilter, timelineQuery, timelineFrom, timelineTo]);

  const filteredJobs = useMemo(() => {
    if (!overview) {
      return [];
    }

    return overview.jobs.filter((job) => stageFilter === "all" || job.stage === stageFilter);
  }, [overview, stageFilter]);

  const filteredApplications = useMemo(() => {
    return applications.filter(
      (entry) => approvalFilter === "all" || entry.application.approvalStatus === approvalFilter
    );
  }, [applications, approvalFilter]);

  if (loading) {
    return (
      <section className="content-grid">
        <Panel className="span-12" eyebrow="Tracker dashboard" title="Loading dashboard">
          <div className="inline-note">Loading jobs, applications, and recent activity...</div>
        </Panel>
      </section>
    );
  }

  if (error || !overview || !history) {
    return (
      <section className="content-grid">
        <Panel className="span-12" eyebrow="Tracker dashboard" title="Dashboard unavailable">
          <div className="error-text">{error || "Failed to load tracker dashboard."}</div>
        </Panel>
      </section>
    );
  }

  const metrics = [
    { label: "Total jobs", value: overview.metrics.totalJobs },
    { label: "Analyzed jobs", value: overview.metrics.analyzedJobs },
    { label: "Resume ready", value: overview.metrics.resumeReadyJobs },
    { label: "Applications", value: overview.metrics.totalApplications },
    { label: "Pending review", value: overview.metrics.pendingReviewApplications }
  ];

  return (
    <section className="content-grid">
      <Panel
        className="span-12"
        eyebrow="Tracker dashboard"
        title="Workflow status at a glance"
        copy="One page for job progress, application review state, and the most recent workflow activity."
      >
        <div className="dashboard-metrics">
          {metrics.map((metric) => (
            <div key={metric.label} className="metric-card">
              <div className="eyebrow">{metric.label}</div>
              <div className="panel-metric">{metric.value}</div>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Pipeline overview"
        title="Current stage counts"
        copy="Each job is mapped to one current stage from imported through approval review."
      >
        <div className="pipeline-grid">
          {Object.entries(overview.pipeline).map(([stage, count]) => (
            <div key={stage} className="pipeline-card">
              <div className="eyebrow">{formatLabel(stage)}</div>
              <strong className="pipeline-count">{count}</strong>
            </div>
          ))}
        </div>
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Global timeline"
        title="Workflow history"
        copy="A unified feed of the latest job and application events, with light filters for entity type and event type."
      >
        <div className="stack">
          <div className="filter-row">
            {timelineActorFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`button ${timelineActorFilter === filter ? "button-primary" : "button-secondary"}`}
                onClick={() => setTimelineActorFilter(filter)}
              >
                {formatLabel(filter)}
              </button>
            ))}
          </div>
          <div className="filter-row">
            {timelineSourceFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`button ${timelineSourceFilter === filter ? "button-primary" : "button-secondary"}`}
                onClick={() => setTimelineSourceFilter(filter)}
              >
                {formatLabel(filter)}
              </button>
            ))}
          </div>
          <div className="filter-row">
            {timelineEntityFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`button ${timelineEntityFilter === filter ? "button-primary" : "button-secondary"}`}
                onClick={() => setTimelineEntityFilter(filter)}
              >
                {formatLabel(filter)}
              </button>
            ))}
          </div>
          <div className="filter-row">
            {timelineEventFilters.map((filter) => (
              <button
                key={filter}
                type="button"
                className={`button ${timelineEventFilter === filter ? "button-primary" : "button-secondary"}`}
                onClick={() => setTimelineEventFilter(filter)}
              >
                {formatLabel(filter)}
              </button>
            ))}
          </div>
          <div className="stack">
            <input
              className="field-input"
              type="search"
              value={timelineQuery}
              onChange={(event) => setTimelineQuery(event.target.value)}
              placeholder="Search job/app id, actor, title, company, URL..."
            />
            <div className="field-grid">
              <input
                className="field-input"
                type="date"
                value={timelineFrom}
                onChange={(event) => setTimelineFrom(event.target.value)}
              />
              <input
                className="field-input"
                type="date"
                value={timelineTo}
                onChange={(event) => setTimelineTo(event.target.value)}
              />
            </div>
          </div>
          {timelineLoading ? <div className="inline-note">Refreshing timeline...</div> : null}
          {timeline.length > 0 ? (
            <div className="activity-list">
              {timeline.map((item) => (
                <Link key={item.id} href={getTimelineHref(item)} className="activity-item">
                  <div className="pill-row">
                    <span className="mini-pill">{formatLabel(item.entityType)}</span>
                    <span className="mini-pill">{formatLabel(item.type)}</span>
                    {item.status ? <span className="mini-pill">{formatLabel(item.status)}</span> : null}
                  </div>
                  <strong>{item.label}</strong>
                  <p className="muted">
                    {getTimelineContext(item)} · by {item.actorType}: {item.actorLabel} · id {item.actorId}
                    {" · "}source {item.source}
                    {item.orchestration ? ` · ${formatOrchestration(item.orchestration)}` : ""}
                    {" · "}{new Date(item.timestamp).toLocaleString()}
                  </p>
                  <p className="muted">{item.summary}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="inline-note">No timeline events match the selected filters.</div>
          )}
        </div>
      </Panel>

      <Panel
        className="span-6"
        eyebrow="Job timelines"
        title="Recent job journeys"
        copy="See each job's milestones from import through resume and application activity."
      >
        {history.jobTimelines.slice(0, 5).length > 0 ? (
          <div className="job-list">
            {history.jobTimelines.slice(0, 5).map((jobTimeline) => (
              <div key={jobTimeline.jobId} className="job-card">
                <div className="stack">
                  <h3>{jobTimeline.title}</h3>
                  <p className="muted">
                    {jobTimeline.company} · {jobTimeline.location}
                  </p>
                  <div className="activity-list">
                    {jobTimeline.events.map((event) => (
                      <Link key={event.id} href={getTimelineHref(event)} className="activity-item">
                        <div className="pill-row">
                          <span className="mini-pill">{formatLabel(event.type)}</span>
                          {event.status ? <span className="mini-pill">{formatLabel(event.status)}</span> : null}
                        </div>
                        <strong>{event.label}</strong>
                        <p className="muted">
                          by {event.actorType}: {event.actorLabel} · id {event.actorId} · source{" "}
                          {event.source}
                          {event.orchestration ? ` · ${formatOrchestration(event.orchestration)}` : ""}
                          {" · "}{new Date(event.timestamp).toLocaleString()}
                        </p>
                        <p className="muted">{event.summary}</p>
                      </Link>
                    ))}
                  </div>
                  <Link className="button button-secondary" href={`/jobs/${jobTimeline.jobId}`}>
                    Open job
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-note">No job timelines yet.</div>
        )}
      </Panel>

      <Panel
        className="span-6"
        eyebrow="Application timelines"
        title="Recent application lifecycles"
        copy="See prefill, approval, submission, and recovery actions grouped by application."
      >
        {history.applicationTimelines.slice(0, 5).length > 0 ? (
          <div className="job-list">
            {history.applicationTimelines.slice(0, 5).map((applicationTimeline) => (
              <div key={applicationTimeline.applicationId} className="job-card">
                <div className="stack">
                  <h3>{applicationTimeline.title}</h3>
                  <p className="muted">{applicationTimeline.company}</p>
                  <div className="pill-row">
                    {applicationTimeline.approvalStatus ? (
                      <span className="mini-pill">{applicationTimeline.approvalStatus}</span>
                    ) : null}
                    {applicationTimeline.submissionStatus ? (
                      <span className="mini-pill">{applicationTimeline.submissionStatus}</span>
                    ) : null}
                  </div>
                  <div className="activity-list">
                    {applicationTimeline.events.map((event) => (
                      <Link key={event.id} href={getTimelineHref(event)} className="activity-item">
                        <div className="pill-row">
                          <span className="mini-pill">{formatLabel(event.type)}</span>
                          {event.status ? <span className="mini-pill">{formatLabel(event.status)}</span> : null}
                        </div>
                        <strong>{event.label}</strong>
                        <p className="muted">
                          by {event.actorType}: {event.actorLabel} · id {event.actorId} · source{" "}
                          {event.source}
                          {event.orchestration ? ` · ${formatOrchestration(event.orchestration)}` : ""}
                          {" · "}{new Date(event.timestamp).toLocaleString()}
                        </p>
                        <p className="muted">{event.summary}</p>
                      </Link>
                    ))}
                  </div>
                  <Link
                    className="button button-secondary"
                    href={`/applications/${applicationTimeline.applicationId}`}
                  >
                    Open review
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-note">No application timelines yet.</div>
        )}
      </Panel>

      <Panel
        className="span-7"
        eyebrow="Jobs board"
        title="Job progress"
        copy="Track how each imported role has moved through analysis, resume generation, and application review."
      >
        <div className="filter-row">
          {stageFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${stageFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setStageFilter(filter)}
            >
              {formatLabel(filter)}
            </button>
          ))}
        </div>
        {filteredJobs.length > 0 ? (
          <div className="job-list">
            {filteredJobs.map((job) => (
              <Link key={job.jobId} href={`/jobs/${job.jobId}`} className="job-card">
                <h3>{job.title}</h3>
                <p className="muted">
                  {job.company} · {job.location}
                </p>
                <div className="pill-row">
                  <span className="mini-pill">{formatLabel(job.stage)}</span>
                  {job.analysisScore != null ? <span className="mini-pill">match {job.analysisScore}</span> : null}
                  {job.resumeStatus ? <span className="mini-pill">{job.resumeStatus}</span> : null}
                  {job.approvalStatus ? <span className="mini-pill">{job.approvalStatus}</span> : null}
                  {job.submissionStatus ? <span className="mini-pill">{job.submissionStatus}</span> : null}
                </div>
                <p className="muted">{job.resumeHeadline ?? "No resume version generated yet."}</p>
                <div className="stack">
                  {job.latestAnalyzeRun ? (
                    <span className="muted">
                      {getWorkflowRunDashboardSummary(job.latestAnalyzeRun)} ·{" "}
                      {job.latestAnalyzeRun.executionMode}
                    </span>
                  ) : null}
                  {job.latestResumeRun ? (
                    <span className="muted">
                      {getWorkflowRunDashboardSummary(job.latestResumeRun)} ·{" "}
                      {job.latestResumeRun.executionMode}
                    </span>
                  ) : null}
                  {job.latestPrefillRun ? (
                    <span className="muted">
                      {getWorkflowRunDashboardSummary(job.latestPrefillRun)} ·{" "}
                      {job.latestPrefillRun.executionMode}
                    </span>
                  ) : null}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-note">No jobs match the selected stage.</div>
        )}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Applications"
        title="Review queue"
        copy="See the current review state for each application record and jump back into approval."
      >
        <div className="filter-row">
          {approvalFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              className={`button ${approvalFilter === filter ? "button-primary" : "button-secondary"}`}
              onClick={() => setApprovalFilter(filter)}
            >
              {formatLabel(filter)}
            </button>
          ))}
        </div>
        {filteredApplications.length > 0 ? (
          <div className="tracker-table">
            <div className="tracker-table-header">
              <span>Company</span>
              <span>Role</span>
              <span>Status</span>
              <span>Resume</span>
              <span>Updated</span>
              <span>Open</span>
            </div>
            {filteredApplications.map((entry) => (
              <div key={entry.application.id} className="tracker-table-row">
                <span>{entry.job?.company ?? "Unknown"}</span>
                <span>{entry.job?.title ?? "Unknown role"}</span>
                <span>
                  {entry.application.status} / {entry.application.approvalStatus} / {entry.application.submissionStatus}
                </span>
                <span>{entry.resumeVersion?.headline ?? "No resume"}</span>
                <span>{new Date(entry.application.updatedAt).toLocaleString()}</span>
                <Link className="button button-secondary" href={`/applications/${entry.application.id}`}>
                  Review
                </Link>
              </div>
            ))}
          </div>
        ) : (
          <div className="inline-note">No applications match the selected approval state.</div>
        )}
      </Panel>
    </section>
  );
}

function formatLabel(value: string) {
  return value.replace(/_/g, " ");
}

function getTimelineHref(item: TimelineItem) {
  if (item.entityType === "application" && item.applicationId) {
    return `/applications/${item.applicationId}`;
  }

  return `/jobs/${item.jobId}`;
}

function getTimelineContext(item: TimelineItem) {
  if (item.entityType === "application" && item.applicationId) {
    return `application ${item.applicationId}`;
  }

  return `job ${item.jobId}`;
}

function formatOrchestration(orchestration: NonNullable<TimelineItem["orchestration"]>) {
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
