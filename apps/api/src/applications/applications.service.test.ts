import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { BadRequestException, ConflictException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { ApplicationsService } from "./applications.service.js";
import { approvalStatusSchema } from "@openclaw/shared-types";

const mockFetch = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", mockFetch);
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      status: "completed",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      errorMessage: null
    })
  });
});
afterEach(() => {
  mockFetch.mockReset();
});

const mockTemporalService = () => ({
  executePrefillJobWorkflow: vi.fn().mockResolvedValue({
    id: "app_temporal",
    application: {
      id: "app_temporal"
    }
  })
});

const mockWorkflowRunsService = () => ({
  createDirectRun: vi.fn().mockResolvedValue({ id: "run_direct" }),
  createTemporalQueuedRun: vi.fn().mockResolvedValue({ id: "run_temporal" }),
  markRunning: vi.fn().mockResolvedValue({ id: "run_direct" }),
  markCancelled: vi.fn().mockResolvedValue({}),
  markCompleted: vi.fn().mockResolvedValue({}),
  markFailed: vi.fn().mockResolvedValue({}),
  listJobRuns: vi.fn().mockResolvedValue([]),
  getWorkflowRun: vi.fn().mockResolvedValue(null)
});

const mockPrisma = () => {
  const tx = {
    application: {
      update: vi.fn()
    },
    applicationEvent: {
      create: vi.fn(),
      findMany: vi.fn()
    }
  };

  return {
    job: {
      findUnique: vi.fn()
    },
    jobAnalysis: {
      findFirst: vi.fn().mockResolvedValue(null)
    },
    resumeVersion: {
      findFirst: vi.fn()
    },
    candidateProfile: {
      findFirst: vi.fn().mockResolvedValue(null)
    },
    application: {
      create: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    },
    applicationEvent: {
      create: vi.fn(),
      findMany: vi.fn()
    },
    $transaction: vi.fn(async (callback: (client: typeof tx) => Promise<unknown>) => callback(tx)),
    __tx: tx
  };
};

describe("ApplicationsService", () => {
  const originalTemporalEnabled = process.env.TEMPORAL_ENABLED;

  beforeEach(() => {
    delete process.env.TEMPORAL_ENABLED;
  });

  afterEach(() => {
    if (originalTemporalEnabled === undefined) {
      delete process.env.TEMPORAL_ENABLED;
      return;
    }

    process.env.TEMPORAL_ENABLED = originalTemporalEnabled;
  });

  it("prefillJob uses Temporal workflow execution when TEMPORAL_ENABLED is true", async () => {
    process.env.TEMPORAL_ENABLED = "true";

    const prisma = mockPrisma();
    const temporalService = mockTemporalService();
    const workflowRunsService = mockWorkflowRunsService();
    const service = new ApplicationsService(prisma as any, temporalService as any, workflowRunsService as any);

    const directSpy = vi.spyOn(service, "prefillJobDirect").mockResolvedValue({
      id: "app_direct",
      application: {
        id: "app_direct"
      }
    } as any);

    const result = await service.prefillJob("job_temporal");

    expect(temporalService.executePrefillJobWorkflow).toHaveBeenCalledWith("job_temporal");
    expect(directSpy).not.toHaveBeenCalled();
    expect(result.id).toBe("app_temporal");
  });

  it("prefillJob keeps direct behavior when TEMPORAL_ENABLED is false", async () => {
    process.env.TEMPORAL_ENABLED = "false";

    const prisma = mockPrisma();
    const temporalService = mockTemporalService();
    const workflowRunsService = mockWorkflowRunsService();
    const service = new ApplicationsService(prisma as any, temporalService as any, workflowRunsService as any);

    const directSpy = vi.spyOn(service, "prefillJobDirect").mockResolvedValue({
      id: "app_direct",
      application: {
        id: "app_direct"
      }
    } as any);

    const result = await service.prefillJob("job_direct");

    expect(directSpy).toHaveBeenCalledWith("job_direct", {
      executionMode: "direct"
    });
    expect(temporalService.executePrefillJobWorkflow).not.toHaveBeenCalled();
    expect(result.id).toBe("app_direct");
  });

  it("prefillJob throws if the job does not exist", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.job.findUnique.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await expect(service.prefillJob("job_123")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("prefillJob throws if the job has no applyUrl", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.job.findUnique.mockResolvedValue({ id: "job_1", applyUrl: null });
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await expect(service.prefillJob("job_1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("prefillJob throws if there is no completed resume version", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.job.findUnique.mockResolvedValue({ id: "job_1", applyUrl: "https://apply" });
    prisma.resumeVersion.findFirst.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await expect(service.prefillJob("job_1")).rejects.toBeInstanceOf(BadRequestException);
  });

  it("getApplication throws when application does not exist", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.application.findUnique.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await expect(service.getApplication("app_1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updateApproval throws when application does not exist", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.application.findUnique.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await expect(
      service.updateApproval("app_1", {
        approvalStatus: approvalStatusSchema.parse("needs_revision")
      })
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it("updateApproval preserves reviewNote when not provided", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      submissionStatus: "not_ready",
      reviewNote: "existing note"
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://example.com",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "existing note",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    const result = await service.updateApproval("app_1", {
      approvalStatus: approvalStatusSchema.parse("approved_for_submit")
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.__tx.application.update).toHaveBeenCalledWith({
      where: { id: "app_1" },
      data: {
        approvalStatus: "approved_for_submit",
        submissionStatus: "ready_to_submit",
        reviewNote: "existing note"
      },
      include: { job: true, resumeVersion: true }
    });
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalled();
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app_1",
        type: "approval_updated",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: {
          approvalStatus: "approved_for_submit",
          note: "existing note"
        }
      })
    });
    expect(result.application.reviewNote).toBe("existing note");
  });

  it("prefillJob returns context with job and resume summaries", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const finalApplication = {
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    };
    prisma.application.update.mockResolvedValueOnce({});
    prisma.__tx.application.update.mockResolvedValue(finalApplication);
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    const result = await service.prefillJob("job_1");
    expect(workflowRunsService.createDirectRun).toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).toHaveBeenCalledWith(
      "run_direct",
      expect.objectContaining({
        applicationId: "app_1"
      })
    );
    expect(result.job).not.toBeNull();
    expect(result.resumeVersion).not.toBeNull();
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app_1",
        type: "prefill_run",
        actorType: "worker",
        actorLabel: "playwright-worker",
        actorId: "playwright-worker",
        source: "worker-prefill",
        payload: expect.objectContaining({
          submissionStatus: "completed",
          orchestration: {
            executionMode: "direct"
          }
        })
      })
    });
  });

  it("prefillJob uses the saved candidate profile when calling the worker", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });
    const savedProfile = {
      id: "profile_1",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg",
      workAuthorization: "",
      summary: "",
      skills: [],
      experienceLibrary: [],
      projectLibrary: [],
      defaultAnswers: {}
    };
    prisma.candidateProfile.findFirst.mockResolvedValue(savedProfile);
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const finalApplication = {
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    };
    prisma.application.update.mockResolvedValueOnce({});
    prisma.__tx.application.update.mockResolvedValue(finalApplication);
    const service = new ApplicationsService(prisma as any);

    await service.prefillJob("job_1");

    const fetchOptions = mockFetch.mock.calls[0][1];
    const payload = JSON.parse(fetchOptions.body);
    expect(payload.profile.fullName).toBe("Ada Lovelace");
    expect(payload.profile.email).toBe("ada@example.com");
    expect(payload.profile.location).toBe("Winnipeg");
  });

  it("prefillJob sends resume pdf metadata, job context, analysis, and default answers to the worker", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply.example.com",
      sourceUrl: "https://source.example.com/job_1",
      title: "Platform Engineer",
      company: "Orbital",
      location: "Remote",
      description: "Build internal platform systems."
    });
    prisma.jobAnalysis.findFirst.mockResolvedValue({
      id: "analysis_1",
      jobId: "job_1",
      matchScore: 88,
      summary: "Strong platform fit.",
      requiredSkills: ["TypeScript", "PostgreSQL"],
      missingSkills: [],
      redFlags: [],
      structuredResult: {
        matchScore: 88,
        summary: "Strong platform fit.",
        requiredSkills: ["TypeScript", "PostgreSQL"],
        missingSkills: [],
        redFlags: []
      }
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      sourceProfileId: "profile_1",
      status: "completed",
      headline: "Platform Engineer",
      job: {
        title: "Platform Engineer",
        company: "Orbital"
      },
      sourceProfile: {
        fullName: "Ada Lovelace"
      }
    });
    prisma.candidateProfile.findFirst.mockResolvedValue({
      id: "profile_1",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg",
      workAuthorization: "Authorized",
      summary: "Platform engineer.",
      skills: ["TypeScript"],
      experienceLibrary: [],
      projectLibrary: [],
      defaultAnswers: {
        "Why do you want to work here?": "I like building reliable developer platforms."
      }
    });
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply.example.com",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Platform Engineer", company: "Orbital", applyUrl: "https://apply.example.com" },
      resumeVersion: { id: "resume_1", headline: "Platform Engineer", status: "completed" }
    });
    prisma.application.update.mockResolvedValueOnce({});
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://apply.example.com",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Platform Engineer", company: "Orbital", applyUrl: "https://apply.example.com" },
      resumeVersion: { id: "resume_1", headline: "Platform Engineer", status: "completed" }
    });
    const workflowRunsService = mockWorkflowRunsService();
    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    await service.prefillJob("job_1");

    const fetchOptions = mockFetch.mock.calls[0][1];
    const payload = JSON.parse(fetchOptions.body);

    expect(payload.resume).toMatchObject({
      id: "resume_1",
      headline: "Platform Engineer",
      status: "completed",
      pdfDownloadUrl: "http://localhost:3001/resume-versions/resume_1/pdf",
      pdfFileName: "ada-lovelace-orbital-platform-engineer-resume.pdf"
    });
    expect(payload.job).toEqual({
      id: "job_1",
      title: "Platform Engineer",
      company: "Orbital",
      location: "Remote",
      description: "Build internal platform systems.",
      applyUrl: "https://apply.example.com"
    });
    expect(payload.analysis).toEqual({
      matchScore: 88,
      summary: "Strong platform fit.",
      requiredSkills: ["TypeScript", "PostgreSQL"],
      missingSkills: [],
      redFlags: []
    });
    expect(payload.defaultAnswers).toEqual({
      "Why do you want to work here?": "I like building reliable developer platforms."
    });
  });

  it("prefillJob persists richer upload and long-answer field results without failing a completed run", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        status: "completed",
        formSnapshot: { url: "https://apply.example.com" },
        fieldResults: [
          {
            fieldName: "email",
            fieldType: "basic_text",
            suggestedValue: "ada@example.com",
            filled: true,
            status: "filled",
            strategy: "text_input",
            source: "profile"
          },
          {
            fieldName: "resume",
            fieldType: "resume_upload",
            suggestedValue: "ada-lovelace-resume.pdf",
            filled: false,
            status: "unhandled",
            strategy: "file_input_then_dropzone",
            source: "resume_pdf",
            failureReason: "resume upload control not found",
            metadata: {
              resumeVersionId: "resume_1",
              fileName: "ada-lovelace-resume.pdf",
              attemptedStrategies: ["file_input", "dropzone"]
            }
          },
          {
            fieldName: "why_company",
            fieldLabel: "Why do you want to work here?",
            fieldType: "long_text",
            questionText: "Why do you want to work here?",
            suggestedValue: "",
            filled: false,
            status: "failed",
            strategy: "textarea",
            source: "llm_generated",
            failureReason: "long-answer generation failed (500)"
          }
        ],
        screenshotPaths: [],
        workerLog: [],
        errorMessage: null
      })
    });

    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply.example.com",
      title: "Platform Engineer",
      company: "Orbital",
      location: "Remote",
      description: "Build internal platform systems."
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      sourceProfileId: "profile_1",
      status: "completed",
      headline: "Platform Engineer",
      sourceProfile: {
        fullName: "Ada Lovelace"
      },
      job: {
        title: "Platform Engineer",
        company: "Orbital"
      }
    });
    prisma.candidateProfile.findFirst.mockResolvedValue({
      id: "profile_1",
      fullName: "Ada Lovelace",
      email: "ada@example.com",
      phone: "555-0101",
      linkedinUrl: "https://linkedin.com/in/ada",
      githubUrl: "https://github.com/ada",
      location: "Winnipeg",
      workAuthorization: "Authorized",
      summary: "Platform engineer.",
      skills: ["TypeScript"],
      experienceLibrary: [],
      projectLibrary: [],
      defaultAnswers: {}
    });
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply.example.com",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Platform Engineer", company: "Orbital", applyUrl: "https://apply.example.com" },
      resumeVersion: { id: "resume_1", headline: "Platform Engineer", status: "completed" }
    });
    prisma.application.update.mockResolvedValueOnce({ status: "running" });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://apply.example.com",
      formSnapshot: { url: "https://apply.example.com" },
      fieldResults: [
        {
          fieldName: "email",
          fieldType: "basic_text",
          suggestedValue: "ada@example.com",
          filled: true,
          status: "filled",
          strategy: "text_input",
          source: "profile"
        },
        {
          fieldName: "resume",
          fieldType: "resume_upload",
          suggestedValue: "ada-lovelace-resume.pdf",
          filled: false,
          status: "unhandled",
          strategy: "file_input_then_dropzone",
          source: "resume_pdf",
          failureReason: "resume upload control not found",
          metadata: {
            resumeVersionId: "resume_1",
            fileName: "ada-lovelace-resume.pdf",
            attemptedStrategies: ["file_input", "dropzone"]
          }
        },
        {
          fieldName: "why_company",
          fieldLabel: "Why do you want to work here?",
          fieldType: "long_text",
          questionText: "Why do you want to work here?",
          suggestedValue: "",
          filled: false,
          status: "failed",
          strategy: "textarea",
          source: "llm_generated",
          failureReason: "long-answer generation failed (500)"
        }
      ],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Platform Engineer", company: "Orbital", applyUrl: "https://apply.example.com" },
      resumeVersion: { id: "resume_1", headline: "Platform Engineer", status: "completed" }
    });

    const service = new ApplicationsService(prisma as any, undefined, mockWorkflowRunsService() as any);

    const result = await service.prefillJob("job_1");

    expect(prisma.__tx.application.update).toHaveBeenCalledWith({
      where: { id: "app_1" },
      data: expect.objectContaining({
        status: "completed",
        fieldResults: expect.arrayContaining([
          expect.objectContaining({
            fieldName: "resume",
            fieldType: "resume_upload",
            status: "unhandled"
          }),
          expect.objectContaining({
            fieldName: "why_company",
            fieldType: "long_text",
            status: "failed"
          })
        ])
      }),
      include: {
        job: true,
        resumeVersion: true
      }
    });
    expect(result.application.status).toBe("completed");
    expect(result.application.fieldResults).toEqual([
      expect.objectContaining({
        fieldName: "email",
        fieldType: "basic_text",
        status: "filled"
      }),
      expect.objectContaining({
        fieldName: "resume",
        fieldType: "resume_upload",
        status: "unhandled",
        suggestedValue: "ada-lovelace-resume.pdf"
      }),
      expect.objectContaining({
        fieldName: "why_company",
        fieldType: "long_text",
        status: "failed",
        suggestedValue: ""
      })
    ]);
  });

  it("prefillJob creates a fresh application record for each rerun", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });

    prisma.application.create
      .mockResolvedValueOnce({
        id: "app_1",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "queued",
        approvalStatus: "pending_review",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionStatus: "not_ready",
        submittedAt: null,
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-17T10:00:00.000Z"),
        updatedAt: new Date("2026-03-17T10:00:00.000Z"),
        job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
        resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
      })
      .mockResolvedValueOnce({
        id: "app_2",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "queued",
        approvalStatus: "pending_review",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionStatus: "not_ready",
        submittedAt: null,
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-17T10:05:00.000Z"),
        updatedAt: new Date("2026-03-17T10:05:00.000Z"),
        job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
        resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
      });

    prisma.application.update.mockResolvedValue({ status: "running" });
    prisma.__tx.application.update
      .mockResolvedValueOnce({
        id: "app_1",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "completed",
        approvalStatus: "pending_review",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionStatus: "not_ready",
        submittedAt: null,
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-17T10:00:00.000Z"),
        updatedAt: new Date("2026-03-17T10:00:05.000Z"),
        job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
        resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
      })
      .mockResolvedValueOnce({
        id: "app_2",
        jobId: "job_1",
        resumeVersionId: "resume_1",
        status: "completed",
        approvalStatus: "pending_review",
        applyUrl: "https://apply",
        formSnapshot: {},
        fieldResults: [],
        screenshotPaths: [],
        workerLog: [],
        submissionStatus: "not_ready",
        submittedAt: null,
        submissionNote: "",
        submittedByUser: false,
        finalSubmissionSnapshot: null,
        reviewNote: "",
        errorMessage: null,
        createdAt: new Date("2026-03-17T10:05:00.000Z"),
        updatedAt: new Date("2026-03-17T10:05:05.000Z"),
        job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
        resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
      });

    const service = new ApplicationsService(prisma as any);

    const first = await service.prefillJob("job_1");
    const second = await service.prefillJob("job_1");

    expect(first.application.id).toBe("app_1");
    expect(second.application.id).toBe("app_2");
    expect(prisma.application.create).toHaveBeenCalledTimes(2);
  });

  it("prefillJob marks the application running before calling the worker", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const finalApplication = {
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    };
    prisma.application.update.mockResolvedValueOnce({});
    prisma.__tx.application.update.mockResolvedValue(finalApplication);
    const service = new ApplicationsService(prisma as any);

    await service.prefillJob("job_1");

    expect(prisma.application.update.mock.calls[0][0]).toMatchObject({
      where: { id: "app_1" },
      data: { status: "running" }
    });
  });

  it("getSubmissionReview throws when application does not exist", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any);

    await expect(service.getSubmissionReview("app_1")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("markSubmitted rejects applications that are not approved for submit", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      approvalStatus: "pending_review",
      submissionStatus: "not_ready",
      fieldResults: [],
      applyUrl: "https://example.com/apply",
      reviewNote: "",
      resumeVersionId: "resume_1"
    });
    const service = new ApplicationsService(prisma as any);

    await expect(
      service.markSubmitted("app_1", { submissionNote: "Submitted manually." })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("markSubmitted records submission state and snapshot", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [{ fieldName: "email", filled: false, failureReason: "selector not found" }],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submitted",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [{ fieldName: "email", filled: false, failureReason: "selector not found" }],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Submitted manually.",
      submittedByUser: true,
      finalSubmissionSnapshot: {
        approvalStatus: "approved_for_submit",
        resumeVersionId: "resume_1",
        applyUrl: "https://example.com/apply",
        unresolvedFieldCount: 1,
        failedFieldCount: 1
      },
      submittedAt: new Date(),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://example.com/apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const service = new ApplicationsService(prisma as any);

    const result = await service.markSubmitted("app_1", { submissionNote: "Submitted manually." });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.__tx.application.update).toHaveBeenCalled();
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app_1",
        type: "submission_marked",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui"
      })
    });
    expect(result.application.submissionStatus).toBe("submitted");
    expect(result.application.submissionNote).toBe("Submitted manually.");
    expect(result.application.finalSubmissionSnapshot).not.toBeNull();
  });

  it("markSubmitted keeps unresolved and failed counts stable for richer field result shapes", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_2",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [
        {
          fieldName: "email",
          fieldType: "basic_text",
          suggestedValue: "ada@example.com",
          filled: true,
          status: "filled",
          strategy: "text_input",
          source: "profile"
        },
        {
          fieldName: "resume",
          fieldType: "resume_upload",
          suggestedValue: "ada-lovelace-resume.pdf",
          filled: false,
          status: "unhandled",
          strategy: "file_input_then_dropzone",
          source: "resume_pdf",
          failureReason: "resume upload control not found"
        },
        {
          fieldName: "why_company",
          fieldType: "long_text",
          questionText: "Why do you want to work here?",
          suggestedValue: "",
          filled: false,
          status: "failed",
          strategy: "textarea",
          source: "llm_generated",
          failureReason: "long-answer generation failed (500)"
        }
      ],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_2",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submitted",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Submitted manually.",
      submittedByUser: true,
      finalSubmissionSnapshot: {
        approvalStatus: "approved_for_submit",
        resumeVersionId: "resume_1",
        applyUrl: "https://example.com/apply",
        unresolvedFieldCount: 2,
        failedFieldCount: 2
      },
      submittedAt: new Date(),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://example.com/apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const service = new ApplicationsService(prisma as any);

    await service.markSubmitted("app_2", { submissionNote: "Submitted manually." });

    expect(prisma.__tx.application.update).toHaveBeenCalledWith({
      where: { id: "app_2" },
      data: expect.objectContaining({
        finalSubmissionSnapshot: {
          approvalStatus: "approved_for_submit",
          resumeVersionId: "resume_1",
          applyUrl: "https://example.com/apply",
          unresolvedFieldCount: 2,
          failedFieldCount: 2
        }
      }),
      include: { job: true, resumeVersion: true }
    });
  });

  it("reopenSubmission rejects applications that are not submitted", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit"
    });
    const service = new ApplicationsService(prisma as any);

    await expect(
      service.reopenSubmission("app_1", { note: "Need another check." })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("reopenSubmission moves submitted applications back to ready_to_submit", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submitted",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Submitted.",
      submittedByUser: true,
      finalSubmissionSnapshot: {
        approvalStatus: "approved_for_submit",
        resumeVersionId: "resume_1",
        applyUrl: "https://example.com/apply",
        unresolvedFieldCount: 0,
        failedFieldCount: 0
      },
      submittedAt: new Date("2026-03-16T12:00:00.000Z"),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Reopened for manual retry.",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      submittedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://example.com/apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const service = new ApplicationsService(prisma as any);

    const result = await service.reopenSubmission("app_1", {
      note: "Reopened for manual retry."
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.__tx.application.update).toHaveBeenCalledWith({
      where: { id: "app_1" },
      data: {
        submissionStatus: "ready_to_submit",
        submissionNote: "Reopened for manual retry.",
        submittedAt: null,
        submittedByUser: false,
        finalSubmissionSnapshot: Prisma.JsonNull
      },
      include: { job: true, resumeVersion: true }
    });
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app_1",
        type: "submission_reopened",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui"
      })
    });
    expect(result.application.submissionStatus).toBe("ready_to_submit");
  });

  it("markRetryReady rejects applications that are not submit_failed", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submitted"
    });
    const service = new ApplicationsService(prisma as any);

    await expect(
      service.markRetryReady("app_1", { note: "Trying again." })
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("markRetryReady moves failed submissions back to ready_to_submit", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submit_failed",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Validation error on the site.",
      submittedByUser: true,
      finalSubmissionSnapshot: {
        approvalStatus: "approved_for_submit",
        resumeVersionId: "resume_1",
        applyUrl: "https://example.com/apply",
        unresolvedFieldCount: 0,
        failedFieldCount: 0
      },
      submittedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Fixed the missing answer.",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      submittedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://example.com/apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    const service = new ApplicationsService(prisma as any);

    const result = await service.markRetryReady("app_1", {
      note: "Fixed the missing answer."
    });

    expect(prisma.$transaction).toHaveBeenCalled();
    expect(prisma.__tx.application.update).toHaveBeenCalledWith({
      where: { id: "app_1" },
      data: {
        submissionStatus: "ready_to_submit",
        submissionNote: "Fixed the missing answer.",
        submittedAt: null,
        submittedByUser: false,
        finalSubmissionSnapshot: Prisma.JsonNull
      },
      include: { job: true, resumeVersion: true }
    });
    expect(prisma.__tx.applicationEvent.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        applicationId: "app_1",
        type: "submission_retry_ready",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui"
      })
    });
    expect(result.application.submissionStatus).toBe("ready_to_submit");
  });

  it("reopenSubmission uses a transaction so event failures do not become half-successful", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "submitted",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Submitted.",
      submittedByUser: true,
      finalSubmissionSnapshot: null,
      submittedAt: new Date("2026-03-16T12:00:00.000Z"),
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    prisma.__tx.application.update.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "completed",
      approvalStatus: "approved_for_submit",
      submissionStatus: "ready_to_submit",
      applyUrl: "https://example.com/apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      reviewNote: "Looks ready",
      submissionNote: "Reopened.",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      submittedAt: null,
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://example.com/apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    prisma.__tx.applicationEvent.create.mockRejectedValue(new Error("event insert failed"));
    const service = new ApplicationsService(prisma as any);

    await expect(service.reopenSubmission("app_1", { note: "Reopened." })).rejects.toThrow(
      "event insert failed"
    );
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("getApplicationEvents returns the newest events first", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1"
    });
    prisma.applicationEvent.findMany.mockResolvedValue([
      {
        id: "event_2",
        applicationId: "app_1",
        type: "submission_retry_ready",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Ready again." },
        createdAt: new Date("2026-03-16T02:00:00.000Z")
      },
      {
        id: "event_1",
        applicationId: "app_1",
        type: "submission_failed",
        actorType: "system",
        actorLabel: "system",
        actorId: null,
        source: undefined,
        payload: { note: "Missing answer." },
        createdAt: new Date("2026-03-16T01:00:00.000Z")
      }
    ]);
    const service = new ApplicationsService(prisma as any);

    const result = await service.getApplicationEvents("app_1");

    expect(result.map((event: { type: string }) => event.type)).toEqual([
      "submission_retry_ready",
      "submission_failed"
    ]);
    expect(result[0]?.actorType).toBe("user");
    expect(result[0]?.actorLabel).toBe("local-user");
    expect(result[0]?.actorId).toBe("local-user");
    expect(result[0]?.source).toBe("web-ui");
    expect(result[0]?.summary).toContain("Ready again.");
  });

  it("getApplicationEvents filters by actorType, eventType, source, query, date range, and limit", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1"
    });
    prisma.applicationEvent.findMany.mockResolvedValue([
      {
        id: "event_3",
        applicationId: "app_1",
        type: "submission_retry_ready",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: {
          note: "Ready again from the web UI.",
          fromStatus: "submit_failed",
          toStatus: "ready_to_submit"
        },
        createdAt: new Date("2026-03-16T03:00:00.000Z")
      },
      {
        id: "event_2",
        applicationId: "app_1",
        type: "submission_failed",
        actorType: "user",
        actorLabel: "local-user",
        actorId: "local-user",
        source: "web-ui",
        payload: { note: "Missing answer on the profile form.", submissionStatus: "submit_failed" },
        createdAt: new Date("2026-03-16T02:00:00.000Z")
      },
      {
        id: "event_1",
        applicationId: "app_1",
        type: "submission_failed",
        actorType: "system",
        actorLabel: "system",
        actorId: null,
        source: "system",
        payload: { note: "Older failure.", submissionStatus: "submit_failed" },
        createdAt: new Date("2026-03-16T01:00:00.000Z")
      }
    ]);
    const service = new ApplicationsService(prisma as any);

    const result = await service.getApplicationEvents("app_1", {
      actorType: "user",
      eventType: "submission_failed",
      source: "web-ui",
      q: "profile form",
      from: "2026-03-16T01:30:00.000Z",
      to: "2026-03-16T02:30:00.000Z",
      limit: 1
    });

    expect(result).toHaveLength(1);
    expect(result[0]?.type).toBe("submission_failed");
    expect(result[0]?.actorType).toBe("user");
    expect(result[0]?.actorId).toBe("local-user");
    expect(result[0]?.source).toBe("web-ui");
    expect(result[0]?.summary).toContain("Missing answer on the profile form.");
  });

  it("getApplicationEvents query matches application ids and payload strings", async () => {
    const prisma = mockPrisma();
    prisma.application.findUnique.mockResolvedValue({
      id: "app_1"
    });
    prisma.applicationEvent.findMany.mockResolvedValue([
      {
        id: "event_prefill",
        applicationId: "app_1",
        type: "prefill_run",
        actorType: "worker",
        actorLabel: "playwright-worker",
        actorId: "playwright-worker",
        source: "worker-prefill",
        payload: {
          note: "Prefill completed in worker",
          submissionStatus: "completed",
          fieldResultCount: 6,
          screenshotCount: 1
        },
        createdAt: new Date("2026-03-17T03:00:00.000Z")
      }
    ]);
    const service = new ApplicationsService(prisma as any);

    const byApplicationId = await service.getApplicationEvents("app_1", {
      q: "app_1"
    });
    const byPayloadText = await service.getApplicationEvents("app_1", {
      q: "completed in worker"
    });

    expect(byApplicationId).toHaveLength(1);
    expect(byApplicationId[0]?.applicationId).toBe("app_1");
    expect(byPayloadText).toHaveLength(1);
    expect(byPayloadText[0]?.type).toBe("prefill_run");
  });

  it("listApplications throws when job not found", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue(null);
    const service = new ApplicationsService(prisma as any);

    await expect(service.listApplications("missing")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("prefillJob records a failed status when worker returns non-ok", async () => {
    const prisma = mockPrisma();
    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co",
      location: "Remote"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });
    prisma.application.create.mockResolvedValue({
      id: "app_1",
      jobId: "job_1",
      resumeVersionId: "resume_1",
      status: "queued",
      approvalStatus: "pending_review",
      applyUrl: "https://apply",
      formSnapshot: {},
      fieldResults: [],
      screenshotPaths: [],
      workerLog: [],
      submissionStatus: "not_ready",
      submittedAt: null,
      submissionNote: "",
      submittedByUser: false,
      finalSubmissionSnapshot: null,
      reviewNote: "",
      errorMessage: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      job: { id: "job_1", title: "Role", company: "Co", applyUrl: "https://apply" },
      resumeVersion: { id: "resume_1", headline: "Headline", status: "completed" }
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      text: async () => "worker unavailable"
    });
    prisma.application.update.mockResolvedValueOnce({}).mockResolvedValueOnce({});
    const service = new ApplicationsService(prisma as any);

    await expect(service.prefillJob("job_1")).rejects.toThrow("worker unavailable");
    expect(prisma.application.update.mock.calls[1][0]).toMatchObject({
      where: { id: "app_1" },
      data: {
        status: "failed"
      }
    });
  });

  it("stops prefill at a safe cancellation point without marking the workflow run failed", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    const controller = new AbortController();

    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co",
      location: "Remote"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });

    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.prefillJobDirect("job_1", { executionMode: "temporal" }, "run_direct", controller.signal)
    ).rejects.toMatchObject({
      name: "WorkflowRunCancelledError"
    });

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_direct");
    expect(prisma.application.create).not.toHaveBeenCalled();
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("marks direct prefill runs cancelled and returns a conflict when a direct workflow signal is aborted", async () => {
    const prisma = mockPrisma();
    const workflowRunsService = mockWorkflowRunsService();
    const controller = new AbortController();

    prisma.job.findUnique.mockResolvedValue({
      id: "job_1",
      applyUrl: "https://apply",
      title: "Role",
      company: "Co",
      location: "Remote"
    });
    prisma.resumeVersion.findFirst.mockResolvedValue({
      id: "resume_1",
      jobId: "job_1",
      status: "completed",
      headline: "Headline"
    });
    workflowRunsService.markCancelled = vi.fn().mockResolvedValue({});

    const service = new ApplicationsService(prisma as any, undefined, workflowRunsService as any);

    controller.abort(new DOMException("Workflow run was cancelled", "AbortError"));

    await expect(
      service.prefillJobDirect("job_1", { executionMode: "direct" }, "run_direct", controller.signal)
    ).rejects.toBeInstanceOf(ConflictException);

    expect(workflowRunsService.markRunning).toHaveBeenCalledWith("run_direct");
    expect(prisma.application.create).not.toHaveBeenCalled();
    expect(workflowRunsService.markCancelled).toHaveBeenCalledWith("run_direct");
    expect(workflowRunsService.markCompleted).not.toHaveBeenCalled();
    expect(workflowRunsService.markFailed).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
