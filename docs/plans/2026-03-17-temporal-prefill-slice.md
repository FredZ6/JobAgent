# Temporal Prefill Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route application prefill through Temporal behind the existing feature flag while keeping the current direct path and human-review flow intact.

**Architecture:** Keep `ApplicationsService` as the public entry point, add a direct-prefill method for the existing behavior, route public prefill requests through `TemporalService` when enabled, and extend the Temporal worker with one new workflow/activity pair that calls an internal direct-prefill route.

**Tech Stack:** NestJS, TypeScript, Temporal SDK, Vitest, Playwright worker, Docker Compose

---

### Task 1: Define prefill dispatcher behavior with tests

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/applications/applications.service.ts`

**Step 1: Write the failing tests**
- Add one test proving `TEMPORAL_ENABLED=true` calls `TemporalService.executePrefillJobWorkflow(jobId)`.
- Add one test proving `TEMPORAL_ENABLED=false` uses the direct prefill path.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`

Expected: FAIL because `ApplicationsService.prefillJob()` does not yet dispatch on the Temporal flag.

### Task 2: Split direct prefill from public dispatch

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`

**Step 1: Extract the current prefill behavior**
- Move the existing prefill implementation into `prefillJobDirect(jobId)`.

**Step 2: Make `prefillJob(jobId)` a dispatcher**
- `TEMPORAL_ENABLED=true` -> `TemporalService.executePrefillJobWorkflow(jobId)`
- else -> `prefillJobDirect(jobId)`

**Step 3: Re-run tests**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`

Expected: PASS

### Task 3: Add internal direct-prefill route

**Files:**
- Modify: `apps/api/src/internal/internal.controller.ts`

**Step 1: Add internal route**
- Add `POST /internal/jobs/:id/prefill-direct`
- Reuse the existing internal token check
- Call `ApplicationsService.prefillJobDirect(id)`

**Step 2: Build API**

Run: `npm run build --workspace @openclaw/api`

Expected: PASS

### Task 4: Extend Temporal client and worker

**Files:**
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/worker-temporal/src/workflows.ts`
- Modify: `apps/worker-temporal/src/activities.ts`

**Step 1: Add API-side workflow execution**
- Add `executePrefillJobWorkflow(jobId)` to `TemporalService`.

**Step 2: Add workflow**
- Add `prefillJobWorkflow(jobId)` beside analysis and resume workflows.

**Step 3: Add activity**
- Add `runDirectPrefill(jobId)` that calls:
  - `POST /internal/jobs/:id/prefill-direct`

**Step 4: Build the updated workspaces**

Run:
- `npm run build --workspace @openclaw/api`
- `npm run build --workspace @openclaw/worker-temporal`

Expected: PASS

### Task 5: Verify direct and Temporal runtime behavior

**Files:**
- Modify if needed: `docker-compose.yml`

**Step 1: Verify direct mode**

Run:
- `docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`

Expected: completed or failed application payload with persisted review evidence

**Step 2: Verify Temporal mode**

Run:
- `TEMPORAL_ENABLED=true docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`
- `docker compose logs worker-temporal --tail=140`

Expected:
- API call returns an application payload
- worker logs show direct prefill activity

### Task 6: Update docs and progress files

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Document the new capability**
- Record that Temporal now backs analysis, resume generation, and prefill behind the feature flag.
- Record any runtime verification issue and the fix.

**Step 2: Re-run final verification**

Run:
- `npm test`
- `npm run build`
- `docker compose ps`
- `curl -sS http://localhost:3001/health`

Expected: all green
