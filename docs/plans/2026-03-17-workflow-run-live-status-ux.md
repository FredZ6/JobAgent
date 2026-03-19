# Workflow Run Live Status UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make workflow-run state easier to understand and keep Job Detail in sync while queued/running work is still in progress.

**Architecture:** Add a small frontend presentation helper for workflow-run labels and helper text, then use it in Job Detail and dashboard summaries. Add lightweight polling in Job Detail that refreshes job detail, applications, and workflow runs only while at least one run is active.

**Tech Stack:** Next.js, React, TypeScript, Vitest, NestJS APIs, Docker Compose

---

### Task 1: Add workflow-run UX helpers

**Files:**
- Create: `apps/web/src/lib/workflow-run-status.ts`
- Create: `apps/web/src/lib/workflow-run-status.test.ts`

**Step 1: Write the failing test**

Add tests for:
- queued Temporal label and helper copy
- running direct vs running temporal copy
- cancelled copy
- dashboard summary copy
- active-run detection

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/web -- workflow-run-status.test.ts`
Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

- Add a helper that:
  - detects whether a run is active
  - returns a presentation label
  - returns helper/next-step copy
  - returns compact dashboard summary text

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/web -- workflow-run-status.test.ts`
Expected: PASS

### Task 2: Wire Job Detail live-status behavior

**Files:**
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Test: `apps/web/src/lib/workflow-run-status.test.ts`

**Step 1: Keep the TDD helper tests green**

Run: `npm run test --workspace @openclaw/web -- workflow-run-status.test.ts`
Expected: PASS

**Step 2: Write minimal implementation**

- Add a refresh helper for:
  - job detail
  - job applications
  - job workflow runs
- Add active-run polling with a 3s interval
- Start polling only when there is at least one `queued/running` run
- Stop polling automatically when all runs are terminal
- Render clearer state-specific copy per run

**Step 3: Run build to verify it passes**

Run: `npm run build --workspace @openclaw/web`
Expected: PASS

### Task 3: Improve dashboard latest-run summaries

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/lib/workflow-run-status.ts`

**Step 1: Write the failing test**

Extend the helper test with compact summary expectations used by dashboard cards.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/web -- workflow-run-status.test.ts`
Expected: FAIL until the summary mapping is implemented.

**Step 3: Write minimal implementation**

- Reuse the helper in dashboard job cards
- Replace raw `status · executionMode` text with compact readable summaries

**Step 4: Run verification**

Run:
- `npm run test --workspace @openclaw/web -- workflow-run-status.test.ts`
- `npm run build --workspace @openclaw/web`

Expected: PASS

### Task 4: Verify and document the slice

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run root verification**

Run:
- `npm test`
- `npm run build`

Expected: PASS

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`
- `curl -sS http://localhost:3000/jobs/<job-id> | head -c 300`

Optional live-state check:
- trigger a queued/running workflow run
- verify Job Detail continues to return HTML and that the page has the new live-status copy paths available

Expected:
- root verification stays green
- default stack stays healthy
- Job Detail route remains accessible
