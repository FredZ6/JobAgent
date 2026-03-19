# OpenClaw Job Agent Submission-Safe Flow Design

## Goal
Add a submission-safe flow that lets a user move an approved application into a final confirmation step, open the real apply page themselves, and record whether the application was submitted or failed without ever automating the final submit click.

## Scope

### In Scope
- Extend `applications` with submission-tracking fields
- Add submission-safe shared DTOs and request schemas
- Add API routes for:
  - loading a submission review payload
  - marking an application as submitted
  - marking a submission attempt as failed
- Add a `Submission Review` page in the web app
- Add entry points from the existing Application Review page
- Extend dashboard/job stage derivation to surface:
  - `ready_to_submit`
  - `submitted`
  - `submit_failed`

### Out of Scope
- Automatic final submit actions
- CAPTCHA bypass or anti-bot handling
- Proving that a third-party ATS really accepted the application
- A separate `submissions` table
- Submission rollback or reopen actions

## Architecture

### Data Strategy
- Reuse the existing `applications` table.
- Treat final submission as a later state on the same application record rather than a second record type.
- Preserve the current prefill and approval evidence, then add a lightweight submission snapshot at the point the user confirms their action.

### Workflow Strategy
- `prefill` and `approval` continue to work exactly as they do now.
- Only applications with `approvalStatus = approved_for_submit` may enter the submission-review flow.
- The system never performs the final submit action. It only helps the user prepare and then records the user’s outcome.

## Data Model

### Application Additions
- `submissionStatus`
  - `not_ready`
  - `ready_to_submit`
  - `submitted`
  - `submit_failed`
- `submittedAt`
- `submissionNote`
- `submittedByUser`
- `finalSubmissionSnapshot`

### Submission Snapshot
The snapshot should preserve the state of the record when the user confirms submission intent:
- `approvalStatus`
- `resumeVersionId`
- `applyUrl`
- unresolved field count
- failed field count

## API Design

### `GET /applications/:id/submission-review`
- Returns a submission-review payload built from:
  - application detail
  - linked job summary
  - linked resume version summary
  - derived unresolved/failed field counts
- Rejects non-existent applications with `404`

### `POST /applications/:id/mark-submitted`
- Allowed only when:
  - `approvalStatus = approved_for_submit`
  - `submissionStatus = ready_to_submit` or `not_ready` that can be derived into ready state
- Writes:
  - `submissionStatus = submitted`
  - `submittedAt`
  - `submissionNote`
  - `submittedByUser = true`
  - `finalSubmissionSnapshot`

### `POST /applications/:id/mark-submit-failed`
- Allowed only when:
  - `approvalStatus = approved_for_submit`
- Writes:
  - `submissionStatus = submit_failed`
  - `submissionNote`
  - `submittedByUser = true`
  - `finalSubmissionSnapshot`

## Status Model

### Approval Status
Unchanged:
- `pending_review`
- `approved_for_submit`
- `needs_revision`
- `rejected`

### Submission Status
- `not_ready`
  - default for applications that are not yet approved for submit
- `ready_to_submit`
  - derived/assigned once approval reaches `approved_for_submit`
- `submitted`
  - user confirms they completed the real submission manually
- `submit_failed`
  - user attempted submission or inspected the page and decided more work is needed

## Dashboard Mapping

### Job Stage Additions
Extend job stage derivation to support:
- `ready_to_submit`
  - latest application has `approvalStatus = approved_for_submit` and is not yet recorded as submitted
- `submitted`
  - latest application `submissionStatus = submitted`
- `submit_failed`
  - latest application `submissionStatus = submit_failed`

The latest application still remains the source of truth for a job’s current application stage.

## UI Design

### Application Review
- Keep the existing approval controls
- When the application is `approved_for_submit`, show a link to `Submission Review`

### Submission Review Page
Route:
- `/applications/:id/submission-review`

Show:
- job title and company
- apply URL
- linked resume version
- approval status
- submission status
- unresolved and failed field summaries
- latest screenshot evidence
- review note
- submission note

Actions:
- `Open apply page`
- `Mark as submitted`
- `Mark submission failed`

### Safety Rules
- `Open apply page` only opens the target URL for the user
- The user performs any real ATS actions themselves
- The system never clicks submit, never claims the third-party site accepted the submission, and never records submission automatically

## Error Handling
- Trying to access submission review for a missing application returns `404`
- Trying to mark submission outcomes before approval returns `409`
- Missing screenshots or unresolved fields should not block the review page
- Missing resume/job context should degrade gracefully, not break the route

## Acceptance Criteria
1. `approved_for_submit` applications can open a dedicated `Submission Review` page.
2. `GET /applications/:id/submission-review` returns complete review data.
3. `POST /applications/:id/mark-submitted` records `submitted`, `submittedAt`, and `submissionNote`.
4. `POST /applications/:id/mark-submit-failed` records `submit_failed` and a note.
5. Dashboard/job stages surface `ready_to_submit`, `submitted`, and `submit_failed`.
6. The system never performs automatic final submission.
7. Root `npm test`, root `npm run build`, and Docker runtime still succeed after the change.

## Notes
- This phase closes the workflow gap after human approval without crossing into unsafe submit automation.
- The first version should optimize for honest state recording, not ATS-specific sophistication.
