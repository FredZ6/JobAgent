"use client";

import Link from "next/link";
import { startTransition, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Field } from "../../components/field";
import { Panel } from "../../components/panel";
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

  return (
    <section className="content-grid">
      <Panel
        className="span-5"
        eyebrow="Import"
        title="Bring in a job"
        copy="Round one is explicit on purpose: import first, inspect second, analyze third."
      >
        <form action={onSubmit} className="stack">
          <Field
            label="Job URL"
            name="sourceUrl"
            value={sourceUrl}
            onChange={setSourceUrl}
            placeholder="https://jobs.example.com/platform-engineer"
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
        className="span-7"
        eyebrow="Imported jobs"
        title="Jobs"
        copy="Every imported role stays reviewable, so analysis is something you intentionally run and revisit."
      >
        {loading ? (
          <div className="inline-note">Loading imported jobs...</div>
        ) : jobs.length === 0 ? (
          <div className="inline-note">No jobs yet. Import one to start the loop.</div>
        ) : (
          <div className="job-list">
            {jobs.map((job) => (
              <Link key={job.id} href={`/jobs/${job.id}`} className="job-card">
                <h3>{job.title}</h3>
                <p className="muted">
                  {job.company} · {job.location}
                </p>
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
              </Link>
            ))}
          </div>
        )}
      </Panel>
    </section>
  );
}
