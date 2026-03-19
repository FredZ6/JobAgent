# OpenClaw Job Agent Phase-Four Design

## Goal
Add an application-prefill MVP that can attempt a best-effort form fill, capture screenshots and field results, and stop for explicit human review before any final submission.

## Scope

### In Scope
- A persisted `application` record for each prefill attempt
- A Playwright-backed worker path that opens `applyUrl`, tries a best-effort prefill, and captures screenshots
- Storage of detected field suggestions, fill outcomes, and worker logs
- A Human Approval review page in the web app
- Approval actions that update review state but do not submit the application

### Out of Scope
- Final automated submission
- Durable workflow orchestration with Temporal
- Deep ATS-specific integrations
- Guaranteed support for multi-page or highly dynamic application flows
- Rich tracker dashboard beyond job-scoped application records

## Architecture

### Execution Strategy
- Keep the API responsible for creating and reading `application` records.
- Bring `worker-playwright` into the runtime path for this phase, but limit its responsibility to prefill attempts and evidence capture.
- Treat the first version as best-effort automation: partial success is acceptable if the run still produces useful review artifacts.

### Safety Strategy
- The system must always stop before final submission.
- Approval updates only express human review intent, not actual form submission.
- If the worker cannot reliably identify or fill a field, it must record that failure instead of fabricating a result.

## Data Model

### `applications`
- `id`
- `jobId`
- `resumeVersionId`
- `status`
- `approvalStatus`
- `applyUrl`
- `formSnapshot`
- `fieldResults`
- `screenshotPaths`
- `workerLog`
- `reviewNote`
- `errorMessage`
- `createdAt`
- `updatedAt`

### Status Fields
- `status`
  - `queued`
  - `running`
  - `completed`
  - `failed`
- `approvalStatus`
  - `pending_review`
  - `approved_for_submit`
  - `needs_revision`
  - `rejected`

## API Design
- `POST /jobs/:id/prefill`
- `GET /jobs/:id/applications`
- `GET /applications/:id`
- `POST /applications/:id/approval`

### `POST /jobs/:id/prefill`
- Creates an `application` record
- Selects the latest completed `resumeVersion` for the job
- Starts a prefill attempt against the job `applyUrl`

### `GET /jobs/:id/applications`
- Lists application records for one job
- Supports Job Detail summaries and links into review

### `GET /applications/:id`
- Returns one application plus all review data:
  - job identity
  - linked resume version
  - field results
  - screenshots
  - worker log summary
  - current approval state

### `POST /applications/:id/approval`
- Accepts:
  - `approvalStatus`
  - `reviewNote`
- Updates human review state only
- Never triggers final submission

## Worker Behavior

### Responsibilities
- Open `applyUrl`
- Detect common fields such as:
  - name
  - email
  - phone
  - LinkedIn
  - GitHub
  - location
  - common textareas
- Build suggested values from:
  - candidate profile
  - selected resume version
  - optionally analysis context
- Attempt best-effort fill operations
- Capture screenshots
- Return structured field results and failure reasons

### Constraints
- Stop before any final submit action
- Allow partial completion
- Record unsupported or blocked fields instead of hiding them

## UI Flow

### Job Detail
- Add a `Run prefill` action
- Show recent application attempts and statuses
- Link to the latest Human Approval page

### Human Approval Page
- Show the linked job and resume version
- Show prefill execution status
- Show field suggestions and fill outcomes
- Show captured screenshots
- Show worker execution notes
- Offer approval actions:
  - `Approve for submission later`
  - `Needs revision`
  - `Reject`

## Error Handling
- Missing `applyUrl`: fail early with a clear API error
- Missing completed `resumeVersion`: fail early with a clear API error
- Worker/browser failure: mark the application `failed` and preserve logs
- Partial field-fill failure: keep the application `completed` if useful artifacts were still captured

## Acceptance Criteria
1. `POST /jobs/:id/prefill` creates an `application` record.
2. A prefill attempt can run against a job with an `applyUrl`.
3. The system stores field results, screenshot paths, worker logs, and linked `resumeVersion`.
4. `GET /applications/:id` returns everything needed for review.
5. The web app renders a Human Approval page for an application.
6. Users can update approval state to `approved_for_submit`, `needs_revision`, or `rejected`.
7. The system never performs final submission in this phase.

## Notes
- This phase establishes the human-review gate before any future submission workflow exists.
- Best-effort prefill is enough for this milestone as long as the review evidence is honest and inspectable.
