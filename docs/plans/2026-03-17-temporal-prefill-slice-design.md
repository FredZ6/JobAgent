# Temporal Prefill Slice Design

## Goal
Extend the Temporal starter slice so application prefill can run through Temporal, while preserving the current human-review boundary and the existing direct fallback path.

## Chosen Approach

### Option 1: Keep prefill fully direct
- Lowest implementation effort.
- Leaves orchestration coverage incomplete and keeps a long-running browser-backed step outside the new workflow model.

### Option 2: Route prefill through Temporal behind `TEMPORAL_ENABLED`
- Keep the public API unchanged.
- Reuse the existing API-side prefill logic and `worker-playwright`.
- Add a dedicated Temporal workflow and internal direct-prefill route.
- This is the recommended approach.

### Option 3: Move prefill plus approval/review state transitions into Temporal
- Broader workflow coverage.
- Needlessly mixes durable orchestration with human-in-the-loop product state, making the first orchestration step too wide.

## Architecture
- Keep `ApplicationsService` as the public application service.
- Split `prefillJob(jobId)` into:
  - feature-flag dispatcher
  - `prefillJobDirect(jobId)` for the existing direct prefill logic
- Add internal route:
  - `POST /internal/jobs/:id/prefill-direct`
- Extend `TemporalService` with:
  - `executePrefillJobWorkflow(jobId)`
- Extend `worker-temporal` with:
  - `prefillJobWorkflow(jobId)`
  - `runDirectPrefill(jobId)` activity

## Data and Behavior
- No schema changes are required.
- The workflow-backed path must still:
  - create a new application row
  - transition it from `queued` to `running`
  - call `worker-playwright`
  - persist field results, screenshots, logs, and `prefill_run` event
- Approval, submission review, retry, and reopen behavior remain exactly as they are today.

## Error Handling
- If `TEMPORAL_ENABLED=true` and Temporal is unavailable, `POST /jobs/:id/prefill` should fail clearly.
- If the worker activity cannot reach the internal prefill route, the workflow should fail clearly.
- If `worker-playwright` fails inside the direct prefill path, the same failure behavior should remain visible on the application record.

## Testing Strategy
- Add unit tests for `ApplicationsService.prefillJob(jobId)`:
  - direct mode uses direct prefill path
  - Temporal mode uses Temporal workflow execution
- Keep existing `prefillJob` behavior tests green against `prefillJobDirect(jobId)`.
- Verify both runtime paths:
  - `TEMPORAL_ENABLED=false` direct prefill still works
  - `TEMPORAL_ENABLED=true` workflow-backed prefill works and still produces a real application review record

## Acceptance Criteria
1. `POST /jobs/:id/prefill` still works when `TEMPORAL_ENABLED=false`.
2. `POST /jobs/:id/prefill` works through Temporal when `TEMPORAL_ENABLED=true`.
3. A workflow-backed prefill still creates a fresh application row and persists `prefill_run` evidence.
4. `worker-temporal` now executes analysis, resume, and prefill workflows.
5. `npm test`, `npm run build`, and Docker verification stay green.
