# Temporal Resume Slice Design

## Goal
Extend the existing Temporal starter slice so resume generation can also run through Temporal, while keeping the current direct path available behind the same feature-flag pattern.

## Chosen Approach

### Option 1: Keep resume generation fully direct
- Lowest implementation effort.
- Leaves orchestration only half-proven and creates two different execution models for adjacent steps.

### Option 2: Add a Temporal-backed resume workflow behind `TEMPORAL_ENABLED`
- Reuse the exact architecture we just introduced for analysis.
- Extract the current direct resume business logic into a reusable service.
- Let `ResumeService` choose between direct execution and Temporal execution.
- This is the recommended approach.

### Option 3: Move resume generation and prefill together
- Broader orchestration coverage.
- Unnecessarily increases runtime and debugging scope because Playwright and approval concerns get pulled in too early.

## Architecture
- `DirectResumeService` becomes the source of truth for the current resume-generation logic.
- `ResumeService` becomes a small dispatcher:
  - `TEMPORAL_ENABLED=false`: call `DirectResumeService.generateResume(jobId)`
  - `TEMPORAL_ENABLED=true`: call `TemporalService.executeGenerateResumeWorkflow(jobId)`
- `worker-temporal` gets:
  - `generateResumeWorkflow(jobId)`
  - `runDirectResumeGeneration(jobId)` activity
- The activity calls a new internal API route:
  - `POST /internal/jobs/:id/generate-resume-direct`
- Public API stays unchanged:
  - `POST /jobs/:id/generate-resume`

## Data and Event Behavior
- No schema change is required.
- Completed resume versions should still be persisted exactly once through the existing direct business logic.
- `resume_generated` job events should continue to be written by the same direct service so tracker/history behavior stays consistent across direct and workflow-backed execution.

## Error Handling
- If `TEMPORAL_ENABLED=true` and Temporal is unavailable, the API should fail clearly rather than silently falling back.
- If the worker cannot reach the internal API route, the workflow should fail and surface an error through the API call.
- If `TEMPORAL_ENABLED=false`, current direct behavior remains unchanged.

## Testing Strategy
- Add a small unit test for `ResumeService` mirroring the analysis tests:
  - Temporal mode calls the Temporal service
  - Direct mode calls the direct service
- Keep existing resume-generation tests green.
- Verify both modes end to end:
  - `TEMPORAL_ENABLED=false` direct resume generation
  - `TEMPORAL_ENABLED=true` workflow-backed resume generation

## Acceptance Criteria
1. `POST /jobs/:id/generate-resume` still works when `TEMPORAL_ENABLED=false`.
2. `POST /jobs/:id/generate-resume` works through Temporal when `TEMPORAL_ENABLED=true`.
3. Resume generation still persists completed `resume_versions` and `resume_generated` milestone events.
4. `worker-temporal` starts and can execute both analysis and resume workflows.
5. `npm test`, `npm run build`, and Docker verification stay green.
