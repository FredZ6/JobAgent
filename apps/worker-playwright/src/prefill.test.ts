import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSuggestions, uploadResume } from "./prefill.js";

type MockUploadElement = {
  setInputFiles: ReturnType<typeof vi.fn>;
};

const originalFetch = global.fetch;

function makeUploadPage(
  resolver: (selector: string) => MockUploadElement | null
) {
  return {
    $: vi.fn(async (selector: string) => resolver(selector))
  } as any;
}

describe("prefill helpers", () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = mkdtempSync(join(tmpdir(), "openclaw-prefill-test-"));
  });

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalFetch) {
      vi.stubGlobal("fetch", originalFetch);
    } else {
      vi.unstubAllGlobals();
    }

    rmSync(tempDir, { recursive: true, force: true });
  });

  it("builds suggestions that mirror the profile fields", () => {
    const profile = {
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg"
    };

    const suggestions = buildSuggestions(profile);
    expect(suggestions.name).toBe("Ada Lovelace");
    expect(suggestions.email).toBe("ada@example.com");
    expect(suggestions.linkedin).toContain("linkedin.com");
  });

  it("prefers a standard file input when one is available", async () => {
    const standardInput = {
      setInputFiles: vi.fn().mockResolvedValue(undefined)
    };
    const dropzoneInput = {
      setInputFiles: vi.fn().mockResolvedValue(undefined)
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode("pdf-data").buffer
      })
    );

    const page = makeUploadPage((selector) => {
      if (selector.includes("dropzone")) {
        return dropzoneInput;
      }
      if (selector.includes('input[type="file"]')) {
        return standardInput;
      }
      return null;
    });

    const result = await uploadResume(page, {
      applicationId: "app_1",
      resume: {
        id: "resume_1",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_1/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      },
      tempBaseDir: tempDir
    });

    expect(result).toMatchObject({
      fieldName: "resume",
      fieldType: "resume_upload",
      suggestedValue: "ada-lovelace-resume.pdf",
      filled: true,
      status: "filled",
      strategy: "file_input",
      source: "resume_pdf",
      metadata: {
        resumeVersionId: "resume_1",
        fileName: "ada-lovelace-resume.pdf",
        attemptedStrategies: ["file_input"]
      }
    });

    expect(standardInput.setInputFiles).toHaveBeenCalledTimes(1);
    expect(dropzoneInput.setInputFiles).not.toHaveBeenCalled();

    const uploadedPath = standardInput.setInputFiles.mock.calls[0][0] as string;
    expect(uploadedPath).toContain("ada-lovelace-resume.pdf");
    expect(existsSync(uploadedPath)).toBe(true);
  });

  it("falls back to a dropzone-style upload target when no standard input is present", async () => {
    const dropzoneInput = {
      setInputFiles: vi.fn().mockResolvedValue(undefined)
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode("pdf-data").buffer
      })
    );

    const page = makeUploadPage((selector) => {
      if (selector.includes("dropzone") && selector.includes('input[type="file"]')) {
        return dropzoneInput;
      }
      return null;
    });

    const result = await uploadResume(page, {
      applicationId: "app_2",
      resume: {
        id: "resume_2",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_2/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      },
      tempBaseDir: tempDir
    });

    expect(result).toMatchObject({
      fieldName: "resume",
      fieldType: "resume_upload",
      filled: true,
      status: "filled",
      strategy: "dropzone",
      source: "resume_pdf",
      metadata: {
        resumeVersionId: "resume_2",
        fileName: "ada-lovelace-resume.pdf",
        attemptedStrategies: ["file_input", "dropzone"]
      }
    });

    expect(dropzoneInput.setInputFiles).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported upload widgets as unhandled", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const page = makeUploadPage(() => null);

    const result = await uploadResume(page, {
      applicationId: "app_3",
      resume: {
        id: "resume_3",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_3/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      },
      tempBaseDir: tempDir
    });

    expect(result).toEqual({
      fieldName: "resume",
      fieldType: "resume_upload",
      suggestedValue: "ada-lovelace-resume.pdf",
      filled: false,
      status: "unhandled",
      strategy: "file_input_then_dropzone",
      source: "resume_pdf",
      failureReason: "no supported upload control found",
      metadata: {
        resumeVersionId: "resume_3",
        fileName: "ada-lovelace-resume.pdf",
        attemptedStrategies: ["file_input", "dropzone"]
      }
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
