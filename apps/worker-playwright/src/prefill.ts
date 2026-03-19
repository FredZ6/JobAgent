import { existsSync, mkdirSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { Page } from "playwright";

type UploadTarget = {
  $(selector: string): Promise<UploadTarget | null>;
  setInputFiles?: (path: string) => Promise<void>;
  dispatchEvent?: (event: string, eventInit?: { dataTransfer?: unknown }) => Promise<void>;
  getAttribute?: (name: string) => Promise<string | null>;
  fill?: (value: string) => Promise<void>;
  evaluate?: (
    pageFunction: (element: unknown, value: string) => unknown,
    value: string
  ) => Promise<unknown>;
  textContent?: () => Promise<string | null>;
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

type LongAnswerTarget = {
  element: UploadTarget;
  fieldName: string;
  fieldLabel?: string;
  questionText: string;
  strategy: "textarea" | "contenteditable";
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

function sanitizeUploadFileName(fileName: string) {
  const sanitized = fileName.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return sanitized.length > 0 ? sanitized : "resume.pdf";
}

function trimToUndefined(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
}

function normalizeLongAnswerFieldName(value: string) {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  return normalized.length > 0 ? normalized : "long_answer";
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

async function describeLongAnswerTarget(
  page: Pick<SelectablePage, "$">,
  element: UploadTarget,
  strategy: LongAnswerTarget["strategy"]
): Promise<LongAnswerTarget | null> {
  const id = trimToUndefined(await element.getAttribute?.("id"));
  const name = trimToUndefined(await element.getAttribute?.("name"));
  const placeholder = trimToUndefined(await element.getAttribute?.("placeholder"));
  const ariaLabel = trimToUndefined(await element.getAttribute?.("aria-label"));
  const dataTestId = trimToUndefined(await element.getAttribute?.("data-testid"));
  const labelText =
    id && page.$
      ? trimToUndefined(await (await page.$(`label[for="${id}"]`))?.textContent?.())
      : undefined;
  const fieldLabel = labelText ?? ariaLabel ?? placeholder;
  const questionText = fieldLabel ?? placeholder ?? ariaLabel ?? name ?? dataTestId ?? id;

  if (!questionText) {
    return null;
  }

  return {
    element,
    fieldName: normalizeLongAnswerFieldName(name ?? id ?? questionText),
    fieldLabel,
    questionText,
    strategy
  };
}

async function collectLongAnswerTargets(page: SelectablePage) {
  const targets: LongAnswerTarget[] = [];

  for (const textarea of await page.$$("textarea")) {
    const target = await describeLongAnswerTarget(page, textarea, "textarea");
    if (target) {
      targets.push(target);
    }
  }

  for (const editable of await page.$$('[contenteditable="true"], [contenteditable="plaintext-only"]')) {
    const target = await describeLongAnswerTarget(page, editable, "contenteditable");
    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

function buildLongAnswerApiUrl(applicationId: string, resume: PrefillRequest["resume"]) {
  if (resume.pdfDownloadUrl) {
    const resumeUrl = new URL(resume.pdfDownloadUrl);
    const basePath = resumeUrl.pathname
      .replace(/\/resume-versions\/[^/]+\/pdf(?:\/inline)?$/, "")
      .replace(/\/$/, "");
    return `${resumeUrl.origin}${basePath}/internal/applications/${applicationId}/generate-long-answers`;
  }

  const baseUrl = (process.env.API_URL ?? "http://localhost:3001").replace(/\/$/, "");
  return `${baseUrl}/internal/applications/${applicationId}/generate-long-answers`;
}

async function requestLongAnswers(
  input: {
    applicationId: string;
    resume: PrefillRequest["resume"];
  },
  targets: LongAnswerTarget[]
) {
  const response = await fetch(buildLongAnswerApiUrl(input.applicationId, input.resume), {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-internal-token": process.env.JWT_SECRET ?? ""
    },
    body: JSON.stringify({
      questions: targets.map((target) => ({
        fieldName: target.fieldName,
        fieldLabel: target.fieldLabel,
        questionText: target.questionText,
        hints: [target.fieldLabel, target.questionText].filter(
          (value): value is string => typeof value === "string" && value.trim().length > 0
        )
      }))
    })
  });

  if (!response.ok) {
    const responseText =
      typeof response.text === "function" ? trimToUndefined(await response.text()) : undefined;
    throw new Error(
      responseText
        ? `long-answer generation failed (${response.status}): ${responseText}`
        : `long-answer generation failed (${response.status})`
    );
  }

  const payload = (await response.json()) as {
    answers?: Array<{
      fieldName: string;
      fieldLabel?: string;
      questionText?: string;
      decision?: "fill" | "manual_review_required";
      answer?: string;
      source: string;
      manualReason?: string;
      matchedRiskCategory?: string;
    }>;
  };

  if (!Array.isArray(payload.answers)) {
    throw new Error("invalid long-answer response");
  }

  return payload.answers;
}

async function fillDetectedLongAnswer(target: LongAnswerTarget, answer: string) {
  if (target.strategy === "textarea") {
    if (typeof target.element.fill !== "function") {
      throw new Error("textarea fill is unavailable");
    }

    await target.element.fill(answer);
    return;
  }

  if (typeof target.element.evaluate === "function") {
    await target.element.evaluate((element, value) => {
      const node = element as {
        textContent: string | null;
        dispatchEvent?: (event: Event) => boolean;
      };
      node.textContent = value;
      node.dispatchEvent?.(new Event("input", { bubbles: true }));
      node.dispatchEvent?.(new Event("change", { bubbles: true }));
    }, answer);
    return;
  }

  if (typeof target.element.fill === "function") {
    await target.element.fill(answer);
    return;
  }

  throw new Error("contenteditable fill is unavailable");
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

    try {
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
    } catch (error) {
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

export async function fillLongAnswerFields(
  page: SelectablePage,
  input: {
    applicationId: string;
    resume: PrefillRequest["resume"];
  }
): Promise<FieldResult[]> {
  const targets = await collectLongAnswerTargets(page);

  if (targets.length === 0) {
    return [];
  }

  try {
    const answers = await requestLongAnswers(input, targets);
    const answersByField = new Map(answers.map((answer) => [answer.fieldName, answer]));
    const results: FieldResult[] = [];

    for (const target of targets) {
      const answer = answersByField.get(target.fieldName);

      if (!answer) {
        results.push({
          fieldName: target.fieldName,
          fieldLabel: target.fieldLabel,
          fieldType: "long_text",
          questionText: target.questionText,
          suggestedValue: "",
          filled: false,
          status: "failed",
          strategy: target.strategy,
          source: "answer_missing",
          failureReason: "answer not returned"
        });
        continue;
      }

      if (answer.decision === "manual_review_required") {
        results.push({
          fieldName: target.fieldName,
          fieldLabel: target.fieldLabel ?? answer.fieldLabel,
          fieldType: "long_text",
          questionText: target.questionText,
          suggestedValue: "",
          filled: false,
          status: "unhandled",
          strategy: target.strategy,
          source: answer.source,
          failureReason: answer.manualReason ?? "manual review required",
          metadata: answer.matchedRiskCategory
            ? {
                matchedRiskCategory: answer.matchedRiskCategory
              }
            : undefined
        });
        continue;
      }

      const normalizedAnswer = typeof answer.answer === "string" ? trimToUndefined(answer.answer) : undefined;

      if (!normalizedAnswer) {
        results.push({
          fieldName: target.fieldName,
          fieldLabel: target.fieldLabel ?? answer.fieldLabel,
          fieldType: "long_text",
          questionText: target.questionText,
          suggestedValue: "",
          filled: false,
          status: "failed",
          strategy: target.strategy,
          source: "answer_missing",
          failureReason: "answer not returned"
        });
        continue;
      }

      try {
        await fillDetectedLongAnswer(target, normalizedAnswer);
        results.push({
          fieldName: target.fieldName,
          fieldLabel: target.fieldLabel ?? answer.fieldLabel,
          fieldType: "long_text",
          questionText: target.questionText,
          suggestedValue: normalizedAnswer,
          filled: true,
          status: "filled",
          strategy: target.strategy,
          source: answer.source
        });
      } catch (error) {
        results.push({
          fieldName: target.fieldName,
          fieldLabel: target.fieldLabel ?? answer.fieldLabel,
          fieldType: "long_text",
          questionText: target.questionText,
          suggestedValue: normalizedAnswer,
          filled: false,
          status: "failed",
          strategy: target.strategy,
          source: answer.source,
          failureReason: (error as Error).message
        });
      }
    }

    return results;
  } catch (error) {
    return targets.map((target) => ({
      fieldName: target.fieldName,
      fieldLabel: target.fieldLabel,
      fieldType: "long_text",
      questionText: target.questionText,
      suggestedValue: "",
      filled: false,
      status: "failed",
      strategy: target.strategy,
      source: "api_generation_failed",
      failureReason: (error as Error).message
    }));
  }
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
