# Automation Summary Best Run Design

## Summary

Add an application-level automation summary to `Application Review` so reviewers can quickly understand how many automation attempts ran, what the latest run looks like, whether retries helped, and which session is the best candidate for review. The first version stays entirely in the web layer and computes summary data from the existing `automationSessions` payload.

## Goals

- Help reviewers answer the highest-value questions without manually scanning every session first.
- Make the recommended run transparent through simple heuristics instead of black-box scoring.
- Keep the first version narrow: no backend DTOs, no Prisma changes, no new pages.

## Non-Goals

- Persisting summary data in the database
- Adding a global automation analytics dashboard
- Showing the summary in `Submission Review`
- Replacing the existing automation session list, compare view, or unresolved-item UI

## UX Overview

Add a lightweight summary strip inside the existing `Automation sessions` section on `Application Review`, above the current search/filter controls.

The strip should show five compact metrics:

- `Total attempts`
- `Latest status`
- `Latest unresolved`
- `Retry trend`
- `Best run`

Below the metric cards, show a short explanation for the recommended run, for example:

- `Best run: completed with fewer unresolved fields and stronger evidence coverage.`

The summary complements the existing session history. Reviewers should still be able to inspect session details, compare runs, and browse unresolved items exactly as they do today.

## Best Run Heuristic

The first version uses a simple, explainable ranking rather than hidden scoring. Sort candidate sessions using this priority order:

1. better status (`completed > running > queued > failed > cancelled`)
2. higher filled count
3. lower combined failed + unresolved count
4. stronger evidence coverage (`screenshots + worker logs`)
5. more recent timestamp as the final tie-breaker

The selected run becomes:

- `bestRunId`
- `bestRunReason`

The reason should reference the winning factors in plain language, not raw score numbers.

## Retry Trend

When there are at least two sessions, compare the latest session against the previous session and show:

- `filledDelta`
- `failedDelta`
- `unresolvedDelta`

If there is only one session, omit retry-trend comparison text instead of showing noisy placeholder deltas.

## Architecture

### Shared Helper

Extend `apps/web/src/lib/automation-session.ts` with a focused helper:

- `buildAutomationSessionOverview(sessions)`

Return shape:

- `totalAttempts`
- `latestSessionId`
- `latestStatus`
- `latestUnresolved`
- `bestRunId`
- `bestRunReason`
- `retryTrend`

This keeps summary logic in one place and avoids duplicating ranking or delta rules inside page components.

### Page Integration

Only `apps/web/src/app/applications/[id]/page-client.tsx` should render the new summary in the first version. The page already has the full automation session list, so no API changes are required.

### Presentation

Reuse existing panel/card primitives and current visual language. The summary should feel like a native extension of the `Automation sessions` workspace, not a separate dashboard.

## Error Handling

- Empty session lists should not render a broken summary; either omit the strip or show a compact empty state.
- Single-session applications should still show total attempts, latest status, latest unresolved, and best run, but skip retry-trend comparison copy.
- Unknown or legacy session fields should degrade conservatively instead of crashing the helper.

## Testing

### Helper Tests

- total attempt count
- latest status and unresolved count
- retry trend deltas
- best-run selection across ties
- human-readable best-run reason

### Page Tests

- summary cards render above the session history
- retry trend hides when only one session exists
- best-run explanation appears for multi-session applications
- existing session history and compare flows still render

### Verification

- `npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts`
- `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
- `npm run test --workspace @rolecraft/web`
- `npm run build --workspace @rolecraft/web`

## Acceptance Criteria

1. `Application Review` shows an application-level automation summary above the session list.
2. Reviewers can see total attempts, latest status, latest unresolved count, retry trend, and best run at a glance.
3. Best-run selection is driven by an explicit heuristic instead of hidden scoring.
4. No backend or Prisma changes are introduced for the first version.
5. Existing automation-session history, compare, and unresolved-item views continue to work.
