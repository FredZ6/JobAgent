"use client";

import React from "react";
import { startTransition, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import type { WorkflowRun } from "@rolecraft/shared-types";

import { Panel } from "../../../components/panel";
import { WorkflowRunCard } from "../../../components/workflow-run-card";
import { compareApplicationRuns } from "../../../lib/application-comparison";
import { buildImportDiagnosticsRows, formatImportWarning } from "../../../lib/job-import-quality";
import {
  analyzeJob,
  buildResumePdfUrl,
  cancelWorkflowRun,
  fetchJob,
  fetchJobApplications,
  fetchJobWorkflowRuns,
  retryWorkflowRun,
  runPrefill,
  type ApplicationWithContext,
  generateResume,
  type JobDetail
} from "../../../lib/api";
import { hasActiveWorkflowRuns } from "../../../lib/workflow-run-status";

export default function JobDetailPage() {
  const params = useParams<{ id: string }>();
  const jobId = params?.id ?? "";
  const [job, setJob] = useState<JobDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [generatingResume, setGeneratingResume] = useState(false);
  const [error, setError] = useState("");
  const [analysisMessage, setAnalysisMessage] = useState("");
  const [resumeError, setResumeError] = useState("");
  const [resumeMessage, setResumeMessage] = useState("");
  const [applications, setApplications] = useState<ApplicationWithContext[]>([]);
  const [workflowRuns, setWorkflowRuns] = useState<WorkflowRun[]>([]);
  const [applicationsError, setApplicationsError] = useState("");
  const [workflowRunsError, setWorkflowRunsError] = useState("");
  const [workflowActionMessage, setWorkflowActionMessage] = useState("");
  const [workflowActionError, setWorkflowActionError] = useState("");
  const [retryingRunId, setRetryingRunId] = useState<string | null>(null);
  const [cancellingRunId, setCancellingRunId] = useState<string | null>(null);
  const [prefillLoading, setPrefillLoading] = useState(false);
  const [prefillMessage, setPrefillMessage] = useState("");
  const [prefillError, setPrefillError] = useState("");

  useEffect(() => {
    if (!jobId) {
      return;
    }

    startTransition(async () => {
      try {
        const data = await fetchJob(jobId);
        setJob(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load job");
      } finally {
        setLoading(false);
      }
    });
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setApplications([]);
      return;
    }

    loadApplications(jobId);
  }, [jobId]);

  useEffect(() => {
    if (!jobId) {
      setWorkflowRuns([]);
      return;
    }

    loadWorkflowRuns(jobId);
  }, [jobId]);

  useEffect(() => {
    if (!jobId || !hasActiveWorkflowRuns(workflowRuns)) {
      return;
    }

    const intervalId = window.setInterval(() => {
      startTransition(() => {
        void refreshJobContext(jobId);
      });
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [jobId, workflowRuns]);

  async function loadApplications(currentJobId: string) {
    try {
      const records = await fetchJobApplications(currentJobId);
      const sorted = [...records].sort(
        (a, b) =>
          new Date(b.application.createdAt).getTime() - new Date(a.application.createdAt).getTime()
      );
      setApplications(sorted);
      setApplicationsError("");
    } catch (loadError) {
      setApplications([]);
      setApplicationsError(
        loadError instanceof Error ? loadError.message : "Failed to load prefill runs"
      );
    }
  }

  async function loadWorkflowRuns(currentJobId: string) {
    try {
      const records = await fetchJobWorkflowRuns(currentJobId);
      setWorkflowRuns(records);
      setWorkflowRunsError("");
    } catch (loadError) {
      setWorkflowRuns([]);
      setWorkflowRunsError(
        loadError instanceof Error ? loadError.message : "Failed to load workflow runs"
      );
    }
  }

  async function refreshJobContext(currentJobId: string) {
    try {
      const [data] = await Promise.all([
        fetchJob(currentJobId),
        loadApplications(currentJobId),
        loadWorkflowRuns(currentJobId)
      ]);
      setJob(data);
      return data;
    } catch (refreshError) {
      setWorkflowRunsError(
        refreshError instanceof Error ? refreshError.message : "Failed to refresh workflow runs"
      );
      return null;
    }
  }

  async function runAnalysis() {
    if (!jobId) {
      return;
    }

    setRunning(true);
    setError("");
    setAnalysisMessage("");

    try {
      await analyzeJob(jobId);
      const [refreshed] = await Promise.all([fetchJob(jobId), loadWorkflowRuns(jobId)]);
      setJob(refreshed);
      setAnalysisMessage("Analysis updated.");
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : "Failed to analyze job");
    } finally {
      setRunning(false);
    }
  }

  async function runPrefillJob() {
    if (!jobId) {
      return;
    }

    setPrefillLoading(true);
    setPrefillError("");
    setPrefillMessage("");

    try {
      const application = await runPrefill(jobId);
      setPrefillMessage(
        `Created ${applications.length > 0 ? "another" : "a"} prefill run: ${application.application.id}.`
      );
      await Promise.all([loadApplications(jobId), loadWorkflowRuns(jobId)]);
    } catch (prefillErr) {
      setPrefillError(prefillErr instanceof Error ? prefillErr.message : "Prefill failed");
    } finally {
      setPrefillLoading(false);
    }
  }

  async function retryFailedRun(runId: string) {
    if (!jobId) {
      return;
    }

    setRetryingRunId(runId);
    setWorkflowActionError("");
    setWorkflowActionMessage("");

    try {
      const result = await retryWorkflowRun(runId);
      const [refreshed] = await Promise.all([
        fetchJob(jobId),
        loadApplications(jobId),
        loadWorkflowRuns(jobId)
      ]);
      setJob(refreshed);
      setWorkflowActionMessage(
        `Retried ${result.workflowRun.kind.replace(/_/g, " ")} run. New run: ${result.workflowRun.id}.`
      );
    } catch (retryError) {
      setWorkflowActionError(retryError instanceof Error ? retryError.message : "Retry failed");
    } finally {
      setRetryingRunId(null);
    }
  }

  async function cancelRun(runId: string) {
    if (!jobId) {
      return;
    }

    setCancellingRunId(runId);
    setWorkflowActionError("");
    setWorkflowActionMessage("");

    try {
      const result = await cancelWorkflowRun(runId);
      await loadWorkflowRuns(jobId);
      setWorkflowActionMessage(
        result.workflowRun.status === "cancelled"
          ? `Cancelled ${result.workflowRun.kind.replace(/_/g, " ")} run ${result.workflowRun.id}.`
          : result.workflowRun.executionMode === "direct"
            ? `Cancellation requested for ${result.workflowRun.kind.replace(/_/g, " ")} run ${result.workflowRun.id}. It will stop at the next safe cancellation point in this API process.`
            : `Cancellation requested for ${result.workflowRun.kind.replace(/_/g, " ")} run ${result.workflowRun.id}. It will stop at the next safe cancellation point.`
      );
    } catch (cancelError) {
      setWorkflowActionError(cancelError instanceof Error ? cancelError.message : "Cancel failed");
    } finally {
      setCancellingRunId(null);
    }
  }

  async function runResumeGeneration() {
    if (!jobId) {
      return;
    }

    setGeneratingResume(true);
    setResumeError("");
    setResumeMessage("");

    try {
      const version = await generateResume(jobId);
      const [refreshed] = await Promise.all([fetchJob(jobId), loadWorkflowRuns(jobId)]);
      setJob(refreshed);
      setResumeMessage(`Resume version ready: ${version.headline}`);
    } catch (generationError) {
      setResumeError(generationError instanceof Error ? generationError.message : "Failed to generate resume");
    } finally {
      setGeneratingResume(false);
    }
  }

  const latestAnalysis = job?.analyses?.[0];
  const latestResumeVersion = job?.resumeVersions?.[0];
  const latestApplication = applications[0];
  const additionalApplications = applications.slice(1);
  const previousApplication = applications[1];
  const hasActiveRuns = useMemo(() => hasActiveWorkflowRuns(workflowRuns), [workflowRuns]);
  const runComparison =
    latestApplication && previousApplication
      ? compareApplicationRuns(latestApplication, previousApplication)
      : null;

  const comparisonHighlights = useMemo(
    () =>
      runComparison
        ? [
            {
              label: "Filled fields",
              delta: runComparison.filledDelta
            },
            {
              label: "Failed fields",
              delta: runComparison.failedDelta
            },
            {
              label: "Unresolved fields",
              delta: runComparison.unresolvedDelta
            },
            {
              label: "Screenshots",
              delta: runComparison.screenshotDelta
            }
          ]
        : [],
    [runComparison]
  );
  const importDiagnosticsRows = useMemo(
    () => buildImportDiagnosticsRows(job?.importDiagnostics),
    [job?.importDiagnostics]
  );

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="Imported role"
        title={job?.title ?? "Job detail"}
        copy={job ? `${job.company} · ${job.location}` : "Loading job detail..."}
      >
        {loading ? (
          <div className="inline-note">Loading job detail...</div>
        ) : job ? (
          <>
            <div className="button-row">
              <button className="button button-primary" type="button" onClick={runAnalysis} disabled={running}>
                {running ? "Analyzing..." : "Analyze job"}
              </button>
              <button
                className="button button-secondary"
                type="button"
                onClick={runResumeGeneration}
                disabled={generatingResume}
              >
                {generatingResume ? "Generating resume..." : "Generate resume"}
              </button>
              <a className="button button-secondary" href={job.sourceUrl} target="_blank" rel="noreferrer">
                Open source URL
              </a>
              <button
                className="button button-primary"
                type="button"
                onClick={runPrefillJob}
                disabled={prefillLoading}
              >
                {prefillLoading ? "Running prefill..." : "Run prefill"}
              </button>
              {error ? <span className="error-text">{error}</span> : null}
              {analysisMessage ? <span className="success-text">{analysisMessage}</span> : null}
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Imported description</div>
              <p className="panel-copy">{job.description}</p>
            </div>
          </>
        ) : (
          <div className="error-text">{error || "Job not found."}</div>
        )}
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Import quality"
        title="Import quality"
        copy="Importer diagnostics help you tell the difference between live page content and placeholder fallback content."
      >
        {job?.importSummary ? (
          <>
            <div className="pill-row">
              <span className="mini-pill">{job.importSummary.statusLabel}</span>
              <span className="mini-pill">{job.importStatus}</span>
            </div>
            <div className="stack">
              <span className="muted">Source URL: {job.sourceUrl}</span>
              <span className="muted">Apply URL: {job.applyUrl ?? "Unavailable"}</span>
            </div>
            {job.importSummary.warnings.length > 0 ? (
              <div className="stack">
                {job.importSummary.warnings.map((warning) => (
                  <span key={warning} className="muted">
                    {formatImportWarning(warning)}
                  </span>
                ))}
              </div>
            ) : (
              <div className="inline-note">No importer warnings were recorded.</div>
            )}
            {importDiagnosticsRows.length > 0 ? (
              <div className="stack">
                {importDiagnosticsRows.map((row) => (
                  <span key={row.label} className="muted">
                    {row.label}: {row.value}
                  </span>
                ))}
              </div>
            ) : null}
          </>
        ) : (
          <div className="inline-note">No importer quality details are available for this job yet.</div>
        )}
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Latest analysis"
        title="Decision support"
        copy="Analysis is stored separately so you can re-run it after profile or settings changes."
      >
        {latestAnalysis ? (
          <>
            <div className="score-badge">{latestAnalysis.matchScore}</div>
            <p className="panel-copy">{latestAnalysis.summary}</p>
          </>
        ) : (
          <div className="inline-note">No analysis result yet. Run it when the imported JD looks right.</div>
        )}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Tailored resume"
        title="Resume versions"
        copy="Generate a grounded resume version from saved profile facts, then inspect the result before using it anywhere else."
      >
        <div className="button-row">
          {resumeMessage ? <span className="success-text">{resumeMessage}</span> : null}
          {resumeError ? <span className="error-text">{resumeError}</span> : null}
          {latestResumeVersion?.status === "completed" ? (
            <a className="button button-secondary" href={buildResumePdfUrl(latestResumeVersion.id)}>
              Download latest PDF
            </a>
          ) : null}
        </div>
        {latestResumeVersion ? (
          <div className="job-list">
            {job.resumeVersions.map((version) => (
              <Link key={version.id} href={`/resume-versions/${version.id}`} className="job-card">
                <h3>{version.headline}</h3>
                <p className="muted">{version.professionalSummary}</p>
                <div className="pill-row">
                  <span className="mini-pill">{version.status}</span>
                  <span className="mini-pill">{new Date(version.createdAt).toLocaleString()}</span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="inline-note">No resume versions yet. Generate one after confirming the job context looks right.</div>
        )}
      </Panel>

      {latestAnalysis ? (
        <div className="span-12 analysis-grid">
          <div className="analysis-card">
            <div className="eyebrow">Required skills</div>
            <div className="pill-row">
              {latestAnalysis.requiredSkills.map((skill) => (
                <span key={skill} className="mini-pill">
                  {skill}
                </span>
              ))}
            </div>
          </div>
          <div className="analysis-card">
            <div className="eyebrow">Missing skills</div>
            <div className="pill-row">
              {latestAnalysis.missingSkills.length > 0 ? (
                latestAnalysis.missingSkills.map((skill) => (
                  <span key={skill} className="mini-pill">
                    {skill}
                  </span>
                ))
              ) : (
                <span className="inline-note">No obvious gaps detected.</span>
              )}
            </div>
          </div>
          <div className="analysis-card">
            <div className="eyebrow">Red flags</div>
            <div className="stack">
              {latestAnalysis.redFlags.map((flag) => (
                <span key={flag} className="muted">
                  {flag}
                </span>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <Panel
        className="span-12"
        eyebrow="Workflow runs"
        title="Execution attempts"
        copy="Each analyze, resume, or prefill run is tracked separately so we can tell whether work is queued, running, completed, or failed."
      >
        {workflowRunsError ? <div className="error-text">{workflowRunsError}</div> : null}
        {workflowActionMessage ? <div className="success-text">{workflowActionMessage}</div> : null}
        {workflowActionError ? <div className="error-text">{workflowActionError}</div> : null}
        {hasActiveRuns ? (
          <div className="inline-note">
            Live updates on. This section refreshes automatically while queued or running work is in flight.
          </div>
        ) : null}
        {workflowRuns.length > 0 ? (
          <div className="job-list">
            {workflowRuns.map((run) => {
              return (
                <WorkflowRunCard
                  key={run.id}
                  run={run}
                  links={[
                    { href: `/workflow-runs/${run.id}`, label: "Open run detail" },
                    ...(run.resumeVersionId
                      ? [{ href: `/resume-versions/${run.resumeVersionId}`, label: "Open resume version" }]
                      : []),
                    ...(run.applicationId
                      ? [{ href: `/applications/${run.applicationId}`, label: "Open application run" }]
                      : [])
                  ]}
                  actions={
                    <>
                      {run.status === "failed" ? (
                        <button
                          className="button button-primary"
                          type="button"
                          onClick={() => retryFailedRun(run.id)}
                          disabled={retryingRunId === run.id}
                        >
                          {retryingRunId === run.id ? "Retrying..." : "Retry failed run"}
                        </button>
                      ) : null}
                      {((run.executionMode === "temporal" &&
                        (run.status === "queued" || run.status === "running")) ||
                        (run.executionMode === "direct" && run.status === "running")) ? (
                        <button
                          className="button button-secondary"
                          type="button"
                          onClick={() => cancelRun(run.id)}
                          disabled={cancellingRunId === run.id}
                        >
                          {cancellingRunId === run.id ? "Cancelling..." : "Cancel run"}
                        </button>
                      ) : null}
                    </>
                  }
                />
              );
            })}
          </div>
        ) : (
          <div className="inline-note">No workflow runs yet. The next analyze, resume, or prefill action will show up here.</div>
        )}
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Application prefill"
        title="Review evidence"
        copy="Each prefill attempt becomes a separate application run. New runs keep older evidence intact so revision work stays auditable."
      >
        <div className="button-row">
          {prefillMessage ? <span className="success-text">{prefillMessage}</span> : null}
          {prefillError ? <span className="error-text">{prefillError}</span> : null}
          <span className="inline-note">
            {latestApplication
              ? "Running prefill again creates a fresh run with the latest completed resume version."
              : "Your first prefill run will create the review record for this job."}
          </span>
        </div>
        {latestApplication ? (
          <div className="application-card featured">
            <div className="pill-row">
              <span className="mini-pill">latest run</span>
              <span className="mini-pill">{latestApplication.application.status}</span>
              <span className="mini-pill">{latestApplication.application.approvalStatus}</span>
              <span className="mini-pill">
                {new Date(latestApplication.application.createdAt).toLocaleString()}
              </span>
            </div>
            <p className="panel-copy">
              Based on {latestApplication.resumeVersion?.headline ?? "saved resume context"} ·{" "}
              {latestApplication.job?.company ?? "saved job context"}
            </p>
            <Link
              href={`/applications/${latestApplication.application.id}`}
              className="button button-secondary"
            >
              Review this run
            </Link>
          </div>
        ) : (
          <div className="inline-note">No prefill attempts yet. Run one to start the review.</div>
        )}
        {applicationsError ? <div className="error-text">{applicationsError}</div> : null}
        {additionalApplications.length > 0 ? (
          <div className="stack">
            <p className="muted">Earlier runs stay here as history. Open any run to inspect or compare evidence.</p>
            <div className="application-list">
            {additionalApplications.map((entry) => (
              <Link
                key={entry.application.id}
                href={`/applications/${entry.application.id}`}
                className="application-card"
              >
                <div className="pill-row">
                  <span className="mini-pill">history</span>
                  <span className="mini-pill">{entry.application.status}</span>
                  <span className="mini-pill">{entry.application.approvalStatus}</span>
                </div>
                <p className="panel-copy">
                  {entry.resumeVersion?.headline ?? "saved resume context"} ·{" "}
                  {entry.job?.company ?? "saved job context"}
                </p>
                <span className="muted">
                  {new Date(entry.application.createdAt).toLocaleString()}
                </span>
              </Link>
            ))}
            </div>
          </div>
        ) : null}
      </Panel>

      {runComparison ? (
        <Panel
          className="span-12"
          eyebrow="Run comparison"
          title="Latest run vs previous run"
          copy="Use this to decide whether the newest revision actually improved the prefill outcome before you spend more time reviewing it."
        >
          <div className="button-row">
            <Link href={`/applications/${runComparison.latestId}`} className="button button-secondary">
              Open latest run
            </Link>
            <Link href={`/applications/${runComparison.previousId}`} className="button button-secondary">
              Open previous run
            </Link>
            <span className="inline-note">
              Comparing {new Date(runComparison.latestCreatedAt).toLocaleString()} against{" "}
              {new Date(runComparison.previousCreatedAt).toLocaleString()}.
            </span>
          </div>
          <div className="comparison-grid">
            {comparisonHighlights.map((item) => (
              <div key={item.label} className="comparison-card">
                <div className="eyebrow">{item.label}</div>
                <strong className={item.delta > 0 ? "success-text" : item.delta < 0 ? "error-text" : ""}>
                  {item.delta > 0 ? `+${item.delta}` : item.delta}
                </strong>
              </div>
            ))}
            <div className="comparison-card">
              <div className="eyebrow">Worker log entries</div>
              <strong
                className={
                  runComparison.workerLogDelta > 0
                    ? "success-text"
                    : runComparison.workerLogDelta < 0
                      ? "error-text"
                      : ""
                }
              >
                {runComparison.workerLogDelta > 0
                  ? `+${runComparison.workerLogDelta}`
                  : runComparison.workerLogDelta}
              </strong>
            </div>
          </div>
          {runComparison.changedFields.length > 0 ? (
            <div className="comparison-field-list">
              {runComparison.changedFields.map((field) => (
                <div key={field.fieldName} className="application-field">
                  <div className="field-result-row">
                    <strong>{field.fieldName}</strong>
                    <div className="pill-row">
                      <span className="mini-pill">{field.previousState}</span>
                      <span className="mini-pill">to</span>
                      <span className="mini-pill">{field.latestState}</span>
                    </div>
                  </div>
                  <p className="muted">
                    Previous: {field.previousSuggestedValue ?? field.previousFailureReason ?? "no value"}
                  </p>
                  <p className="muted">
                    Latest: {field.latestSuggestedValue ?? field.latestFailureReason ?? "no value"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="inline-note">
              No field-level changes were detected between the latest run and the previous one.
            </div>
          )}
        </Panel>
      ) : null}
    </section>
  );
}
