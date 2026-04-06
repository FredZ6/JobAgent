"use client";

import React from "react";
import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "../../components/field";
import { Panel } from "../../components/panel";
import { getImportStatusLabel } from "../../lib/job-import-quality";
import { fetchJobs, importJob, type JobListItem } from "../../lib/api";

export default function JobsPage() {
  const router = useRouter();
  const [sourceUrl, setSourceUrl] = useState("");
  const [jobs, setJobs] = useState<JobListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadJobs() {
    try {
      const data = await fetchJobs();
      setJobs(data);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to load jobs");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    startTransition(loadJobs);
  }, []);

  async function onSubmit(formData: FormData) {
    setImporting(true);
    setMessage("");
    setError("");

    try {
      const payload = {
        sourceUrl: String(formData.get("sourceUrl") ?? "")
      };
      const created = await importJob(payload);
      setSourceUrl("");
      setMessage("Job imported. Open it to inspect the JD and trigger analysis.");
      await loadJobs();
      router.push(`/jobs/${created.id}`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to import job");
    } finally {
      setImporting(false);
    }
  }

  const jobsWithWarnings = jobs.filter((job) => job.importSummary?.hasWarnings).length;
  const jobsReadyForAnalysis = jobs.filter((job) => !job.latestAnalysis).length;

  return (
    <div className="workspace-page">
      <section className="workspace-hero-grid">
        <Panel
          className="workspace-hero-main"
          eyebrow="Intake"
          title="Role intake"
          copy="Bring new opportunities in deliberately, inspect the source quality, and only then move into deeper work."
        >
          <div className="queue-intro">
            <div className="queue-intro-item">
              <strong>One role at a time</strong>
              <p className="muted">Import stays explicit so the record starts with a URL you trust.</p>
            </div>
            <div className="queue-intro-item">
              <strong>Warnings stay attached</strong>
              <p className="muted">Fallbacks and importer issues remain visible instead of being hidden behind success states.</p>
            </div>
          </div>
          <form action={onSubmit} className="stack">
            <Field
              label="Job URL"
              name="sourceUrl"
              value={sourceUrl}
              onChange={setSourceUrl}
              placeholder="https://jobs.example.com/platform-engineer"
              description="Paste the original listing so Rolecraft can preserve provenance and import diagnostics."
            />
            <div className="button-row">
              <button className="button button-primary" type="submit" disabled={importing}>
                {importing ? "Importing..." : "Import job"}
              </button>
              {message ? <span className="success-text">{message}</span> : null}
              {error ? <span className="error-text">{error}</span> : null}
            </div>
          </form>
        </Panel>

        <Panel
          className="workspace-hero-aside"
          eyebrow="Queue status"
          title="Pipeline snapshot"
          copy="This page combines intake and queue scanning so you can judge where to spend effort next."
        >
          <div className="workspace-summary-list">
            <div className="workspace-summary-item">
              <strong>Total case files</strong>
              <p>{loading ? "Loading queue..." : `${jobs.length} imported roles in the current workspace.`}</p>
            </div>
            <div className="workspace-summary-item">
              <strong>Needs source review</strong>
              <p>{loading ? "Loading..." : `${jobsWithWarnings} roles currently carry import warnings.`}</p>
            </div>
            <div className="workspace-summary-item">
              <strong>Ready for analysis</strong>
              <p>{loading ? "Loading..." : `${jobsReadyForAnalysis} roles still need an analysis pass.`}</p>
            </div>
          </div>
        </Panel>
      </section>

      <section className="content-grid workspace-section-grid">
        <Panel
          className="span-12"
          eyebrow="Active records"
          title="Case queue"
          copy="Each role stays as a reviewable case file with import quality, analysis readiness, and resume progress visible at a glance."
        >
          {loading ? (
            <div className="inline-note">Loading imported jobs...</div>
          ) : jobs.length === 0 ? (
            <div className="inline-note">No jobs yet. Import one to start the loop.</div>
          ) : (
            <div className="job-list">
              {jobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="job-card">
                  <div className="job-card-head">
                    <div>
                      <h3>{job.title}</h3>
                      <p className="muted">
                        {job.company} · {job.location}
                      </p>
                    </div>
                    <span className="job-card-arrow">Open</span>
                  </div>
                  {job.importSummary ? (
                    <div className="pill-row">
                      <span className="mini-pill">{getImportStatusLabel(job.importSummary)}</span>
                    </div>
                  ) : null}
                  <p className="muted">{job.description.slice(0, 160)}...</p>
                  {job.latestAnalysis ? (
                    <div className="pill-row">
                      <span className="mini-pill">match {job.latestAnalysis.matchScore}</span>
                      <span className="mini-pill">{job.latestAnalysis.status}</span>
                    </div>
                  ) : (
                    <div className="inline-note">No analysis yet</div>
                  )}
                  {job.latestResumeVersion ? (
                    <div className="pill-row">
                      <span className="mini-pill">resume ready</span>
                      <span className="mini-pill">{job.latestResumeVersion.headline}</span>
                    </div>
                  ) : null}
                  <div className="job-card-footer muted">Open the case file to inspect evidence and trigger the next step.</div>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </section>
    </div>
  );
}
