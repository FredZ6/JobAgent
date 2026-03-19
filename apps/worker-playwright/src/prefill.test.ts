import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSuggestions, uploadResume } from "./prefill.js";

type MockFileInput = {
  setInputFiles: ReturnType<typeof vi.fn>;
};

type MockDropzone = {
  $: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
};

const originalFetch = global.fetch;

function makeUploadPage(input: {
  resolveSelector: (selector: string) => unknown | null;
  genericFileInputs?: MockFileInput[];
  evaluateHandle?: ReturnType<typeof vi.fn>;
}) {
  return {
    $: vi.fn(async (selector: string) => input.resolveSelector(selector)),
    $$: vi.fn(async (selector: string) => (selector === 'input[type="file"]' ? input.genericFileInputs ?? [] : [])),
    evaluateHandle: input.evaluateHandle ?? vi.fn()
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

  it("prefers a matching standard file input when one is available", async () => {
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

    const page = makeUploadPage({
      resolveSelector: (selector) => {
        if (selector.includes('input[type="file"][name*="resume" i]')) {
          return standardInput;
        }
        if (selector.includes("dropzone")) {
          return {
            $: vi.fn().mockResolvedValue(dropzoneInput),
            dispatchEvent: vi.fn().mockResolvedValue(undefined)
          } satisfies MockDropzone;
        }
        return null;
      }
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

    const uploadedPath = standardInput.setInputFiles.mock.calls[0][0] as string;
    expect(uploadedPath).toContain("ada-lovelace-resume.pdf");
    expect(existsSync(uploadedPath)).toBe(true);
  });

  it("falls back to a dropzone's nested file input when no direct input matches", async () => {
    const dropzoneInput = {
      setInputFiles: vi.fn().mockResolvedValue(undefined)
    };
    const dropzone = {
      $: vi.fn(async (selector: string) => (selector === 'input[type="file"]' ? dropzoneInput : null)),
      dispatchEvent: vi.fn().mockResolvedValue(undefined)
    } satisfies MockDropzone;

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode("pdf-data").buffer
      })
    );

    const page = makeUploadPage({
      resolveSelector: (selector) => (selector.includes("dropzone") ? dropzone : null)
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
    expect(dropzone.dispatchEvent).not.toHaveBeenCalled();
  });

  it("falls back to dispatching a drop event for common dropzones without nested inputs", async () => {
    const dropzone = {
      $: vi.fn().mockResolvedValue(null),
      dispatchEvent: vi.fn().mockResolvedValue(undefined)
    } satisfies MockDropzone;
    const dataTransferHandle = {
      dispose: vi.fn().mockResolvedValue(undefined)
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        arrayBuffer: async () => new TextEncoder().encode("pdf-data").buffer
      })
    );

    const page = makeUploadPage({
      resolveSelector: (selector) => (selector.includes("dropzone") ? dropzone : null),
      evaluateHandle: vi.fn().mockResolvedValue(dataTransferHandle)
    });

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

    expect(result).toMatchObject({
      fieldName: "resume",
      fieldType: "resume_upload",
      filled: true,
      status: "filled",
      strategy: "dropzone",
      source: "resume_pdf"
    });
    expect(page.evaluateHandle).toHaveBeenCalledTimes(1);
    expect(dropzone.dispatchEvent).toHaveBeenNthCalledWith(1, "dragenter", {
      dataTransfer: dataTransferHandle
    });
    expect(dropzone.dispatchEvent).toHaveBeenNthCalledWith(2, "dragover", {
      dataTransfer: dataTransferHandle
    });
    expect(dropzone.dispatchEvent).toHaveBeenNthCalledWith(3, "drop", {
      dataTransfer: dataTransferHandle
    });
    expect(dataTransferHandle.dispose).toHaveBeenCalledTimes(1);
  });

  it("reports unsupported upload widgets as unhandled without downloading the file", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    const page = makeUploadPage({
      resolveSelector: () => null
    });

    const result = await uploadResume(page, {
      applicationId: "app_4",
      resume: {
        id: "resume_4",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_4/pdf",
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
      failureReason: "resume upload control not found",
      metadata: {
        resumeVersionId: "resume_4",
        fileName: "ada-lovelace-resume.pdf",
        attemptedStrategies: ["file_input", "dropzone"]
      }
    });
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
