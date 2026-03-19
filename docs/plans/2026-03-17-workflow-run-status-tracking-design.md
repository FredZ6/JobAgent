# Workflow Run Status Tracking Design

## Goal
Make each analyze, resume-generation, and prefill attempt observable as a first-class run with a lifecycle status, without turning the product into a full workflow admin console.

## Chosen Approach

### Option 1: Keep using milestone events only
- Lowest schema cost.
- Not enough to answer "is this run queued, running, completed, or failed right now?"

### Option 2: Add a lightweight `workflow_runs` table
- Persist one row per analyze, resume-generation, or prefill attempt.
- Store execution mode, run status, timestamps, workflow metadata, and any related application/resume linkage.
- Surface the latest runs in Job Detail and dashboard.
- This is the recommended approach.

### Option 3: Build a richer Temporal control plane now
- More powerful long term.
- Too large for the current phase and mixes status visibility with control actions like retry/cancel.

## Architecture
- Add a new `WorkflowRun` persistence model with:
  - `kind`: `analyze`, `generate_resume`, `prefill`
  - `status`: `queued`, `running`, `completed`, `failed`
  - `executionMode`: `direct`, `temporal`
  - Temporal metadata: `workflowId`, `workflowType`, `taskQueue`
  - linkage fields: `jobId`, optional `applicationId`, optional `resumeVersionId`
  - timestamps: `startedAt`, `completedAt`, plus normal `createdAt` / `updatedAt`
- Direct execution paths create a run row as `running` and close it as `completed` or `failed`.
- Temporal execution paths create a run row as `queued` before workflow submission, then the direct internal execution path upgrades that same row to `running`, `completed`, or `failed`.
- Prefill runs should attach the generated `applicationId` after the application record exists.

## Scope Boundaries
- No cancel/retry controls yet.
- No separate workflow dashboard page.
- No `analysisId` linkage for now; the run will remain job-centric for analysis.
- No attempt-level visualization of Temporal retries or event history.

## API/UI Behavior
- Add:
  - `GET /jobs/:id/workflow-runs`
  - `GET /workflow-runs/:id`
- Extend dashboard overview/job rows with latest run summaries for:
  - analyze
  - generate_resume
  - prefill
- Add a `Workflow runs` section to Job Detail showing the latest attempts with status, execution mode, timestamps, and any related application/resume context.

## Error Handling
- Any failed analyze/resume/prefill attempt should produce a `workflow_run` row with `status=failed` and `errorMessage`.
- Direct-mode failures should still produce a run row even if the business result row was never written.
- Temporal-mode failures should preserve the original `workflowId` metadata on the failed run.
- Older jobs with no run rows should continue to render without fake run history.

## Testing Strategy
- Add shared-type coverage for workflow-run DTOs.
- Add API tests for:
  - direct mode creates `running -> completed`
  - Temporal mode creates `queued` then direct internal execution transitions it
  - prefill success links `applicationId`
  - run listing and run-detail reads
- Add dashboard tests for latest run summaries.
- Add focused web tests only where new pure helpers are introduced.

## Acceptance Criteria
1. Every analyze, resume-generation, and prefill attempt creates a `workflow_run`.
2. Direct mode persists `running -> completed/failed`.
3. Temporal mode persists `queued -> running -> completed/failed`.
4. Successful prefill runs link to the created `applicationId`.
5. `GET /jobs/:id/workflow-runs` and `GET /workflow-runs/:id` return stable data.
6. Job Detail shows recent workflow runs and dashboard exposes the latest run summaries.
7. `npm test`, `npm run build`, and Docker verification stay green in both direct and Temporal modes.
