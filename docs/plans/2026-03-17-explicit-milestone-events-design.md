# Explicit Milestone Events Design

## Goal
Reduce the audit system's reliance on derived timestamps by persisting real milestone events for job import, job analysis, resume generation, and prefill runs.

## Recommended Approach

### Option 1: Keep deriving everything
- Continue using entity timestamps for `job_imported`, `analysis_completed`, `resume_generated`, and `prefill_run`.
- Pros: no schema work.
- Cons: timeline remains partly inferred, which weakens audit trust and future reporting.

### Option 2: Add explicit milestone events only where we need them now
- Add a `JobEvent` table for:
  - `job_imported`
  - `analysis_completed`
  - `resume_generated`
- Extend `ApplicationEvent` with:
  - `prefill_run`
- Keep dashboard as a mixed model, but prefer explicit events when they exist and fall back only for older rows.
- Pros: strongest improvement per unit of scope; keeps current APIs and UI largely intact.
- Cons: history stays partially mixed for old data.

### Option 3: Replace the timeline with a full workflow event ledger
- Persist every milestone for every entity in a single generic workflow-event table.
- Pros: most uniform long term.
- Cons: too large for the current phase and would force broader refactors.

### Recommendation
Choose **Option 2**. It improves audit truthfulness materially without turning the product into an event-sourcing project.

## Scope

### In scope
- Add `JobEvent`.
- Extend `ApplicationEventType` with `prefill_run`.
- Persist milestone events when:
  - a job is imported
  - analysis completes
  - resume generation completes
  - a prefill run completes or fails
- Update dashboard read-model to prefer explicit milestone events and fall back only when missing.

### Out of scope
- New public job-events endpoint.
- Full generic workflow-events layer.
- Backfill/migration of historical events.
- Reworking current dashboard/history UI.

## Data Model

### `JobEvent`
Fields:
- `id`
- `jobId`
- `type`
- `actorType`
- `actorLabel`
- `actorId`
- `source`
- `payload`
- `createdAt`

Event types for this phase:
- `job_imported`
- `analysis_completed`
- `resume_generated`

### `ApplicationEvent`
Extend the allowed types with:
- `prefill_run`

Payload for `prefill_run` should contain:
- `status`
- `title`
- `company`
- `note` optional

## Write Paths

### Job import
After the job record is created, write `job_imported`:
- actor: `api / apps-api`
- actorId: `apps-api`
- source: `jobs-controller`

### Job analysis
After `JobAnalysis` is saved, write `analysis_completed`:
- actor: `api / apps-api`
- source: `analysis-service`
- payload includes `matchScore`

### Resume generation
After `ResumeVersion` is saved, write `resume_generated`:
- actor: `api / apps-api`
- source: `resume-service`
- payload includes `headline`

### Prefill run
After worker execution is written back to the application record, write `prefill_run`:
- actor: `worker / playwright-worker`
- actorId: `playwright-worker`
- source: `worker-prefill`
- payload includes `status`, `title`, and `company`

## Dashboard Read Model

### Priority order
1. Use explicit milestone events if present.
2. Fall back to derived timestamps only when the explicit event does not exist.

### Result
- Older rows remain visible and honest.
- Newer rows become explicit and more queryable.
- No duplicate milestone entries for the same job/application milestone in the dashboard read-model.

## Error Handling
- Event-write failures should not silently create half-written flows where the main record succeeds but the explicit event fails.
- For analysis/resume/prefill, prefer wrapping the business write and event write in the same transaction where practical.
- If older data has no explicit milestone events, fallback derivation remains valid.

## Testing
- Shared schema tests for `prefill_run` as an application event type.
- Applications service tests for explicit `prefill_run` event writes.
- Dashboard service tests to verify explicit milestone events are preferred over derived duplicates.
- Runtime verification that new milestone actions appear in timeline/history with explicit `source` values.

## Acceptance Criteria
1. New job imports write `job_imported` rows.
2. New analyses write `analysis_completed` rows.
3. New resume generations write `resume_generated` rows.
4. New prefill runs write explicit `prefill_run` application events.
5. Dashboard timeline/history prefer explicit milestone events and avoid duplicate fallback rows.
6. Root tests, root build, and Docker verification all pass.
