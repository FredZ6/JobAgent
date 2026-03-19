import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { buildSuggestions, fillLongAnswerFields, uploadResume } from "./prefill.js";

type MockFileInput = {
  setInputFiles: ReturnType<typeof vi.fn>;
};

type MockDropzone = {
  $: ReturnType<typeof vi.fn>;
  dispatchEvent: ReturnType<typeof vi.fn>;
};

const originalFetch = global.fetch;
const originalJwtSecret = process.env.JWT_SECRET;

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

type MockLongAnswerElement = {
  getAttribute: ReturnType<typeof vi.fn>;
  fill?: ReturnType<typeof vi.fn>;
  evaluate?: ReturnType<typeof vi.fn>;
  textContent?: ReturnType<typeof vi.fn>;
};

function makeLongAnswerPage(input: {
  labels?: Record<string, MockLongAnswerElement | null>;
  textareas?: MockLongAnswerElement[];
  contenteditables?: MockLongAnswerElement[];
}) {
  return {
    $: vi.fn(async (selector: string) => input.labels?.[selector] ?? null),
    $$: vi.fn(async (selector: string) => {
      if (selector === "textarea") {
        return input.textareas ?? [];
      }
      if (selector.includes("[contenteditable")) {
        return input.contenteditables ?? [];
      }
      return [];
    })
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

    if (originalJwtSecret === undefined) {
      delete process.env.JWT_SECRET;
    } else {
      process.env.JWT_SECRET = originalJwtSecret;
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

  it("returns a failed upload result instead of throwing when a dropzone upload errors", async () => {
    const dropzone = {
      $: vi.fn(async () => ({
        setInputFiles: vi.fn().mockRejectedValue(new Error("dropzone upload failed"))
      })),
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

    await expect(
      uploadResume(page, {
        applicationId: "app_5",
        resume: {
          id: "resume_5",
          headline: "Platform Engineer",
          status: "completed",
          pdfDownloadUrl: "http://api:3001/resume-versions/resume_5/pdf",
          pdfFileName: "ada-lovelace-resume.pdf"
        },
        tempBaseDir: tempDir
      })
    ).resolves.toMatchObject({
      fieldName: "resume",
      fieldType: "resume_upload",
      filled: false,
      status: "failed",
      strategy: "file_input_then_dropzone",
      source: "resume_pdf",
      failureReason: "dropzone upload failed"
    });
  });

  it("detects long-answer fields, requests answers, and fills textarea plus contenteditable targets", async () => {
    process.env.JWT_SECRET = "secret";

    const editableNode = {
      textContent: "",
      dispatchEvent: vi.fn()
    };
    const textarea = {
      getAttribute: vi.fn(async (name: string) => {
        if (name === "id") {
          return "why-company";
        }
        if (name === "name") {
          return "why_company";
        }
        if (name === "placeholder") {
          return "Why do you want to work here?";
        }
        return null;
      }),
      fill: vi.fn().mockResolvedValue(undefined)
    };
    const contenteditable = {
      getAttribute: vi.fn(async (name: string) => {
        if (name === "aria-label") {
          return "Describe a project you are proud of";
        }
        if (name === "data-testid") {
          return "project-story";
        }
        return null;
      }),
      evaluate: vi.fn(async (callback: (element: typeof editableNode, value: string) => unknown, value: string) =>
        callback(editableNode, value)
      )
    };
    const label = {
      getAttribute: vi.fn(),
      textContent: vi.fn().mockResolvedValue("Why do you want to work here?")
    };
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        applicationId: "app_6",
        answers: [
          {
            fieldName: "why_company",
            questionText: "Why do you want to work here?",
            decision: "fill",
            answer: "I enjoy building reliable developer platforms.",
            source: "default_answer_match"
          },
          {
            fieldName: "describe_a_project_you_are_proud_of",
            questionText: "Describe a project you are proud of",
            decision: "fill",
            answer: "I led a platform migration that cut deploy time.",
            source: "llm_generated"
          }
        ]
      })
    });
    vi.stubGlobal("fetch", fetchSpy);

    const page = makeLongAnswerPage({
      labels: {
        'label[for="why-company"]': label
      },
      textareas: [textarea],
      contenteditables: [contenteditable]
    });

    const results = await fillLongAnswerFields(page, {
      applicationId: "app_6",
      resume: {
        id: "resume_6",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/api/resume-versions/resume_6/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      }
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      "http://api:3001/api/internal/applications/app_6/generate-long-answers",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          "content-type": "application/json",
          "x-internal-token": "secret"
        })
      })
    );
    expect(textarea.fill).toHaveBeenCalledWith("I enjoy building reliable developer platforms.");
    expect(contenteditable.evaluate).toHaveBeenCalledTimes(1);
    expect(editableNode.textContent).toBe("I led a platform migration that cut deploy time.");
    expect(editableNode.dispatchEvent).toHaveBeenCalledTimes(2);
    expect(results).toEqual([
      {
        fieldName: "why_company",
        fieldLabel: "Why do you want to work here?",
        fieldType: "long_text",
        questionText: "Why do you want to work here?",
        suggestedValue: "I enjoy building reliable developer platforms.",
        filled: true,
        status: "filled",
        strategy: "textarea",
        source: "default_answer_match"
      },
      {
        fieldName: "describe_a_project_you_are_proud_of",
        fieldLabel: "Describe a project you are proud of",
        fieldType: "long_text",
        questionText: "Describe a project you are proud of",
        suggestedValue: "I led a platform migration that cut deploy time.",
        filled: true,
        status: "filled",
        strategy: "contenteditable",
        source: "llm_generated"
      }
    ]);
  });

  it("does not autofill long-answer fields when the API requires manual review", async () => {
    process.env.JWT_SECRET = "secret";

    const textarea = {
      getAttribute: vi.fn(async (name: string) => {
        if (name === "name") {
          return "salary_expectation";
        }
        if (name === "placeholder") {
          return "What is your salary expectation?";
        }
        return null;
      }),
      fill: vi.fn().mockResolvedValue(undefined)
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          applicationId: "app_7",
          answers: [
            {
              fieldName: "salary_expectation",
              questionText: "What is your salary expectation?",
              decision: "manual_review_required",
              source: "manual_review_required",
              manualReason: "high_risk_question_missing_default_answer",
              matchedRiskCategory: "salary_expectation"
            }
          ]
        })
      })
    );

    const page = makeLongAnswerPage({
      textareas: [textarea]
    });

    const results = await fillLongAnswerFields(page, {
      applicationId: "app_7",
      resume: {
        id: "resume_7",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_7/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      }
    });

    expect(textarea.fill).not.toHaveBeenCalled();
    expect(results).toEqual([
      {
        fieldName: "salary_expectation",
        fieldLabel: "What is your salary expectation?",
        fieldType: "long_text",
        questionText: "What is your salary expectation?",
        suggestedValue: "",
        filled: false,
        status: "unhandled",
        strategy: "textarea",
        source: "manual_review_required",
        failureReason: "high_risk_question_missing_default_answer",
        metadata: {
          matchedRiskCategory: "salary_expectation"
        }
      }
    ]);
  });

  it("returns failed long-answer results with empty suggested values when generation fails", async () => {
    process.env.JWT_SECRET = "secret";

    const textarea = {
      getAttribute: vi.fn(async (name: string) => {
        if (name === "name") {
          return "why_company";
        }
        if (name === "placeholder") {
          return "Why do you want to work here?";
        }
        return null;
      }),
      fill: vi.fn().mockResolvedValue(undefined)
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => "generation exploded"
      })
    );

    const page = makeLongAnswerPage({
      textareas: [textarea]
    });

    const results = await fillLongAnswerFields(page, {
      applicationId: "app_7",
      resume: {
        id: "resume_7",
        headline: "Platform Engineer",
        status: "completed",
        pdfDownloadUrl: "http://api:3001/resume-versions/resume_7/pdf",
        pdfFileName: "ada-lovelace-resume.pdf"
      }
    });

    expect(results).toEqual([
      {
        fieldName: "why_company",
        fieldLabel: "Why do you want to work here?",
        fieldType: "long_text",
        questionText: "Why do you want to work here?",
        suggestedValue: "",
        filled: false,
        status: "failed",
        strategy: "textarea",
        source: "api_generation_failed",
        failureReason: "long-answer generation failed (500): generation exploded"
      }
    ]);
  });
});
