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
export type AutomationSessionOverview = {
  totalAttempts: number;
  latestSessionId: string | null;
  latestStatus: AutomationSession["status"] | null;
  latestUnresolved: number;
  bestRunId: string | null;
  bestRunReason: string | null;
  retryTrend: {
    filledDelta: number;
    failedDelta: number;
    unresolvedDelta: number;
  } | null;
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

const sessionStatusRank: Record<AutomationSession["status"], number> = {
  completed: 4,
  running: 3,
  queued: 2,
  failed: 1,
  cancelled: 0
};

function getAutomationSessionSortTimestamp(session: AutomationSession) {
  return new Date(session.completedAt ?? session.startedAt ?? session.createdAt).getTime();
}

function compareAutomationSessionQuality(left: AutomationSession, right: AutomationSession) {
  const leftSummary = summarizeAutomationSessionEvidence(left);
  const rightSummary = summarizeAutomationSessionEvidence(right);

  if (sessionStatusRank[left.status] !== sessionStatusRank[right.status]) {
    return sessionStatusRank[right.status] - sessionStatusRank[left.status];
  }

  if (leftSummary.filled !== rightSummary.filled) {
    return rightSummary.filled - leftSummary.filled;
  }

  const leftFailures = leftSummary.failed + leftSummary.unresolved;
  const rightFailures = rightSummary.failed + rightSummary.unresolved;

  if (leftFailures !== rightFailures) {
    return leftFailures - rightFailures;
  }

  const leftEvidence = leftSummary.screenshotCount + leftSummary.logCount;
  const rightEvidence = rightSummary.screenshotCount + rightSummary.logCount;

  if (leftEvidence !== rightEvidence) {
    return rightEvidence - leftEvidence;
  }

  return getAutomationSessionSortTimestamp(right) - getAutomationSessionSortTimestamp(left);
}

function formatBestRunReason(session: AutomationSession) {
  const summary = summarizeAutomationSessionEvidence(session);
  const formatCount = (count: number, singular: string, plural = `${singular}s`) =>
    `${count} ${count === 1 ? singular : plural}`;

  return `${session.id} is the best run because it is ${session.status} with ${formatCount(summary.filled, "filled field")}, ${formatCount(summary.failed, "failed field")}, ${formatCount(summary.unresolved, "unresolved field")}, ${formatCount(summary.screenshotCount, "screenshot")}, and ${formatCount(summary.logCount, "worker log entry", "worker log entries")}.`;
}

export function buildAutomationSessionOverview(sessions: AutomationSession[]): AutomationSessionOverview {
  if (sessions.length === 0) {
    return {
      totalAttempts: 0,
      latestSessionId: null,
      latestStatus: null,
      latestUnresolved: 0,
      bestRunId: null,
      bestRunReason: null,
      retryTrend: null
    };
  }

  const sessionsByRecency = [...sessions].sort(
    (left, right) => getAutomationSessionSortTimestamp(right) - getAutomationSessionSortTimestamp(left)
  );
  const latestSession = sessionsByRecency[0];
  const previousSession = sessionsByRecency[1] ?? null;
  const latestSummary = summarizeAutomationSessionEvidence(latestSession);
  const bestRun = [...sessions].sort(compareAutomationSessionQuality)[0];

  return {
    totalAttempts: sessions.length,
    latestSessionId: latestSession.id,
    latestStatus: latestSession.status,
    latestUnresolved: latestSummary.unresolved,
    bestRunId: bestRun?.id ?? null,
    bestRunReason: bestRun ? formatBestRunReason(bestRun) : null,
    retryTrend: previousSession
      ? (() => {
          const previousSummary = summarizeAutomationSessionEvidence(previousSession);
          return {
            filledDelta: latestSummary.filled - previousSummary.filled,
            failedDelta: latestSummary.failed - previousSummary.failed,
            unresolvedDelta: latestSummary.unresolved - previousSummary.unresolved
          };
        })()
      : null
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
