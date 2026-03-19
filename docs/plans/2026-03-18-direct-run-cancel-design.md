# Direct Run Cancel Design

## Goal

Allow `running` direct workflow runs to be cancelled honestly, using cooperative in-process cancellation instead of pretending the API can hard-kill or roll back already completed work.

## Scope

- Extend `POST /workflow-runs/:id/cancel` to allow `executionMode=direct` and `status=running`
- Keep the existing Temporal cancel behavior intact
- Add a process-local cancellation registry for active direct runs
- Reuse the current `AbortSignal`-based safe cancellation checks in:
  - `analyze`
  - `generate_resume`
  - `prefill`
- Expose `Cancel run` for running direct runs on:
  - Job Detail
  - Workflow Run Detail

## Non-Goals

- Hard-killing LLM calls, browser work, or the Node process
- Rolling back already-persisted business records
- Cross-process or multi-instance direct cancellation coordination
- Adding `cancel_requested` / `cancelling` intermediate statuses
- Bulk direct cancel

## Approach Options

### Option 1: Force-Cancel the Existing Direct Path

Allow the current cancel endpoint to mark direct runs `cancelled` without adding any in-process coordination.

Why not:
- The run could say `cancelled` while direct work still finishes and writes results
- This would make workflow history and tracker state dishonest

### Option 2: Cooperative In-Process Cancellation

Add a small in-memory registry for active direct runs, issue an abort signal when cancel is requested, and stop only at the next safe checkpoint.

Recommended because:
- It matches the existing `AbortSignal`-based direct-service architecture
- It is honest about what can and cannot be stopped
- It keeps the slice small enough to verify thoroughly

### Option 3: Hard Interruption / Rollback

Try to interrupt the currently executing direct work and unwind any writes already made.

Why not now:
- Too risky for local correctness
- Would mix cancellation semantics with rollback semantics
- Would make prefill/browser-backed work much harder to reason about

## Recommended Design

Use **Option 2: Cooperative In-Process Cancellation**.

The API process will keep a small registry of currently running direct workflow runs. Cancelling a direct run aborts its registry-owned signal. Existing direct services will then stop at their current safe checkpoints and settle the run honestly:

- if cancellation is detected before final writes, the run ends `cancelled`
- if work already completed and persisted, the run remains `completed`

## Architecture

### Direct Cancellation Registry

Add a provider, for example:

- `apps/api/src/workflow-runs/direct-run-cancellation-registry.service.ts`

Responsibilities:
- `register(runId)` -> returns an `AbortSignal`
- `cancel(runId)` -> aborts the registered signal
- `has(runId)` -> indicates whether the run is still cancellable in this API process
- `cleanup(runId)` -> removes finished runs

This registry is intentionally process-local. It is the truthful boundary for the first direct-cancel slice.

### Signal Composition

Direct services already accept optional `AbortSignal`s. This slice will merge:

- the registry-owned direct-run signal
- any existing request/transport abort signal

The merged signal is then passed through the existing `throwIfWorkflowRunCancelled(signal)` checkpoints and downstream LLM / worker calls.

## Supported Flows

### Analyze

Safe checkpoints:
- before loading profile/settings if the run was just cancelled
- after the LLM call and before persisting analysis results

### Generate Resume

Safe checkpoints:
- before loading profile/settings/job context
- after resume content generation and before persisting the resume version
- before final `markCompleted`

### Prefill

Safe checkpoints:
- before loading job/resume prerequisites
- before creating or advancing application-side execution state where possible
- before calling the Playwright worker
- before final application/run completion writes

`prefill` keeps its current honest behavior for partially created `application` rows:
- a pre-created application may still be recorded as failed with `Workflow run was cancelled`
- the workflow run itself should still settle as `cancelled` if the direct cancellation signal was what stopped execution

## Cancel Endpoint Semantics

Keep:

- `POST /workflow-runs/:id/cancel`

Allow:
- `temporal + queued`
- `temporal + running`
- `direct + running`

Reject:
- `direct + queued` (should not exist in current model)
- `completed`
- `failed`
- `cancelled`

Additional direct-mode rule:
- if the direct run is no longer registered in the current API process, return a clear error such as:
  - `Direct workflow run is no longer cancellable in this API process.`

This keeps the feature honest about its single-process boundary.

## Status Semantics

Keep the existing status set:

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

Do not add `cancel_requested`.

Behavior:
- cancel request does **not** immediately rewrite a running direct run to `cancelled`
- the run becomes `cancelled` only when a safe checkpoint observes the abort
- if the work already completed, the run stays `completed`

## UI Changes

Update:
- `apps/web/src/app/jobs/[id]/page.tsx`
- `apps/web/src/app/workflow-runs/[id]/page.tsx`
- `apps/web/src/lib/workflow-run-status.ts`

For running direct runs:
- show `Cancel run`
- show copy that is more precise than the Temporal variant:
  - `Stops the run at the next safe cancellation point in this API process.`

## Testing Strategy

Follow TDD:

1. Add failing backend tests for direct-run cancel eligibility and registry behavior
2. Add failing direct-service tests for cooperative cancellation checkpoints
3. Add failing frontend tests for direct-run cancel affordances/copy
4. Implement the smallest registry + signal plumbing to pass
5. Re-run targeted tests, full tests, build, Docker, and direct-mode runtime checks

## Verification

- `npm test`
- `npm run build`
- `docker compose up --build -d`
- direct positive check:
  - start a real direct run
  - cancel while `running`
  - confirm it settles as `cancelled` when caught at a safe checkpoint
- direct negative check:
  - already-finished runs still reject cancel
- regression checks:
  - Temporal cancel behavior still works unchanged
  - completed direct work is not incorrectly rewritten to `cancelled`
