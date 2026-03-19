# Workflow Runs Bulk Follow-up Guidance Design

## Goal
Make the recent bulk-action result panel on `/workflow-runs` more actionable by adding safe next-step actions based on the latest bulk retry/cancel result.

## Recommended Approach
Add lightweight follow-up actions directly to the existing recent bulk-action panel:

- `Open successful runs`
- `Reselect skipped runs`
- `Reselect failed results`

These actions should be derived entirely from the latest in-memory bulk result already shown on the page. They do not need new API routes or a persisted bulk-history model.

## Scope

### Frontend
- Add a helper that derives follow-up targets from the latest bulk result and current loaded run list
- Extend the recent bulk-action panel with follow-up actions
- Show small follow-up feedback messages when reselection happens

### Backend
- No new routes
- No schema changes
- No bulk-history persistence

## Out of Scope
- New bulk mutations
- Bulk-history pages
- Replaying older bulk results
- Bulk actions across unloaded pages
- Cross-page persistent selection

## Action Semantics

### Open successful runs
- Uses successful rows from the latest bulk result that include returned `workflowRun` details
- Opens the resulting run-detail pages
- Uses the same `5 targets` safety guard as other navigation-only bulk actions

### Reselect skipped runs
- Re-selects the original `runId` values for `skipped` rows
- Only reselects runs that are still present in the current loaded page
- Shows a small feedback message after reselection

### Reselect failed results
- Re-selects the original `runId` values for `failed` rows
- Only reselects runs that are still present in the current loaded page
- Shows a small feedback message after reselection

## UX Notes
- These follow-up actions should appear only when the latest bulk result contains matching rows
- `skipped` and `failed` follow-up actions should feel like recovery/navigation helpers, not new mutations
- The result panel remains in-memory only and still represents the most recent bulk action
- Dismissing the panel should remove both the rows and the follow-up actions

## Testing Strategy
- Add helper tests for:
  - successful run-detail target derivation
  - skipped/failed reselection ids filtered to the current loaded page
  - missing-target messaging
- Verify the page:
  - renders only relevant follow-up actions
  - can reselect skipped/failed rows
  - can open successful run details
  - keeps the existing bulk summary and dismiss behavior intact
