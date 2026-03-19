# OpenClaw Job Agent Submission-Safe Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a submission-safe flow so approved applications can move into a final human confirmation step and be recorded as manually submitted or failed.

**Architecture:** Extend the existing `applications` model with submission fields instead of creating a separate submission entity. Add shared schemas, NestJS routes, dashboard stage updates, and a new submission-review page that opens the real apply page but never automates the final submit action.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define shared submission-safe schemas

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/src/application.test.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing schema tests**

Add tests that verify:
- valid submission statuses parse
- application DTOs accept submission fields
- submission-review payloads parse
- dashboard stages accept `ready_to_submit`, `submitted`, and `submit_failed`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the new submission-safe schemas and stage values do not exist yet.

**Step 3: Implement the schemas**

Add Zod schemas and inferred types for:
- submission status enum
- submission review payload
- mark-submitted request
- mark-submit-failed request
- extended application DTO
- extended dashboard stage values

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Add failing API tests for submission-safe rules

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- submission review rejects missing applications
- submission actions reject applications that are not approved for submit
- mark-submitted records status, timestamp, note, and snapshot
- mark-submit-failed records the failed outcome and note
- dashboard stage derivation prefers `submitted` and `submit_failed`, and maps approved applications to `ready_to_submit`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api`
Expected: FAIL because the service behavior does not exist yet.

**Step 3: Keep fixtures minimal**

Use deterministic mocked application records with just enough fields to express the approval and submission transitions clearly.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api`
Expected: PASS.

### Task 3: Extend Prisma and application API behavior

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/applications/applications.controller.ts`

**Step 1: Extend the `Application` model**

Add:
- `submissionStatus`
- `submittedAt`
- `submissionNote`
- `submittedByUser`
- `finalSubmissionSnapshot`

**Step 2: Add application service methods**

Implement:
- `getSubmissionReview`
- `markSubmitted`
- `markSubmitFailed`

Enforce:
- only `approved_for_submit` records can move into submission-safe outcomes
- final submit is never automated

**Step 3: Add controller routes**

Implement:
- `GET /applications/:id/submission-review`
- `POST /applications/:id/mark-submitted`
- `POST /applications/:id/mark-submit-failed`

**Step 4: Verify manually**

Run:
- `curl -sS http://localhost:3001/applications/<id>/submission-review`
- `curl -sS -X POST http://localhost:3001/applications/<id>/mark-submitted -H 'Content-Type: application/json' -d '{"submissionNote":"Submitted manually from Greenhouse."}'`
- `curl -sS -X POST http://localhost:3001/applications/<id>/mark-submit-failed -H 'Content-Type: application/json' -d '{"submissionNote":"Blocked by required question."}'`

Expected: routes return valid JSON and reject invalid transitions.

### Task 4: Extend dashboard stage derivation

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`

**Step 1: Update derived job stages**

Make stage derivation prioritize:
- `submitted`
- `submit_failed`
- `ready_to_submit`

before the older approval-only view.

**Step 2: Update counts and recent activity if needed**

Ensure the overview payload remains stable while reflecting the new stages.

**Step 3: Verify manually**

Run:
- `curl -sS http://localhost:3001/dashboard/overview`

Expected: approved applications can surface as `ready_to_submit`, and marked submissions surface as `submitted` or `submit_failed`.

### Task 5: Add web API helpers and submission-review UI

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Create: `apps/web/src/app/applications/[id]/submission-review/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add failing UI expectations**

Wire the submission-review route and helpers so the web build knows about:
- submission review payloads
- mark-submitted action
- mark-submit-failed action

**Step 2: Implement the new page**

Render:
- job summary
- apply URL
- resume version link
- approval/submission status pills
- unresolved and failed field summaries
- screenshot evidence
- submission note form

Add actions:
- `Open apply page`
- `Mark as submitted`
- `Mark submission failed`

**Step 3: Extend Application Review**

Show a `Go to submission review` action when `approvalStatus = approved_for_submit`.

**Step 4: Verify manually**

Load:
- `http://localhost:3000/applications/<id>/submission-review`

Expected: the page renders and actions update status without any automatic submit behavior.

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
- `curl -sS http://localhost:3001/applications/<id>/submission-review`
- `curl -sS http://localhost:3001/dashboard/overview`
- `curl -sS http://localhost:3000/applications/<id>/submission-review`

Expected: the new submission-safe routes and page are reachable and dashboard state reflects submission outcomes.

**Step 3: Update docs**

Document:
- the new submission-review flow
- the fact that final submit is still manual
- the new dashboard stages
