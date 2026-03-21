# Workflow Run Cleanup Finish Design

## Goal

Finish the partially migrated Rolecraft workflow-run cleanup so the shared workflow-run card work is fully closed out rather than only partially ported from the old prep branch.

## Scope

- Restore the original cleanup design/plan documents into the current branch
- Add page-level coverage for both workflow-run card integration points:
  - `/workflow-runs`
  - `/jobs/[id]`
- Tighten the shared `WorkflowRunCard` layout so long summaries and action rows stay visually stable

## Non-Goals

- No new workflow-run product features
- No new bulk-action behavior
- No new backend schema or API changes
- No restoration of local-only planning artifacts like `progress.md`, `task_plan.md`, or `findings.md`

## Problem

The earlier sync work intentionally migrated the highest-value pieces of the old stash:

- shared Rolecraft brand copy
- shared workflow-run card component
- worker JSON error extraction
- Temporal runtime helper cleanup

That fixed the branch-sync and runtime drift issues, but it did **not** fully close out the original workflow-run cleanup effort. The remaining gaps are:

1. the original cleanup design/plan docs were left only in stash history
2. the shared card is used in pages, but the pages do not yet have direct integration tests for that change
3. the card layout is improved, but not yet intentionally tightened for long summary/action stability

## Approach Options

### Option 1: Leave the current code as-is

Pros:
- no more churn

Cons:
- still leaves the cleanup only partially finished
- no page-level proof that the shared card integration is stable
- the original cleanup docs remain orphaned in stash history

### Option 2: Finish the cleanup incrementally in-place

Pros:
- smallest change set
- closes the exact remaining gaps
- keeps the cleanup additive and UI-local

Cons:
- requires a small extra test/doc pass

### Option 3: Re-open the entire workflow-run redesign

Pros:
- could produce a more ambitious visual refresh

Cons:
- expands far beyond the original unfinished scope
- adds unnecessary regression risk

## Recommended Design

Use **Option 2: Finish the cleanup incrementally in-place**.

### Documentation

- Restore:
  - `docs/plans/2026-03-19-rolecraft-workflow-run-card-cleanup-design.md`
  - `docs/plans/2026-03-19-rolecraft-workflow-run-card-cleanup.md`
- Keep them as historical design/planning artifacts for the cleanup that was originally started on the old branch

### Page-Level Verification

Add focused tests that verify the shared card is really wired into the two real UI entry points.

#### `/workflow-runs`

Verify:
- runs render through the shared card layout
- selection controls still work
- the expected action links remain visible

#### `/jobs/[id]`

Verify:
- workflow runs render through the shared card layout
- failed runs still expose retry
- running runs still expose cancel

These tests should validate the cleanup outcome, not duplicate all page behavior.

### Style Tightening

Adjust `WorkflowRunCard` styling only enough to make it more resilient:

- separate summary/meta/actions into clearer vertical regions
- keep the action row visually stable
- avoid long summaries making the card feel collapsed or chaotic

This should remain a light layout polish, not a redesign.

## Testing

Use TDD:

1. add failing page-level tests
2. run targeted tests and confirm RED
3. add the minimal layout/style adjustments
4. rerun targeted tests to confirm GREEN
5. rerun `npm run test`
6. rerun `npm run build`

## Acceptance Criteria

1. The original workflow-run cleanup docs are restored into the branch
2. `/workflow-runs` has direct page-level test coverage for shared workflow-run cards
3. `/jobs/[id]` has direct page-level test coverage for shared workflow-run cards
4. `WorkflowRunCard` layout is tightened without redesigning the page
5. `npm run test` passes
6. `npm run build` passes
