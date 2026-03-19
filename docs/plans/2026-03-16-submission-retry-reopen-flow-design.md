# OpenClaw Job Agent Submission Retry & Reopen Flow Design

## Goal
Add a lightweight recovery flow so a user can reopen a previously marked submission or move a failed submission back into a retry-ready state without re-running automation or losing the human-approval boundary.

## Scope

### In Scope
- Add lightweight `application_events` persistence
- Add recovery actions for:
  - `submitted -> ready_to_submit`
  - `submit_failed -> ready_to_submit`
- Add API routes for recovery actions and event listing
- Add a small history section to `Submission Review`
- Extend dashboard recent activity with reopen and retry-ready events

### Out of Scope
- Re-running prefill automatically
- Reopening approval back to `pending_review`
- Full workflow orchestration
- Rich filtering or timeline UI
- Automatic resubmission

## Architecture

### State Strategy
- Keep `applications` as the source of truth for current submission state.
- Add `application_events` to preserve a lightweight action history without mutating older snapshots.
- Recovery actions should only change `submissionStatus`; they should not roll back `approvalStatus`.

### Recovery Strategy
- `submitted` can be reopened to `ready_to_submit`
- `submit_failed` can be moved to `ready_to_submit`
- Both actions should optionally capture a short note
- Both actions should append an event row

## Data Model

### New Table: `ApplicationEvent`
- `id`
- `applicationId`
- `type`
- `payload`
- `createdAt`

### Event Types
- `approval_updated`
- `submission_marked`
- `submission_failed`
- `submission_reopened`
- `submission_retry_ready`

### Event Payload
The first version can stay minimal:
- optional `note`
- optional `fromStatus`
- optional `toStatus`

## State Model

### Approval Status
Unchanged:
- `pending_review`
- `approved_for_submit`
- `needs_revision`
- `rejected`

### Submission Status
Still:
- `not_ready`
- `ready_to_submit`
- `submitted`
- `submit_failed`

### Allowed Recovery Transitions
- `submitted -> ready_to_submit`
  - action: reopen submission
- `submit_failed -> ready_to_submit`
  - action: mark ready to retry

### Rules
- Recovery actions do not trigger Playwright
- Recovery actions do not alter `approvalStatus`
- Only previously approved applications may remain in this recovery loop

## API Design

### `POST /applications/:id/reopen-submission`
- Valid only when `submissionStatus = submitted`
- Sets:
  - `submissionStatus = ready_to_submit`
  - keeps approval as `approved_for_submit`
- Writes an event:
  - `submission_reopened`

### `POST /applications/:id/mark-retry-ready`
- Valid only when `submissionStatus = submit_failed`
- Sets:
  - `submissionStatus = ready_to_submit`
- Writes an event:
  - `submission_retry_ready`

### `GET /applications/:id/events`
- Returns newest-first lightweight event rows for the application

## UI Design

### Submission Review
Keep the existing submission summary and add:
- `Reopen submission` when `submissionStatus = submitted`
- `Mark ready to retry` when `submissionStatus = submit_failed`
- a small `History` section that lists recent event rows

### Dashboard
No new page is needed.
Extend recent activity to surface:
- submission reopened
- retry-ready marked

## Error Handling
- Reopen a non-`submitted` application: `409`
- Retry-ready a non-`submit_failed` application: `409`
- Missing application: `404`
- Empty history should render a clear zero state in the UI

## Acceptance Criteria
1. `submitted` applications can be reopened to `ready_to_submit`.
2. `submit_failed` applications can be moved to `ready_to_submit`.
3. `GET /applications/:id/events` returns recent history rows.
4. `Submission Review` shows both recovery actions when relevant.
5. `Submission Review` shows event history.
6. Dashboard recent activity includes reopen and retry-ready actions.
7. The system still never auto-submits applications.

## Notes
- This phase improves recoverability, not automation depth.
- The event table is intentionally small and action-oriented rather than a full audit or workflow system.
