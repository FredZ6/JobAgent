# OpenClaw Job Agent Lightweight Audit Enhancements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add actor-based filtering and API-generated summaries to the current audit history so dashboard and application review timelines are easier to query and easier to read.

**Architecture:** Extend the shared event schemas with `summary`, keep explicit application actions in `application_events`, and enhance the current dashboard read-model with actor filtering and summary generation. Reuse the existing pages instead of adding a new audit surface.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Docker Compose, Zod

---

### Task 1: Define summary-aware shared schemas

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: `packages/shared-types/src/application.test.ts`
- Modify: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- application events require `summary`
- recent activity items require `summary`
- timeline items require `summary`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts`
Expected: FAIL because the current schemas do not expose `summary`.

**Step 3: Implement the schemas**

Add `summary` to:
- application events
- recent activity items
- timeline items

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts`
Expected: PASS.

### Task 2: Add failing application-event filtering tests

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- `getApplicationEvents()` can filter by `actorType`
- `getApplicationEvents()` can filter by `eventType`
- returned events include `summary`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: FAIL because the method does not accept filters or generate summaries yet.

**Step 3: Keep fixtures compact**

Use a small explicit event list with at least two event types and two actor types.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: PASS.

### Task 3: Add failing dashboard filtering and summary tests

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- `getTimeline()` filters by `actorType`
- implicit milestone events still get summaries
- overview recent activity includes summaries
- grouped history includes summaries on job and application events

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: FAIL because summaries and actor filtering do not exist yet.

**Step 3: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: PASS.

### Task 4: Implement application-event filters and summaries

**Files:**
- Modify: `apps/api/src/applications/applications.controller.ts`
- Modify: `apps/api/src/applications/applications.service.ts`

**Step 1: Add query parsing**

Support:
- `actorType`
- `eventType`
- `limit`

for `GET /applications/:id/events`.

**Step 2: Add summary builder**

Generate concise summaries from:
- `approvalStatus`
- `submissionStatus`
- `fromStatus`
- `toStatus`
- `note`
- `reasonCode`

**Step 3: Keep payload naming consistent**

Ensure new writes continue using the standardized payload keys.

**Step 4: Run targeted tests**

Run: `npm run test --workspace @openclaw/api -- applications.service.test.ts`
Expected: PASS.

### Task 5: Implement dashboard actor filtering and summaries

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.controller.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.ts`

**Step 1: Extend timeline query parsing**

Add:
- `actorType`

to the `GET /dashboard/timeline` filter set.

**Step 2: Add summary generation**

Thread summary through:
- `recentActivity`
- flat timeline items
- grouped history events

**Step 3: Preserve derived milestones**

Implicit events must still return:
- derived actor metadata
- readable summaries

**Step 4: Run targeted tests**

Run: `npm run test --workspace @openclaw/api -- dashboard.service.test.ts`
Expected: PASS.

### Task 6: Update dashboard and submission review UI

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`

**Step 1: Add filter helpers**

Support:
- dashboard `actorType`
- application-history `actorType`
- application-history `eventType`

**Step 2: Render summaries**

Display:
- label
- actor attribution
- timestamp
- summary

instead of relying on raw payload text.

**Step 3: Keep the page structure stable**

Do not add new routes in this phase.

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
- `curl -sS 'http://localhost:3001/applications/<id>/events?actorType=user'`
- `curl -sS 'http://localhost:3001/dashboard/timeline?actorType=user'`
- `curl -sS http://localhost:3001/dashboard/history`
- `curl -sS http://localhost:3000/dashboard`

Expected: filtering and summaries work across APIs and the dashboard route remains accessible.

**Step 3: Update docs**

Document:
- standardized audit payload keys
- actor-based audit filtering
- summary-based rendering in dashboard and submission history
