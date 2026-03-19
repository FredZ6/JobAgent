# Phase 29: Workflow Run Detail & History Design

## Goal

Turn workflow runs into first-class, traceable objects by adding lightweight lifecycle events and a dedicated run-detail page.

## Scope

- Add `workflow_run_events` as a lightweight lifecycle table.
- Record workflow-run lifecycle events for:
  - `run_queued`
  - `run_started`
  - `run_completed`
  - `run_failed`
  - `run_cancelled`
  - `run_retried`
- Add `GET /workflow-runs/:id/events`.
- Expand `GET /workflow-runs/:id` to include the linked job and related records needed by a detail page.
- Add `/workflow-runs/[id]` in the web app.
- Add `Open run detail` entry points from Job Detail.

## Non-Goals

- No global workflow-run console yet.
- No actor/source model on `workflow_run_events` in this phase.
- No dashboard-wide run-history UI.
- No new workflow controls beyond existing retry/cancel actions.

## Design

### Persistence

Add a `WorkflowRunEvent` model keyed by `workflowRunId`.

`payload` stays lightweight and optional. It can hold:

- `status`
- `errorMessage`
- `applicationId`
- `resumeVersionId`
- `retryRunId`
- `retryOfRunId`
- `workflowId`

### Event Write Rules

- `createTemporalQueuedRun()` writes `run_queued`
- `createDirectRun()` writes `run_started`
- `markRunning()` writes `run_started`
- `markCompleted()` writes `run_completed`
- `markFailed()` writes `run_failed`
- `markCancelled()` writes `run_cancelled`
- retry flow writes `run_retried` on the original failed run

### API

`GET /workflow-runs/:id` should return:

- `workflowRun`
- `job`
- `application` when linked
- `resumeVersion` when linked
- `retryOfRun` when present
- `latestRetry` when present

`GET /workflow-runs/:id/events` returns that run's lifecycle timeline in chronological order.

### UI

Add `/workflow-runs/[id]` with:

1. Run summary
2. Linked records
3. Retry lineage
4. Lifecycle history
5. Existing retry/cancel actions when still applicable

This page should explain how the run got to its current state, not just what the current state is.

## Acceptance Criteria

1. Workflow-run lifecycle changes persist `workflow_run_events`.
2. `GET /workflow-runs/:id/events` returns run history.
3. `GET /workflow-runs/:id` returns linked context for the detail page.
4. `/workflow-runs/[id]` loads successfully.
5. Job Detail links each run to its detail page.
6. Retry/cancel controls do not regress.
7. Root tests, builds, and runtime verification pass.
