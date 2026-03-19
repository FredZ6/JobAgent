# OpenClaw Job Agent Lightweight Audit Enhancements Design

## Goal
Make the existing audit history easier to query and easier to read by standardizing event payload keys, adding actor-based filtering, and returning API-generated summaries for application events and dashboard timeline items.

## Scope

### In Scope
- Standardize the common `application_events.payload` keys used by new writes
- Add `summary` to application events, recent activity items, and timeline items
- Add `actorType` filtering to `GET /applications/:id/events`
- Add `actorType` filtering to `GET /dashboard/timeline`
- Keep `eventType`, `entityType`, and `limit` filtering where already applicable
- Add dashboard and submission-history UI affordances for actor-focused filtering and clearer summaries

### Out of Scope
- `actorId` or `source`
- Full event-sourcing or new job/resume event tables
- Backfilling old events into a new payload format
- Full-text search, date range filters, or a dedicated audit page

## Architecture

### Event Model
- Keep `application_events` as the persisted audit trail for explicit application actions.
- Continue using the dashboard read-model for implicit milestones such as import, analysis, resume generation, and prefill.
- Standardize the payload keys that new application-event writes may use:
  - `note`
  - `fromStatus`
  - `toStatus`
  - `approvalStatus`
  - `submissionStatus`
  - `reasonCode`

### Summary Model
- Generate `summary` in the API layer instead of the frontend.
- `summary` should be short and readable, combining status transitions and notes where available.
- If note data is missing, summary should gracefully fall back to status-only text or the event label.

## API Design

### `GET /applications/:id/events`
Add optional query params:
- `actorType`
- `eventType`
- `limit`

Return each item with:
- `actorType`
- `actorLabel`
- `payload`
- `createdAt`
- `summary`

### `GET /dashboard/timeline`
Keep:
- `entityType`
- `eventType`
- `limit`

Add:
- `actorType`

Return each item with:
- `actorType`
- `actorLabel`
- `summary`

### `GET /dashboard/history`
Keep grouped response shape, but each event should include `summary`.

### `GET /dashboard/overview`
Keep the existing overview shape, but each `recentActivity` item should include `summary` so the dashboard summary feed stays aligned with the timeline API.

## UI Design

### Dashboard
- Add an `actorType` filter to the global timeline section:
  - `all`
  - `user`
  - `worker`
  - `api`
  - `system`
- Show each item as:
  - label
  - actor attribution
  - timestamp
  - summary
- Apply the same display style to grouped job and application timeline cards.

### Submission Review
- Add lightweight history filters:
  - `actorType`
  - `eventType`
- Show each item as:
  - label
  - actor attribution
  - timestamp
  - summary

## Error Handling
- Old events without the newer payload shape should still produce a usable summary.
- Empty filtered results should render clear zero-states.
- Missing or unknown actor filters should safely fall back to `all`.

## Acceptance Criteria
1. New application-event writes use standardized payload keys.
2. `GET /applications/:id/events` supports `actorType`, `eventType`, and `limit`.
3. `GET /dashboard/timeline` supports `actorType`, `entityType`, `eventType`, and `limit`.
4. Events and timeline items return `summary`.
5. Dashboard supports actor-based timeline filtering.
6. Submission Review history shows actor attribution and summaries instead of only raw payload text.
7. `npm test`, `npm run build`, and `docker compose up --build -d` succeed after the feature lands.

## Notes
- This phase intentionally improves usability and consistency without claiming to be a full audit ledger.
- Old events remain honest: they are displayed as-is with graceful summary fallback rather than being rewritten.
