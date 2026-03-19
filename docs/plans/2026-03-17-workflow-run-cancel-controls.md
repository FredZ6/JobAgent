# Workflow Run Cancel Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a safe cancel action for queued Temporal workflow runs and surface it on Job Detail.

**Architecture:** Extend the workflow-run state model with a `cancelled` terminal status, add a narrow cancel API that only targets queued Temporal runs, and wire Job Detail to call it and refresh the current run list. Keep cancellation process-only: it must not roll back persisted business records.

**Tech Stack:** NestJS, Prisma, Temporal client, Next.js, TypeScript, Vitest, Docker Compose

---

### Task 1: Extend workflow-run status contracts

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`
- Modify: `prisma/schema.prisma`

**Step 1: Write the failing test**

Add a schema test that parses a workflow run with `status: "cancelled"`.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`
Expected: FAIL because `cancelled` is not yet allowed.

**Step 3: Write minimal implementation**

- Add `cancelled` to `workflowRunStatusSchema`
- Keep `completedAt` nullable and reuse it for terminal timestamps
- Update Prisma model comments/enum-like usage as needed

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`
Expected: PASS

### Task 2: Add cancel support in the API

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.controller.ts`
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Create: `apps/api/src/workflow-runs/workflow-run-cancel.service.ts`
- Create: `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Write the failing test**

Add tests for:
- cancelling a queued Temporal run succeeds
- cancelling a direct run fails
- cancelling a non-queued run fails

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts`
Expected: FAIL because the cancel service does not exist yet.

**Step 3: Write minimal implementation**

- Add `markCancelled(id)`
- Add a small cancel service that:
  - loads the run
  - validates queued Temporal semantics
  - calls Temporal cancellation by `workflowId`
  - marks the run `cancelled`
- Add `POST /workflow-runs/:id/cancel`

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts`
Expected: PASS

### Task 3: Add the Job Detail cancel control

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`

**Step 1: Write the failing test**

Keep this lightweight: rely on type/build validation plus existing page route verification.

**Step 2: Write minimal implementation**

- Add `cancelWorkflowRun(id)` API helper
- Show `Cancel run` only for `temporal + queued`
- Refresh workflow runs after cancel
- Show a clear success/error message

**Step 3: Run build to verify it passes**

Run: `npm run build --workspace @openclaw/web`
Expected: PASS

### Task 4: Verify the full slice

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run targeted verification**

Run:
- `npm run test --workspace @openclaw/shared-types -- job.test.ts`
- `npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts`

Expected: PASS

**Step 2: Run root verification**

Run:
- `npm test`
- `npm run build`

Expected: PASS

**Step 3: Run runtime verification**

Run:
- `TEMPORAL_ENABLED=true docker compose up --build -d --force-recreate`
- create or identify a queued Temporal run
- `POST /workflow-runs/:id/cancel`
- `GET /jobs/:id/workflow-runs`
- restore default with `docker compose up --build -d --force-recreate`

Expected:
- queued Temporal run becomes `cancelled`
- Job Detail continues to load
- final stack ends with `TEMPORAL_ENABLED=false`
