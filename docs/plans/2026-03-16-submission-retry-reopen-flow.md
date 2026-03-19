# OpenClaw Job Agent Submission Retry & Reopen Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add recovery actions so a manually submitted or failed application can move back into a retry-ready state while preserving a lightweight history.

**Architecture:** Keep `applications` as the current-state record and introduce a small `application_events` table for recovery history. Extend the API with reopen, retry-ready, and event-list routes, then expose those actions in the Submission Review page and reflect them in dashboard activity.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define shared event and recovery schemas

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/src/application.test.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing schema tests**

Add tests that verify:
- application event rows parse
- reopen and retry-ready request payloads parse
- recent activity accepts recovery event types

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the recovery schemas and event types do not exist yet.

**Step 3: Implement the schemas**

Add:
- application event schema
- reopen request schema
- retry-ready request schema
- recovery event types in dashboard recent activity

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Add failing API tests for recovery transitions

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- `submitted` can reopen to `ready_to_submit`
- `submit_failed` can move to `ready_to_submit`
- invalid recovery transitions are rejected
- recovery actions write event rows
- dashboard recent activity includes the recovery events

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api`
Expected: FAIL because recovery methods and event persistence do not exist yet.

**Step 3: Keep fixtures minimal**

Use explicit mocked application states and event rows so the transition rules stay obvious.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api`
Expected: PASS.

### Task 3: Add Prisma event storage and API recovery methods

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/applications/applications.controller.ts`

**Step 1: Add `ApplicationEvent`**

Create a small table with:
- `applicationId`
- `type`
- `payload`
- `createdAt`

**Step 2: Add recovery methods**

Implement:
- `reopenSubmission`
- `markRetryReady`
- `listEvents`

Rules:
- reopen only when current submission state is `submitted`
- retry-ready only when current submission state is `submit_failed`
- each action appends an event row

**Step 3: Add routes**

Implement:
- `POST /applications/:id/reopen-submission`
- `POST /applications/:id/mark-retry-ready`
- `GET /applications/:id/events`

**Step 4: Verify manually**

Run:
- `curl -sS -X POST http://localhost:3001/applications/<id>/reopen-submission -H 'Content-Type: application/json' -d '{"note":"Need to re-check before resubmitting."}'`
- `curl -sS -X POST http://localhost:3001/applications/<id>/mark-retry-ready -H 'Content-Type: application/json' -d '{"note":"External blocker resolved."}'`
- `curl -sS http://localhost:3001/applications/<id>/events`

Expected: valid transitions succeed, invalid ones reject, and event rows are returned.

### Task 4: Extend dashboard activity for recovery events

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`

**Step 1: Add recovery activity mapping**

Include:
- `submission_reopened`
- `submission_retry_ready`

in recent activity when those event rows exist.

**Step 2: Keep stage derivation simple**

No new stage values are needed; both recovery flows end at `ready_to_submit`.

**Step 3: Verify manually**

Run:
- `curl -sS http://localhost:3001/dashboard/overview`

Expected: recent activity includes recovery actions after they occur.

### Task 5: Add recovery controls and history to the Submission Review page

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add API helpers**

Expose:
- `fetchApplicationEvents`
- `reopenApplicationSubmission`
- `markApplicationRetryReady`

**Step 2: Implement recovery controls**

On Submission Review:
- show `Reopen submission` for `submitted`
- show `Mark ready to retry` for `submit_failed`

**Step 3: Add history UI**

Render recent event rows with timestamps and short labels.

**Step 4: Verify manually**

Load:
- `http://localhost:3000/applications/<id>/submission-review`

Expected: the correct recovery action shows for the current state and the event list renders.

### Task 6: Final verification and docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- transition a real application through reopen or retry-ready
- `curl -sS http://localhost:3001/applications/<id>/events`
- `curl -sS http://localhost:3001/dashboard/overview`
- `curl -sS http://localhost:3000/applications/<id>/submission-review`

Expected: recovery actions succeed, events are stored, and dashboard activity reflects them.

**Step 3: Update docs**

Document:
- the new recovery actions
- the lightweight event history
- the fact that recovery still never triggers automatic submission
