# Temporal Resume Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Route resume generation through Temporal behind the existing feature flag while keeping the current direct path as a safe fallback.

**Architecture:** Extract the current resume-generation business logic into a new `DirectResumeService`, keep `ResumeService` as the feature-flag switch, and extend the existing Temporal worker with one new workflow and one new activity that call an internal direct-generation route.

**Tech Stack:** NestJS, TypeScript, Temporal SDK, Vitest, Docker Compose

---

### Task 1: Define dispatcher behavior with tests

**Files:**
- Create: `apps/api/src/resume/resume.service.test.ts`
- Modify: `apps/api/src/resume/resume.service.ts`

**Step 1: Write the failing test**
- Add one test proving `TEMPORAL_ENABLED=true` calls `TemporalService.executeGenerateResumeWorkflow(jobId)`.
- Add one test proving `TEMPORAL_ENABLED=false` keeps calling the direct resume path.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- resume.service.test.ts`

Expected: FAIL because the current `ResumeService` does not yet depend on a direct service plus Temporal dispatcher logic.

### Task 2: Extract direct resume generation

**Files:**
- Create: `apps/api/src/resume/direct-resume.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Move the existing direct business logic**
- Copy the current `ResumeService.generateResume()` implementation into `DirectResumeService.generateResume(jobId)`.

**Step 2: Minimize `ResumeService`**
- Turn `ResumeService` into a dispatcher:
  - direct mode -> `DirectResumeService.generateResume(jobId)`
  - Temporal mode -> `TemporalService.executeGenerateResumeWorkflow(jobId)`

**Step 3: Register providers**
- Add `DirectResumeService` to `AppModule`.

**Step 4: Run tests**

Run: `npm run test --workspace @openclaw/api -- resume.service.test.ts`

Expected: PASS

### Task 3: Add internal direct-generation route

**Files:**
- Modify: `apps/api/src/internal/internal.controller.ts`

**Step 1: Add a new internal route**
- Add `POST /internal/jobs/:id/generate-resume-direct`
- Reuse the same internal token header guard as the analysis route.
- Call `DirectResumeService.generateResume(id)`.

**Step 2: Run focused API tests/build**

Run: `npm run build --workspace @openclaw/api`

Expected: PASS

### Task 4: Extend Temporal client and worker

**Files:**
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/worker-temporal/src/workflows.ts`
- Modify: `apps/worker-temporal/src/activities.ts`

**Step 1: Add API-side workflow execution**
- Add `executeGenerateResumeWorkflow(jobId)` in `TemporalService`.

**Step 2: Add workflow**
- Add `generateResumeWorkflow(jobId)` beside `analyzeJobWorkflow(jobId)`.

**Step 3: Add activity**
- Add `runDirectResumeGeneration(jobId)` that calls:
  - `POST /internal/jobs/:id/generate-resume-direct`

**Step 4: Build the updated workspaces**

Run:
- `npm run build --workspace @openclaw/api`
- `npm run build --workspace @openclaw/worker-temporal`

Expected: PASS

### Task 5: Verify direct and Temporal runtime behavior

**Files:**
- Modify if needed: `docker-compose.yml`
- Modify if needed: `.env.example`

**Step 1: Verify direct mode**

Run:
- `docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`

Expected: completed resume version JSON

**Step 2: Verify Temporal mode**

Run:
- `TEMPORAL_ENABLED=true docker compose up --build -d`
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`
- `docker compose logs worker-temporal --tail=120`

Expected:
- API call returns completed resume version JSON
- worker logs show direct resume generation activity

### Task 6: Update docs and progress files

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Document the new capability**
- Record that Temporal now backs both analysis and resume generation behind the feature flag.
- Record any runtime issues and the resolution.

**Step 2: Re-run final verification**

Run:
- `npm test`
- `npm run build`
- `docker compose ps`
- `curl -sS http://localhost:3001/health`

Expected: all green
