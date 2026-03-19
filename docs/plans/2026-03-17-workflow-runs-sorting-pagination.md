# Workflow Runs Sorting & Pagination Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add sorting and cursor-based pagination to the global workflow-runs API and page.

**Architecture:** Extend the existing `GET /workflow-runs` response so one query still powers both summary cards and rows, while adding page metadata for incremental loading. Keep filtering and summary computation over the full filtered result set, then sort and slice the rows for the current page.

**Tech Stack:** Next.js, NestJS, Prisma, Zod, Vitest, Docker Compose

---

### Task 1: Shared Types For Sort And Pagination

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`

**Steps:**
1. Add failing shared-types tests for:
   - `sortBy`
   - `sortOrder`
   - `cursor`
   - response `pageInfo`
2. Run `npm run test --workspace @openclaw/shared-types -- job.test.ts` and confirm RED.
3. Add the minimal schema/type changes.
4. Re-run the same test command and confirm GREEN.

### Task 2: API Sorting And Cursor Pagination

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.test.ts`

**Steps:**
1. Add failing API tests for:
   - default `createdAt desc`
   - explicit `sortBy/sortOrder`
   - `startedAt`/`completedAt` null handling
   - `cursor` returning the next slice
   - `summary` staying aligned with the full filtered result set
2. Run `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts` and confirm RED.
3. Add the minimal service implementation.
4. Re-run the same API test command and confirm GREEN.

### Task 3: Web Sort Controls And Load More

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Steps:**
1. Extend the client filter/query type with sort and cursor fields.
2. Add `Sort by` and `Order` controls to `/workflow-runs`.
3. Add `Load more` behavior using `pageInfo.nextCursor`.
4. Reset the list when filters, search, dates, or sort values change.
5. Keep summary cards sourced from the first page response.

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
   - `curl -sS 'http://localhost:3001/workflow-runs?sortBy=createdAt&sortOrder=desc&limit=5'`
   - `curl -sS 'http://localhost:3001/workflow-runs?sortBy=status&sortOrder=asc&limit=5'`
   - `curl -sS 'http://localhost:3001/workflow-runs?limit=2'`
   - `curl -sS 'http://localhost:3001/workflow-runs?limit=2&cursor=<nextCursor>'`
   - `curl -sS http://localhost:3000/workflow-runs | head -c 400`
4. Update docs and planning artifacts with final Phase 32 status and runtime notes.
