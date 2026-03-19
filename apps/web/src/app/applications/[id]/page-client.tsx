"use client";

import { startTransition, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

import { ApplicationFieldResults } from "../../../components/application-field-results";
import { AutomationSessionSummary } from "../../../components/automation-session-summary";
import { Panel } from "../../../components/panel";
import {
  buildApplicationScreenshotUrl,
  fetchApplication,
  runPrefill,
  updateApplicationApproval,
  type ApplicationWithContext
} from "../../../lib/api";
import type { ApprovalStatus } from "@openclaw/shared-types";

const approvalOptions: { label: string; value: ApprovalStatus; tone: "primary" | "secondary" }[] = [
  { label: "Approve for later submit", value: "approved_for_submit", tone: "primary" },
  { label: "Needs revision", value: "needs_revision", tone: "secondary" },
  { label: "Reject", value: "rejected", tone: "secondary" }
];

export default function ApplicationReviewPage() {
  const params = useParams<{ id: string }>();
  const applicationId = params?.id ?? "";
  const router = useRouter();
  const [applicationContext, setApplicationContext] = useState<ApplicationWithContext | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalMessage, setApprovalMessage] = useState("");
  const [approvalError, setApprovalError] = useState("");
  const [rerunLoading, setRerunLoading] = useState(false);
  const [reviewNote, setReviewNote] = useState("");

  useEffect(() => {
    if (!applicationId) {
      return;
    }

    startTransition(async () => {
      try {
        const data = await fetchApplication(applicationId);
        setApplicationContext(data);
        setReviewNote(data.application.reviewNote);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load application");
      } finally {
        setLoading(false);
      }
    });
  }, [applicationId]);

  async function handleApproval(status: ApprovalStatus) {
    if (!applicationContext) {
      return;
    }

    setApprovalLoading(true);
    setApprovalError("");
    setApprovalMessage("");

    try {
      const updated = await updateApplicationApproval(applicationContext.application.id, {
        approvalStatus: status,
        reviewNote
      });
      setApplicationContext((current) =>
        current
          ? {
              ...updated,
              latestAutomationSession: updated.latestAutomationSession ?? current.latestAutomationSession
            }
          : updated
      );
      setReviewNote(updated.application.reviewNote);
      setApprovalMessage(`Marked as ${status.replace(/_/g, " ")}.`);
    } catch (approvalErr) {
      setApprovalError(approvalErr instanceof Error ? approvalErr.message : "Failed to update approval");
    } finally {
      setApprovalLoading(false);
    }
  }

  async function handleRerunPrefill() {
    if (!applicationContext?.job?.id) {
      return;
    }

    setRerunLoading(true);
    setApprovalError("");
    setApprovalMessage("");

    try {
      const nextRun = await runPrefill(applicationContext.job.id);
      router.push(`/applications/${nextRun.application.id}`);
    } catch (rerunError) {
      setApprovalError(rerunError instanceof Error ? rerunError.message : "Failed to run another prefill");
    } finally {
      setRerunLoading(false);
    }
  }

  if (loading) {
    return (
      <section className="content-grid">
        <div className="inline-note">Loading application review...</div>
      </section>
    );
  }

  if (error || !applicationContext) {
    return (
      <section className="content-grid">
        <div className="error-text">{error || "Application not found."}</div>
      </section>
    );
  }

  const { application, job, resumeVersion, latestAutomationSession } = applicationContext;
  const screenshotFilenames = application.screenshotPaths.map((path) => {
    const segments = path.split("/");
    return segments[segments.length - 1];
  });

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="Application context"
        title={job?.title ?? "Application"}
        copy={`Applying to ${job?.company ?? "Unknown"} via ${application.applyUrl}`}
      >
        <div className="stack">
          <p className="panel-copy">
            Resume version: {resumeVersion?.headline ?? "unknown"} · status {resumeVersion?.status ?? "unknown"}
          </p>
          <div className="pill-row">
            <span className="mini-pill">{application.status}</span>
            <span className="mini-pill">{application.approvalStatus}</span>
          </div>
          <p className="muted">
            Prefill run at {new Date(application.createdAt).toLocaleString()} · Resume version:{" "}
            {resumeVersion?.headline ?? "unknown"}
          </p>
          <div className="button-row">
            {job ? (
              <Link className="button button-secondary" href={`/jobs/${job.id}`}>
                Back to job
              </Link>
            ) : null}
            {resumeVersion ? (
              <Link className="button button-secondary" href={`/resume-versions/${resumeVersion.id}`}>
                Open resume
              </Link>
            ) : null}
            {job ? (
              <button
                className="button button-secondary"
                type="button"
                onClick={handleRerunPrefill}
                disabled={rerunLoading}
              >
                {rerunLoading ? "Running another prefill..." : "Run another prefill"}
              </button>
            ) : null}
            <span className="inline-note">Submission is blocked until you approve.</span>
          </div>
        </div>
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Human approval"
        title="Review status"
        copy="This interface lets you gate the application before any final submit happens."
      >
        <div className="stack">
          {application.approvalStatus === "needs_revision" ? (
            <p className="muted">
              This run is marked for revision. Running another prefill creates a new application run and keeps this evidence intact.
            </p>
          ) : null}
          <textarea
            className="field-textarea"
            name="reviewNote"
            value={reviewNote}
            onChange={(event) => setReviewNote(event.target.value)}
            placeholder="Capture what should happen next before any later submit step."
          />
          {application.errorMessage ? (
            <p className="error-text">Worker error: {application.errorMessage}</p>
          ) : null}
          {approvalMessage ? <p className="success-text">{approvalMessage}</p> : null}
          {approvalError ? <p className="error-text">{approvalError}</p> : null}
          <div className="button-row">
            {approvalOptions.map((option) => (
              <button
                key={option.value}
                className={`button ${option.tone === "primary" ? "button-primary" : "button-secondary"}`}
                type="button"
                onClick={() => handleApproval(option.value)}
                disabled={approvalLoading}
              >
                {approvalLoading ? "Saving..." : option.label}
              </button>
            ))}
          </div>
          {application.approvalStatus === "approved_for_submit" ? (
            <div className="button-row">
              <Link className="button button-primary" href={`/applications/${application.id}/submission-review`}>
                Go to submission review
              </Link>
            </div>
          ) : null}
        </div>
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Automation session"
        title="Latest execution evidence"
        copy="This records the newest browser automation attempt that populated the review data below."
      >
        <AutomationSessionSummary
          session={latestAutomationSession}
          emptyCopy="No automation session has been captured for this application yet."
        />
      </Panel>

      <Panel
        className="span-12"
        eyebrow="Field results"
        title="What the worker tried to fill"
        copy="Results are grouped by field type so you can quickly review uploads, long answers, and basic form fields."
      >
        <ApplicationFieldResults
          results={application.fieldResults}
          emptyCopy="No field data captured yet."
          summaryTitle="Prefill summary"
        />
      </Panel>

      <div className="span-12 analysis-grid">
        <Panel
          className="span-7"
          eyebrow="Worker log"
          title="Playwright actions"
          copy="The log tracks when the job ran and whether it succeeded."
        >
          {application.workerLog.length === 0 ? (
            <div className="inline-note">No log entries captured.</div>
          ) : (
            <div className="stack">
              {application.workerLog.map((entry, idx) => (
                <div key={`${entry.message}-${idx}`} className="field-result-row">
                  <div className="pill-row">
                    <span className="mini-pill">{entry.level}</span>
                    {entry.timestamp ? (
                      <span className="mini-pill">{new Date(entry.timestamp).toLocaleString()}</span>
                    ) : null}
                  </div>
                  <p className="panel-copy">{entry.message}</p>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          className="span-5"
          eyebrow="Screenshots"
          title="Captured evidence"
          copy="Images show how far the worker got before stopping."
        >
          {screenshotFilenames.length === 0 ? (
            <div className="inline-note">No screenshots were captured.</div>
          ) : (
            <div className="application-screenshots">
              {screenshotFilenames.map((filename) => (
                <img
                  key={filename}
                  src={buildApplicationScreenshotUrl(application.id, filename)}
                  alt="Prefill screenshot"
                  className="application-screenshot"
                />
              ))}
            </div>
          )}
        </Panel>
      </div>
    </section>
  );
}
