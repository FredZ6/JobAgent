# Phase 36: Workflow Runs Safe Bulk Actions Design

## Goal

Make the new `/workflow-runs` selection model useful by adding safe, navigation-only bulk actions before introducing any bulk state-changing operations.

## Scope

- Add a bulk action bar that appears when one or more workflow runs are selected
- Add these actions:
  - `Open selected run details`
  - `Open selected jobs`
  - `Clear selection`
- Limit each open action to at most `5` targets
- Show clear feedback when the selection exceeds that limit

## Non-Goals

- No backend changes
- No bulk retry
- No bulk cancel
- No bulk export
- No select-across-all-pages behavior
- No confirmation modals

## Design

### Action Model

Bulk actions remain intentionally read-only in this phase.

- `Open selected run details`
  - opens selected workflow-run detail pages
- `Open selected jobs`
  - opens deduplicated job pages for selected runs
- `Clear selection`
  - resets the current page-local selection

This keeps the feature low-risk while still making selection materially useful.

### Limits And Guard Rails

The first version should cap each open action at `5` targets.

If the user selects more than `5` relevant targets:

- do not open anything
- show a clear message:
  - `Select 5 runs or fewer to open details at once.`
  - `Select 5 jobs or fewer to open at once.`

This avoids surprising tab explosions and keeps the action semantics honest.

### Job Deduplication

`Open selected jobs` should deduplicate by `job.id`.

If multiple selected runs belong to the same job, opening jobs should still open that job only once.

### Implementation Shape

Add a small front-end helper that:

- derives selected run-detail targets from selected ids
- derives deduplicated selected job targets from the loaded list
- applies the `5 target` guard
- returns either:
  - a list of URLs to open
  - or a user-facing error message

The page should keep the actual `window.open(...)` calls local, but it should not own the target-building rules itself.

## Acceptance Criteria

1. Selecting one or more runs shows a bulk action bar.
2. `Open selected run details` opens selected run detail pages when the selection is within the limit.
3. `Open selected jobs` opens deduplicated job pages when the selection is within the limit.
4. Exceeding `5` targets blocks the open action and shows the correct error message.
5. `Clear selection` continues to work.
6. Root tests, builds, Docker verification, and browser-level interaction checks pass.
