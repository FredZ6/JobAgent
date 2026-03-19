# Phase 35: Workflow Runs Selection Foundation Design

## Goal

Prepare `/workflow-runs` for future bulk actions by adding predictable, page-local selection behavior without changing backend APIs or introducing new workflow controls.

## Scope

- Add a per-row checkbox for each loaded workflow run
- Track selected run ids in local page state
- Show a lightweight selection summary
- Add:
  - `Select all loaded`
  - `Clear selection`
- Keep selection only for the currently active query

## Non-Goals

- No backend changes
- No bulk retry/cancel actions yet
- No cross-query persistent selection
- No URL persistence for selected run ids
- No “select every result across all pages” behavior

## Design

### Selection Model

Selection is local to the currently loaded `/workflow-runs` list.

- Each loaded row can be selected individually
- `Load more` appends more rows, and already selected ids remain selected
- Newly loaded rows start unselected

This keeps the selection model small and predictable while still giving the next phase a stable base for bulk actions.

### Query-Bound Selection

Selection belongs to the current query, not the page forever.

When any of these change, the selection resets:

- `kind`
- `status`
- `executionMode`
- `q`
- `from`
- `to`
- `sortBy`
- `sortOrder`

This avoids confusing situations where a user changes the query but still has invisible stale selections from a previous result set.

### Page Controls

Add a small selection area near the results summary:

- `N runs selected`
- `Select all loaded`
- `Clear selection`

Name the action `Select all loaded` rather than `Select all` so the UI stays honest about scope.

### UX Boundaries

This phase intentionally stops before any real bulk operation.

If there are selected runs, the page can show a quiet note like:

- `Bulk actions are not enabled yet.`

That sets expectation without pretending the controls are missing by accident.

## Acceptance Criteria

1. `/workflow-runs` shows a checkbox for each loaded run.
2. The page shows how many runs are currently selected.
3. `Select all loaded` selects all loaded rows.
4. `Clear selection` clears the current selection.
5. `Load more` preserves existing selections.
6. Filter/search/date/sort changes reset selection.
7. Root tests, builds, Docker verification, and runtime checks pass.
