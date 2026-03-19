import type { ApplicationWithContext } from "./api";

type FieldState = "filled" | "failed" | "unresolved" | "missing";

export type ApplicationRunComparison = {
  latestId: string;
  previousId: string;
  latestCreatedAt: string;
  previousCreatedAt: string;
  filledDelta: number;
  failedDelta: number;
  unresolvedDelta: number;
  screenshotDelta: number;
  workerLogDelta: number;
  changedFields: Array<{
    fieldName: string;
    latestState: FieldState;
    previousState: FieldState;
    latestSuggestedValue?: string;
    previousSuggestedValue?: string;
    latestFailureReason?: string;
    previousFailureReason?: string;
  }>;
};

type FieldResultLike = ApplicationWithContext["application"]["fieldResults"][number];

export function compareApplicationRuns(
  latest: ApplicationWithContext,
  previous: ApplicationWithContext
): ApplicationRunComparison {
  const latestCounts = summarizeRun(latest);
  const previousCounts = summarizeRun(previous);
  const latestFields = indexFields(latest.application.fieldResults);
  const previousFields = indexFields(previous.application.fieldResults);
  const fieldNames = new Set([...latestFields.keys(), ...previousFields.keys()]);

  const changedFields = Array.from(fieldNames)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((fieldName) => {
      const latestField = latestFields.get(fieldName);
      const previousField = previousFields.get(fieldName);

      const latestState = getFieldState(latestField);
      const previousState = getFieldState(previousField);
      const latestSuggestedValue = latestField?.suggestedValue;
      const previousSuggestedValue = previousField?.suggestedValue;
      const latestFailureReason = latestField?.failureReason;
      const previousFailureReason = previousField?.failureReason;

      const changed =
        latestState !== previousState ||
        latestSuggestedValue !== previousSuggestedValue ||
        latestFailureReason !== previousFailureReason;

      if (!changed) {
        return [];
      }

      return [
        {
          fieldName,
          latestState,
          previousState,
          latestSuggestedValue,
          previousSuggestedValue,
          latestFailureReason,
          previousFailureReason
        }
      ];
    });

  return {
    latestId: latest.application.id,
    previousId: previous.application.id,
    latestCreatedAt: latest.application.createdAt,
    previousCreatedAt: previous.application.createdAt,
    filledDelta: latestCounts.filled - previousCounts.filled,
    failedDelta: latestCounts.failed - previousCounts.failed,
    unresolvedDelta: latestCounts.unresolved - previousCounts.unresolved,
    screenshotDelta:
      latest.application.screenshotPaths.length - previous.application.screenshotPaths.length,
    workerLogDelta: latest.application.workerLog.length - previous.application.workerLog.length,
    changedFields
  };
}

function summarizeRun(application: ApplicationWithContext) {
  return application.application.fieldResults.reduce(
    (counts, field) => {
      const state = getFieldState(field);
      if (state === "filled") {
        counts.filled += 1;
      } else if (state === "failed") {
        counts.failed += 1;
      } else if (state === "unresolved") {
        counts.unresolved += 1;
      }

      return counts;
    },
    { filled: 0, failed: 0, unresolved: 0 }
  );
}

function indexFields(fields: ApplicationWithContext["application"]["fieldResults"]) {
  return new Map(fields.map((field) => [field.fieldName, field]));
}

function getFieldState(field?: FieldResultLike): FieldState {
  if (!field) {
    return "missing";
  }

  if (field.filled) {
    return "filled";
  }

  if (field.failureReason) {
    return "failed";
  }

  return "unresolved";
}
