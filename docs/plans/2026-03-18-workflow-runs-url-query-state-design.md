# Phase 33: Workflow Runs URL Query-State Design

## Goal

Make `/workflow-runs` shareable and refresh-safe by encoding its query state in the URL while keeping pagination cursors ephemeral.

## Scope

- Sync these query fields between `/workflow-runs` UI state and the URL:
  - `kind`
  - `status`
  - `executionMode`
  - `q`
  - `from`
  - `to`
  - `sortBy`
  - `sortOrder`
- Restore those values from the URL on page load and browser navigation
- Keep `Load more` working without storing pagination cursor state in the URL

## Non-Goals

- No server-side route refactor
- No URL state for `cursor` or loaded page count
- No debounce system
- No API changes
- No new workflow-run controls

## Design

### URL Model

The URL represents stable query intent, not transient list position.

Included in the URL:

- `kind`
- `status`
- `executionMode`
- `q`
- `from`
- `to`
- `sortBy`
- `sortOrder`

Excluded from the URL:

- `cursor`
- appended page state
- loading/error UI state

This means a shared link restores the same filtered and sorted first page, rather than a fragile mid-list cursor snapshot.

### Normalization Rules

Only non-default values should be written to the URL.

Rules:

- omit `all`
- omit empty strings
- omit default sort values:
  - `sortBy=createdAt`
  - `sortOrder=desc`

This keeps links short and stable while still being explicit when the user has changed something meaningful.

### Page Behavior

1. Initial load:
   - parse `searchParams`
   - seed local UI state
   - fetch the first page

2. Filter/search/date/sort changes:
   - update local state
   - write normalized query state to the URL with `router.replace(...)`
   - reset to the first page

3. `Load more`:
   - continues using in-memory cursor state only
   - does not change the URL

4. Browser back/forward:
   - should restore prior query-state from the URL
   - should re-fetch the corresponding first page

### Implementation Shape

Add a small web-side helper that:

- parses `ReadonlyURLSearchParams` into workflow-runs page state
- serializes workflow-runs page state back into normalized `URLSearchParams`

The page should consume that helper instead of hand-writing URL logic inline.

## Acceptance Criteria

1. `/workflow-runs` restores filter/search/date/sort state from the URL.
2. Changing those controls updates the URL.
3. Refreshing the page restores the same first-page result set.
4. `Load more` remains functional without polluting the URL.
5. Browser back/forward restores earlier query-state.
6. Root tests, builds, Docker verification, and runtime checks pass.
