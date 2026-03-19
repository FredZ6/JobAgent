# Workflow Run Detail & History Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add lifecycle history and a dedicated detail page for workflow runs.

**Architecture:** Extend the workflow-run model with a lightweight event table and write lifecycle rows at the same points where run state changes. Expose those records via small API additions, then add a dedicated web detail page that reuses the existing run controls.

**Tech Stack:** Prisma, NestJS, Next.js, TypeScript, Vitest, Docker Compose

---

### Task 1: Add shared schemas for workflow-run events and detail payloads

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`

**Step 1: Write the failing test**

Add tests that:
- parse a valid workflow-run event
- parse an expanded workflow-run detail payload with linked records and retry lineage

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`
Expected: FAIL because the new schemas do not exist yet.

**Step 3: Write minimal implementation**

- Add event-type schema
- Add workflow-run event schema
- Add workflow-run detail schema

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`
Expected: PASS

### Task 2: Persist workflow-run lifecycle events in the API

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Create: `apps/api/src/workflow-runs/workflow-runs.service.test.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-retries.service.ts`

**Step 1: Write the failing test**

Add tests that:
- `createTemporalQueuedRun()` writes `run_queued`
- `markCompleted()` writes `run_completed`
- retry writes `run_retried` on the original failed run

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts workflow-run-retries.service.test.ts`
Expected: FAIL because lifecycle events are not written yet.

**Step 3: Write minimal implementation**

- Add `WorkflowRunEvent` model and relation
- Add a small event-recording helper in `WorkflowRunsService`
- Write lifecycle events at run create/update points
- Write `run_retried` in retry flow

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts workflow-run-retries.service.test.ts`
Expected: PASS

### Task 3: Expose workflow-run detail and events

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.controller.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/web/src/lib/api.ts`

**Step 1: Write the failing test**

Extend service tests for event listing and detail expansion where helpful.

**Step 2: Write minimal implementation**

- Add `listWorkflowRunEvents(id)`
- Expand `GET /workflow-runs/:id`
- Add `GET /workflow-runs/:id/events`
- Add web API helpers/types for both

**Step 3: Run verification**

Run:
- `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts`
- `npm run build --workspace @openclaw/api`

Expected: PASS

### Task 4: Add the web detail page

**Files:**
- Create: `apps/web/src/app/workflow-runs/[id]/page.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/lib/workflow-run-status.ts`

**Step 1: Write minimal implementation**

- Add run-detail page sections:
  - summary
  - linked records
  - retry lineage
  - lifecycle history
  - actions
- Add `Open run detail` from Job Detail cards

**Step 2: Run build to verify it passes**

Run: `npm run build --workspace @openclaw/web`
Expected: PASS

### Task 5: Verify and document the slice

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
- `curl -sS http://localhost:3001/workflow-runs/<run-id>`
- `curl -sS http://localhost:3001/workflow-runs/<run-id>/events`
- `curl -sS http://localhost:3000/workflow-runs/<run-id> | head -c 300`

Expected:
- API returns linked run context
- events route returns lifecycle history
- run-detail page returns HTML
