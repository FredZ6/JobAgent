# Phase 34: Workflow Runs Results UX Design

## Goal

Make `/workflow-runs` easier to understand at a glance by clarifying the current query, surfacing active filters, and distinguishing empty states without changing the underlying API model.

## Scope

- Add a result summary that explains:
  - how many runs match the current query
  - how many rows are currently loaded
  - the active sort
- Add active filter chips for:
  - `kind`
  - `status`
  - `executionMode`
  - `q`
  - `from`
  - `to`
- Add a `Clear filters` action that resets URL-backed query state to defaults
- Distinguish between:
  - a true first-run empty state
  - a filtered-empty state

## Non-Goals

- No new backend endpoints
- No new filter dimensions
- No bulk actions
- No saved views
- No table/dense mode toggle
- No changes to cursor pagination behavior

## Design

### Query Semantics Stay The Same

This phase does not change the query model introduced in Phase 33.

- URL-backed state still includes:
  - `kind`
  - `status`
  - `executionMode`
  - `q`
  - `from`
  - `to`
  - `sortBy`
  - `sortOrder`
- `Load more` still uses in-memory cursor state only

The improvement is presentation, not new filtering behavior.

### Derived View State

The page should derive a few lightweight view booleans from existing query and response data:

- `hasActiveFilters`
  - true when any non-default filter/search/date field is active
- `hasAnyRuns`
  - true when `summary.totalRuns > 0`
- `isDefaultSort`
  - true when `sortBy=createdAt` and `sortOrder=desc`

These values drive chips, reset affordances, and the appropriate empty-state message.

### Result Summary

Add a compact summary block above the list that always explains:

- `Showing X of Y workflow runs`
- `Sorted by created time, descending`
- when filters are active:
  - `Filtered by N conditions`

`X` should reflect the number of currently rendered rows.
`Y` should reflect the filtered total from `summary.totalRuns`.

### Active Filter Chips

Render one chip per active query condition. Each chip should:

- show a readable label, such as:
  - `kind: prefill`
  - `status: failed`
  - `mode: temporal`
  - `q: platform`
  - `from: 2026-03-18`
- expose a single remove action
- update URL-backed state when removed

Sorting should be shown in the result summary rather than as removable chips.

### Clear Filters

When any filter is active, show a single `Clear filters` action that:

- restores default URL-backed query state
- returns to the first page
- preserves the current route

This should not reset session-local loading state in any special way beyond the normal first-page fetch.

### Empty-State Behavior

Use two distinct empty-state messages:

1. No workflow runs exist at all:
   - guide the user toward triggering analyze, resume, or prefill

2. Workflow runs exist, but the current query matched none:
   - guide the user toward clearing or widening filters

This keeps the page from blaming the system when the result is actually caused by an intentionally narrow query.

## Acceptance Criteria

1. `/workflow-runs` displays a readable result summary.
2. Active query conditions appear as removable chips.
3. `Clear filters` resets the page to the default URL-backed query state.
4. The page distinguishes true-empty and filtered-empty states.
5. Removing chips or clearing filters resets the list to the first page.
6. Root tests, builds, Docker verification, and runtime checks pass.
