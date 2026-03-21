# Main Sync And Runtime Brand Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Preserve the valuable Rolecraft workflow-run cleanup work, move implementation onto the latest `main`, and centralize the remaining runtime/config drift.

**Architecture:** Start from clean `main`, selectively restore the useful stash changes, then add a small runtime-config helper layer in `@rolecraft/config` so Temporal toggles/defaults are resolved in one place instead of scattered across services.

**Tech Stack:** Next.js, React, NestJS, Prisma, TypeScript, Vitest

---

### Task 1: Capture branch-sync context and restore only the needed stash work

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/lib/workflow-run-status.ts`
- Modify: `apps/web/src/lib/workflow-run-status.test.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Create: `apps/web/src/components/workflow-run-card.tsx`
- Create: `apps/web/src/lib/brand.ts`
- Create: `apps/web/src/lib/brand.test.ts`

**Steps:**
1. Re-read the stash diff and identify the files worth keeping.
2. Restore only the web/API cleanup changes, not the local planning notes.
3. Make sure the restored code still fits the current `main` data model and UI structure.
4. Run targeted tests for the restored files and confirm the restored cleanup is sound.

### Task 2: Centralize Temporal runtime resolution

**Files:**
- Modify: `packages/config/src/env.ts`
- Modify: `packages/config/src/env.test.ts`
- Modify: `apps/api/src/analysis/analysis.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-retries.service.ts`
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: related tests as needed

**Steps:**
1. Add helper(s) that resolve whether Temporal is enabled and what task queue/defaults to use.
2. Replace direct `process.env.TEMPORAL_ENABLED === "true"` checks with the helper.
3. Replace repeated Temporal task-queue defaults with the helper.
4. Add or update tests so the helper behavior is covered directly.

### Task 3: Verify full repository health on the new branch

**Files:**
- No planned source additions

**Steps:**
1. Run `npm run prisma:generate`
2. Run `npm run test`
3. Run `npm run build`
4. Confirm the branch is clean except for intended changes

### Task 4: Commit and prepare the local sync summary

**Files:**
- Modify: `docs/plans/2026-03-21-main-sync-runtime-brand-cleanup-design.md`
- Modify: `docs/plans/2026-03-21-main-sync-runtime-brand-cleanup.md`

**Steps:**
1. Commit the sync/cleanup changes on the fresh branch.
2. Summarize that the root checkout is now based on the latest `main`.
3. Note that the old prep-branch work was preserved via stash and selectively migrated instead of rebasing the stale branch wholesale.
