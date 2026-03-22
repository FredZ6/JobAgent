import type { AutomationSession } from "@rolecraft/shared-types";

import { summarizeFieldResults } from "./field-results";

export type AutomationSessionEvidenceSummary = ReturnType<typeof summarizeAutomationSessionEvidence>;
export type AutomationSessionStatusFilter = "all" | AutomationSession["status"];
export type AutomationSessionAttentionFilter =
  | "all"
  | "has_failures"
  | "has_unresolved"
  | "has_screenshots"
  | "has_worker_logs";
export type AutomationSessionFilterState = {
  query: string;
  status: AutomationSessionStatusFilter;
  attention: AutomationSessionAttentionFilter;
};
export type AutomationSessionComparison = {
  latestId: string;
  previousId: string;
  latestStatus: AutomationSession["status"];
  previousStatus: AutomationSession["status"];
  latestSummary: AutomationSessionEvidenceSummary;
  previousSummary: AutomationSessionEvidenceSummary;
  filledDelta: number;
  failedDelta: number;
  unresolvedDelta: number;
  screenshotDelta: number;
  logDelta: number;
};

export function summarizeAutomationSessionEvidence(session: AutomationSession) {
  const fieldSummary = summarizeFieldResults(session.fieldResults);

  return {
    ...fieldSummary,
    screenshotCount: session.screenshotPaths.length,
    logCount: session.workerLog.length
  };
}

export function getAutomationSessionPhaseLabel(session: AutomationSession) {
  if (session.status === "failed") {
    return "Failed";
  }

  if (session.status === "cancelled") {
    return "Cancelled";
  }

  if (session.status === "completed") {
    return "Completed";
  }

  if (session.status === "queued") {
    return "Queued";
  }

  if (session.startedAt) {
    return "In progress";
  }

  return "Pending";
}

export function compareAutomationSessions(
  latest: AutomationSession,
  previous: AutomationSession
): AutomationSessionComparison {
  const latestSummary = summarizeAutomationSessionEvidence(latest);
  const previousSummary = summarizeAutomationSessionEvidence(previous);

  return {
    latestId: latest.id,
    previousId: previous.id,
    latestStatus: latest.status,
    previousStatus: previous.status,
    latestSummary,
    previousSummary,
    filledDelta: latestSummary.filled - previousSummary.filled,
    failedDelta: latestSummary.failed - previousSummary.failed,
    unresolvedDelta: latestSummary.unresolved - previousSummary.unresolved,
    screenshotDelta: latestSummary.screenshotCount - previousSummary.screenshotCount,
    logDelta: latestSummary.logCount - previousSummary.logCount
  };
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function matchesAutomationSessionQuery(session: AutomationSession, query: string) {
  if (!query) {
    return true;
  }

  const normalizedQuery = normalizeQuery(query);
  const searchableValues = [
    session.workflowRunId,
    session.applicationId,
    session.status,
    getAutomationSessionPhaseLabel(session),
    session.errorMessage ?? "",
    ...session.workerLog.map((entry) => entry.message)
  ];

  return searchableValues.some((value) => (value ?? "").toLowerCase().includes(normalizedQuery));
}

function matchesAutomationSessionAttention(
  session: AutomationSession,
  attention: AutomationSessionAttentionFilter
) {
  if (attention === "all") {
    return true;
  }

  const summary = summarizeAutomationSessionEvidence(session);

  if (attention === "has_failures") {
    return summary.failed > 0;
  }

  if (attention === "has_unresolved") {
    return summary.unresolved > 0;
  }

  if (attention === "has_screenshots") {
    return summary.screenshotCount > 0;
  }

  return summary.logCount > 0;
}

export function filterAutomationSessions(sessions: AutomationSession[], filters: AutomationSessionFilterState) {
  return sessions.filter((session) => {
    if (filters.status !== "all" && session.status !== filters.status) {
      return false;
    }

    if (!matchesAutomationSessionAttention(session, filters.attention)) {
      return false;
    }

    return matchesAutomationSessionQuery(session, filters.query);
  });
}
