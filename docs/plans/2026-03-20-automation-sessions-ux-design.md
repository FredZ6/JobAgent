# Automation Sessions UX Design

## Goal

Turn `automation_sessions` from a backend-supported execution record into a user-visible product feature by adding application-scoped history, detail inspection, comparison, and evidence entry points.

## Current State

The backend already exposes application automation session history:

- `GET /applications/:id`
- `GET /applications/:id/automation-sessions`
- `GET /applications/:id/screenshots/:name`

The frontend currently only shows a `latestAutomationSession` summary card on:

- application detail
- submission review

This is useful for the newest run, but it does not help users understand:

- how many times automation has been attempted
- whether a retry improved results
- what changed between runs
- where to inspect screenshots and worker logs for a specific session

## Desired Outcome

Within an application page, users should be able to:

- see the full session history for that application
- inspect any individual session
- compare two sessions side by side
- open screenshots and review worker logs from the selected session(s)

The submission review page should keep its current lightweight latest-session summary and provide a clear route back to the fuller application-level view.

## Recommended Approach

Build the first complete `automation_sessions` UX inside the existing application detail flow instead of creating a separate global automation console.

### Why this approach

- It keeps the feature in the correct business context: a single application.
- It reuses the API surface that already exists.
- It avoids creating a disconnected “operations dashboard” before the product needs one.
- It lets us deliver list, detail, compare, and evidence access without changing backend contracts.

## Design

### 1. Application detail becomes the primary automation history view

Replace the current single “Latest automation session” summary area in the application detail page with a fuller `Automation sessions` section.

That section should include:

- a session list
- a detail view for the selected session
- a compare mode when two sessions are selected

This keeps the product model clear:

- the application page remains the main review surface
- automation history is part of reviewing that application

### 2. Session list

The list should show one row per session with high-signal metadata:

- started time
- status
- phase label
- filled count
- failed count
- unresolved count
- screenshot count
- log count
- workflow run id (shortened)

Each row should support:

- selecting the session for detail view
- selecting up to two sessions for comparison

The list should not show all evidence inline. It should stay compact and scan-friendly.

### 3. Session detail view

The detail area should default to the latest session and switch when the user selects a different row.

The detail view should include:

- summary metadata
- field results
- worker logs
- screenshots
- error message when present

This should reuse the visual language already present in application review where possible, especially for field-result presentation.

### 4. Compare mode

When the user selects two sessions, the detail area should switch into compare mode.

The first version should keep comparison simple and high-value:

- side-by-side session columns
- top summary diff:
  - status
  - filled count
  - failed count
  - unresolved count
  - screenshot count
  - log count
- field-result delta summary:
  - fields that improved from failed/unhandled to filled
  - fields that regressed or became unresolved

The first version should not attempt:

- full text diff of logs
- image diffing
- complex row-by-row deep compare UIs

### 5. Screenshot and log entry points

The list should show counts only.
The detail and compare views should provide the actual evidence entry points.

For screenshots:

- use the existing screenshot route
- render either links or lightweight preview blocks

For worker logs:

- display ordered log rows with level and message

### 6. Submission review remains lightweight

The submission review page should keep the current latest-session summary.
It should not become a second full history surface.

If needed, add a lightweight link or button back to the application page’s session history section rather than duplicating the full UI.

## API and Data Strategy

No backend API changes are required for the first version.

Frontend should:

- continue loading `fetchApplication(applicationId)` for business context
- add `fetchAutomationSessions(applicationId)` for the full session list

Do not overload `GET /applications/:id` with all sessions.
The session list should remain separately loaded so the application response stays lighter.

Comparison should happen entirely in the frontend using the already-fetched session list.

## Testing Strategy

### Frontend coverage

Add tests for:

- rendering the session list
- defaulting detail view to the latest session
- switching detail view when a different session is selected
- entering compare mode when two sessions are selected
- showing summary deltas in compare mode
- empty-state behavior when no sessions exist
- single-session behavior when compare is unavailable

### Helper coverage

If comparison summaries are extracted into helpers, test:

- filled/failed/unresolved count comparisons
- safe handling of missing field results
- screenshot/log count differences

## Risks

- A single page can become visually dense if list, detail, and compare are not carefully layered.
- Very evidence-heavy sessions may make detail panels long.
- Frontend-only compare can become hard to read if we over-design the first version.

These are acceptable if we keep the first version compact and summary-first.

## Acceptance Criteria

- Application detail page shows a full automation session list for the current application.
- Users can inspect any session’s details.
- Users can select two sessions and see a useful summary comparison.
- Screenshots and worker logs are reachable from the session detail experience.
- Submission review keeps the lighter latest-session summary without regression.
- No new backend endpoints are required.
