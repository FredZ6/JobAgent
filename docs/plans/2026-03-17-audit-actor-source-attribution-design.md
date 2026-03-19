# Audit Actor/Source Attribution Design

## Goal
Strengthen the current lightweight audit model by adding stable `actorId` and `source` fields to persisted application events and derived timeline items, so history becomes more trustworthy for debugging, filtering, and future actor-aware features.

## Recommended Approach

### Option 1: UI-only filtering pass
- Add more filters on top of the current `actorType + actorLabel` model.
- Pros: fast, small.
- Cons: does not improve audit fidelity; later search/reporting still sits on weak identifiers.

### Option 2: Lightweight actor/source foundation
- Add `actorId` and `source` to `application_events`.
- Return the same fields from application history, dashboard timeline, grouped history, and recent activity.
- Keep implicit milestone events derived, but give them stable derived identifiers too.
- Pros: highest long-term leverage with small schema change; keeps current UI and APIs coherent.
- Cons: older rows remain partially attributed and must be handled honestly.

### Option 3: Full audit ledger expansion
- Add actor/source plus explicit event tables for jobs, analyses, resumes, and worker actions.
- Pros: strongest audit model.
- Cons: too large for the current phase and would force broader workflow refactors.

### Recommendation
Choose **Option 2**. It strengthens the real source-of-truth fields without reopening the entire event model.

## Scope

### In scope
- Add persisted `actorId` and `source` to `ApplicationEvent`.
- Extend shared schemas and API responses to include those fields.
- Derive stable `actorId/source` values for implicit timeline milestones.
- Render `actorId/source` in the existing dashboard and submission-review history surfaces.
- Keep older events readable via sensible fallbacks.

### Out of scope
- New dedicated audit page.
- Search by free text or date range.
- Full backfill of old records.
- New event tables for jobs, analyses, resumes, or worker logs.

## Data Model

### `ApplicationEvent`
Add:
- `actorId String?`
- `source String @default("system")`

Field intent:
- `actorType`: coarse class of actor (`system`, `user`, `worker`, `api`)
- `actorLabel`: human-readable label (`local-user`, `playwright-worker`, `apps-api`)
- `actorId`: stable machine-facing identifier for joins/filtering later
- `source`: where the event came from (`web-ui`, `applications-service`, `playwright-worker`, `derived-job-record`, `derived-application-record`, `system`)

### Backward compatibility
- Existing rows will not be backfilled.
- Read paths will fall back conservatively:
  - missing `actorId` -> use `actorLabel`
  - missing `source` -> `system`

## Read Model Rules

### Persisted application events
New writes should use:
- approval/submission/recovery actions:
  - `actorType=user`
  - `actorLabel=local-user`
  - `actorId=local-user`
  - `source=web-ui`

### Derived timeline milestones
- `job_imported`
  - `actorType=api`
  - `actorLabel=apps-api`
  - `actorId=apps-api`
  - `source=derived-job-record`
- `analysis_completed`
  - `actorType=api`
  - `actorLabel=apps-api`
  - `actorId=apps-api`
  - `source=derived-job-record`
- `resume_generated`
  - `actorType=api`
  - `actorLabel=apps-api`
  - `actorId=apps-api`
  - `source=derived-job-record`
- `prefill_run`
  - `actorType=worker`
  - `actorLabel=playwright-worker`
  - `actorId=playwright-worker`
  - `source=derived-application-record`

This keeps the mixed model honest while making actor identity much more stable.

## API Surface

Existing endpoints should be extended, not replaced:
- `GET /applications/:id/events`
- `GET /dashboard/overview`
- `GET /dashboard/timeline`
- `GET /dashboard/history`

Each returned event/timeline item should now include:
- `actorType`
- `actorLabel`
- `actorId`
- `source`
- `summary`

No new endpoint is required for this phase.

## UI Changes

### Dashboard
- Show `actorId` alongside `actorType/actorLabel` where helpful.
- Show `source` in timeline metadata rows.
- Keep the current filter set; do not add new controls yet.

### Submission Review history
- Show `source` below the actor line.
- Keep the current actor/event filters and summary-driven presentation.

The main objective is explanation and trust, not more controls.

## Error Handling
- If older rows have no `actorId`, fall back to `actorLabel`.
- If older rows have no `source`, show `system`.
- If a derived milestone lacks context, still return the event with stable defaults rather than dropping it.

## Testing
- Shared schema tests for new `actorId/source` fields.
- API service tests that new writes include `actorId/source`.
- Dashboard tests that derived milestones expose stable `actorId/source`.
- Runtime verification for:
  - filtered events endpoint
  - filtered timeline endpoint
  - grouped history endpoint
  - dashboard route
  - submission-review route

## Acceptance Criteria
1. New `application_events` persist `actorId` and `source`.
2. Existing history endpoints expose `actorId` and `source`.
3. Derived milestones expose stable `actorId/source` values.
4. Dashboard and Submission Review render the new attribution data without breaking current flows.
5. Root tests, root build, and Docker runtime verification all pass.
