# OpenClaw Job Agent Tracker Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a unified Tracker Dashboard that surfaces both job progress and application review state from one page.

**Architecture:** Reuse the existing `jobs`, `job_analysis`, `resume_versions`, and `applications` records to derive tracker state instead of creating new tables. Add one dashboard aggregation endpoint plus a top-level applications list route, then render a `/dashboard` page with metrics, pipeline counts, jobs board, applications table, and recent activity.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define shared tracker schemas

**Files:**
- Create: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing schema tests**

Add tests that verify:
- valid job stage values parse
- dashboard overview payloads parse
- invalid stage names are rejected

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the tracker schemas do not exist yet.

**Step 3: Implement the schemas**

Add Zod schemas and inferred types for:
- job tracker stage enum
- dashboard metrics
- pipeline counts
- approval breakdown
- job tracker row
- recent activity item
- dashboard overview DTO

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Add failing API tests for tracker aggregation

**Files:**
- Create: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- jobs map to the expected tracker stages from related analysis, resume, and application records
- overview metrics count totals correctly
- approval breakdown and recent activity are returned in a stable shape

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api`
Expected: FAIL because the dashboard service does not exist yet.

**Step 3: Implement the minimal fixtures**

Use small deterministic Prisma mocks or service fixtures so the expectations are clear.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api`
Expected: PASS.

### Task 3: Implement dashboard and applications API endpoints

**Files:**
- Create: `apps/api/src/dashboard/dashboard.service.ts`
- Create: `apps/api/src/dashboard/dashboard.controller.ts`
- Modify: `apps/api/src/applications/applications.controller.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Add dashboard aggregation**

Implement:
- `GET /dashboard/overview`

Return:
- metrics
- pipeline counts
- approval breakdown
- job tracker rows
- recent activity

**Step 2: Add top-level applications listing**

Implement:
- `GET /applications`

Return application rows with linked job and resume summaries.

**Step 3: Reuse existing data only**

Do not add new tables or stored tracker-state columns. Derive everything from existing persisted records.

**Step 4: Verify manually**

Run:
- `curl -sS http://localhost:3001/dashboard/overview`
- `curl -sS http://localhost:3001/applications`

Expected: both routes return valid JSON with stable shapes.

### Task 4: Add web API client helpers for the dashboard

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Step 1: Add failing type usage if needed**

Add the new dashboard fetch helpers and make the type expectations explicit.

**Step 2: Implement helpers**

Expose:
- `fetchDashboardOverview`
- `fetchApplications`

**Step 3: Verify build**

Run: `npm run build --workspace @openclaw/web`
Expected: PASS or fail only because the page is not wired yet.

### Task 5: Build the `/dashboard` page

**Files:**
- Create: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add the failing page wiring**

Create a dashboard page that expects:
- overview metrics
- pipeline data
- jobs rows
- applications rows
- recent activity

**Step 2: Implement the UI**

Render:
- top metric cards
- pipeline strip
- jobs board with stage filter
- applications table with approval filter
- recent activity list

**Step 3: Keep filters local and simple**

Use client-side state for the first version:
- one selected job stage
- one selected approval state

**Step 4: Verify manually**

Load:
- `http://localhost:3000/dashboard`

Expected: the page renders tracker data and filter changes update visible rows without a full reload.

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
- `curl -sS http://localhost:3001/dashboard/overview`
- `curl -sS http://localhost:3001/applications`
- `curl -sS http://localhost:3000/dashboard`

Expected: the dashboard API routes return real data and the web dashboard route returns HTML.

**Step 3: Update docs**

Document:
- the new dashboard page
- the fact that tracker state is derived from current records rather than a dedicated timeline table
- the first-pass filter limitations
