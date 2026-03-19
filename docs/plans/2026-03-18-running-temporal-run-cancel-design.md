# Running Temporal Run Cancel Design

## Goal

Allow `running` Temporal workflow runs to be cancelled honestly, using safe cancellation checkpoints instead of pretending the system can hard-stop already executing work.

## Scope

- Extend `POST /workflow-runs/:id/cancel` to allow `executionMode=temporal` and `status=running`
- Keep `direct` runs non-cancellable
- Keep queued Temporal cancel behavior intact
- Add cooperative cancellation checks to the internal direct execution paths for:
  - `analyze`
  - `generate_resume`
  - `prefill`
- Expose the new cancel affordance on Job Detail and Workflow Run Detail for running Temporal runs

## Non-Goals

- Direct-run cancellation
- Hard-killing Playwright/browser processes
- Rolling back already-persisted business records
- Adding `cancel_requested` / `cancelling` intermediate statuses
- Bulk cancel for running Temporal runs

## Approach Options

### Option 1: Relax API Validation Only

Allow `running` Temporal runs through the cancel endpoint, call Temporal cancel, and keep the rest of the system unchanged.

Why not:
- The run could end up marked `cancelled` while the underlying direct path still writes analysis, resume, or application results
- This would make tracker and workflow history dishonest

### Option 2: Cooperative Cancellation Checks

Keep the current single cancel endpoint, but add explicit cancellation checks at safe points in the internal direct execution path.

Recommended because:
- It preserves honest lifecycle semantics
- It fits the current direct-service architecture
- It keeps the slice small enough to verify thoroughly

### Option 3: Hard Interruption

Attempt to interrupt the worker/direct path itself, including Playwright/browser work.

Why not now:
- Too risky
- Would mix cancellation with rollback
- Hard to make honest without a larger orchestration redesign

## Recommended Design

Use **Option 2: Cooperative Cancellation Checks**.

The cancel endpoint will allow `running` Temporal runs, call Temporal cancellation, and rely on explicit safe checkpoints in the direct execution path to stop before irreversible writes.

If cancellation arrives:
- before final business writes, the run should end `cancelled`
- after final writes already completed, the run should remain `completed`

## Cancellation Semantics

- Cancel remains available only for `executionMode=temporal`
- Allowed statuses:
  - `queued`
  - `running`
- Rejected statuses:
  - `completed`
  - `failed`
  - `cancelled`
- `direct` stays non-cancellable

This slice keeps cancellation as a process-control action, not a rollback feature.

## Safe Checkpoints

### Analyze

Check cancellation:
- when the internal direct route begins
- immediately before the service executes the main analysis write path

### Generate Resume

Check cancellation:
- when the internal direct route begins
- immediately before generating and persisting the resume version

### Prefill

Check cancellation:
- when the internal direct route begins
- immediately before calling the worker/browser-backed prefill path
- immediately before persisting final prefill completion state if needed

## API / UI Changes

### API

Keep:
- `POST /workflow-runs/:id/cancel`

Behavior:
- `queued Temporal` -> cancel as today
- `running Temporal` -> allowed, but only stops at the next safe cancellation point

### UI

Update:
- Job Detail workflow-run cards
- Workflow Run Detail page

For running Temporal runs:
- show `Cancel run`
- show explanatory copy:
  - `Stops the run at the next safe cancellation point.`

## Testing Strategy

Follow TDD:

1. Add failing tests for cancel-service validation changes
2. Add failing tests for direct-path cancellation checkpoints
3. Add failing tests for UI affordance changes
4. Implement minimal code to pass
5. Re-run targeted tests, full tests, build, Docker, and runtime checks

## Verification

- `npm test`
- `npm run build`
- `docker compose up --build -d`
- direct negative check:
  - direct run still cannot cancel
- Temporal queued positive check:
  - existing cancel path still works
- Temporal running positive check:
  - run can be cancelled
  - safe checkpoints convert it to `cancelled`
  - completed work is not incorrectly rewritten to `cancelled`
