# OpenClaw Job Agent Tracker History & Timeline Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a richer tracker history view with a global timeline plus grouped job and application timelines on the existing dashboard page.

**Architecture:** Build a dashboard read-model from existing `jobs`, `job_analyses`, `resume_versions`, `applications`, and `application_events`. Expose one flat timeline API and one grouped history API, then render both views on `/dashboard` with minimal filtering and direct links back into the workflow.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define timeline schemas

**Files:**
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`
- Modify: `packages/shared-types/src/index.ts`

**Step 1: Write the failing schema tests**

Add tests that verify:
- a unified timeline item parses
- grouped job timeline payloads parse
- grouped application timeline payloads parse
- dashboard history payload parses

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the timeline and grouped history schemas do not exist yet.

**Step 3: Implement the schemas**

Add:
- timeline item schema
- grouped job timeline schema
- grouped application timeline schema
- dashboard history schema

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Add failing dashboard service tests for history

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- `getTimeline()` returns a newest-first filtered feed
- `getHistory()` returns grouped job timelines
- `getHistory()` returns grouped application timelines
- recovery events appear in grouped history

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: FAIL because the new dashboard history methods do not exist yet.

**Step 3: Keep fixtures compact**

Use one or two jobs with one application so the expected order and grouping stay obvious.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: PASS.

### Task 3: Implement dashboard timeline aggregation APIs

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/dashboard/dashboard.controller.ts`

**Step 1: Add timeline builders**

Implement helpers that:
- convert jobs into implicit history milestones
- convert applications into implicit prefill milestones
- convert `application_events` into explicit timeline items

**Step 2: Add service methods**

Implement:
- `getTimeline(filters)`
- `getHistory()`

Rules:
- timeline is newest-first
- grouped histories are oldest-to-newest inside each card
- filters only apply to the flat timeline feed

**Step 3: Add routes**

Implement:
- `GET /dashboard/timeline`
- `GET /dashboard/history`

**Step 4: Verify manually**

Run:
- `curl -sS http://localhost:3001/dashboard/timeline`
- `curl -sS http://localhost:3001/dashboard/timeline?entityType=application`
- `curl -sS http://localhost:3001/dashboard/history`

Expected: flat timeline works, filtering works, grouped histories render meaningful data.

### Task 4: Extend the dashboard web API client

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Step 1: Add fetch helpers**

Expose:
- `fetchDashboardTimeline`
- `fetchDashboardHistory`

**Step 2: Add filter types**

Support:
- `entityType`
- `eventType`

**Step 3: Keep existing overview helpers unchanged**

Do not regress the current dashboard metrics and table behavior.

### Task 5: Add timeline UI to `/dashboard`

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Load overview, applications, and history**

Fetch:
- overview
- applications list
- grouped history
- flat timeline

**Step 2: Add global timeline**

Render:
- newest-first event list
- entity-type filter
- event-type filter
- links to jobs/applications

**Step 3: Add grouped job timelines**

Render a recent set of job cards with vertical milestone lists.

**Step 4: Add grouped application timelines**

Render a recent set of application cards with lifecycle event lists.

**Step 5: Keep current operational sections**

Retain:
- metrics
- pipeline overview
- jobs board
- applications table

but move the tables below the new history sections.

**Step 6: Verify manually**

Load:
- `http://localhost:3000/dashboard`

Expected: dashboard shows metrics, pipeline, flat timeline, job timelines, application timelines, jobs board, and applications table.

### Task 6: Final verification and docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/dashboard/timeline`
- `curl -sS http://localhost:3001/dashboard/history`
- `curl -sS http://localhost:3000/dashboard`

Expected: APIs return grouped and flat history, and the dashboard route loads with the new sections.

**Step 3: Update docs**

Document:
- the new timeline views
- the mixed implicit/explicit event model
- the lightweight filters
