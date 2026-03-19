# OpenClaw Job Agent Audit & Actor Attribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add actor attribution to persisted application events and dashboard history so every visible workflow event can explain who triggered it.

**Architecture:** Extend `ApplicationEvent` with first-class actor columns, update shared schemas and API responses, then thread the new attribution into the existing dashboard/application history UIs. Keep implicit job and worker milestones as derived read-model events with stable actor defaults.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define actor-aware shared schemas

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/application.test.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- application events parse `actorType` and `actorLabel`
- recent activity parses actor attribution
- timeline items parse actor attribution

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts`
Expected: FAIL because actor-aware schemas do not exist yet.

**Step 3: Implement the schemas**

Add:
- shared actor type schema
- actor fields on application events
- actor fields on recent activity
- actor fields on timeline items

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts`
Expected: PASS.

### Task 2: Add failing application service tests for actor persistence

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- approval updates persist `user / local-user`
- submission actions persist `user / local-user`
- recovery actions persist `user / local-user`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: FAIL because event writes do not include actor fields yet.

**Step 3: Keep fixtures small**

Use one application fixture and assert directly on the event create payloads.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: PASS.

### Task 3: Add failing dashboard service tests for actor attribution

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- recent activity returns actor attribution
- flat timeline returns persisted actor attribution for explicit events
- flat timeline returns derived actor attribution for implicit milestones
- grouped history returns actor attribution everywhere

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: FAIL because the dashboard read-model does not expose actor fields yet.

**Step 3: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: PASS.

### Task 4: Implement persisted actor attribution

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `apps/api/src/applications/applications.service.ts`

**Step 1: Extend Prisma schema**

Add `actorType` and `actorLabel` to `ApplicationEvent`.

**Step 2: Update event writes**

Every application-event write should store:
- `actorType`
- `actorLabel`

Use:
- `user / local-user` for approval, submission, reopen, retry-ready actions

**Step 3: Keep read fallback safe**

If older rows are missing actor fields in the current environment, formatters should degrade gracefully until Prisma schema is pushed everywhere.

**Step 4: Run targeted tests**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: PASS.

### Task 5: Implement actor-aware dashboard read-model

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Modify: `apps/api/src/dashboard/dashboard.controller.ts`

**Step 1: Thread actor fields through recent activity and timeline items**

Persisted event sources should read actor attribution from the event rows.

**Step 2: Add derived actor defaults**

Use:
- `api / apps-api` for import, analysis, resume milestones
- `worker / playwright-worker` for prefill milestones

**Step 3: Verify overview, flat timeline, and grouped history**

Run:
- `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`

Expected: PASS.

### Task 6: Render actor attribution in the UI

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`

**Step 1: Show actor attribution on dashboard history rows**

Add compact “by actorType: actorLabel” text to:
- global timeline
- job timeline rows
- application timeline rows

**Step 2: Show actor attribution on submission history**

Add the same attribution pattern to the application event history block.

**Step 3: Keep the layout lightweight**

Do not add new filters or new pages in this phase.

### Task 7: Final verification and docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts`
- `npm run test --workspace @openclaw/api -- applications.service.test.ts`
- `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/dashboard/overview`
- `curl -sS http://localhost:3001/dashboard/timeline`
- `curl -sS http://localhost:3001/applications/<id>/events`
- `curl -sS http://localhost:3000/dashboard`

Expected: APIs and UI routes expose actor attribution end to end.

**Step 3: Update docs**

Document:
- the first-class actor columns on `application_events`
- the derived actor defaults used by dashboard history
- the fact that this is still a lightweight audit model rather than a full ledger
