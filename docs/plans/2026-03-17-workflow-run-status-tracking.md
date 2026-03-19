# Workflow Run Status Tracking Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Track analyze, resume-generation, and prefill attempts as explicit workflow runs with durable status transitions and visible summaries in the current tracker surfaces.

**Architecture:** Add a lightweight `WorkflowRun` Prisma model, write runs from both direct and Temporal execution paths, expose run reads through new API routes, and surface the latest run summaries in dashboard and Job Detail. Keep business result tables (`job_analyses`, `resume_versions`, `applications`) unchanged as the source of domain output.

**Tech Stack:** Prisma, NestJS, Next.js, TypeScript, Zod, Temporal SDK, Vitest, Docker Compose

---

### Task 1: Define workflow-run schemas and DTO expectations with tests

**Files:**
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/job.test.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing tests**
- Add a workflow-run schema test covering `kind`, `status`, `executionMode`, and optional workflow metadata.
- Add a dashboard test covering latest analyze/resume/prefill run summaries on a job row.

**Step 2: Run tests to verify they fail**

Run:
- `npm run test --workspace @openclaw/shared-types -- job.test.ts`
- `npm run test --workspace @openclaw/shared-types -- dashboard.test.ts`

Expected: FAIL because workflow-run schemas and dashboard fields do not exist yet.

### Task 2: Add `workflow_runs` persistence

**Files:**
- Modify: `prisma/schema.prisma`

**Step 1: Add model**
- Create `WorkflowRun` with:
  - `jobId`
  - optional `applicationId`
  - optional `resumeVersionId`
  - `kind`
  - `status`
  - `executionMode`
  - optional `workflowId`
  - optional `workflowType`
  - optional `taskQueue`
  - optional `startedAt`
  - optional `completedAt`
  - optional `errorMessage`
  - timestamps

**Step 2: Add indexes**
- At minimum index by `jobId, createdAt` and `status`.

**Step 3: Regenerate Prisma**

Run:
- `npm run prisma:generate`

Expected: PASS

### Task 3: Prove run creation and transitions fail first

**Files:**
- Modify: `apps/api/src/analysis/analysis.service.test.ts`
- Modify: `apps/api/src/resume/resume.service.test.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/jobs/jobs.controller.ts` or new workflow-run service tests if introduced

**Step 1: Write failing tests**
- Direct analyze writes a `running -> completed` workflow run.
- Direct resume writes a `running -> completed` workflow run and attaches `resumeVersionId`.
- Direct prefill writes a `running -> completed` workflow run and attaches `applicationId`.
- Temporal dispatch creates a `queued` run with workflow metadata before execution.
- Run list/detail reads return expected fields.

**Step 2: Run tests to verify they fail**

Run:
- `npm run test --workspace @openclaw/api -- analysis.service.test.ts`
- `npm run test --workspace @openclaw/api -- resume.service.test.ts`
- `npm run test --workspace @openclaw/api -- applications.service.test.ts`

Expected: FAIL because workflow-run persistence and reads do not exist yet.

### Task 4: Implement workflow-run writing helpers

**Files:**
- Create: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/analysis/direct-analysis.service.ts`
- Modify: `apps/api/src/resume/direct-resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/temporal/temporal.service.ts`

**Step 1: Add workflow-run service helpers**
- Create helper methods for:
  - create direct run
  - create Temporal queued run
  - mark running
  - mark completed
  - mark failed

**Step 2: Wire direct paths**
- Direct analyze/resume/prefill create a run at start, then complete/fail it.

**Step 3: Wire Temporal paths**
- API creates `queued` run before workflow submission.
- Pass `workflowRunId` into workflow/activity/internal direct path.
- Direct path upgrades queued run to `running`, then to `completed`/`failed`.

**Step 4: Re-run targeted API tests**

Run:
- `npm run test --workspace @openclaw/api -- analysis.service.test.ts`
- `npm run test --workspace @openclaw/api -- resume.service.test.ts`
- `npm run test --workspace @openclaw/api -- applications.service.test.ts`

Expected: PASS

### Task 5: Expose workflow-run read APIs

**Files:**
- Create: `apps/api/src/workflow-runs/workflow-runs.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/jobs/jobs.controller.ts`
- Modify if needed: `apps/api/src/lib/prisma.service.ts`

**Step 1: Add routes**
- `GET /jobs/:id/workflow-runs`
- `GET /workflow-runs/:id`

**Step 2: Return stable DTOs**
- Include linkage fields, status, execution mode, workflow metadata, timestamps, and errors.

**Step 3: Build API**

Run:
- `npm run build --workspace @openclaw/api`

Expected: PASS

### Task 6: Extend dashboard data and Job Detail UI

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`

**Step 1: Add latest run summaries to dashboard**
- Expose latest analyze/resume/prefill runs per job.

**Step 2: Add fetch helpers**
- Add `fetchJobWorkflowRuns(jobId)` and any updated dashboard typing.

**Step 3: Render Job Detail section**
- Show recent runs with kind, status, execution mode, timestamps, and related application/resume ids when present.

**Step 4: Re-run web/API builds and targeted tests**

Run:
- `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
- `npm run build --workspace @openclaw/api`
- `npm run build --workspace @openclaw/web`

Expected: PASS

### Task 7: Verify direct and Temporal runtime behavior

**Files:**
- Modify if needed: `docker-compose.yml`

**Step 1: Verify direct mode**

Run:
- `docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/analyze`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`
- `curl -sS http://localhost:3001/jobs/<jobId>/workflow-runs`

Expected:
- New workflow runs exist
- direct mode rows show `running -> completed` and `executionMode=direct`

**Step 2: Verify Temporal mode**

Run:
- `env TEMPORAL_ENABLED=true docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/analyze`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/prefill`
- `curl -sS http://localhost:3001/jobs/<jobId>/workflow-runs`

Expected:
- Temporal rows show queued/running/completed transitions
- workflow metadata is present
- successful prefill row links the created application

### Task 8: Update docs and progress files

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Record the new capability**
- Document the workflow-run model and how to inspect it.
- Record any runtime issues and fixes discovered during verification.

**Step 2: Re-run final verification**

Run:
- `npm test`
- `npm run build`
- `docker compose ps`
- `curl -sS http://localhost:3001/health`

Expected: all green
