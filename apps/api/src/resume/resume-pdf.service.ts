import { ConflictException, Inject, Injectable, NotFoundException } from "@nestjs/common";
import { resolveChromiumRuntime } from "@rolecraft/config";
import {
  candidateProfileSchema,
  jobSchema,
  resumeVersionSchema,
  type CandidateProfile,
  type JobDto,
  type ResumeVersion
} from "@rolecraft/shared-types";
import { chromium } from "playwright";

import { PrismaService } from "../lib/prisma.service.js";

export const resumePdfTemplateSchema = ["classic", "modern"] as const;
export type ResumePdfTemplate = (typeof resumePdfTemplateSchema)[number];

export type PrintableResumeDocument = {
  name: string;
  title: string;
  company: string;
  location: string;
  email: string;
  phone: string;
  contactLine: string[];
  headerLinks: string[];
  headline: string;
  professionalSummary: string;
  skills: string[];
  experience: ResumeVersion["experienceSections"];
  projects: ResumeVersion["projectSections"];
};

type PrintableResumeInput = {
  profile: CandidateProfile;
  job: JobDto;
  resumeVersion: ResumeVersion;
};

export function buildPrintableResumeDocument({
  profile,
  job,
  resumeVersion
}: PrintableResumeInput): PrintableResumeDocument {
  if (resumeVersion.status !== "completed") {
    throw new ConflictException("Only completed resume versions can be exported to PDF.");
  }

  return {
    name: profile.fullName,
    title: job.title,
    company: job.company,
    location: profile.location,
    email: profile.email,
    phone: profile.phone,
    contactLine: [profile.email, profile.phone, profile.location].filter(Boolean),
    headerLinks: [profile.linkedinUrl, profile.githubUrl].filter(Boolean).map(stripProtocol),
    headline: resumeVersion.headline,
    professionalSummary: resumeVersion.professionalSummary,
    skills: resumeVersion.skills,
    experience: resumeVersion.experienceSections,
    projects: resumeVersion.projectSections
  };
}

export function buildResumePdfFileName(input: {
  fullName: string;
  company: string;
  title: string;
}) {
  const base = [input.fullName, input.company, input.title, "resume"].map(slugify).filter(Boolean).join("-");

  return `${base || "resume"}.pdf`;
}

function renderClassicResumeHtml(document: PrintableResumeDocument) {
  const experienceHtml = document.experience
    .map(
      (section) => `
        <section class="section">
          <div class="section-header">
            <h3>${escapeHtml(section.title)}</h3>
            <span>${escapeHtml(section.company)}</span>
          </div>
          <ul>
            ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");

  const projectsHtml = document.projects
    .map(
      (section) => `
        <section class="section">
          <div class="section-header">
            <h3>${escapeHtml(section.name)}</h3>
            <span>${escapeHtml(section.tagline)}</span>
          </div>
          <ul>
            ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.name)} - ${escapeHtml(document.title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #f4f0ea;
        color: #1e1b18;
      }

      .page {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        padding: 0.55in 0.65in 0.6in;
        background: #fffdf8;
      }

      .hero {
        border-bottom: 1px solid #d7cec1;
        padding-bottom: 0.22in;
        margin-bottom: 0.24in;
      }

      h1 {
        margin: 0;
        font-size: 26px;
        line-height: 1.1;
      }

      .headline {
        margin-top: 8px;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
        color: #6f5a45;
      }

      .meta,
      .links {
        margin-top: 10px;
        font-size: 11px;
        color: #5a4a3c;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      .meta span::after,
      .links span::after {
        content: "•";
        margin-left: 8px;
      }

      .meta span:last-child::after,
      .links span:last-child::after {
        content: "";
        margin: 0;
      }

      .block {
        margin-top: 0.2in;
      }

      h2 {
        margin: 0 0 10px;
        font-size: 12px;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #7f6247;
      }

      p,
      li {
        margin: 0;
        font-size: 11px;
        line-height: 1.5;
      }

      .skills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .skill {
        padding: 4px 8px;
        border: 1px solid #d7cec1;
        border-radius: 999px;
        font-size: 10px;
      }

      .section {
        margin-top: 12px;
      }

      .section-header {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        align-items: baseline;
        margin-bottom: 6px;
      }

      .section-header h3 {
        margin: 0;
        font-size: 12px;
      }

      ul {
        margin: 0;
        padding-left: 16px;
      }
    </style>
  </head>
  <body>
    <main class="page">
      <header class="hero">
        <h1>${escapeHtml(document.name)}</h1>
        <div class="headline">${escapeHtml(document.headline)}</div>
        <div class="meta">
          ${document.contactLine.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        ${
          document.headerLinks.length > 0
            ? `<div class="links">${document.headerLinks
                .map((item) => `<span>${escapeHtml(item)}</span>`)
                .join("")}</div>`
            : ""
        }
      </header>

      <section class="block">
        <h2>Professional Summary</h2>
        <p>${escapeHtml(document.professionalSummary)}</p>
      </section>

      ${
        document.skills.length > 0
          ? `<section class="block">
              <h2>Key Skills</h2>
              <div class="skills">
                ${document.skills.map((item) => `<span class="skill">${escapeHtml(item)}</span>`).join("")}
              </div>
            </section>`
          : ""
      }

      ${
        document.experience.length > 0
          ? `<section class="block">
              <h2>Experience</h2>
              ${experienceHtml}
            </section>`
          : ""
      }

      ${
        document.projects.length > 0
          ? `<section class="block">
              <h2>Projects</h2>
              ${projectsHtml}
            </section>`
          : ""
      }
    </main>
  </body>
</html>`;
}

function renderModernResumeHtml(document: PrintableResumeDocument) {
  const experienceHtml = document.experience
    .map(
      (section) => `
        <section class="modern-item">
          <h3>${escapeHtml(section.title)}</h3>
          <div class="modern-meta">${escapeHtml(section.company)}</div>
          <ul>
            ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");

  const projectsHtml = document.projects
    .map(
      (section) => `
        <section class="modern-item">
          <h3>${escapeHtml(section.name)}</h3>
          <div class="modern-meta">${escapeHtml(section.tagline)}</div>
          <ul>
            ${section.bullets.map((bullet) => `<li>${escapeHtml(bullet)}</li>`).join("")}
          </ul>
        </section>
      `
    )
    .join("");

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(document.name)} - ${escapeHtml(document.title)}</title>
    <style>
      :root {
        color-scheme: light;
        font-family: "Avenir Next", "Helvetica Neue", Helvetica, Arial, sans-serif;
      }

      * {
        box-sizing: border-box;
      }

      body {
        margin: 0;
        background: #ebe7df;
        color: #1f1a16;
      }

      .modern-shell {
        width: 8.5in;
        min-height: 11in;
        margin: 0 auto;
        background: linear-gradient(180deg, #f9f6ef 0%, #fffdfa 22%);
        padding: 0.42in;
      }

      .modern-grid {
        display: grid;
        grid-template-columns: 2.1fr 1fr;
        gap: 20px;
      }

      .modern-hero {
        padding: 18px 20px;
        border-radius: 22px;
        background: #1f3a36;
        color: #f7f4ee;
      }

      .modern-hero h1 {
        margin: 0;
        font-size: 28px;
        line-height: 1.08;
      }

      .modern-headline {
        margin-top: 10px;
        font-size: 13px;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: #d8e5df;
      }

      .modern-contact,
      .modern-links {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 10px;
        font-size: 11px;
      }

      .modern-card,
      .modern-sidebar {
        background: #fffdfa;
        border: 1px solid rgba(31, 26, 22, 0.08);
        border-radius: 20px;
        padding: 16px 18px;
      }

      .modern-sidebar {
        background: #f5efe4;
      }

      .modern-stack {
        display: grid;
        gap: 14px;
      }

      .modern-section-title {
        margin: 0 0 8px;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.14em;
        color: #7a6048;
      }

      .modern-card p,
      .modern-sidebar p,
      .modern-card li,
      .modern-sidebar li {
        margin: 0;
        font-size: 11px;
        line-height: 1.55;
      }

      .modern-skills {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }

      .modern-skill {
        padding: 5px 8px;
        border-radius: 999px;
        background: #1f3a36;
        color: #f7f4ee;
        font-size: 10px;
      }

      .modern-item {
        margin-top: 10px;
      }

      .modern-item h3 {
        margin: 0;
        font-size: 12px;
      }

      .modern-meta {
        margin-top: 4px;
        margin-bottom: 6px;
        font-size: 10px;
        color: #70553d;
      }

      ul {
        margin: 0;
        padding-left: 16px;
      }
    </style>
  </head>
  <body>
    <main class="modern-shell">
      <header class="modern-hero">
        <h1>${escapeHtml(document.name)}</h1>
        <div class="modern-headline">${escapeHtml(document.headline)}</div>
        <div class="modern-contact">
          ${document.contactLine.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}
        </div>
        ${
          document.headerLinks.length > 0
            ? `<div class="modern-links">${document.headerLinks
                .map((item) => `<span>${escapeHtml(item)}</span>`)
                .join("")}</div>`
            : ""
        }
      </header>

      <section class="modern-grid" style="margin-top: 16px;">
        <div class="modern-stack">
          <section class="modern-card">
            <h2 class="modern-section-title">Professional Summary</h2>
            <p>${escapeHtml(document.professionalSummary)}</p>
          </section>

          ${
            document.experience.length > 0
              ? `<section class="modern-card">
                  <h2 class="modern-section-title">Experience</h2>
                  ${experienceHtml}
                </section>`
              : ""
          }

          ${
            document.projects.length > 0
              ? `<section class="modern-card">
                  <h2 class="modern-section-title">Projects</h2>
                  ${projectsHtml}
                </section>`
              : ""
          }
        </div>

        <aside class="modern-sidebar">
          <div class="modern-stack">
            <section>
              <h2 class="modern-section-title">Target Role</h2>
              <p>${escapeHtml(document.title)}</p>
              <p>${escapeHtml(document.company)}</p>
            </section>

            ${
              document.skills.length > 0
                ? `<section>
                    <h2 class="modern-section-title">Key Skills</h2>
                    <div class="modern-skills">
                      ${document.skills
                        .map((item) => `<span class="modern-skill">${escapeHtml(item)}</span>`)
                        .join("")}
                    </div>
                  </section>`
                : ""
            }
          </div>
        </aside>
      </section>
    </main>
  </body>
</html>`;
}

export function renderPrintableResumeHtml(
  document: PrintableResumeDocument,
  template: ResumePdfTemplate = "classic"
) {
  return template === "modern"
    ? renderModernResumeHtml(document)
    : renderClassicResumeHtml(document);
}

@Injectable()
export class ResumePdfService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  async renderPrintHtml(id: string, template: ResumePdfTemplate = "classic") {
    const document = await this.getPrintableResumeDocument(id);

    return renderPrintableResumeHtml(document, template);
  }

  async renderPdf(id: string, template: ResumePdfTemplate = "classic") {
    const document = await this.getPrintableResumeDocument(id);
    const html = renderPrintableResumeHtml(document, template);
    const chromiumRuntime = resolveChromiumRuntime(process.env);

    if (!chromiumRuntime.resolvedExecutablePath) {
      const configuredHint = chromiumRuntime.configuredPath
        ? ` Configured CHROMIUM_EXECUTABLE_PATH was not found at ${chromiumRuntime.configuredPath}.`
        : "";
      throw new ConflictException(
        `Chromium executable not found for PDF rendering.${configuredHint} Set CHROMIUM_EXECUTABLE_PATH or install Chromium in one of: ${chromiumRuntime.knownPaths.join(", ")}.`
      );
    }

    const browser = await chromium.launch({
      headless: true,
      executablePath: chromiumRuntime.resolvedExecutablePath
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: "load"
      });

      const buffer = await page.pdf({
        format: "Letter",
        printBackground: true,
        margin: {
          top: "0.35in",
          right: "0.35in",
          bottom: "0.35in",
          left: "0.35in"
        }
      });

      return {
        buffer,
        filename: buildResumePdfFileName({
          fullName: document.name,
          company: document.company,
          title: document.title
        })
      };
    } finally {
      await browser.close();
    }
  }

  async getPrintableResumeDocument(id: string) {
    const version = await this.prisma.resumeVersion.findUnique({
      where: { id },
      include: {
        job: true,
        sourceProfile: true
      }
    });

    if (!version) {
      throw new NotFoundException("Resume version not found");
    }

    const profile = candidateProfileSchema.parse({
      fullName: version.sourceProfile.fullName,
      email: version.sourceProfile.email,
      phone: version.sourceProfile.phone,
      linkedinUrl: version.sourceProfile.linkedinUrl,
      githubUrl: version.sourceProfile.githubUrl,
      location: version.sourceProfile.location,
      workAuthorization: version.sourceProfile.workAuthorization,
      summary: version.sourceProfile.summary,
      skills: version.sourceProfile.skills,
      experienceLibrary: version.sourceProfile.experienceLibrary,
      projectLibrary: version.sourceProfile.projectLibrary,
      defaultAnswers: version.sourceProfile.defaultAnswers
    });

    const job = jobSchema.parse({
      id: version.job.id,
      sourceUrl: version.job.sourceUrl,
      applyUrl: version.job.applyUrl,
      title: version.job.title,
      company: version.job.company,
      location: version.job.location,
      description: version.job.description,
      rawText: version.job.rawText,
      importStatus: version.job.importStatus,
      createdAt: version.job.createdAt.toISOString(),
      updatedAt: version.job.updatedAt.toISOString()
    });

    const resumeVersion = resumeVersionSchema.parse({
      id: version.id,
      jobId: version.jobId,
      sourceProfileId: version.sourceProfileId,
      status: version.status,
      headline: version.headline,
      professionalSummary: version.professionalSummary,
      skills: version.skills,
      experienceSections: version.experienceSections,
      projectSections: version.projectSections,
      changeSummary: version.changeSummary,
      structuredContent: version.structuredContent,
      errorMessage: version.errorMessage,
      createdAt: version.createdAt.toISOString(),
      updatedAt: version.updatedAt.toISOString()
    });

    return buildPrintableResumeDocument({
      profile,
      job,
      resumeVersion
    });
  }
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+/g, "")
    .replace(/-+$/g, "");
}

function stripProtocol(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}
