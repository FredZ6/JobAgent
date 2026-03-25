import {
  type AutomationSession,
  type ApplicationEventType,
  type ApplicationEvent,
  type ApplicationContext,
  type ApprovalRequest,
  type ApprovalStatus,
  type AuditActorType,
  type CandidateProfile,
  type DashboardEventType,
  type DashboardHistory,
  type DashboardOverview,
  type MarkRetryReadyRequest,
  type MarkSubmitFailedRequest,
  type MarkSubmittedRequest,
  type JobAnalysisResult,
  type JobDto,
  type JobImportRequest,
  type JobStage,
  type LlmSettingsInput,
  type ReopenSubmissionRequest,
  type UnresolvedAutomationItem,
  type UpdateUnresolvedAutomationItemRequest,
  type SubmissionReview,
  type TimelineEntityType,
  type TimelineItem,
  type ResumeVersion,
  type WorkflowRunDetail,
  type WorkflowRunExecutionMode,
  type WorkflowRunEvent,
  type WorkflowRunKind,
  type WorkflowRunSortBy,
  type WorkflowRunSortOrder,
  type WorkflowRunStatus,
  type WorkflowRunsBulkActionResponse,
  type WorkflowRunsListResponse,
  type WorkflowRun
} from "@rolecraft/shared-types";
import { extractApiErrorMessage } from "./api-error";
import { resolveWebApiBaseUrl } from "./api-base";

const IS_BROWSER = typeof window !== "undefined";

const API_BASE = resolveWebApiBaseUrl(
  {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    API_URL: IS_BROWSER ? undefined : process.env.API_URL
  },
  {
    browser: IS_BROWSER
  }
);

type AnalysisRecord = JobAnalysisResult & {
  id: string;
  jobId: string;
  status: string;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
};

export type JobDetail = JobDto & {
  analyses: AnalysisRecord[];
  resumeVersions: ResumeVersion[];
};

export type ApplicationWithContext = ApplicationContext;

export type SubmissionReviewWithContext = SubmissionReview;

export type JobListItem = JobDto & {
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

export type ApplicationTableRow = ApplicationWithContext;
export type WorkflowRunsFilter = {
  kind?: WorkflowRunKind;
  status?: WorkflowRunStatus;
  executionMode?: WorkflowRunExecutionMode;
  q?: string;
  from?: string;
  to?: string;
  sortBy?: WorkflowRunSortBy;
  sortOrder?: WorkflowRunSortOrder;
  cursor?: string;
  limit?: number;
};

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!response.ok) {
    const message = extractApiErrorMessage(await response.text(), response.status);
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function fetchProfile() {
  return request<CandidateProfile>("/profile");
}

export function saveProfile(input: CandidateProfile) {
  return request<CandidateProfile>("/profile", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function fetchSettings() {
  return request<LlmSettingsInput>("/settings/llm");
}

export function saveSettings(input: LlmSettingsInput) {
  return request<LlmSettingsInput>("/settings/llm", {
    method: "PUT",
    body: JSON.stringify(input)
  });
}

export function fetchJobs() {
  return request<JobListItem[]>("/jobs");
}

export function fetchJob(id: string) {
  return request<JobDetail>(`/jobs/${id}`);
}

export function importJob(input: JobImportRequest) {
  return request<JobDto>("/jobs/import-by-url", {
    method: "POST",
    body: JSON.stringify(input)
  });
}

export function analyzeJob(id: string) {
  return request<AnalysisRecord>(`/jobs/${id}/analyze`, {
    method: "POST"
  });
}

export function generateResume(id: string) {
  return request<ResumeVersion>(`/jobs/${id}/generate-resume`, {
    method: "POST"
  });
}

export function fetchResumeVersions(jobId: string) {
  return request<ResumeVersion[]>(`/jobs/${jobId}/resume-versions`);
}

export function fetchResumeVersion(id: string) {
  return request<ResumeVersion>(`/resume-versions/${id}`);
}

export type ResumePdfTemplate = "classic" | "modern";

export function buildResumePdfUrl(id: string, template?: ResumePdfTemplate) {
  const search = template ? `?template=${template}` : "";
  return `${API_BASE}/resume-versions/${id}/pdf${search}`;
}

export function buildResumePdfInlineUrl(id: string, template?: ResumePdfTemplate) {
  const search = template ? `?template=${template}` : "";
  return `${API_BASE}/resume-versions/${id}/pdf/inline${search}`;
}

export function runPrefill(jobId: string) {
  return request<ApplicationWithContext>(`/jobs/${jobId}/prefill`, {
    method: "POST"
  });
}

export function fetchJobApplications(jobId: string) {
  return request<ApplicationWithContext[]>(`/jobs/${jobId}/applications`);
}

export function fetchJobWorkflowRuns(jobId: string) {
  return request<WorkflowRun[]>(`/jobs/${jobId}/workflow-runs`);
}

export function fetchWorkflowRun(id: string) {
  return request<WorkflowRunDetail>(`/workflow-runs/${id}`);
}

export function fetchWorkflowRunEvents(id: string) {
  return request<WorkflowRunEvent[]>(`/workflow-runs/${id}/events`);
}

export function fetchWorkflowRuns(filters?: WorkflowRunsFilter) {
  const searchParams = new URLSearchParams();

  if (filters?.kind) {
    searchParams.set("kind", filters.kind);
  }

  if (filters?.status) {
    searchParams.set("status", filters.status);
  }

  if (filters?.executionMode) {
    searchParams.set("executionMode", filters.executionMode);
  }

  if (filters?.q) {
    searchParams.set("q", filters.q);
  }

  if (filters?.from) {
    searchParams.set("from", filters.from);
  }

  if (filters?.to) {
    searchParams.set("to", filters.to);
  }

  if (filters?.sortBy) {
    searchParams.set("sortBy", filters.sortBy);
  }

  if (filters?.sortOrder) {
    searchParams.set("sortOrder", filters.sortOrder);
  }

  if (filters?.cursor) {
    searchParams.set("cursor", filters.cursor);
  }

  if (filters?.limit != null) {
    searchParams.set("limit", String(filters.limit));
  }

  const query = searchParams.toString();
  return request<WorkflowRunsListResponse>(`/workflow-runs${query ? `?${query}` : ""}`);
}

export type { WorkflowRunDetail, WorkflowRunEvent, WorkflowRunsListResponse };

export function retryWorkflowRun(id: string) {
  return request<WorkflowRunDetail>(`/workflow-runs/${id}/retry`, {
    method: "POST"
  });
}

export function cancelWorkflowRun(id: string) {
  return request<WorkflowRunDetail>(`/workflow-runs/${id}/cancel`, {
    method: "POST"
  });
}

export function pauseWorkflowRun(id: string) {
  return request<WorkflowRunDetail>(`/workflow-runs/${id}/pause`, {
    method: "POST"
  });
}

export function resumeWorkflowRun(id: string) {
  return request<WorkflowRunDetail>(`/workflow-runs/${id}/resume`, {
    method: "POST"
  });
}

export function bulkRetryWorkflowRuns(runIds: string[]) {
  return request<WorkflowRunsBulkActionResponse>("/workflow-runs/bulk-retry", {
    method: "POST",
    body: JSON.stringify({ runIds })
  });
}

export function bulkCancelWorkflowRuns(runIds: string[]) {
  return request<WorkflowRunsBulkActionResponse>("/workflow-runs/bulk-cancel", {
    method: "POST",
    body: JSON.stringify({ runIds })
  });
}

export function fetchApplication(id: string) {
  return request<ApplicationWithContext>(`/applications/${id}`);
}

export function updateApplicationApproval(id: string, approval: ApprovalRequest) {
  return request<ApplicationWithContext>(`/applications/${id}/approval`, {
    method: "POST",
    body: JSON.stringify(approval)
  });
}

export function fetchSubmissionReview(id: string) {
  return request<SubmissionReviewWithContext>(`/applications/${id}/submission-review`);
}

export function fetchAutomationSessions(applicationId: string) {
  return request<AutomationSession[]>(`/applications/${applicationId}/automation-sessions`);
}

export function updateUnresolvedAutomationItem(
  applicationId: string,
  itemId: string,
  payload: UpdateUnresolvedAutomationItemRequest
) {
  return request<UnresolvedAutomationItem>(`/applications/${applicationId}/unresolved-items/${itemId}`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchApplicationEvents(
  id: string,
  filters?: {
    actorType?: AuditActorType;
    eventType?: ApplicationEventType;
    source?: string;
    q?: string;
    from?: string;
    to?: string;
    limit?: number;
  }
) {
  const searchParams = new URLSearchParams();

  if (filters?.actorType) {
    searchParams.set("actorType", filters.actorType);
  }

  if (filters?.eventType) {
    searchParams.set("eventType", filters.eventType);
  }

  if (filters?.source) {
    searchParams.set("source", filters.source);
  }

  if (filters?.q) {
    searchParams.set("q", filters.q);
  }

  if (filters?.from) {
    searchParams.set("from", filters.from);
  }

  if (filters?.to) {
    searchParams.set("to", filters.to);
  }

  if (filters?.limit != null) {
    searchParams.set("limit", String(filters.limit));
  }

  const query = searchParams.toString();
  return request<ApplicationEvent[]>(`/applications/${id}/events${query ? `?${query}` : ""}`);
}

export function markApplicationSubmitted(id: string, payload: MarkSubmittedRequest) {
  return request<ApplicationWithContext>(`/applications/${id}/mark-submitted`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function markApplicationSubmitFailed(id: string, payload: MarkSubmitFailedRequest) {
  return request<ApplicationWithContext>(`/applications/${id}/mark-submit-failed`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function reopenApplicationSubmission(id: string, payload: ReopenSubmissionRequest) {
  return request<ApplicationWithContext>(`/applications/${id}/reopen-submission`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function markApplicationRetryReady(id: string, payload: MarkRetryReadyRequest) {
  return request<ApplicationWithContext>(`/applications/${id}/mark-retry-ready`, {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function fetchDashboardOverview() {
  return request<DashboardOverview>("/dashboard/overview");
}

export function fetchDashboardTimeline(filters?: {
  actorType?: AuditActorType;
  entityType?: TimelineEntityType;
  eventType?: DashboardEventType;
  source?: string;
  q?: string;
  from?: string;
  to?: string;
  limit?: number;
}) {
  const searchParams = new URLSearchParams();

  if (filters?.actorType) {
    searchParams.set("actorType", filters.actorType);
  }

  if (filters?.entityType) {
    searchParams.set("entityType", filters.entityType);
  }

  if (filters?.eventType) {
    searchParams.set("eventType", filters.eventType);
  }

  if (filters?.source) {
    searchParams.set("source", filters.source);
  }

  if (filters?.q) {
    searchParams.set("q", filters.q);
  }

  if (filters?.from) {
    searchParams.set("from", filters.from);
  }

  if (filters?.to) {
    searchParams.set("to", filters.to);
  }

  if (filters?.limit != null) {
    searchParams.set("limit", String(filters.limit));
  }

  const query = searchParams.toString();
  return request<TimelineItem[]>(`/dashboard/timeline${query ? `?${query}` : ""}`);
}

export function fetchDashboardHistory() {
  return request<DashboardHistory>("/dashboard/history");
}

export function fetchApplicationsList() {
  return request<ApplicationWithContext[]>("/applications");
}

export type DashboardStageFilter = JobStage | "all";
export type DashboardApprovalFilter = ApprovalStatus | "all";
export type DashboardTimelineEntityFilter = TimelineEntityType | "all";
export type DashboardTimelineEventFilter = DashboardEventType | "all";
export type DashboardTimelineActorFilter = AuditActorType | "all";
export type ApplicationHistoryActorFilter = AuditActorType | "all";
export type ApplicationHistoryEventFilter = ApplicationEventType | "all";

export function buildApplicationScreenshotUrl(applicationId: string, screenshotPath: string) {
  const filename = screenshotPath.split("/").filter(Boolean).at(-1);
  if (!filename) {
    return "";
  }

  return `${API_BASE}/applications/${applicationId}/screenshots/${encodeURIComponent(filename)}`;
}
