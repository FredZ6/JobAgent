# Phase 26: Workflow Run Retry Controls Design

## Goal

Make failed workflow runs actionable without mutating prior evidence. A retry should create a fresh `workflow_run`, preserve the original failed run, and reuse the existing analyze/resume/prefill execution paths.

## Scope

- Add retry controls only for `failed` workflow runs.
- Support `analyze`, `generate_resume`, and `prefill`.
- Create a new workflow run for every retry.
- Record the relationship with `retryOfRunId`.
- Surface retry actions on Job Detail.

## Non-Goals

- No cancel controls yet.
- No automatic retry policies.
- No bulk retry.
- No retry UI on the dashboard.

## Design

### Persistence

Add `retryOfRunId` to `workflow_runs` as a nullable self-reference:

- old failed run remains unchanged
- new retry run points back to the failed run

### Dispatch Rules

- direct mode:
  - create a fresh direct run
  - call the existing direct service with the new run id
- Temporal mode:
  - submit the existing workflow path again
  - create a fresh queued Temporal run with `retryOfRunId`

Retries intentionally use the current runtime mode rather than forcing the old mode.

### Failure Semantics

If a retry creates a new run but the execution fails again:

- keep the new failed run
- return the new run detail instead of hiding it behind a generic 500

This is especially important for failed browser-backed prefills where an honest failed retry is still useful evidence.

### UI

Job Detail `Workflow runs` gets:

- `Retry failed run` for failed rows
- `Retry of <runId>` on retried rows
- refresh after retry completes

## Acceptance Criteria

1. `POST /workflow-runs/:id/retry` only accepts failed runs.
2. A retry creates a fresh run and preserves the old one.
3. The new run stores `retryOfRunId`.
4. Prefill retries create fresh application evidence instead of overwriting the old application.
5. Job Detail exposes retry controls for failed runs.
6. direct and Temporal retry paths are both verified.
