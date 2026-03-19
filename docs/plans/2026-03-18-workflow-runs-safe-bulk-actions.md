# Workflow Runs Safe Bulk Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add safe, navigation-only bulk actions to `/workflow-runs` so selected runs can be opened in detail or job context without introducing bulk state changes.

**Architecture:** Keep the work entirely in the web app. Add a small helper for bulk-target derivation and guard rails, then wire a bulk action bar into the existing selection toolbar. Use `window.open(...)` only after the helper has validated the current selection.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add Bulk-Action Helper Tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-bulk-actions.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-actions.test.ts`

**Steps:**
1. Write failing tests for:
   - building selected workflow-run detail targets
   - deduplicating selected job targets
   - rejecting selections above the `5 target` limit with the correct message
2. Run `npm run test --workspace @openclaw/web -- workflow-runs-bulk-actions.test.ts` and confirm RED.
3. Write the minimal helper implementation.
4. Re-run the same test command and confirm GREEN.

### Task 2: Wire Bulk Actions Into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Add a bulk action bar that appears only when `selectedCount > 0`.
2. Add:
   - `Open selected run details`
   - `Open selected jobs`
   - `Clear selection`
3. Use the helper to derive URLs or user-facing errors before calling `window.open(...)`.
4. Render clear error text when the user exceeds the `5 target` limit.
5. Keep the action bar visually lightweight and aligned with the current selection toolbar.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- workflow-runs-bulk-actions.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run browser-level checks for:
   - selected-count action bar visibility
   - `Open selected run details`
   - `Open selected jobs`
   - over-limit guard messaging
4. Update docs and planning artifacts with final Phase 36 status and any runtime notes.
