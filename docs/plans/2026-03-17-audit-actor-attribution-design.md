# OpenClaw Job Agent Audit & Actor Attribution Design

## Goal
Make tracker history and application event trails more trustworthy by attaching actor attribution to audit events and timeline items, without introducing a full user system or a full event-sourcing rewrite.

## Scope

### In Scope
- Add `actorType` and `actorLabel` to persisted `application_events`
- Return actor metadata from application event APIs
- Return actor metadata from dashboard overview, flat timeline, and grouped history APIs
- Add stable derived actor attribution for implicit milestone events
- Show actor attribution in dashboard timelines and application submission history

### Out of Scope
- Full authentication or multi-user identity
- `actorId`, `source`, or a broader actor directory
- New job-specific or resume-specific event tables
- Backfilling synthetic historical events into the database
- Actor-based filtering, search, or analytics

## Architecture

### Event Storage Strategy
- Keep `application_events` as the only persisted lightweight audit table for now.
- Promote actor attribution to first-class columns on the event table:
  - `actorType`
  - `actorLabel`
- Continue to use the current read-model approach for dashboard history.

### Attribution Strategy
- For persisted application events, write actor attribution at event creation time.
- For implicit milestones that still come from entity timestamps, attach a stable derived actor in the read-model:
  - `job_imported` -> `api / apps-api`
  - `analysis_completed` -> `api / apps-api`
  - `resume_generated` -> `api / apps-api`
  - `prefill_run` -> `worker / playwright-worker`

This keeps the first version honest and useful without forcing new event tables for every domain object.

## Data Model

### Application Event Columns
- `actorType`
  - `system`
  - `user`
  - `worker`
  - `api`
- `actorLabel`
  - first version examples:
    - `local-user`
    - `playwright-worker`
    - `applications-service`
    - `apps-api`

### Shared Event Shape
All event-like API payloads should expose:
- `type`
- `label`
- `timestamp`
- `actorType`
- `actorLabel`

This applies to:
- `GET /applications/:id/events`
- `GET /dashboard/overview` recent activity
- `GET /dashboard/timeline`
- `GET /dashboard/history`

## API Design

### Persisted Application Events
Persist actor metadata for:
- `approval_updated`
- `submission_marked`
- `submission_failed`
- `submission_reopened`
- `submission_retry_ready`

First version attribution:
- user-triggered review and submission actions -> `user / local-user`

### Derived Timeline Events
Do not add new tables yet for:
- `job_imported`
- `analysis_completed`
- `resume_generated`
- `prefill_run`

Instead, derive actor metadata in the dashboard read-model when building timeline items.

## UI Design

### Dashboard
Add actor attribution to:
- global timeline rows
- job timeline rows
- application timeline rows

Display format should stay lightweight:
- event label
- timestamp
- `by user: local-user`
- `by worker: playwright-worker`
- `by api: apps-api`

### Application Review / Submission Review
Show actor attribution anywhere event history is already rendered so users do not have to cross-reference the dashboard to understand who triggered an action.

## Error Handling
- Old event rows without actor fields should fall back safely at read time until all environments are migrated.
- Timeline items must always provide actor metadata, even when it is derived rather than persisted.
- Actor attribution should never block the core workflow if a note or payload is empty.

## Acceptance Criteria
1. New `application_events` persist `actorType` and `actorLabel`.
2. `GET /applications/:id/events` returns actor attribution.
3. `GET /dashboard/overview`, `GET /dashboard/timeline`, and `GET /dashboard/history` return actor attribution.
4. Derived milestone events expose stable actor attribution.
5. `/dashboard` and application history UIs display actor attribution.
6. `npm test`, `npm run build`, and `docker compose up --build -d` succeed after the feature lands.

## Notes
- This phase intentionally improves trust in history without pretending to be a full audit ledger.
- If the project later adds real users, this design can grow by adding `actorId` and `source` without changing the current event-reading model.
