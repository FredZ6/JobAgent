# Phase 28: Workflow Run Live Status UX Design

## Goal

Make workflow-run state easier to understand in the existing UI by improving run-specific copy, automatically refreshing active runs on Job Detail, and clarifying latest-run summaries on the dashboard.

## Scope

- Improve `Workflow runs` rendering on Job Detail for:
  - `queued`
  - `running`
  - `completed`
  - `failed`
  - `cancelled`
- Add automatic polling on Job Detail only when at least one workflow run is `queued` or `running`.
- Stop polling automatically once all visible runs reach terminal states.
- Keep existing retry and cancel controls, but present them with clearer surrounding guidance.
- Improve dashboard jobs-board run summaries so latest run state is more readable at a glance.

## Non-Goals

- No new `/workflow-runs/:id` page.
- No WebSocket or SSE transport.
- No dashboard-wide live polling.
- No new workflow control types beyond the existing retry/cancel actions.
- No running Temporal cancel support.

## Design

### Job Detail UX

Each workflow run should present a clearer state-specific interpretation:

- `queued`
  - Label: `Queued in Temporal`
  - Help text: waiting for a worker to pick up the run
  - Action: `Cancel run` only for Temporal queued runs
- `running`
  - Label: `Running`
  - Help text varies by execution mode:
    - direct: running inside the direct API path
    - temporal: running inside a Temporal worker
  - No retry/cancel action
- `completed`
  - Label: `Completed`
  - Help text points to the produced downstream record when available
- `failed`
  - Label: `Failed`
  - Help text shows a compact error summary
  - Action: `Retry failed run`
- `cancelled`
  - Label: `Cancelled before execution`
  - Help text clarifies that cancellation stopped the run lifecycle and did not roll back existing business records

### Polling Model

Polling stays intentionally narrow:

- only on Job Detail
- only while at least one run is `queued` or `running`
- interval: every 3 seconds
- poll payloads:
  - job detail
  - job applications
  - job workflow runs

Refreshing all three keeps the page coherent when an active run finishes and creates a new analysis, resume version, or application.

### Dashboard

Dashboard remains read-oriented and non-live, but latest run summaries become more readable:

- `Analyze queued`
- `Resume running`
- `Prefill cancelled`

This keeps the dashboard glanceable without turning it into an operator console.

## Acceptance Criteria

1. Job Detail shows state-specific copy for `queued`, `running`, `completed`, `failed`, and `cancelled`.
2. Job Detail starts polling only when at least one workflow run is active (`queued` or `running`).
3. Polling stops automatically when all workflow runs become terminal.
4. Retry/cancel controls do not regress.
5. Dashboard job cards show clearer latest-run summaries.
6. Root tests, builds, and Docker verification all pass.
