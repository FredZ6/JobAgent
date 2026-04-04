import type {
  ApplicationContext,
  ApplicationEvent,
  AutomationSession,
  CandidateProfile,
  DashboardHistory,
  DashboardOverview,
  JobAnalysisResult,
  JobDto,
  LlmSettingsInput,
  ResumeVersion,
  SubmissionReview,
  TimelineItem,
  WorkflowRun,
  WorkflowRunDetail,
  WorkflowRunEvent,
  WorkflowRunsListResponse
} from "@rolecraft/shared-types";

type AnalysisRecord = JobAnalysisResult & {
  id: string;
  jobId: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

type JobDetailResponse = JobDto & {
  analyses: AnalysisRecord[];
  resumeVersions: ResumeVersion[];
};

type JobListItemResponse = JobDto & {
  latestAnalysis: {
    matchScore: number;
    summary: string;
    status: string;
  } | null;
  latestResumeVersion: {
    id: string;
    headline: string;
    status: string;
  } | null;
};

const demoSettings: LlmSettingsInput = {
  provider: "openai",
  model: "gpt-5.4",
  apiKey: "demo-key-present",
  isConfigured: true
};

const demoProfile: CandidateProfile = {
  fullName: "Avery Chen",
  email: "avery.chen@example.com",
  phone: "555-0142",
  linkedinUrl: "https://linkedin.com/in/averychen",
  githubUrl: "https://github.com/averychen",
  location: "Winnipeg, MB",
  workAuthorization: "Eligible to work in Canada and the United States",
  summary:
    "Product-minded platform engineer who builds internal systems, workflow tooling, and operational UX for high-leverage teams.",
  skills: ["TypeScript", "React", "Node.js", "Workflow automation", "Product systems"],
  experienceLibrary: [
    {
      role: "Senior Product Engineer",
      company: "Signalpath",
      startDate: "2022-01",
      endDate: "Present",
      bullets: [
        "Led internal workflow tooling used across product, ops, and support teams.",
        "Reduced manual review time by shipping structured approval and auditing surfaces."
      ]
    }
  ],
  projectLibrary: [
    {
      name: "Ops Ledger",
      tagline: "A workflow visibility system for review-heavy internal work.",
      bullets: [
        "Built a local-first evidence trail for multi-step operational decisions.",
        "Designed high-trust interfaces for review queues and escalation paths."
      ],
      skills: ["React", "TypeScript", "Prisma"]
    }
  ],
  defaultAnswers: {
    "Why do you want to work here?":
      "I like working on tools that improve decision quality for teams doing complex operational work.",
    "Do you require sponsorship?": "No."
  }
};

const jobA: JobDto = {
  id: "job_demo_a",
  sourceUrl: "https://jobs.northstar.ai/senior-product-platform-engineer",
  applyUrl: "https://apply.northstar.ai/senior-product-platform-engineer",
  title: "Senior Product Platform Engineer",
  company: "Northstar",
  location: "Remote (North America)",
  description:
    "Northstar is hiring a Senior Product Platform Engineer to build internal product systems, workflow tooling, and decision-support surfaces for cross-functional teams.",
  rawText:
    "Northstar is hiring a Senior Product Platform Engineer to build internal product systems, workflow tooling, and decision-support surfaces for cross-functional teams.",
  importStatus: "imported",
  importSummary: {
    source: "live_html",
    warnings: [],
    hasWarnings: false,
    statusLabel: "Live import"
  },
  importDiagnostics: {
    fetchStatus: 200,
    usedJsonLd: true,
    usedBodyFallback: false,
    applyUrlSource: "json_ld",
    titleSource: "og:title",
    companySource: "json_ld",
    descriptionSource: "json_ld"
  },
  createdAt: "2026-04-01T14:10:00.000Z",
  updatedAt: "2026-04-03T21:35:00.000Z"
};

const analyzeRun: WorkflowRun = {
  id: "run_demo_analyze_a",
  jobId: jobA.id,
  retryOfRunId: null,
  applicationId: null,
  resumeVersionId: null,
  kind: "analyze",
  status: "completed",
  executionMode: "temporal",
  workflowId: "analyze-job-demo-a",
  workflowType: "analyzeJobWorkflow",
  taskQueue: "rolecraft-analysis",
  startedAt: "2026-04-01T14:15:00.000Z",
  completedAt: "2026-04-01T14:16:30.000Z",
  pauseRequestedAt: null,
  pausedAt: null,
  pauseReason: null,
  resumeRequestedAt: null,
  errorMessage: null,
  createdAt: "2026-04-01T14:15:00.000Z",
  updatedAt: "2026-04-01T14:16:30.000Z"
};

const resumeRun: WorkflowRun = {
  id: "run_demo_resume_a",
  jobId: jobA.id,
  retryOfRunId: null,
  applicationId: null,
  resumeVersionId: "resume_demo_a1",
  kind: "generate_resume",
  status: "completed",
  executionMode: "direct",
  workflowId: null,
  workflowType: null,
  taskQueue: null,
  startedAt: "2026-04-01T14:30:00.000Z",
  completedAt: "2026-04-01T14:31:00.000Z",
  pauseRequestedAt: null,
  pausedAt: null,
  pauseReason: null,
  resumeRequestedAt: null,
  errorMessage: null,
  createdAt: "2026-04-01T14:30:00.000Z",
  updatedAt: "2026-04-01T14:31:00.000Z"
};

const failedPrefillRun: WorkflowRun = {
  id: "run_demo_prefill_a0",
  jobId: jobA.id,
  retryOfRunId: null,
  applicationId: "app_demo_a0",
  resumeVersionId: "resume_demo_a1",
  kind: "prefill",
  status: "failed",
  executionMode: "temporal",
  workflowId: "prefill-job-demo-a0",
  workflowType: "prefillJobWorkflow",
  taskQueue: "rolecraft-analysis",
  startedAt: "2026-04-01T15:10:00.000Z",
  completedAt: "2026-04-01T15:12:00.000Z",
  pauseRequestedAt: null,
  pausedAt: null,
  pauseReason: null,
  resumeRequestedAt: null,
  errorMessage: "High-risk compensation field requires manual confirmation.",
  createdAt: "2026-04-01T15:10:00.000Z",
  updatedAt: "2026-04-01T15:12:00.000Z"
};

const latestPrefillRun: WorkflowRun = {
  id: "run_demo_prefill_a1",
  jobId: jobA.id,
  retryOfRunId: failedPrefillRun.id,
  applicationId: "app_demo_a1",
  resumeVersionId: "resume_demo_a1",
  kind: "prefill",
  status: "completed",
  executionMode: "temporal",
  workflowId: "prefill-job-demo-a1",
  workflowType: "prefillJobWorkflow",
  taskQueue: "rolecraft-analysis",
  startedAt: "2026-04-02T09:20:00.000Z",
  completedAt: "2026-04-02T09:23:00.000Z",
  pauseRequestedAt: null,
  pausedAt: null,
  pauseReason: null,
  resumeRequestedAt: null,
  errorMessage: null,
  createdAt: "2026-04-02T09:20:00.000Z",
  updatedAt: "2026-04-02T09:23:00.000Z"
};

const analysisA: AnalysisRecord = {
  id: "analysis_demo_a1",
  jobId: jobA.id,
  matchScore: 84,
  summary:
    "Strong fit for workflow tooling, product systems thinking, and human-in-the-loop operational UX. Missing depth in ML infra is not core to the role.",
  requiredSkills: ["TypeScript", "React", "Internal tooling", "Workflow systems", "Product sense"],
  missingSkills: ["Python backend depth"],
  redFlags: ["Compensation range is not listed.", "Cross-functional coordination load is likely high."],
  status: "completed",
  errorMessage: null,
  createdAt: "2026-04-01T14:16:30.000Z",
  updatedAt: "2026-04-01T14:16:30.000Z"
};

const resumeA: ResumeVersion = {
  id: "resume_demo_a1",
  jobId: jobA.id,
  sourceProfileId: "profile_demo_a",
  status: "completed",
  headline: "Senior Product Platform Engineer",
  professionalSummary:
    "Product-minded platform engineer with experience building internal systems, workflow tooling, and operational interfaces for review-heavy teams.",
  skills: ["TypeScript", "React", "Node.js", "Workflow automation", "Design systems"],
  experienceSections: [
    {
      title: "Senior Product Engineer",
      company: "Signalpath",
      bullets: [
        "Built internal workflow surfaces that reduced review time across operational teams.",
        "Partnered with product and ops on high-trust decision support interfaces."
      ]
    }
  ],
  projectSections: [
    {
      name: "Ops Ledger",
      tagline: "Structured operational review workspace",
      bullets: [
        "Shipped evidence trails for internal decision workflows.",
        "Created interfaces for manual approval, revision, and escalation."
      ]
    }
  ],
  changeSummary: {
    highlightedStrengths: ["Workflow tooling", "Operational UX", "Cross-functional product systems"],
    deemphasizedItems: ["Consumer growth experiments"],
    notes: ["Tailored toward internal tooling and review-heavy product work."]
  },
  structuredContent: {
    headline: "Senior Product Platform Engineer",
    professionalSummary:
      "Product-minded platform engineer with experience building internal systems, workflow tooling, and operational interfaces for review-heavy teams.",
    keySkills: ["TypeScript", "React", "Node.js", "Workflow automation", "Design systems"],
    experience: [
      {
        title: "Senior Product Engineer",
        company: "Signalpath",
        bullets: [
          "Built internal workflow surfaces that reduced review time across operational teams.",
          "Partnered with product and ops on high-trust decision support interfaces."
        ]
      }
    ],
    projects: [
      {
        name: "Ops Ledger",
        tagline: "Structured operational review workspace",
        bullets: [
          "Shipped evidence trails for internal decision workflows.",
          "Created interfaces for manual approval, revision, and escalation."
        ]
      }
    ],
    changeSummary: {
      highlightedStrengths: ["Workflow tooling", "Operational UX", "Cross-functional product systems"],
      deemphasizedItems: ["Consumer growth experiments"],
      notes: ["Tailored toward internal tooling and review-heavy product work."]
    }
  },
  errorMessage: null,
  createdAt: "2026-04-01T14:31:00.000Z",
  updatedAt: "2026-04-01T14:31:00.000Z"
};

const appFieldResultsA0 = [
  {
    fieldName: "full_name",
    fieldLabel: "Full name",
    fieldType: "basic_text" as const,
    suggestedValue: "Avery Chen",
    filled: true,
    status: "filled" as const
  },
  {
    fieldName: "resume_upload",
    fieldLabel: "Resume",
    fieldType: "resume_upload" as const,
    suggestedValue: "resume_demo_a1.pdf",
    filled: true,
    status: "filled" as const
  },
  {
    fieldName: "salary_expectation",
    fieldLabel: "Salary expectation",
    fieldType: "long_text" as const,
    questionText: "What is your salary expectation?",
    filled: false,
    status: "failed" as const,
    failureReason: "High-risk compensation field requires manual confirmation."
  }
];

const appFieldResultsA1 = [
  {
    fieldName: "full_name",
    fieldLabel: "Full name",
    fieldType: "basic_text" as const,
    suggestedValue: "Avery Chen",
    filled: true,
    status: "filled" as const
  },
  {
    fieldName: "resume_upload",
    fieldLabel: "Resume",
    fieldType: "resume_upload" as const,
    suggestedValue: "resume_demo_a1.pdf",
    filled: true,
    status: "filled" as const
  },
  {
    fieldName: "work_authorization",
    fieldLabel: "Work authorization",
    fieldType: "basic_text" as const,
    suggestedValue: "Eligible to work in Canada and the United States",
    filled: true,
    status: "filled" as const
  },
  {
    fieldName: "why_here",
    fieldLabel: "Why do you want to work here?",
    fieldType: "long_text" as const,
    questionText: "Why do you want to work here?",
    filled: false,
    status: "failed" as const,
    failureReason: "High-risk question requires saved default answer."
  }
];

const automationSessionOld: AutomationSession = {
  id: "session_demo_a1_old",
  applicationId: "app_demo_a1",
  workflowRunId: failedPrefillRun.id,
  resumeVersionId: resumeA.id,
  kind: "prefill",
  status: "failed",
  applyUrl: jobA.applyUrl ?? "",
  formSnapshot: {},
  fieldResults: appFieldResultsA0,
  screenshotPaths: [],
  workerLog: [
    {
      level: "warn",
      message: "Compensation field flagged as high-risk and left for manual review.",
      timestamp: "2026-04-01T15:11:00.000Z"
    }
  ],
  errorMessage: "High-risk compensation field requires manual confirmation.",
  startedAt: "2026-04-01T15:10:00.000Z",
  completedAt: "2026-04-01T15:12:00.000Z",
  createdAt: "2026-04-01T15:10:00.000Z",
  updatedAt: "2026-04-01T15:12:00.000Z"
};

const automationSessionLatest: AutomationSession = {
  id: "session_demo_a1_latest",
  applicationId: "app_demo_a1",
  workflowRunId: latestPrefillRun.id,
  resumeVersionId: resumeA.id,
  kind: "prefill",
  status: "completed",
  applyUrl: jobA.applyUrl ?? "",
  formSnapshot: {},
  fieldResults: appFieldResultsA1,
  screenshotPaths: [],
  workerLog: [
    {
      level: "info",
      message: "Completed prefill with one remaining high-risk answer left unresolved.",
      timestamp: "2026-04-02T09:23:00.000Z"
    }
  ],
  errorMessage: null,
  startedAt: "2026-04-02T09:20:00.000Z",
  completedAt: "2026-04-02T09:23:00.000Z",
  createdAt: "2026-04-02T09:20:00.000Z",
  updatedAt: "2026-04-02T09:23:00.000Z"
};

const applicationA0: ApplicationContext = {
  application: {
    id: "app_demo_a0",
    jobId: jobA.id,
    resumeVersionId: resumeA.id,
    status: "failed",
    approvalStatus: "needs_revision",
    applyUrl: jobA.applyUrl ?? "",
    formSnapshot: {},
    fieldResults: appFieldResultsA0,
    screenshotPaths: [],
    workerLog: automationSessionOld.workerLog,
    submissionStatus: "not_ready",
    submittedAt: null,
    submissionNote: "",
    submittedByUser: false,
    finalSubmissionSnapshot: null,
    reviewNote: "Compensation question still needs a manual answer before re-running.",
    errorMessage: automationSessionOld.errorMessage,
    createdAt: "2026-04-01T15:10:00.000Z",
    updatedAt: "2026-04-01T15:12:00.000Z"
  },
  job: {
    id: jobA.id,
    title: jobA.title,
    company: jobA.company,
    applyUrl: jobA.applyUrl
  },
  resumeVersion: {
    id: resumeA.id,
    headline: resumeA.headline,
    status: resumeA.status
  },
  latestAutomationSession: automationSessionOld,
  unresolvedItems: [
    {
      id: "unresolved_demo_a0_comp",
      automationSessionId: automationSessionOld.id,
      applicationId: "app_demo_a0",
      fieldName: "salary_expectation",
      fieldLabel: "Salary expectation",
      fieldType: "long_text",
      questionText: "What is your salary expectation?",
      status: "unresolved",
      resolutionKind: null,
      failureReason: "High-risk compensation field requires manual confirmation.",
      source: "browser_worker",
      suggestedValue: null,
      metadata: {},
      resolvedAt: null,
      createdAt: "2026-04-01T15:12:00.000Z",
      updatedAt: "2026-04-01T15:12:00.000Z"
    }
  ]
};

const applicationA1: ApplicationContext = {
  application: {
    id: "app_demo_a1",
    jobId: jobA.id,
    resumeVersionId: resumeA.id,
    status: "completed",
    approvalStatus: "approved_for_submit",
    applyUrl: jobA.applyUrl ?? "",
    formSnapshot: {},
    fieldResults: appFieldResultsA1,
    screenshotPaths: [],
    workerLog: automationSessionLatest.workerLog,
    submissionStatus: "ready_to_submit",
    submittedAt: null,
    submissionNote: "",
    submittedByUser: false,
    finalSubmissionSnapshot: null,
    reviewNote:
      "Strong fit overall. Before final submit, answer the high-risk motivation question manually and verify compensation expectations.",
    errorMessage: null,
    createdAt: "2026-04-02T09:20:00.000Z",
    updatedAt: "2026-04-02T09:40:00.000Z"
  },
  job: {
    id: jobA.id,
    title: jobA.title,
    company: jobA.company,
    applyUrl: jobA.applyUrl
  },
  resumeVersion: {
    id: resumeA.id,
    headline: resumeA.headline,
    status: resumeA.status
  },
  latestAutomationSession: automationSessionLatest,
  unresolvedItems: [
    {
      id: "unresolved_demo_a1_why_here",
      automationSessionId: automationSessionLatest.id,
      applicationId: "app_demo_a1",
      fieldName: "why_here",
      fieldLabel: "Why do you want to work here?",
      fieldType: "long_text",
      questionText: "Why do you want to work here?",
      status: "unresolved",
      resolutionKind: null,
      failureReason: "High-risk question requires saved default answer.",
      source: "browser_worker",
      suggestedValue: null,
      metadata: {},
      resolvedAt: null,
      createdAt: "2026-04-02T09:23:00.000Z",
      updatedAt: "2026-04-02T09:23:00.000Z"
    }
  ]
};

const submissionReviewA1: SubmissionReview = {
  ...applicationA1,
  unresolvedFieldCount: 1,
  failedFieldCount: 1
};

const applicationEventsById: Record<string, ApplicationEvent[]> = {
  app_demo_a0: [
    {
      id: "app_event_demo_a0_prefill",
      applicationId: "app_demo_a0",
      type: "prefill_run",
      actorType: "worker",
      actorLabel: "Prefill worker",
      actorId: failedPrefillRun.id,
      source: "system",
      summary: "Initial prefill run failed on a compensation field that required manual confirmation.",
      orchestration: {
        executionMode: "temporal",
        workflowId: failedPrefillRun.workflowId ?? undefined,
        workflowType: failedPrefillRun.workflowType ?? undefined,
        taskQueue: failedPrefillRun.taskQueue ?? undefined
      },
      payload: {},
      createdAt: "2026-04-01T15:12:00.000Z"
    },
    {
      id: "app_event_demo_a0_revision",
      applicationId: "app_demo_a0",
      type: "approval_updated",
      actorType: "user",
      actorLabel: "Avery Chen",
      actorId: "user_demo_avery",
      source: "web-ui",
      summary: "Marked this earlier run for revision and kept the evidence on record.",
      orchestration: null,
      payload: {},
      createdAt: "2026-04-01T15:20:00.000Z"
    }
  ],
  app_demo_a1: [
    {
      id: "app_event_demo_a1_prefill",
      applicationId: "app_demo_a1",
      type: "prefill_run",
      actorType: "worker",
      actorLabel: "Prefill worker",
      actorId: latestPrefillRun.id,
      source: "system",
      summary: "Latest prefill completed with one remaining high-risk long-answer question.",
      orchestration: {
        executionMode: "temporal",
        workflowId: latestPrefillRun.workflowId ?? undefined,
        workflowType: latestPrefillRun.workflowType ?? undefined,
        taskQueue: latestPrefillRun.taskQueue ?? undefined
      },
      payload: {},
      createdAt: "2026-04-02T09:23:00.000Z"
    },
    {
      id: "app_event_demo_a1_approval",
      applicationId: "app_demo_a1",
      type: "approval_updated",
      actorType: "user",
      actorLabel: "Avery Chen",
      actorId: "user_demo_avery",
      source: "web-ui",
      summary: "Approved this application for manual submission after reviewing the latest prefill evidence.",
      orchestration: null,
      payload: {},
      createdAt: "2026-04-02T09:40:00.000Z"
    }
  ]
};

const workflowRunEventsById: Record<string, WorkflowRunEvent[]> = {
  [analyzeRun.id]: [
    { id: "run_event_analyze_queued", workflowRunId: analyzeRun.id, type: "run_queued", payload: {}, createdAt: "2026-04-01T14:15:00.000Z" },
    { id: "run_event_analyze_started", workflowRunId: analyzeRun.id, type: "run_started", payload: {}, createdAt: "2026-04-01T14:15:05.000Z" },
    { id: "run_event_analyze_completed", workflowRunId: analyzeRun.id, type: "run_completed", payload: {}, createdAt: "2026-04-01T14:16:30.000Z" }
  ],
  [resumeRun.id]: [
    { id: "run_event_resume_started", workflowRunId: resumeRun.id, type: "run_started", payload: {}, createdAt: "2026-04-01T14:30:00.000Z" },
    { id: "run_event_resume_completed", workflowRunId: resumeRun.id, type: "run_completed", payload: {}, createdAt: "2026-04-01T14:31:00.000Z" }
  ],
  [failedPrefillRun.id]: [
    { id: "run_event_prefill_old_started", workflowRunId: failedPrefillRun.id, type: "run_started", payload: {}, createdAt: "2026-04-01T15:10:00.000Z" },
    { id: "run_event_prefill_old_failed", workflowRunId: failedPrefillRun.id, type: "run_failed", payload: { error: failedPrefillRun.errorMessage }, createdAt: "2026-04-01T15:12:00.000Z" },
    { id: "run_event_prefill_old_retried", workflowRunId: failedPrefillRun.id, type: "run_retried", payload: { nextRunId: latestPrefillRun.id }, createdAt: "2026-04-02T09:20:00.000Z" }
  ],
  [latestPrefillRun.id]: [
    { id: "run_event_prefill_new_started", workflowRunId: latestPrefillRun.id, type: "run_started", payload: {}, createdAt: "2026-04-02T09:20:00.000Z" },
    { id: "run_event_prefill_new_completed", workflowRunId: latestPrefillRun.id, type: "run_completed", payload: {}, createdAt: "2026-04-02T09:23:00.000Z" }
  ]
};

const workflowRunDetailsById: Record<string, WorkflowRunDetail> = {
  [analyzeRun.id]: {
    workflowRun: analyzeRun,
    job: { id: jobA.id, title: jobA.title, company: jobA.company },
    application: null,
    resumeVersion: null,
    retryOfRun: null,
    latestRetry: null
  },
  [resumeRun.id]: {
    workflowRun: resumeRun,
    job: { id: jobA.id, title: jobA.title, company: jobA.company },
    application: null,
    resumeVersion: { id: resumeA.id, headline: resumeA.headline, status: resumeA.status },
    retryOfRun: null,
    latestRetry: null
  },
  [failedPrefillRun.id]: {
    workflowRun: failedPrefillRun,
    job: { id: jobA.id, title: jobA.title, company: jobA.company },
    application: {
      id: applicationA0.application.id,
      status: applicationA0.application.status,
      approvalStatus: applicationA0.application.approvalStatus,
      submissionStatus: applicationA0.application.submissionStatus,
      createdAt: applicationA0.application.createdAt
    },
    resumeVersion: { id: resumeA.id, headline: resumeA.headline, status: resumeA.status },
    retryOfRun: null,
    latestRetry: latestPrefillRun
  },
  [latestPrefillRun.id]: {
    workflowRun: latestPrefillRun,
    job: { id: jobA.id, title: jobA.title, company: jobA.company },
    application: {
      id: applicationA1.application.id,
      status: applicationA1.application.status,
      approvalStatus: applicationA1.application.approvalStatus,
      submissionStatus: applicationA1.application.submissionStatus,
      createdAt: applicationA1.application.createdAt
    },
    resumeVersion: { id: resumeA.id, headline: resumeA.headline, status: resumeA.status },
    retryOfRun: failedPrefillRun,
    latestRetry: null
  }
};

const allWorkflowRuns = [latestPrefillRun, failedPrefillRun, resumeRun, analyzeRun];

const jobAListItem: JobListItemResponse = {
  ...jobA,
  latestAnalysis: {
    matchScore: analysisA.matchScore,
    summary: analysisA.summary,
    status: analysisA.status
  },
  latestResumeVersion: {
    id: resumeA.id,
    headline: resumeA.headline,
    status: resumeA.status
  }
};

const jobADetail: JobDetailResponse = {
  ...jobA,
  analyses: [analysisA],
  resumeVersions: [resumeA]
};

const recentTimeline: TimelineItem[] = [
  {
    id: "timeline_demo_approval",
    entityType: "application",
    entityId: applicationA1.application.id,
    jobId: jobA.id,
    applicationId: applicationA1.application.id,
    type: "approval_updated",
    label: "Application approved for submission",
    timestamp: "2026-04-02T09:40:00.000Z",
    actorType: "user",
    actorLabel: "Avery Chen",
    actorId: "user_demo_avery",
    source: "web-ui",
    summary: "Approved the latest application run for manual submission after reviewing evidence.",
    orchestration: null,
    status: "approved_for_submit",
    meta: {}
  },
  {
    id: "timeline_demo_prefill",
    entityType: "application",
    entityId: applicationA1.application.id,
    jobId: jobA.id,
    applicationId: applicationA1.application.id,
    type: "prefill_run",
    label: "Latest prefill completed",
    timestamp: "2026-04-02T09:23:00.000Z",
    actorType: "worker",
    actorLabel: "Prefill worker",
    actorId: latestPrefillRun.id,
    source: "system",
    summary: "Completed a new application run with one unresolved high-risk answer left for manual review.",
    orchestration: {
      executionMode: "temporal",
      workflowId: latestPrefillRun.workflowId ?? undefined,
      workflowType: latestPrefillRun.workflowType ?? undefined,
      taskQueue: latestPrefillRun.taskQueue ?? undefined
    },
    status: "completed",
    meta: {}
  },
  {
    id: "timeline_demo_resume",
    entityType: "job",
    entityId: jobA.id,
    jobId: jobA.id,
    applicationId: null,
    type: "resume_generated",
    label: "Resume version generated",
    timestamp: "2026-04-01T14:31:00.000Z",
    actorType: "api",
    actorLabel: "Resume service",
    actorId: resumeRun.id,
    source: "system",
    summary: "Generated a tailored resume version for the Northstar role.",
    orchestration: {
      executionMode: "direct"
    },
    status: "completed",
    meta: {}
  },
  {
    id: "timeline_demo_analysis",
    entityType: "job",
    entityId: jobA.id,
    jobId: jobA.id,
    applicationId: null,
    type: "analysis_completed",
    label: "Analysis completed",
    timestamp: "2026-04-01T14:16:30.000Z",
    actorType: "worker",
    actorLabel: "Analysis worker",
    actorId: analyzeRun.id,
    source: "system",
    summary: "Scored the role as a strong fit for workflow tooling and internal product systems work.",
    orchestration: {
      executionMode: "temporal",
      workflowId: analyzeRun.workflowId ?? undefined,
      workflowType: analyzeRun.workflowType ?? undefined,
      taskQueue: analyzeRun.taskQueue ?? undefined
    },
    status: "completed",
    meta: {}
  }
];

const demoDashboardOverview: DashboardOverview = {
  metrics: {
    totalJobs: 1,
    analyzedJobs: 1,
    resumeReadyJobs: 1,
    totalApplications: 2,
    pendingReviewApplications: 0
  },
  pipeline: {
    imported: 0,
    analyzed: 0,
    resume_ready: 0,
    prefill_run: 0,
    pending_review: 0,
    approved_for_submit: 0,
    ready_to_submit: 1,
    submitted: 0,
    submit_failed: 0,
    needs_revision: 1,
    rejected: 0
  },
  approvalBreakdown: {
    pending_review: 0,
    approved_for_submit: 1,
    needs_revision: 1,
    rejected: 0
  },
  jobs: [
    {
      jobId: jobA.id,
      title: jobA.title,
      company: jobA.company,
      location: jobA.location,
      stage: "ready_to_submit",
      analysisScore: analysisA.matchScore,
      resumeStatus: resumeA.status,
      approvalStatus: applicationA1.application.approvalStatus,
      submissionStatus: applicationA1.application.submissionStatus,
      resumeHeadline: resumeA.headline,
      latestAnalyzeRun: analyzeRun,
      latestResumeRun: resumeRun,
      latestPrefillRun: latestPrefillRun
    }
  ],
  recentActivity: recentTimeline.map((item) => ({
    id: item.id,
    type: item.type,
    label: item.label,
    jobId: item.jobId,
    timestamp: item.timestamp,
    actorType: item.actorType,
    actorLabel: item.actorLabel,
    actorId: item.actorId,
    source: item.source,
    summary: item.summary,
    orchestration: item.orchestration ?? null
  }))
};

const demoDashboardHistory: DashboardHistory = {
  globalTimeline: recentTimeline,
  jobTimelines: [
    {
      jobId: jobA.id,
      title: jobA.title,
      company: jobA.company,
      location: jobA.location,
      events: recentTimeline.filter((item) => item.jobId === jobA.id)
    }
  ],
  applicationTimelines: [
    {
      applicationId: applicationA1.application.id,
      jobId: jobA.id,
      title: jobA.title,
      company: jobA.company,
      approvalStatus: applicationA1.application.approvalStatus,
      submissionStatus: applicationA1.application.submissionStatus,
      events: recentTimeline.filter((item) => item.applicationId === applicationA1.application.id)
    },
    {
      applicationId: applicationA0.application.id,
      jobId: jobA.id,
      title: jobA.title,
      company: jobA.company,
      approvalStatus: applicationA0.application.approvalStatus,
      submissionStatus: applicationA0.application.submissionStatus,
      events: [
        {
          id: "timeline_demo_old_prefill",
          entityType: "application",
          entityId: applicationA0.application.id,
          jobId: jobA.id,
          applicationId: applicationA0.application.id,
          type: "prefill_run",
          label: "Earlier prefill failed",
          timestamp: "2026-04-01T15:12:00.000Z",
          actorType: "worker",
          actorLabel: "Prefill worker",
          actorId: failedPrefillRun.id,
          source: "system",
          summary: "An earlier run was left for revision because the compensation field required manual handling.",
          orchestration: {
            executionMode: "temporal",
            workflowId: failedPrefillRun.workflowId ?? undefined,
            workflowType: failedPrefillRun.workflowType ?? undefined,
            taskQueue: failedPrefillRun.taskQueue ?? undefined
          },
          status: "failed",
          meta: {}
        }
      ]
    }
  ]
};

function cloneValue<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function includesQuery(value: string | null | undefined, query: string) {
  return (value ?? "").toLowerCase().includes(query);
}

function filterWorkflowRuns(pathname: string, searchParams: URLSearchParams) {
  if (pathname === `/jobs/${jobA.id}/workflow-runs`) {
    return allWorkflowRuns;
  }

  let runs = [...allWorkflowRuns];
  const kind = searchParams.get("kind");
  const status = searchParams.get("status");
  const executionMode = searchParams.get("executionMode");
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";

  if (kind) {
    runs = runs.filter((run) => run.kind === kind);
  }

  if (status) {
    runs = runs.filter((run) => run.status === status);
  }

  if (executionMode) {
    runs = runs.filter((run) => run.executionMode === executionMode);
  }

  if (query) {
    runs = runs.filter((run) =>
      [
        run.id,
        run.kind,
        run.status,
        run.applicationId,
        run.resumeVersionId,
        jobA.title,
        jobA.company
      ].some((value) => includesQuery(value ?? "", query))
    );
  }

  return runs;
}

function buildWorkflowRunsResponse(searchParams: URLSearchParams): WorkflowRunsListResponse {
  const runs = filterWorkflowRuns("/workflow-runs", searchParams).map((workflowRun) => ({
    workflowRun,
    job: { id: jobA.id, title: jobA.title, company: jobA.company },
    application:
      workflowRun.applicationId != null
        ? {
            id: workflowRun.applicationId,
            status:
              workflowRun.applicationId === applicationA1.application.id
                ? applicationA1.application.status
                : applicationA0.application.status
          }
        : null,
    resumeVersion:
      workflowRun.resumeVersionId != null
        ? { id: resumeA.id, headline: resumeA.headline, status: resumeA.status }
        : null
  }));

  return {
    summary: {
      totalRuns: runs.length,
      queuedRuns: runs.filter((item) => item.workflowRun.status === "queued").length,
      runningRuns: runs.filter((item) => item.workflowRun.status === "running").length,
      completedRuns: runs.filter((item) => item.workflowRun.status === "completed").length,
      failedRuns: runs.filter((item) => item.workflowRun.status === "failed").length,
      cancelledRuns: runs.filter((item) => item.workflowRun.status === "cancelled").length
    },
    pageInfo: {
      nextCursor: null,
      hasMore: false,
      returnedCount: runs.length
    },
    runs
  };
}

function filterApplicationEvents(applicationId: string, searchParams: URLSearchParams) {
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const actorType = searchParams.get("actorType");
  const eventType = searchParams.get("eventType");
  const source = searchParams.get("source");
  const limit = Number(searchParams.get("limit") ?? "20");

  let events = [...(applicationEventsById[applicationId] ?? [])];

  if (actorType) {
    events = events.filter((event) => event.actorType === actorType);
  }

  if (eventType) {
    events = events.filter((event) => event.type === eventType);
  }

  if (source) {
    events = events.filter((event) => event.source === source);
  }

  if (query) {
    events = events.filter((event) =>
      [event.id, event.summary, event.actorLabel, event.actorId, event.type].some((value) =>
        includesQuery(value, query)
      )
    );
  }

  return events.slice(0, Number.isFinite(limit) ? limit : 20);
}

function filterTimeline(searchParams: URLSearchParams) {
  const query = searchParams.get("q")?.trim().toLowerCase() ?? "";
  const actorType = searchParams.get("actorType");
  const entityType = searchParams.get("entityType");
  const eventType = searchParams.get("eventType");
  const source = searchParams.get("source");
  const limit = Number(searchParams.get("limit") ?? "20");

  let items = [...demoDashboardHistory.globalTimeline];

  if (actorType) {
    items = items.filter((item) => item.actorType === actorType);
  }

  if (entityType) {
    items = items.filter((item) => item.entityType === entityType);
  }

  if (eventType) {
    items = items.filter((item) => item.type === eventType);
  }

  if (source) {
    items = items.filter((item) => item.source === source);
  }

  if (query) {
    items = items.filter((item) =>
      [item.id, item.summary, item.label, item.jobId, item.applicationId, item.actorLabel, item.actorId].some((value) =>
        includesQuery(value, query)
      )
    );
  }

  return items.slice(0, Number.isFinite(limit) ? limit : 20);
}

export function getDemoGetResponse(path: string) {
  const url = new URL(path, "http://rolecraft-demo.local");
  const pathname = url.pathname;
  const searchParams = url.searchParams;

  if (pathname === "/profile") {
    return cloneValue(demoProfile);
  }

  if (pathname === "/settings/llm") {
    return cloneValue(demoSettings);
  }

  if (pathname === "/jobs") {
    return cloneValue([jobAListItem]);
  }

  if (pathname === `/jobs/${jobA.id}`) {
    return cloneValue(jobADetail);
  }

  if (pathname === `/jobs/${jobA.id}/applications`) {
    return cloneValue([applicationA1, applicationA0]);
  }

  if (pathname === `/jobs/${jobA.id}/workflow-runs`) {
    return cloneValue(allWorkflowRuns);
  }

  if (pathname === "/workflow-runs") {
    return cloneValue(buildWorkflowRunsResponse(searchParams));
  }

  const workflowRunMatch = pathname.match(/^\/workflow-runs\/([^/]+)$/);
  if (workflowRunMatch) {
    return cloneValue(workflowRunDetailsById[workflowRunMatch[1] ?? ""]);
  }

  const workflowRunEventsMatch = pathname.match(/^\/workflow-runs\/([^/]+)\/events$/);
  if (workflowRunEventsMatch) {
    return cloneValue(workflowRunEventsById[workflowRunEventsMatch[1] ?? ""] ?? []);
  }

  if (pathname === "/applications") {
    return cloneValue([applicationA1, applicationA0]);
  }

  const applicationMatch = pathname.match(/^\/applications\/([^/]+)$/);
  if (applicationMatch) {
    const applicationId = applicationMatch[1] ?? "";
    if (applicationId === applicationA1.application.id) {
      return cloneValue(applicationA1);
    }
    if (applicationId === applicationA0.application.id) {
      return cloneValue(applicationA0);
    }
  }

  const applicationEventsMatch = pathname.match(/^\/applications\/([^/]+)\/events$/);
  if (applicationEventsMatch) {
    const applicationId = applicationEventsMatch[1] ?? "";
    return cloneValue(filterApplicationEvents(applicationId, searchParams));
  }

  const automationSessionsMatch = pathname.match(/^\/applications\/([^/]+)\/automation-sessions$/);
  if (automationSessionsMatch) {
    const applicationId = automationSessionsMatch[1] ?? "";
    if (applicationId === applicationA1.application.id) {
      return cloneValue([automationSessionLatest, automationSessionOld]);
    }
    if (applicationId === applicationA0.application.id) {
      return cloneValue([automationSessionOld]);
    }
  }

  const submissionReviewMatch = pathname.match(/^\/applications\/([^/]+)\/submission-review$/);
  if (submissionReviewMatch) {
    const applicationId = submissionReviewMatch[1] ?? "";
    if (applicationId === applicationA1.application.id) {
      return cloneValue(submissionReviewA1);
    }
    if (applicationId === applicationA0.application.id) {
      return cloneValue({
        ...applicationA0,
        unresolvedFieldCount: 1,
        failedFieldCount: 1
      } satisfies SubmissionReview);
    }
  }

  if (pathname === "/dashboard/overview") {
    return cloneValue(demoDashboardOverview);
  }

  if (pathname === "/dashboard/history") {
    return cloneValue(demoDashboardHistory);
  }

  if (pathname === "/dashboard/timeline") {
    return cloneValue(filterTimeline(searchParams));
  }

  return undefined;
}
