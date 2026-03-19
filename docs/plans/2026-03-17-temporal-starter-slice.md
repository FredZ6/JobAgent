# Temporal Starter Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a minimal Temporal-backed orchestration slice for job analysis without breaking the current synchronous MVP flow.

**Architecture:** Keep the public API unchanged and split analysis execution behind `AnalysisService`. When `TEMPORAL_ENABLED=false`, keep the current direct path. When enabled, call a Temporal workflow that reuses the same direct-analysis business logic through a worker activity.

**Tech Stack:** NestJS, TypeScript, Temporal SDK, Vitest, Docker Compose

---

### Task 1: Define the fallback and workflow behavior with tests

**Files:**
- Create: `apps/api/src/analysis/analysis.service.test.ts`

**Step 1: Write a failing direct-mode test**
- Verify `AnalysisService.analyzeJob()` calls the direct analysis path when `TEMPORAL_ENABLED=false`.

**Step 2: Run the targeted test and watch it fail**

Run:
```bash
npm run test --workspace @openclaw/api -- analysis.service.test.ts
```

**Step 3: Add a failing Temporal-mode test**
- Verify `AnalysisService.analyzeJob()` calls a Temporal client/service when `TEMPORAL_ENABLED=true`.

**Step 4: Re-run the targeted test**

Run:
```bash
npm run test --workspace @openclaw/api -- analysis.service.test.ts
```

### Task 2: Refactor analysis into reusable direct logic

**Files:**
- Modify: `apps/api/src/analysis/analysis.service.ts`
- Create: `apps/api/src/analysis/direct-analysis.service.ts`

**Step 1: Extract current business logic**
- Move the current fetch-profile/settings, LLM call, persistence, and milestone-event write into a reusable service method.

**Step 2: Keep `AnalysisService` small**
- Let `AnalysisService` decide whether to call direct logic or Temporal.

### Task 3: Add Temporal client plumbing to the API

**Files:**
- Create: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`

**Step 1: Add a minimal Temporal service**
- Connect with env-based configuration.
- Expose one method for executing the analysis workflow.

**Step 2: Register it with Nest**
- Keep wiring explicit and small.

### Task 4: Add the worker-temporal app

**Files:**
- Create: `apps/worker-temporal/package.json`
- Create: `apps/worker-temporal/tsconfig.json`
- Create: `apps/worker-temporal/Dockerfile`
- Create: `apps/worker-temporal/src/index.ts`
- Create: `apps/worker-temporal/src/workflows.ts`
- Create: `apps/worker-temporal/src/activities.ts`

**Step 1: Wire a single task queue**
- Register `AnalyzeJobWorkflow`.

**Step 2: Reuse API-side direct analysis**
- Call the reusable direct-analysis logic from the activity.

### Task 5: Add Docker and env support

**Files:**
- Modify: `docker-compose.yml`
- Modify: `.env.example`
- Modify: `README.md`

**Step 1: Add Temporal services**
- Add a local Temporal dev service and UI only if lightweight enough; otherwise add only the required server pieces for the starter slice.

**Step 2: Add `worker-temporal`**
- Wire the worker to the same workspace and env defaults.

### Task 6: Verify and document

**Files:**
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run targeted tests**

Run:
```bash
npm run test --workspace @openclaw/api -- analysis.service.test.ts
npm run build --workspace @openclaw/worker-temporal
```

**Step 2: Run workspace verification**

Run:
```bash
npm test
npm run build
```

**Step 3: Run Docker verification**

Run:
```bash
docker compose up --build -d
curl -sS http://localhost:3001/health
curl -sS -X POST http://localhost:3001/jobs/<job-id>/analyze
```

**Step 4: Verify both modes**
- Verify direct mode with `TEMPORAL_ENABLED=false`.
- Verify workflow mode with `TEMPORAL_ENABLED=true`.

**Step 5: Update docs**
- Mark the phase complete.
- Record that Temporal now backs job analysis behind a feature flag.
