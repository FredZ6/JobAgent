import type { AutomationSession } from "@openclaw/shared-types";

import { summarizeFieldResults } from "./field-results";

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
