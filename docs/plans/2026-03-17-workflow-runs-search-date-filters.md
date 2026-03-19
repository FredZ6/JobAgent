# Workflow Runs Search & Date Filters Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add keyword search and created-at date range filters to the global workflow-runs page and API.

**Architecture:** Extend the existing `GET /workflow-runs` endpoint so a single response still powers both summary cards and the filtered run list. Keep filtering lightweight by combining exact filters with a small in-memory search haystack over already joined run context.

**Tech Stack:** Next.js, NestJS, Prisma, Zod, Vitest, Docker Compose

---

### Task 1: Shared Types For New Query Fields

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`

**Steps:**
1. Add failing shared-types tests for `q`, `from`, and `to` on the workflow-runs query schema.
2. Run `npm run test --workspace @openclaw/shared-types -- job.test.ts` and confirm RED.
3. Add the minimal schema fields.
4. Re-run the same test command and confirm GREEN.

### Task 2: API Filtering Logic

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.test.ts`

**Steps:**
1. Add failing API tests for:
   - keyword search matching run and linked context
   - created-at date range filtering
   - summary counts changing with the filtered result set
2. Run `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts` and confirm RED.
3. Add the minimal service implementation.
4. Re-run the same API test command and confirm GREEN.

### Task 3: Web Filters

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Steps:**
1. Extend the client filter type and query builder.
2. Add the keyword input plus `From` and `To` date inputs.
3. Wire them into the existing fetch cycle.
4. Keep the list and summary cards driven by the same response.

### Task 4: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/shared-types -- job.test.ts`
   - `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run runtime checks:
   - `curl -sS 'http://localhost:3001/workflow-runs?q=<term>&from=<date>&to=<date>'`
   - `curl -sS http://localhost:3000/workflow-runs | head -c 400`
4. Update docs and planning artifacts with final Phase 31 status and any runtime notes.
