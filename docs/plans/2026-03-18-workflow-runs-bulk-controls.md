# Workflow Runs Bulk Controls Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add safe bulk retry and bulk cancel controls to `/workflow-runs` using the existing single-run retry/cancel services and the current page-local selection model.

**Architecture:** Keep the current page-local selection and eligibility model, then add two bulk endpoints that reuse the existing single-run retry/cancel services for each eligible run. Return explicit per-run outcomes and aggregate counts so the `/workflow-runs` page can confirm, execute, refresh, and explain partial success without inventing a new workflow-control layer.

**Tech Stack:** Next.js, React, NestJS, Prisma, Zod, Vitest, Docker Compose

---

### Task 1: Add shared bulk-control schemas

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- a valid bulk action request with `runIds`
- rejection of an empty `runIds` array
- a valid bulk action response with per-run results and counts

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`

**Step 3: Add minimal schemas and exports**

Add:
- `workflowRunsBulkActionRequestSchema`
- `workflowRunBulkActionResultSchema`
- `workflowRunsBulkActionResponseSchema`

Export the corresponding inferred types.

**Step 4: Run tests to verify pass**

Run: `npm run test --workspace @openclaw/shared-types -- job.test.ts`

---

### Task 2: Add API-side bulk action service tests

**Files:**
- Create: `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.test.ts`

**Step 1: Write failing tests**

Cover:
- bulk retry acts only on failed runs and skips others
- bulk cancel acts only on queued Temporal runs and skips others
- over-limit eligible subset is rejected
- partial failure returns mixed result rows

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/api -- workflow-run-bulk-actions.service.test.ts`

---

### Task 3: Implement API-side bulk action service

**Files:**
- Create: `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Implement minimal service**

Create a service that:
- accepts raw `runIds`
- validates with shared schemas
- loads runs via `WorkflowRunsService`
- computes eligible vs skipped
- enforces `eligible <= 5`
- calls existing retry/cancel services per eligible run
- returns aggregate counts plus per-run results

**Step 2: Keep validation centralized**

Retry eligibility:
- `status === "failed"`

Cancel eligibility:
- `executionMode === "temporal" && status === "queued"`

**Step 3: Run targeted tests**

Run: `npm run test --workspace @openclaw/api -- workflow-run-bulk-actions.service.test.ts`

---

### Task 4: Expose bulk retry/cancel endpoints

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.controller.ts`

**Step 1: Add routes**

Add:
- `POST /workflow-runs/bulk-retry`
- `POST /workflow-runs/bulk-cancel`

**Step 2: Return typed bulk responses**

Route handlers should call the new bulk action service and return the response directly.

**Step 3: Run focused API tests**

Run:
- `npm run test --workspace @openclaw/api -- workflow-run-bulk-actions.service.test.ts`
- `npm run test --workspace @openclaw/api -- workflow-run-retries.service.test.ts`
- `npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts`

---

### Task 5: Add frontend API helpers and helper tests

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-controls.ts`
- Create: `apps/web/src/lib/workflow-runs-bulk-controls.test.ts`

**Step 1: Write failing helper tests**

Cover:
- confirmation copy for mixed selections
- result-summary copy for mixed success/failure/skip outcomes

**Step 2: Run tests to verify failure**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-controls.test.ts`

**Step 3: Add minimal implementation**

Add:
- API helpers:
  - `bulkRetryWorkflowRuns(runIds)`
  - `bulkCancelWorkflowRuns(runIds)`
- UI helpers for confirmation and result summaries

**Step 4: Run tests to verify pass**

Run: `npm run test --workspace @openclaw/web -- workflow-runs-bulk-controls.test.ts`

---

### Task 6: Wire bulk retry/cancel into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Step 1: Add inline confirm state**

Track:
- pending action type: `retry | cancel | null`
- action loading state
- action result summary/error state

**Step 2: Enable buttons only when eligible counts are within bounds**

Rules:
- enable bulk retry when `retryEligibleCount > 0 && retryEligibleCount <= 5`
- enable bulk cancel when `cancelEligibleCount > 0 && cancelEligibleCount <= 5`

**Step 3: Execute and refresh**

On confirm:
- call the relevant bulk API
- refresh current list view
- clear selection
- show result summary

**Step 4: Preserve existing safe behavior**

Do not change:
- selection reset on query changes
- `Load more`
- safe navigation bulk actions

**Step 5: Run web tests**

Run:
- `npm run test --workspace @openclaw/web -- workflow-runs-eligibility.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-selection.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-actions.test.ts`
- `npm run test --workspace @openclaw/web -- workflow-runs-bulk-controls.test.ts`

---

### Task 7: Verify the whole slice

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run root verification**

Run:
- `npm test`
- `npm run build`

**Step 2: Run Docker verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`

**Step 3: Run runtime API verification**

Verify:
- bulk retry returns per-run success/skip/failure rows
- bulk cancel returns per-run success/skip/failure rows

**Step 4: Run browser-level verification**

Verify on `/workflow-runs`:
- mixed selection confirmation copy
- enabled bulk action buttons only for eligible subsets
- post-action result summary and refreshed list state

**Step 5: Update docs**

Record:
- Phase 38 completion
- new API routes
- bulk control safety boundaries
- any runtime/browser verification caveats
