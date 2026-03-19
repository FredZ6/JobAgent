# Workflow Runs Bulk Controls Design

## Goal
Add the first real bulk state-changing controls to `/workflow-runs` by supporting bulk retry and bulk cancel on the currently selected runs, while preserving the safety boundaries established in earlier phases.

## Recommended Approach
Use an eligible-subset model:

- `bulk retry` applies only to selected runs whose status is `failed`
- `bulk cancel` applies only to selected runs whose `executionMode` is `temporal` and whose status is `queued`
- ineligible selected runs are skipped, not treated as hard blockers

This keeps mixed selections usable and aligns with the existing eligibility counts already shown in the UI.

## Scope

### Backend
- Add `POST /workflow-runs/bulk-retry`
- Add `POST /workflow-runs/bulk-cancel`
- Reuse existing single-run services:
  - `WorkflowRunRetriesService.retryWorkflowRun(id)`
  - `WorkflowRunCancelService.cancelWorkflowRun(id)`
- Return per-run results plus a small aggregate summary

### Frontend
- Turn the currently disabled `Retry eligible runs` and `Cancel eligible runs` buttons into real actions
- Add a lightweight inline confirm state in `/workflow-runs`
- Show result feedback after execution
- Refresh the list and clear the selection after a bulk operation completes

## Out of Scope
- Bulk actions across all filtered results or unloaded pages
- Bulk actions larger than `5` eligible runs
- Transactional all-or-nothing semantics
- Running Temporal cancel
- Direct-run cancel
- Background batch jobs or a separate bulk-ops console

## Data and API Shape

### Request
- `runIds: string[]`

### Response
- `requestedCount`
- `eligibleCount`
- `skippedCount`
- `successCount`
- `failureCount`
- `results`
  - `runId`
  - `status`
    - `success`
    - `skipped`
    - `failed`
  - `message`
  - `workflowRun?`

This keeps the response explicit and makes partial success easy to explain in the UI.

## Safety Boundaries
- Bulk retry only operates on eligible failed runs
- Bulk cancel only operates on eligible queued Temporal runs
- If more than `5` eligible runs are present, the request is rejected before execution
- Ineligible selected runs are reported as skipped
- Existing single-run validation remains the source of truth

## UX Notes
- The action bar continues to show eligibility counts before execution
- When a bulk action is chosen, the page enters a simple confirmation state rather than opening a modal
- Confirmation copy should explicitly say how many eligible runs will be acted on and how many selected runs will be ignored
- After completion, the page should show a compact success/failure summary and reload the current list view

## Testing Strategy
- Shared-type schema tests for the bulk request/response payloads
- API service tests for:
  - eligible-subset execution
  - skip handling
  - over-limit rejection
  - partial success/failure responses
- Frontend helper tests for confirmation copy and result summaries
- Runtime verification for:
  - bulk retry on failed runs
  - bulk cancel on queued Temporal runs
  - mixed-selection browser behavior on `/workflow-runs`
