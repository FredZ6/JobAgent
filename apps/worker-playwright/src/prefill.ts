import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";

type UploadTarget = {
  $(selector: string): Promise<UploadTarget | null>;
  setInputFiles?: (path: string) => Promise<void>;
  dispatchEvent?: (event: string, eventInit?: { dataTransfer?: unknown }) => Promise<void>;
};

type DisposableHandle = {
  dispose?: () => Promise<void> | void;
};

type SelectablePage = {
  $(selector: string): Promise<UploadTarget | null>;
  $$(selector: string): Promise<UploadTarget[]>;
  evaluateHandle?: (
    pageFunction: (arg: { bytes: number[]; fileName: string }) => unknown,
    arg: { bytes: number[]; fileName: string }
  ) => Promise<DisposableHandle>;
};

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

const standardUploadSelectors = [
  'input[type="file"][name*="resume" i]',
  'input[type="file"][id*="resume" i]',
  'input[type="file"][aria-label*="resume" i]',
  'input[type="file"][name*="cv" i]',
  'input[type="file"][id*="cv" i]',
  'input[type="file"][aria-label*="cv" i]'
];

const dropzoneSelectors = [
  '[data-testid*="dropzone" i]',
  '[class*="dropzone" i]',
  '[class*="drop-zone" i]',
  '[data-testid*="upload" i]',
  '[aria-label*="upload" i]'
];

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

function sanitizeUploadFileName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return sanitized.length > 0 ? sanitized : "resume.pdf";
}

function buildResumeUploadResult(input: {
  resumeId: string;
  fileName: string;
  attemptedStrategies: string[];
  filled: boolean;
  status: FieldResult["status"];
  strategy: FieldResult["strategy"];
  failureReason?: string;
}) {
  return {
    fieldName: "resume",
    fieldType: "resume_upload" as const,
    suggestedValue: input.fileName,
    filled: input.filled,
    status: input.status,
    strategy: input.strategy,
    source: "resume_pdf",
    failureReason: input.failureReason,
    metadata: {
      resumeVersionId: input.resumeId,
      fileName: input.fileName,
      attemptedStrategies: input.attemptedStrategies
    }
  };
}

async function findFirstMatchingTarget(page: Pick<SelectablePage, "$">, selectors: string[]) {
  for (const selector of selectors) {
    const element = await page.$(selector);
    if (element) {
      return element;
    }
  }

  return null;
}

async function findSingleGenericFileInput(page: Pick<SelectablePage, "$$">) {
  const inputs = await page.$$('input[type="file"]');
  return inputs.length === 1 ? inputs[0] : null;
}

async function dispatchDropzoneUpload(
  page: SelectablePage,
  target: UploadTarget,
  filePath: string,
  fileName: string
) {
  if (!page.evaluateHandle || !target.dispatchEvent) {
    return false;
  }

  const bytes = Array.from(await readFile(filePath));
  const dataTransfer = await page.evaluateHandle(
    ({ bytes: uploadBytes, fileName: uploadFileName }) => {
      const transfer = new DataTransfer();
      const file = new File([new Uint8Array(uploadBytes)], uploadFileName, {
        type: "application/pdf"
      });
      transfer.items.add(file);
      return transfer;
    },
    { bytes, fileName }
  );

  try {
    await target.dispatchEvent("dragenter", { dataTransfer });
    await target.dispatchEvent("dragover", { dataTransfer });
    await target.dispatchEvent("drop", { dataTransfer });
    return true;
  } finally {
    if (typeof dataTransfer.dispose === "function") {
      await dataTransfer.dispose();
    }
  }
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
  const fileName = input.resume.pdfFileName ?? `${input.resume.id}.pdf`;
  const attemptedStrategies: string[] = [];

  if (!input.resume.pdfDownloadUrl || !input.resume.pdfFileName) {
    return buildResumeUploadResult({
      resumeId: input.resume.id,
      fileName,
      attemptedStrategies,
      filled: false,
      status: "skipped",
      strategy: "file_input_then_dropzone",
      failureReason: "resume pdf metadata unavailable"
    });
  }

  let localFilePath: string | undefined;
  const ensureDownloadedFile = async () => {
    if (!localFilePath) {
      localFilePath = await downloadResumePdf(input);
    }

    return localFilePath;
  };

  attemptedStrategies.push("file_input");
  const standardInput =
    (await findFirstMatchingTarget(page, standardUploadSelectors)) ?? (await findSingleGenericFileInput(page));

  if (standardInput && typeof standardInput.setInputFiles === "function") {
    const filePath = await ensureDownloadedFile();

    try {
      await standardInput.setInputFiles(filePath);
      return buildResumeUploadResult({
        resumeId: input.resume.id,
        fileName,
        attemptedStrategies,
        filled: true,
        status: "filled",
        strategy: "file_input"
      });
    } catch (error) {
      attemptedStrategies.push("dropzone");
      const dropzoneTarget = await findFirstMatchingTarget(page, dropzoneSelectors);

      if (dropzoneTarget) {
        const nestedInput = await dropzoneTarget.$('input[type="file"]');
        if (nestedInput && typeof nestedInput.setInputFiles === "function") {
          await nestedInput.setInputFiles(filePath);
          return buildResumeUploadResult({
            resumeId: input.resume.id,
            fileName,
            attemptedStrategies,
            filled: true,
            status: "filled",
            strategy: "dropzone"
          });
        }

        if (await dispatchDropzoneUpload(page, dropzoneTarget, filePath, fileName)) {
          return buildResumeUploadResult({
            resumeId: input.resume.id,
            fileName,
            attemptedStrategies,
            filled: true,
            status: "filled",
            strategy: "dropzone"
          });
        }
      }

      return buildResumeUploadResult({
        resumeId: input.resume.id,
        fileName,
        attemptedStrategies,
        filled: false,
        status: "failed",
        strategy: "file_input_then_dropzone",
        failureReason: (error as Error).message
      });
    }
  }

  attemptedStrategies.push("dropzone");
  const dropzoneTarget = await findFirstMatchingTarget(page, dropzoneSelectors);
  if (dropzoneTarget) {
    const filePath = await ensureDownloadedFile();
    const nestedInput = await dropzoneTarget.$('input[type="file"]');

    if (nestedInput && typeof nestedInput.setInputFiles === "function") {
      await nestedInput.setInputFiles(filePath);
      return buildResumeUploadResult({
        resumeId: input.resume.id,
        fileName,
        attemptedStrategies,
        filled: true,
        status: "filled",
        strategy: "dropzone"
      });
    }

    if (await dispatchDropzoneUpload(page, dropzoneTarget, filePath, fileName)) {
      return buildResumeUploadResult({
        resumeId: input.resume.id,
        fileName,
        attemptedStrategies,
        filled: true,
        status: "filled",
        strategy: "dropzone"
      });
    }
  }

  return buildResumeUploadResult({
    resumeId: input.resume.id,
    fileName,
    attemptedStrategies,
    filled: false,
    status: "unhandled",
    strategy: "file_input_then_dropzone",
    failureReason: "resume upload control not found"
  });
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
