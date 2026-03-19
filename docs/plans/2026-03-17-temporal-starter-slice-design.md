# Temporal Starter Slice Design

## Goal
Introduce a small, real workflow-orchestration slice with Temporal by moving job analysis into a durable workflow while keeping the current synchronous path as a safe fallback.

## Recommended Approach

### Option 1: Scaffold Temporal only
- Add `worker-temporal` and Temporal services, but do not route real work through them yet.
- Pros: lowest risk.
- Cons: low product value and no proof that orchestration works.

### Option 2: Route job analysis through Temporal behind a feature flag
- Add `worker-temporal`.
- Add a small Temporal client in the API.
- Implement `AnalyzeJobWorkflow`.
- Keep `POST /jobs/:id/analyze` unchanged for callers.
- Use `TEMPORAL_ENABLED=true` to switch on workflow execution and keep a direct fallback when disabled.
- Pros: proves durable orchestration with bounded scope and little frontend churn.
- Cons: adds a new service boundary and dependency installation.

### Option 3: Move analysis, resume generation, and prefill into Temporal together
- Pros: closer to the eventual target architecture.
- Cons: far too much surface area for one phase and likely to destabilize the current MVP.

### Recommendation
Choose **Option 2**. Job analysis is the safest first workflow because it is already a backend-only operation with a clear input/output contract and no browser automation edge cases.

## Scope

### In scope
- Add `apps/worker-temporal`.
- Add Temporal services to `docker-compose.yml`.
- Add a small API-side Temporal client/service.
- Implement `AnalyzeJobWorkflow`.
- Route `POST /jobs/:id/analyze` through Temporal when `TEMPORAL_ENABLED=true`.
- Keep the current direct analysis path when `TEMPORAL_ENABLED=false`.
- Add tests for both paths.

### Out of scope
- Resume-generation workflow.
- Prefill workflow.
- Pause/resume UI.
- Workflow dashboard UI.
- Migration of older analysis history.

## Architecture

### API behavior
- `JobsController` continues calling `AnalysisService.analyzeJob(id)`.
- `AnalysisService` becomes a small orchestration boundary:
  - direct mode: current behavior
  - Temporal mode: start/execute `AnalyzeJobWorkflow`

### Worker behavior
- `worker-temporal` runs a single worker.
- The worker registers:
  - `AnalyzeJobWorkflow`
  - one analysis activity that reuses the existing direct analysis logic

### Reuse strategy
- Move the existing “perform and persist analysis” logic into a reusable direct-analysis method.
- Both the synchronous API path and the Temporal activity call that same method.
- This keeps business logic single-sourced and reduces drift.

## Configuration

Add these environment variables:

- `TEMPORAL_ENABLED=false`
- `TEMPORAL_ADDRESS=temporal:7233`
- `TEMPORAL_NAMESPACE=default`
- `TEMPORAL_TASK_QUEUE=openclaw-analysis`

When Temporal is disabled:
- the current system behavior stays intact
- Docker can still run without operators using the workflow path

## Error Handling

- If Temporal is enabled but the client cannot connect, `POST /jobs/:id/analyze` should fail clearly rather than silently falling back.
- If the workflow fails, the request should surface the failure.
- If Temporal is disabled, the current direct path remains the source of truth.

## Testing

- Add unit tests for `AnalysisService`:
  - direct mode calls the existing analysis path
  - Temporal mode calls the workflow client
- Build and test the new `worker-temporal` workspace.
- Verify the stack in Docker with:
  - `TEMPORAL_ENABLED=false` direct analysis still works
  - `TEMPORAL_ENABLED=true` workflow-backed analysis works

## Acceptance Criteria
1. A new `worker-temporal` app exists and starts successfully in Docker.
2. `POST /jobs/:id/analyze` still works when `TEMPORAL_ENABLED=false`.
3. `POST /jobs/:id/analyze` works through Temporal when `TEMPORAL_ENABLED=true`.
4. Existing callers do not need a new endpoint or frontend change.
5. Root tests, root build, and Docker verification all pass.
