# Phase 27: Workflow Run Cancel Controls Design

## Goal

Add a safe cancel action for Temporal workflow runs without implying business-result rollback. This phase intentionally limits cancellation to queued Temporal runs so the UI only promises behavior the current worker architecture can actually deliver.

## Scope

- Add `cancelled` as a workflow-run terminal status.
- Support `POST /workflow-runs/:id/cancel`.
- Only allow cancellation when:
  - `executionMode=temporal`
  - `status=queued`
  - `workflowId` exists
- Surface `Cancel run` only on queued Temporal runs in Job Detail.

## Non-Goals

- No direct-mode cancellation.
- No cancellation for running Temporal runs yet.
- No business-result rollback for analyses, resume versions, or applications.
- No cancel controls on dashboard cards.

## Design

### Status Model

Extend `workflow_runs.status` with:

- `cancelled`

Use the existing `completedAt` field as the terminal timestamp for cancelled runs.

### Cancellation Semantics

Cancellation is defined as a process-state transition, not a data rollback:

- the workflow run becomes `cancelled`
- the workflow is asked to stop at the Temporal layer
- any already-persisted business objects remain untouched

### Why only queued?

The current Temporal activities call API routes synchronously and do not use heartbeats or cooperative cancellation. That means a `running` workflow may already be inside a direct API path that will continue to write records. Supporting queued-only cancellation keeps the behavior honest and predictable.

### UI

Job Detail `Workflow runs` panel:

- show `Cancel run` for `temporal + queued`
- show no cancel control for `running/completed/failed/cancelled`
- keep retry behavior unchanged for failed runs

## Acceptance Criteria

1. `workflow_runs.status` accepts `cancelled`.
2. `POST /workflow-runs/:id/cancel` cancels only queued Temporal runs.
3. Successful cancellation marks the run `cancelled` and writes `completedAt`.
4. Non-queued, non-Temporal, or missing-workflow-id runs are rejected.
5. Job Detail shows `Cancel run` only for queued Temporal rows.
6. Root tests, builds, and Temporal-mode runtime verification all pass.
