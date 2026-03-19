"use client";

import { startTransition, useEffect, useState } from "react";
import { useParams } from "next/navigation";

import { Panel } from "../../../components/panel";
import {
  buildResumePdfInlineUrl,
  buildResumePdfUrl,
  type ResumePdfTemplate,
  fetchResumeVersion
} from "../../../lib/api";
import { type ResumeVersion } from "@openclaw/shared-types";

export default function ResumeVersionPage() {
  const params = useParams<{ id: string }>();
  const resumeVersionId = params?.id ?? "";
  const [resumeVersion, setResumeVersion] = useState<ResumeVersion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfTemplate, setPdfTemplate] = useState<ResumePdfTemplate>("classic");

  useEffect(() => {
    if (!resumeVersionId) {
      return;
    }

    startTransition(async () => {
      try {
        const data = await fetchResumeVersion(resumeVersionId);
        setResumeVersion(data);
      } catch (fetchError) {
        setError(fetchError instanceof Error ? fetchError.message : "Failed to load resume version");
      } finally {
        setLoading(false);
      }
    });
  }, [resumeVersionId]);

  return (
    <section className="content-grid">
      <Panel
        className="span-7"
        eyebrow="Resume review"
        title={resumeVersion?.headline ?? "Resume version"}
        copy={
          resumeVersion
            ? `Generated ${new Date(resumeVersion.createdAt).toLocaleString()}`
            : "Loading structured resume output..."
        }
      >
        {loading ? (
          <div className="inline-note">Loading resume version...</div>
        ) : error ? (
          <div className="error-text">{error}</div>
        ) : resumeVersion ? (
          <div className="stack">
            <div className="pill-row">
              <button
                type="button"
                className={`button ${pdfTemplate === "classic" ? "button-primary" : "button-secondary"}`}
                onClick={() => setPdfTemplate("classic")}
              >
                Classic
              </button>
              <button
                type="button"
                className={`button ${pdfTemplate === "modern" ? "button-primary" : "button-secondary"}`}
                onClick={() => setPdfTemplate("modern")}
              >
                Modern
              </button>
            </div>
            <div className="button-row">
              <a
                className="button button-secondary"
                href={buildResumePdfInlineUrl(resumeVersion.id, pdfTemplate)}
                target="_blank"
                rel="noreferrer"
              >
                Preview PDF
              </a>
              <a
                className="button button-secondary"
                href={buildResumePdfUrl(resumeVersion.id, pdfTemplate)}
              >
                Download PDF
              </a>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">PDF preview</div>
              <p className="panel-copy">
                If your browser does not render embedded PDFs here, use Preview PDF or Download PDF.
              </p>
              <iframe
                className="pdf-preview-frame"
                title="Resume PDF preview"
                src={buildResumePdfInlineUrl(resumeVersion.id, pdfTemplate)}
              />
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Professional summary</div>
              <p className="panel-copy">{resumeVersion.professionalSummary}</p>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Key skills</div>
              <div className="pill-row">
                {resumeVersion.skills.map((skill) => (
                  <span key={skill} className="mini-pill">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Experience</div>
              <div className="stack">
                {resumeVersion.experienceSections.map((section) => (
                  <div key={`${section.title}-${section.company}`} className="section-block">
                    <strong>
                      {section.title} · {section.company}
                    </strong>
                    <ul className="clean-list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Projects</div>
              <div className="stack">
                {resumeVersion.projectSections.map((section) => (
                  <div key={section.name} className="section-block">
                    <strong>{section.name}</strong>
                    <p className="panel-copy">{section.tagline}</p>
                    <ul className="clean-list">
                      {section.bullets.map((bullet) => (
                        <li key={bullet}>{bullet}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="inline-note">No resume version found.</div>
        )}
      </Panel>

      <Panel
        className="span-5"
        eyebrow="Change summary"
        title="What changed"
        copy="This section is meant to stay honest: it explains emphasis, not invention."
      >
        {resumeVersion ? (
          <div className="stack">
            <div className="analysis-card">
              <div className="eyebrow">Highlighted strengths</div>
              <div className="pill-row">
                {resumeVersion.changeSummary.highlightedStrengths.map((item) => (
                  <span key={item} className="mini-pill">
                    {item}
                  </span>
                ))}
              </div>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">De-emphasized items</div>
              <div className="stack">
                {resumeVersion.changeSummary.deemphasizedItems.length > 0 ? (
                  resumeVersion.changeSummary.deemphasizedItems.map((item) => (
                    <span key={item} className="muted">
                      {item}
                    </span>
                  ))
                ) : (
                  <span className="inline-note">Nothing was explicitly de-emphasized.</span>
                )}
              </div>
            </div>
            <div className="analysis-card">
              <div className="eyebrow">Notes</div>
              <div className="stack">
                {resumeVersion.changeSummary.notes.map((item) => (
                  <span key={item} className="muted">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="inline-note">Change summary becomes available after generation.</div>
        )}
      </Panel>
    </section>
  );
}
