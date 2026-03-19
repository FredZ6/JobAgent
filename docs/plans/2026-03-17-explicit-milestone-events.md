# Explicit Milestone Events Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Persist real milestone events for job import, analysis, resume generation, and prefill so dashboard history becomes less inferred and more auditable.

**Architecture:** Add a small `JobEvent` table and extend `ApplicationEvent` with `prefill_run`. Record milestone events close to the successful writes that created the underlying job/analysis/resume/application state, then have the dashboard read-model prefer explicit events and fall back only for older records.

**Tech Stack:** Prisma, NestJS, Next.js, TypeScript, Zod, Vitest, Docker Compose

---

### Task 1: Extend schemas and Prisma

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/application.test.ts`

**Step 1: Add failing tests**
- Extend `ApplicationEventType` coverage to include `prefill_run`.

**Step 2: Update schema**
- Add `JobEvent`.
- Add `prefill_run` to application event types.

**Step 3: Re-run shared tests**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts
```

### Task 2: Persist explicit milestone events

**Files:**
- Modify: `apps/api/src/jobs/jobs.controller.ts`
- Modify: `apps/api/src/analysis/analysis.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Test: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write/extend failing tests**
- Assert prefill writes a `prefill_run` event with worker attribution.

**Step 2: Implement minimal event writes**
- Write `job_imported` after job creation.
- Write `analysis_completed` after analysis save.
- Write `resume_generated` after resume save.
- Write `prefill_run` after worker result save.

**Step 3: Re-run targeted tests**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

### Task 3: Prefer explicit milestone events in dashboard

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Test: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Add failing tests**
- Explicit job/application milestone events should appear once.
- Derived fallbacks should be skipped when an explicit event exists.

**Step 2: Implement dashboard changes**
- Load `jobEvent` rows.
- Load `prefill_run` application events.
- Build timeline/history from explicit rows first.
- Fall back only where missing.

**Step 3: Re-run targeted tests**

Run:
```bash
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

### Task 4: Verify and document

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run root verification**

Run:
```bash
npm test
npm run build
```

**Step 2: Run Docker verification**

Run:
```bash
docker compose up --build -d
curl -sS http://localhost:3001/dashboard/history
curl -sS http://localhost:3001/dashboard/timeline?limit=10
```

**Step 3: Update docs**
- Mark the phase complete.
- Record the shift from derived to explicit milestone events for new rows.
