# Temporal Workflow Observability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expose direct-vs-temporal workflow metadata for analysis, resume generation, and prefill in the existing tracker/history surfaces.

**Architecture:** Add a small orchestration metadata object to newly written event payloads, thread it through Temporal execution paths, extend dashboard timeline DTOs with optional orchestration data, and render that data in the existing dashboard UI.

**Tech Stack:** NestJS, TypeScript, Temporal SDK, Vitest, Next.js, Docker Compose

---

### Task 1: Define orchestration metadata in shared schemas

**Files:**
- Modify: `packages/shared-types/src/dashboard.ts`
- Test: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing test**
- Add a schema test that a timeline item can include orchestration metadata.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types -- dashboard.test.ts`

Expected: FAIL because timeline items do not yet include orchestration metadata.

### Task 2: Add orchestration metadata to dashboard read-models

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Test: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing dashboard test**
- Prove that persisted payload orchestration metadata appears in timeline/history output.

**Step 2: Implement minimal read-model support**
- Parse `payload.orchestration` from job/application milestone events.
- Add optional orchestration data to `recentActivity` and `timeline` items.

**Step 3: Re-run focused tests**

Run:
- `npm run test --workspace @openclaw/shared-types -- dashboard.test.ts`
- `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`

Expected: PASS

### Task 3: Thread orchestration metadata through direct and Temporal paths

**Files:**
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/api/src/analysis/direct-analysis.service.ts`
- Modify: `apps/api/src/resume/direct-resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/internal/internal.controller.ts`
- Modify: `apps/worker-temporal/src/workflows.ts`
- Modify: `apps/worker-temporal/src/activities.ts`

**Step 1: Standardize orchestration metadata**
- Generate workflow metadata at API submission time.
- Pass it through workflow -> activity -> internal route -> direct service.

**Step 2: Persist the metadata**
- Write `executionMode=direct` for direct path events.
- Write `executionMode=temporal` plus workflow fields for workflow-backed events.

**Step 3: Build the updated workspaces**

Run:
- `npm run build --workspace @openclaw/api`
- `npm run build --workspace @openclaw/worker-temporal`

Expected: PASS

### Task 4: Render orchestration metadata in dashboard UI

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`

**Step 1: Add lightweight rendering**
- Show `mode direct` or `mode temporal`.
- When present, show a shortened workflow id in timeline and grouped history cards.

**Step 2: Build web**

Run: `npm run build --workspace @openclaw/web`

Expected: PASS

### Task 5: Verify runtime behavior

**Files:**
- Modify docs if needed after verification

**Step 1: Verify Temporal-backed rows**

Run:
- `TEMPORAL_ENABLED=true docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/analyze`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`
- `curl -sS "http://localhost:3001/dashboard/timeline?limit=10"`

Expected:
- returned timeline includes orchestration metadata for the new rows

### Task 6: Update docs and progress files

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Document the observability layer**
- Record that tracker/history now expose direct-vs-temporal execution metadata.

**Step 2: Re-run final verification**

Run:
- `npm test`
- `npm run build`
- `docker compose ps`
- `curl -sS http://localhost:3001/health`

Expected: all green
