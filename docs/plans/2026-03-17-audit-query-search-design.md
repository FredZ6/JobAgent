# Audit Query/Search Design

## Goal
Turn the existing audit and history surfaces into genuinely searchable operator tools by adding source filtering, keyword search, and simple date-range filters on top of the current actor-aware timeline model.

## Recommended Approach

### Option 1: Add more pills only
- Extend the current button filters with `source`.
- Pros: small UI change.
- Cons: still weak for real investigation; users cannot quickly find a note, company, or actor id.

### Option 2: Focused query/search enhancement
- Extend existing history APIs with:
  - `source`
  - `q`
  - `from`
  - `to`
- Add matching controls to:
  - dashboard global timeline
  - submission-review history
- Keep grouped history and recent activity read-only.
- Pros: highest immediate operator value without adding a new page or changing the persistence model.
- Cons: grouped history stays non-searchable in this phase.

### Option 3: Dedicated audit page
- Build a separate audit center with larger tables and advanced controls.
- Pros: could grow into a strong admin surface.
- Cons: too large for the next step and duplicates the dashboard/history context we already have.

### Recommendation
Choose **Option 2**. It makes the current audit surfaces actually useful for investigation while staying inside the existing product shape.

## Scope

### In scope
- Extend `GET /applications/:id/events` filtering.
- Extend `GET /dashboard/timeline` filtering.
- Add source filter, keyword search, and simple date range inputs in the current UI.
- Search against already-returned, user-meaningful fields.

### Out of scope
- New audit page.
- Full-text database indexing.
- Search/filtering for `GET /dashboard/history`.
- Pagination beyond the current `limit`.

## Query Model

### New query parameters

For `GET /applications/:id/events`:
- `actorType`
- `eventType`
- `source`
- `q`
- `from`
- `to`
- `limit`

For `GET /dashboard/timeline`:
- `actorType`
- `entityType`
- `eventType`
- `source`
- `q`
- `from`
- `to`
- `limit`

### Semantics
- `source`: exact match against the event source string
- `q`: case-insensitive substring search
- `from` / `to`: ISO date or date-time strings; inclusive bounds

### Search fields

`applications/:id/events`
- `label`
- `summary`
- `actorType`
- `actorLabel`
- `actorId`
- `source`
- selected payload text fields such as `note`

`dashboard/timeline`
- all of the above, plus:
- job/application context text already present in `meta`
- derived job title/company/headline text where available

The search should stay simple, predictable, and transparent.

## API Behavior

### `GET /applications/:id/events`
- Load events as today.
- Format to the canonical DTO first.
- Apply filters in memory:
  - actor type
  - event type
  - source
  - date range
  - keyword search
  - limit

### `GET /dashboard/timeline`
- Build canonical timeline items as today.
- Apply filters in memory in the same order.

This keeps filtering behavior consistent across both endpoints without widening the persistence layer.

## UI Changes

### Dashboard global timeline
Add:
- source filter pills
- keyword search input
- `from` date input
- `to` date input

Do not add these controls to grouped job/application timeline cards yet.

### Submission review history
Add:
- source filter pills
- keyword search input
- `from` date input
- `to` date input

The review page should remain compact; this is a power-up, not a redesign.

## Error Handling
- Invalid dates should be rejected by query parsing with clear 400 behavior.
- Empty `q` behaves like no search.
- Missing `from` or `to` means open-ended range.
- If filters eliminate everything, return an empty list rather than an error.

## Testing
- Shared type tests for any new query-related exported types, if needed.
- Applications service tests for:
  - source filter
  - keyword search
  - date range
- Dashboard service tests for:
  - source filter
  - keyword search
  - date range
- Runtime verification with filtered HTTP requests against both endpoints.

## Acceptance Criteria
1. `GET /applications/:id/events` supports `source/q/from/to`.
2. `GET /dashboard/timeline` supports `source/q/from/to`.
3. Dashboard global timeline can filter by source, keyword, and date range.
4. Submission Review history can filter by source, keyword, and date range.
5. Root tests, root build, and Docker runtime verification all pass.
