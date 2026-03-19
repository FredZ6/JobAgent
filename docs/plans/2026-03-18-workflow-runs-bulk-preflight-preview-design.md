# Workflow Runs Bulk Preflight Preview Design

## Goal
Make bulk retry/cancel safer and easier to trust by showing an explicit execution preview before the user confirms the action on `/workflow-runs`.

## Recommended Approach
Extend the existing inline confirmation state with a helper-driven preview that shows:

- `Will process`
- `Will skip`

The preview should be derived from the current loaded page data and the same eligibility rules already used by the bulk controls. No new API routes or separate preview screen are needed.

## Scope

### Frontend
- Add a helper that builds a preflight preview for `retry` or `cancel`
- Extend the existing inline confirmation area on `/workflow-runs`
- Show process and skip groups with stable row metadata and skip reasons

### Backend
- No new routes
- No schema changes
- No execution-path changes

## Out of Scope
- A separate preview page
- Preview-time per-run editing or removal
- New APIs
- New mutations
- Bulk-history persistence

## Preview Model
For the active action:

### Will process
Rows that will be acted on.

Each row should show:
- `runId`
- `kind`
- `status`
- `executionMode`

### Will skip
Rows that are selected but not eligible.

Each row should show:
- `runId`
- `kind`
- `status`
- `executionMode`
- `reason`

## UX Notes
- Keep the current inline confirmation sentence at the top
- Show the preview only after the user has initiated `Retry eligible runs` or `Cancel eligible runs`
- Hide empty groups
- Keep `Confirm` and `Go back` exactly where they are
- Do not introduce a modal

## Testing Strategy
- Helper tests for:
  - retry previews
  - cancel previews
  - mixed eligible/ineligible selections
  - skip reasons
- Browser verification for:
  - preview appearing after bulk action start
  - correct `Will process` / `Will skip` grouping
  - `Go back` hiding the preview
  - confirmation flow still working
