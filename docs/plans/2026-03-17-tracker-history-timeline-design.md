# OpenClaw Job Agent Tracker History & Timeline Design

## Goal
Add a richer tracker history view so the dashboard can show both job-centered and application-centered timelines on the same page, while reusing the existing persisted records and lightweight `application_events`.

## Scope

### In Scope
- Add a unified timeline DTO for dashboard history
- Add a global timeline feed
- Add grouped job timelines
- Add grouped application timelines
- Add lightweight filtering by `entityType` and `eventType`
- Keep the current jobs board and applications table, but move them lower on the dashboard page

### Out of Scope
- Full audit logging for every table
- Backfilling synthetic event rows into the database
- Complex search, date-range filters, or pagination
- Separate history pages for jobs and applications
- Workflow orchestration or actor-level attribution

## Architecture

### Data Strategy
- Reuse existing records:
  - `jobs`
  - `job_analyses`
  - `resume_versions`
  - `applications`
  - `application_events`
- Treat timeline as a read-model built on demand in the dashboard service.
- Keep history generation honest:
  - use timestamps from domain records for implicit milestones
  - use `application_events` for explicit approval/submission/recovery actions

### View Strategy
- Keep everything on `/dashboard`
- Add three history layers:
  - global timeline
  - job timelines
  - application timelines
- Preserve the existing dashboard summary metrics and operational tables

## Timeline Model

### Unified Timeline Item
- `id`
- `entityType`
  - `job`
  - `application`
- `entityId`
- `jobId`
- `applicationId`
- `type`
- `label`
- `timestamp`
- `status`
- `meta`

### Supported Event Types
- `job_imported`
- `analysis_completed`
- `resume_generated`
- `prefill_run`
- `approval_updated`
- `submission_marked`
- `submission_failed`
- `submission_reopened`
- `submission_retry_ready`

### Event Provenance
- `job_imported`: `job.createdAt`
- `analysis_completed`: latest completed analysis `createdAt`
- `resume_generated`: latest completed resume `createdAt`
- `prefill_run`: `application.createdAt`
- `approval_updated`: `application_events`
- `submission_marked`: `application_events`
- `submission_failed`: `application_events`
- `submission_reopened`: `application_events`
- `submission_retry_ready`: `application_events`

## API Design

### `GET /dashboard/timeline`
Returns a flat newest-first feed of timeline items.

Supported query params:
- `entityType`
- `eventType`
- `limit`

### `GET /dashboard/history`
Returns grouped history data:
- `globalTimeline`
- `jobTimelines`
- `applicationTimelines`

Each group should already be shaped for direct dashboard rendering so the frontend does not need to reassemble events from raw records.

## UI Design

### Dashboard Layout
1. Metrics row
2. Pipeline overview
3. Global timeline
4. Job timeline cards
5. Application timeline cards
6. Existing jobs board
7. Existing applications table

### Global Timeline
- Default to the newest 20 items
- Allow filtering by:
  - `entityType`
  - `eventType`
- Each row should show:
  - label
  - timestamp
  - related job/application context
  - jump link

### Job Timeline Cards
- One card per recent job
- Show the ordered milestones for that job
- Include an `Open job` link

### Application Timeline Cards
- One card per recent application
- Show the ordered lifecycle for that application
- Include an `Open review` link

## Error Handling
- Empty history should render a clear zero-state in all three sections
- Missing event filters should default to `all`
- If grouped history cannot be loaded, the dashboard should show a clear error state rather than partial misleading data

## Acceptance Criteria
1. `/dashboard` renders a unified global timeline.
2. `/dashboard` renders grouped job timelines.
3. `/dashboard` renders grouped application timelines.
4. `GET /dashboard/timeline` returns stable filtered timeline data.
5. `GET /dashboard/history` returns stable grouped history data.
6. Timeline entries link to the correct job or application detail page.
7. `npm test`, `npm run build`, and `docker compose up --build -d` all succeed after the feature lands.

## Notes
- The first version intentionally favors truthful history over artificially complete history.
- This phase should make the tracker easier to read without forcing a full event-sourcing rewrite.
