import { mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import type { Page } from "playwright";

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
  };
};

export type FieldResult = {
  fieldName: string;
  suggestedValue?: string;
  filled: boolean;
  failureReason?: string;
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
      fieldResults.push({ fieldName: field, filled: false, failureReason: "no suggestion" });
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
      suggestedValue: value,
      filled,
      failureReason: filled ? undefined : "selector not found"
    });
  }

  return fieldResults;
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
