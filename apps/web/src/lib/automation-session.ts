import type { AutomationSession } from "@rolecraft/shared-types";

import { summarizeFieldResults } from "./field-results";

export type AutomationSessionEvidenceSummary = ReturnType<typeof summarizeAutomationSessionEvidence>;
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
