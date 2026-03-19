import { describe, expect, it } from "vitest";

import {
  buildPrintableResumeDocument,
  buildResumePdfFileName,
  renderPrintableResumeHtml
} from "./resume-pdf.service.js";

describe("resume pdf helpers", () => {
  const profile = {
    fullName: "Lena Park",
    email: "lena@example.com",
    phone: "+1 555 0100",
    linkedinUrl: "https://linkedin.com/in/lenapark",
    githubUrl: "https://github.com/lenapark",
    location: "Winnipeg, MB",
    workAuthorization: "Open to Canadian roles",
    summary: "Thoughtful builder of workflow systems.",
    skills: ["TypeScript", "NestJS", "PostgreSQL"],
    experienceLibrary: [],
    projectLibrary: [],
    defaultAnswers: {}
  };

  const job = {
    id: "job_123",
    sourceUrl: "https://example.com/jobs/123",
    applyUrl: "https://example.com/apply/123",
    title: "Platform Engineer",
    company: "Orbital IO",
    location: "Remote",
    description: "Build internal platform tools.",
    rawText: "Build internal platform tools.",
    importStatus: "imported" as const,
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z"
  };

  const resumeVersion = {
    id: "resume_123",
    jobId: "job_123",
    sourceProfileId: "profile_123",
    status: "completed" as const,
    headline: "Platform Engineer",
    professionalSummary: "Builder of stable internal tooling.",
    skills: ["TypeScript", "NestJS", "Developer Experience"],
    experienceSections: [
      {
        title: "Senior Software Engineer",
        company: "North Star Labs",
        bullets: ["Built workflow tooling", "Reduced support load with internal automation"]
      }
    ],
    projectSections: [
      {
        name: "OpenClaw",
        tagline: "A job workflow copilot",
        bullets: ["Structured role analysis", "Grounded tailored resume generation"]
      }
    ],
    changeSummary: {
      highlightedStrengths: ["Workflow design"],
      deemphasizedItems: [],
      notes: ["No fabricated experience"]
    },
    structuredContent: {
      headline: "Platform Engineer",
      professionalSummary: "Builder of stable internal tooling.",
      keySkills: ["TypeScript", "NestJS", "Developer Experience"],
      experience: [
        {
          title: "Senior Software Engineer",
          company: "North Star Labs",
          bullets: ["Built workflow tooling"]
        }
      ],
      projects: [
        {
          name: "OpenClaw",
          tagline: "A job workflow copilot",
          bullets: ["Structured role analysis"]
        }
      ],
      changeSummary: {
        highlightedStrengths: ["Workflow design"],
        deemphasizedItems: [],
        notes: ["No fabricated experience"]
      }
    },
    errorMessage: null,
    createdAt: "2026-03-16T00:00:00.000Z",
    updatedAt: "2026-03-16T00:00:00.000Z"
  };

  it("builds a printable document model from a completed resume version", () => {
    const result = buildPrintableResumeDocument({
      profile,
      job,
      resumeVersion
    });

    expect(result.name).toBe("Lena Park");
    expect(result.headerLinks).toEqual([
      "linkedin.com/in/lenapark",
      "github.com/lenapark"
    ]);
    expect(result.skills).toEqual(["TypeScript", "NestJS", "Developer Experience"]);
    expect(result.experience[0]?.title).toBe("Senior Software Engineer");
    expect(result.projects[0]?.name).toBe("OpenClaw");
  });

  it("rejects pdf export when the resume version is not completed", () => {
    expect(() =>
      buildPrintableResumeDocument({
        profile,
        job,
        resumeVersion: {
          ...resumeVersion,
          status: "draft"
        }
      })
    ).toThrowError(/completed/i);
  });

  it("builds a stable slugged pdf filename", () => {
    const filename = buildResumePdfFileName({
      fullName: "Lena Park",
      company: "Orbital IO",
      title: "Platform Engineer"
    });

    expect(filename).toBe("lena-park-orbital-io-platform-engineer-resume.pdf");
  });

  it("renders different html markers for classic and modern templates", () => {
    const document = buildPrintableResumeDocument({
      profile,
      job,
      resumeVersion
    });

    const classicHtml = renderPrintableResumeHtml(document, "classic");
    const modernHtml = renderPrintableResumeHtml(document, "modern");

    expect(classicHtml).toContain('class="hero"');
    expect(modernHtml).toContain('class="modern-shell"');
    expect(modernHtml).not.toBe(classicHtml);
  });
});
