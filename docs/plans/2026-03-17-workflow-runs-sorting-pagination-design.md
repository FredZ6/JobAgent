# Phase 32: Workflow Runs Sorting & Pagination Design

## Goal

Make the global workflow-runs view sustainable as run volume grows by adding explicit sort controls and cursor-based pagination.

## Scope

- Extend `GET /workflow-runs` with:
  - `sortBy`
  - `sortOrder`
  - `cursor`
  - existing `limit`
- Extend `/workflow-runs` with:
  - sort controls
  - a `Load more` action
- Keep the existing filters and search:
  - `kind`
  - `status`
  - `executionMode`
  - `q`
  - `from`
  - `to`

## Non-Goals

- No page-number pagination
- No infinite scroll
- No URL query-state syncing
- No new retry/cancel controls
- No live polling

## Design

### Query Semantics

New query fields:

- `sortBy`
  - `createdAt`
  - `startedAt`
  - `completedAt`
  - `status`
  - `kind`
- `sortOrder`
  - `asc`
  - `desc`
- `cursor`
  - opaque cursor for the next slice of rows

Default behavior:

- `sortBy=createdAt`
- `sortOrder=desc`
- `limit=20`

Execution order is:

1. filter
2. sort
3. paginate

### Sorting Rules

`createdAt`, `startedAt`, and `completedAt` sort by timestamp.

For nullable timestamps:

- `null` values sort last in both directions

`status` and `kind` sort by fixed business order instead of raw string comparison.

`status` order:

1. `queued`
2. `running`
3. `failed`
4. `cancelled`
5. `completed`

`kind` order:

1. `analyze`
2. `generate_resume`
3. `prefill`

`desc` reverses these sequences.

### Pagination Model

Use lightweight cursor pagination rather than page numbers.

The response should include:

- `summary`
- `runs`
- `pageInfo`
  - `nextCursor`
  - `hasMore`
  - `returnedCount`

`summary` reflects the fully filtered result set, not just the current page.

That keeps the cards stable and truthful while the list loads incrementally.

### UI

Add to `/workflow-runs`:

- a `Sort by` control
- an `Order` control
- a `Load more` button under the list

Behavior:

- changing any filter, search term, date, or sort resets the list to page one
- `Load more` appends the next page using the current query state
- the page remains read-oriented and non-live

## Acceptance Criteria

1. `GET /workflow-runs` supports `sortBy`, `sortOrder`, `cursor`, and `limit`.
2. `/workflow-runs` exposes sort controls and `Load more`.
3. Filtering, search, date range, sorting, and pagination work together.
4. Summary cards reflect the filtered total result set rather than the current page size.
5. Nullable `startedAt` and `completedAt` sort predictably.
6. Changing filters or sort resets pagination cleanly.
7. Root tests, builds, Docker verification, and runtime HTTP checks pass.
