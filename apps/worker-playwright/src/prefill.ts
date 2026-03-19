import { mkdirSync, existsSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";

type SelectablePage = Pick<Page, "$">;

export type PrefillRequest = {
  applicationId: string;
  applyUrl: string;
  profile: {
    fullName: string;
    email: string;
    phone: string;
    linkedinUrl: string;
    githubUrl: string;
    location: string;
  };
  resume: {
    id: string;
    headline: string;
    status: string;
    pdfDownloadUrl?: string;
    pdfFileName?: string;
  };
  job?: {
    id: string;
    title: string;
    company: string;
    location: string;
    description: string;
    applyUrl: string;
  };
  analysis?: {
    matchScore: number;
    summary: string;
    requiredSkills: unknown[];
    missingSkills: unknown[];
    redFlags: unknown[];
  } | null;
  defaultAnswers?: Record<string, string>;
};

export type FieldResult = {
  fieldName: string;
  fieldLabel?: string;
  fieldType?: "basic_text" | "resume_upload" | "long_text";
  questionText?: string;
  suggestedValue?: string;
  filled: boolean;
  status?: "filled" | "unhandled" | "failed" | "skipped";
  strategy?: string;
  source?: string;
  failureReason?: string;
  metadata?: Record<string, unknown>;
};

export type PrefillResponse = {
  status: "completed" | "failed";
  formSnapshot: Record<string, unknown>;
  fieldResults: FieldResult[];
  screenshotPaths: string[];
  workerLog: { level: string; message: string; timestamp?: string }[];
  errorMessage?: string;
};

export const buildSuggestions = (profile: PrefillRequest["profile"]) => ({
  name: profile.fullName,
  email: profile.email,
  phone: profile.phone,
  linkedin: profile.linkedinUrl,
  github: profile.githubUrl,
  location: profile.location
});

export async function fillCommonFields(page: Page, suggestions: ReturnType<typeof buildSuggestions>) {
  const fieldResults: FieldResult[] = [];

  for (const [field, value] of Object.entries(suggestions)) {
    if (!value) {
      fieldResults.push({
        fieldName: field,
        fieldType: "basic_text",
        filled: false,
        status: "skipped",
        strategy: "text_input",
        source: "profile",
        failureReason: "no suggestion"
      });
      continue;
    }
    const selectors = [
      `input[name*="${field}"]`,
      `input[id*="${field}"]`,
      `input[aria-label*="${field}"]`,
      `textarea[name*="${field}"]`
    ];

    let filled = false;
    for (const selector of selectors) {
      const element = await page.$(selector);
      if (!element) {
        continue;
      }
      await element.fill(value);
      filled = true;
      break;
    }

    fieldResults.push({
      fieldName: field,
      fieldType: "basic_text",
      suggestedValue: value,
      filled,
      status: filled ? "filled" : "failed",
      strategy: "text_input",
      source: "profile",
      failureReason: filled ? undefined : "selector not found"
    });
  }

  return fieldResults;
}

const standardUploadSelectors = [
  'input[type="file"][name*="resume" i]',
  'input[type="file"][id*="resume" i]',
  'input[type="file"][aria-label*="resume" i]',
  'input[type="file"][name*="cv" i]',
  'input[type="file"][id*="cv" i]',
  'input[type="file"][aria-label*="cv" i]',
  'input[type="file"]'
];

const dropzoneUploadSelectors = [
  '[data-testid*="dropzone" i] input[type="file"]',
  '[class*="dropzone" i] input[type="file"]',
  '[data-testid*="upload" i] input[type="file"]',
  '[class*="upload" i] input[type="file"]',
  '[aria-label*="upload" i] input[type="file"]'
];

function sanitizeUploadFileName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return sanitized.length > 0 ? sanitized : "resume.pdf";
}

async function findUploadElement(page: SelectablePage, selectors: string[]) {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

export async function downloadResumePdf(input: {
  applicationId: string;
  resume: PrefillRequest["resume"];
  tempBaseDir?: string;
}) {
  if (!input.resume.pdfDownloadUrl || !input.resume.pdfFileName) {
    throw new Error("resume pdf metadata unavailable");
  }

  const baseDir = input.tempBaseDir ?? join(tmpdir(), "openclaw-prefill");
  const targetDir = ensureStorage(input.applicationId, baseDir);
  const filePath = join(targetDir, sanitizeUploadFileName(input.resume.pdfFileName));
  const response = await fetch(input.resume.pdfDownloadUrl);

  if (!response.ok) {
    throw new Error(`resume pdf download failed (${response.status})`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  await writeFile(filePath, bytes);
  return filePath;
}

export async function uploadResume(
  page: SelectablePage,
  input: {
    applicationId: string;
    resume: PrefillRequest["resume"];
    tempBaseDir?: string;
  }
): Promise<FieldResult> {
  const metadata = {
    resumeVersionId: input.resume.id,
    fileName: input.resume.pdfFileName ?? `${input.resume.id}.pdf`,
    attemptedStrategies: [] as string[]
  };
  const suggestedValue = input.resume.pdfFileName ?? `${input.resume.id}.pdf`;

  if (!input.resume.pdfDownloadUrl || !input.resume.pdfFileName) {
    return {
      fieldName: "resume",
      fieldType: "resume_upload",
      suggestedValue,
      filled: false,
      status: "skipped",
      strategy: "file_input_then_dropzone",
      source: "resume_pdf",
      failureReason: "resume pdf metadata unavailable",
      metadata
    };
  }

  metadata.attemptedStrategies.push("file_input");
  const standardUpload = await findUploadElement(page, standardUploadSelectors);
  if (standardUpload && typeof (standardUpload as { setInputFiles?: unknown }).setInputFiles === "function") {
    try {
      const localFilePath = await downloadResumePdf(input);
      await (standardUpload as { setInputFiles(path: string): Promise<void> }).setInputFiles(localFilePath);

      return {
        fieldName: "resume",
        fieldType: "resume_upload",
        suggestedValue,
        filled: true,
        status: "filled",
        strategy: "file_input",
        source: "resume_pdf",
        metadata
      };
    } catch (error) {
      return {
        fieldName: "resume",
        fieldType: "resume_upload",
        suggestedValue,
        filled: false,
        status: "failed",
        strategy: "file_input",
        source: "resume_pdf",
        failureReason: (error as Error).message,
        metadata
      };
    }
  }

  metadata.attemptedStrategies.push("dropzone");
  const dropzoneUpload = await findUploadElement(page, dropzoneUploadSelectors);
  if (dropzoneUpload && typeof (dropzoneUpload as { setInputFiles?: unknown }).setInputFiles === "function") {
    try {
      const localFilePath = await downloadResumePdf(input);
      await (dropzoneUpload as { setInputFiles(path: string): Promise<void> }).setInputFiles(localFilePath);

      return {
        fieldName: "resume",
        fieldType: "resume_upload",
        suggestedValue,
        filled: true,
        status: "filled",
        strategy: "dropzone",
        source: "resume_pdf",
        metadata
      };
    } catch (error) {
      return {
        fieldName: "resume",
        fieldType: "resume_upload",
        suggestedValue,
        filled: false,
        status: "failed",
        strategy: "dropzone",
        source: "resume_pdf",
        failureReason: (error as Error).message,
        metadata
      };
    }
  }

  return {
    fieldName: "resume",
    fieldType: "resume_upload",
    suggestedValue,
    filled: false,
    status: "unhandled",
    strategy: "file_input_then_dropzone",
    source: "resume_pdf",
    failureReason: "no supported upload control found",
    metadata
  };
}

export function ensureStorage(applicationId: string, baseDir: string) {
  const targetDir = join(baseDir, applicationId);
  if (!existsSync(targetDir)) {
    mkdirSync(targetDir, { recursive: true });
  }
  return targetDir;
}

export async function captureScreenshot(page: Page, applicationId: string, baseDir: string) {
  const folder = ensureStorage(applicationId, baseDir);
  const screenshotPath = join(folder, "prefill.png");
  await page.screenshot({ path: screenshotPath, fullPage: true });
  return screenshotPath;
}
