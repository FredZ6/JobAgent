# Global Workflow Runs View Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a global workflow-runs page with lightweight filters and linked run context.

**Architecture:** Reuse the existing `workflow_runs` domain by adding one filtered list endpoint that returns summary counts and linked row context in a single response. Build a simple web page and nav entry on top of that API without adding new workflow controls or real-time behavior.

**Tech Stack:** Next.js, NestJS, Prisma, Zod, Vitest, Docker Compose

---

### Task 1: Shared Types For Global Workflow Runs

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`

**Steps:**
1. Write failing shared-types tests for:
   - workflow-runs list query payload
   - workflow-runs list row payload
   - workflow-runs list response payload
2. Run `npm run test --workspace @openclaw/shared-types -- job.test.ts` and confirm RED.
3. Add the minimal Zod schemas and exported types.
4. Re-run the same test command and confirm GREEN.

### Task 2: API List Endpoint

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.controller.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.test.ts`

**Steps:**
1. Write failing API tests for:
   - filtered global workflow run listing
   - linked job/application/resume context in list rows
   - summary counts derived from the filtered result set
2. Run `npm run test --workspace @openclaw/api -- workflow-runs.service.test.ts` and confirm RED.
3. Add the minimal service/controller implementation for `GET /workflow-runs`.
4. Re-run the same API test command and confirm GREEN.

### Task 3: Web API Wiring And Page

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/components/app-shell.tsx`
- Create: `apps/web/src/app/workflow-runs/page.tsx`

**Steps:**
1. Add the new API client types and fetch helper for `GET /workflow-runs`.
2. Add the nav entry.
3. Build the new page with:
   - summary cards
   - filter controls
   - linked rows
   - empty state
4. Reuse the existing run-detail page for per-run drilldown.

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
   - `curl -sS http://localhost:3001/workflow-runs`
   - `curl -sS http://localhost:3000/workflow-runs | head -c 400`
4. Update docs and planning artifacts with final Phase 30 status and any runtime notes.
