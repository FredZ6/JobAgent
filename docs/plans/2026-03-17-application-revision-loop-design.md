# Application Revision Loop Design

## Goal
Let users safely run a new prefill attempt after a `needs_revision` outcome or a profile/resume update, without overwriting previous application evidence.

## Recommended Approach

### Option 1: Reuse the existing application row
- Re-run prefill into the same `applications` record.
- Pros: no extra rows.
- Cons: destroys evidence and makes audit/history less trustworthy.

### Option 2: Create a new application run each time
- Keep every prefill attempt as its own `applications` row.
- Reuse the current `POST /jobs/:id/prefill` flow.
- Make the UI explicit that “rerun” means “create a new prefill attempt”.
- Pros: strongest audit story, minimal backend change, naturally fits current dashboard/history.
- Cons: users need clearer UI to understand latest vs older attempts.

### Option 3: Add a separate revision table
- Model revisions independently from application runs.
- Pros: most expressive long term.
- Cons: unnecessary complexity for the current MVP.

### Recommendation
Choose **Option 2**. The backend already models prefill attempts as separate application records, so the real gap is discoverability and revision-oriented UX, not data structure.

## Scope

### In scope
- Make “run another prefill” an explicit workflow on:
  - Job Detail
  - Application Review
- Clarify in the UI that reruns create a new application record.
- Keep the latest run visually distinct from history.
- Ensure reruns keep using the latest completed resume version for the job.
- Add tests and runtime verification that a second run creates a second row instead of overwriting the first.

### Out of scope
- Editing a prior run in place.
- Diffing runs side by side.
- Auto-detecting whether profile/resume changed enough to require rerun.
- Rebinding an old run to a new resume version.

## Data and API

### Data model
No schema changes.

### API behavior
- Continue using `POST /jobs/:id/prefill`.
- Each call creates a fresh `applications` row.
- The latest completed resume version for the job remains the resume source.

## UI Behavior

### Job Detail
- Keep `Run prefill`.
- If there are existing runs, update copy to make it clear a new run will be created.
- Keep the newest run prominent and older runs below it.

### Application Review
- Add a `Run another prefill` action that links back to the parent job or triggers a new run from the same surface.
- If the current run is `needs_revision`, the rerun path should feel like the expected next step.

## Error Handling
- If no completed resume version exists, reruns still fail with the current API error.
- Failed reruns should still create their own failed application row when the failure happens after creation.
- Older runs remain untouched in every case.

## Testing
- Job/application tests should verify repeated prefill calls create multiple rows.
- UI tests are still out of scope, but route/build verification should cover the new controls.

## Acceptance Criteria
1. Running prefill again creates a second application row for the same job.
2. The first row remains unchanged.
3. Job Detail clearly distinguishes latest run from history.
4. Application Review exposes a clear rerun path.
5. Root tests, root build, and Docker verification all pass.
