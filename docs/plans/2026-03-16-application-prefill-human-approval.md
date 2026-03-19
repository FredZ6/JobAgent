# OpenClaw Job Agent Application Prefill & Human Approval Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a best-effort application-prefill flow that captures review evidence and stops for explicit human approval before any submission.

**Architecture:** Extend persistence with an `applications` model, expose API endpoints for prefill and review state, and route prefill execution through `worker-playwright`. The worker attempts common-field fills, captures screenshots and structured results, and the web app renders a review page where users can approve for later submission, request revision, or reject.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Playwright, Docker Compose, Zod

---

### Task 1: Define shared schemas for applications and approval requests

**Files:**
- Create: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/application.test.ts`

**Step 1: Write the failing schema tests**

Add tests that verify:
- application payloads accept valid status, approval, field results, and screenshot lists
- invalid approval states are rejected
- approval request payloads require a valid status

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the application schemas do not exist yet.

**Step 3: Implement the schemas**

Add Zod schemas and inferred types for:
- application status
- approval status
- field result entry
- application DTO
- approval update request

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Extend Prisma and seed data for application records

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Step 1: Update the Prisma schema**

Add an `Application` model with relations to `Job` and `ResumeVersion`, plus JSON fields for form snapshots, field results, screenshots, and logs.

**Step 2: Apply the schema**

Run: `docker compose exec api npx prisma db push`
Expected: the database syncs successfully.

**Step 3: Update seed assumptions if needed**

Ensure seeded jobs and resume versions remain compatible with application creation.

### Task 3: Add failing API-side tests for application review logic

**Files:**
- Create: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- a prefill record requires an `applyUrl`
- a prefill record requires a completed `resumeVersion`
- approval updates only accept valid approval states

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api`
Expected: FAIL because the application service does not exist yet.

**Step 3: Implement the minimal service logic**

Create the smallest service behavior needed to satisfy those rules.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api`
Expected: PASS.

### Task 4: Implement API persistence and endpoints for applications

**Files:**
- Create: `apps/api/src/applications/applications.service.ts`
- Create: `apps/api/src/applications/applications.controller.ts`
- Modify: `apps/api/src/jobs/jobs.controller.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Add application creation and read behavior**

Implement:
- `POST /jobs/:id/prefill`
- `GET /jobs/:id/applications`
- `GET /applications/:id`
- `POST /applications/:id/approval`

**Step 2: Keep initial execution synchronous or directly delegated**

For the first cut, wire the API so that it can create an application and invoke the worker path without introducing Temporal.

**Step 3: Verify manually**

Run:
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`
- `curl -sS http://localhost:3001/jobs/<jobId>/applications`
- `curl -sS http://localhost:3001/applications/<applicationId>`
- `curl -sS -X POST http://localhost:3001/applications/<applicationId>/approval -H 'Content-Type: application/json' -d '{"approvalStatus":"needs_revision","reviewNote":"Missing one field"}'`

Expected: each route returns valid persisted JSON and approval updates stick.

### Task 5: Implement the worker-playwright prefill path

**Files:**
- Create: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/index.ts`
- Possibly create: `apps/worker-playwright/src/prefill.test.ts`
- Modify: `apps/worker-playwright/package.json`
- Modify: `apps/worker-playwright/Dockerfile`

**Step 1: Write the failing worker behavior tests**

Cover minimal deterministic logic such as:
- mapping profile/resume fields to suggested form values
- marking unsupported fields honestly

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/worker-playwright`
Expected: FAIL because the prefill logic does not exist yet.

**Step 3: Implement the worker path**

Add code that:
- opens `applyUrl`
- detects common fields
- fills what it can
- captures screenshot files
- returns structured results
- stops before final submit

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/worker-playwright`
Expected: PASS.

### Task 6: Build the Human Approval UI

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Create: `apps/web/src/app/applications/[id]/page.tsx`
- Possibly create: `apps/web/src/components/application-review.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add API client helpers**

Expose:
- `runPrefill`
- `fetchJobApplications`
- `fetchApplication`
- `updateApplicationApproval`

**Step 2: Extend Job Detail**

Add:
- `Run prefill`
- application status list
- link to the latest application review

**Step 3: Build the review page**

Render:
- job and resume summary
- prefill status
- field results
- screenshots
- worker notes
- approval actions

**Step 4: Verify manually**

Run a prefill from Job Detail and confirm the review page renders updated application data.

### Task 7: Final verification and docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`
- `npm run test --workspace @openclaw/worker-playwright`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- create or reuse a job with `applyUrl`
- trigger `POST /jobs/:id/prefill`
- inspect `GET /applications/:id`
- update approval state
- load the Human Approval page in the web app

Expected: the app stores evidence for the prefill attempt, renders review UI, and never submits the application.

**Step 3: Update docs**

Document:
- the new prefill and approval flow
- the fact that final submit is still intentionally blocked
- the limitations of the first best-effort worker implementation
