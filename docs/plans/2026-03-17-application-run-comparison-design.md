# Application Run Comparison Design

## Goal
Help users judge whether a fresh prefill attempt actually improved the result by comparing the latest application run with the immediately previous run on Job Detail.

## Recommended Approach

### Option 1: Add backend diff endpoints and persistence
- Create a dedicated API or stored comparison snapshot.
- Pros: reusable for many surfaces.
- Cons: unnecessary backend complexity for a read-only first pass.

### Option 2: Compare the latest two runs in the web app
- Reuse the application runs already loaded for Job Detail.
- Build a small comparison helper in the frontend.
- Show deltas for filled/failed/unresolved fields, screenshots, logs, and field-level state changes.
- Pros: smallest change, no schema/API work, immediately useful where reruns happen.
- Cons: limited to the currently loaded runs and not yet reusable across every page.

### Option 3: Build a full run-diff experience everywhere
- Add side-by-side comparison on Job Detail, Application Review, and dashboard history.
- Pros: richest UX.
- Cons: too large for the current phase.

### Recommendation
Choose **Option 2**. The main product gap after Phase 19 is understanding whether the newest rerun helped. That can be solved entirely in the existing Job Detail surface.

## Scope

### In scope
- Compare the latest application run with the previous run for the same job.
- Show high-level deltas for:
  - filled fields
  - failed fields
  - unresolved fields
  - screenshots
  - worker log entries
- Show field-level state changes and suggested value differences.
- Add focused frontend tests for the comparison helper.
- Verify the experience against a job that already has multiple runs.

### Out of scope
- Schema changes.
- New API endpoints.
- Arbitrary run-to-run selection.
- Comparison views on dashboard or Application Review.
- Screenshot image diffing.

## Data and API

### Data model
No schema changes.

### API behavior
No API changes. Job Detail already loads enough data to compute a latest-vs-previous comparison client-side.

## UI Behavior

### Job Detail
- If a job has at least two application runs, show a `Run comparison` panel.
- Highlight the newest run versus the previous run.
- Surface summary deltas first, then field-level changes underneath.
- Keep direct links to both runs.

### Comparison rules
- `filled`, `failed`, `unresolved`, and `missing` are treated as explicit states.
- Missing prior fields should still count as a meaningful change.
- If no field-level differences exist, show a clear “no changes detected” note instead of empty space.

## Error Handling
- If fewer than two runs exist, hide the comparison panel.
- If field payloads are partial or malformed, compare whatever is present without throwing.
- Comparison remains read-only and never mutates application records.

## Testing
- Add unit tests for the comparison helper.
- Re-run the workspace and root verification commands.
- Verify Job Detail still loads after Docker rebuild and the job with two runs remains accessible.

## Acceptance Criteria
1. Jobs with at least two application runs show a latest-vs-previous comparison panel.
2. The panel reports high-level deltas for field states, screenshots, and worker logs.
3. Field-level state changes are visible and understandable.
4. Jobs with fewer than two runs do not show a broken or empty comparison UI.
5. Root tests, root build, and Docker verification all pass.
