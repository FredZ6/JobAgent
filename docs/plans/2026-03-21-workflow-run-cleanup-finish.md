# Workflow Run Cleanup Finish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fully close out the partially migrated Rolecraft workflow-run cleanup with page-level tests, small layout tightening, and restored cleanup docs.

**Architecture:** Keep the work additive and UI-local. Restore the historical cleanup docs, add focused page integration tests for the shared workflow-run card, then make the smallest CSS/component adjustments needed to stabilize summary/action layout.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest

---

### Task 1: Restore the historical workflow-run cleanup docs

**Files:**
- Create: `docs/plans/2026-03-19-rolecraft-workflow-run-card-cleanup-design.md`
- Create: `docs/plans/2026-03-19-rolecraft-workflow-run-card-cleanup.md`

**Steps:**
1. Restore the original cleanup design doc from stash history.
2. Restore the original cleanup implementation plan from stash history.
3. Verify both files exist in the current branch and keep their historical context intact.

### Task 2: Add failing page-level tests for workflow-run card usage

**Files:**
- Create: `apps/web/src/app/workflow-runs/page-client.test.tsx`
- Create: `apps/web/src/app/jobs/[id]/page-client.test.tsx`

**Steps:**
1. Write a failing test for `/workflow-runs` that proves shared workflow-run cards render with selection controls and action links.
2. Run the test and confirm it fails for the expected reason.
3. Write a failing test for `/jobs/[id]` that proves shared workflow-run cards still expose retry/cancel controls.
4. Run the test and confirm it fails for the expected reason.

### Task 3: Tighten the shared workflow-run card layout

**Files:**
- Modify: `apps/web/src/components/workflow-run-card.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Make the card layout more intentionally sectionalized for summary, metadata, and actions.
2. Ensure the action row remains visually stable even with long summary text.
3. Keep the change minimal and avoid redesigning surrounding pages.
4. Re-run the new page-level tests and confirm they pass.

### Task 4: Run targeted and full verification

**Files:**
- No new source files expected

**Steps:**
1. Run targeted web tests for:
   - `apps/web/src/app/workflow-runs/page-client.test.tsx`
   - `apps/web/src/app/jobs/[id]/page-client.test.tsx`
2. Run `npm run test`
3. Run `npm run build`
4. Confirm the branch is clean except for the intended cleanup changes.

### Task 5: Commit the finished cleanup

**Files:**
- No new source files expected

**Steps:**
1. Commit the restored docs, page-level tests, and final workflow-run card polish.
2. Summarize that the workflow-run cleanup is now fully closed out rather than partially migrated.
