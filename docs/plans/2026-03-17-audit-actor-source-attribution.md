# Audit Actor/Source Attribution Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add stable `actorId` and `source` attribution to persisted audit events and derived history/timeline items.

**Architecture:** Extend the existing lightweight audit model instead of replacing it. Persist richer attribution on `ApplicationEvent`, derive the same fields for implicit milestones in the dashboard read-model, and thread the new fields through shared schemas and the current UI.

**Tech Stack:** Prisma, NestJS, Next.js, TypeScript, Zod, Vitest, Docker Compose

---

### Task 1: Extend shared audit schemas

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Test: `packages/shared-types/src/application.test.ts`
- Test: `packages/shared-types/src/dashboard.test.ts`

**Step 1: Write the failing tests**
- Add assertions that application events require `actorId` and `source`.
- Add assertions that recent activity and timeline items require `actorId` and `source`.

**Step 2: Run tests to verify they fail**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts
```

**Step 3: Implement minimal schema changes**
- Add `actorId` and `source` to shared audit schemas.
- Export any new types needed by API/web.

**Step 4: Re-run tests**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts
```

### Task 2: Extend Prisma and application event writes

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `apps/api/src/applications/applications.service.ts`
- Test: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing API tests**
- Assert approval/submission/recovery event writes include `actorId` and `source`.
- Keep older-row compatibility behavior outside the persistence assertions.

**Step 2: Run tests to verify they fail**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

**Step 3: Implement minimal persistence changes**
- Add Prisma fields for `ApplicationEvent`.
- Update event creation helpers to write:
  - `actorId=local-user`
  - `source=web-ui`
- Add read-side fallbacks for old rows.

**Step 4: Re-run tests**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

### Task 3: Extend dashboard read-model attribution

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Test: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write the failing dashboard tests**
- Assert derived milestones include stable `actorId/source`.
- Assert persisted application events expose `actorId/source` in overview, timeline, and history.

**Step 2: Run tests to verify they fail**

Run:
```bash
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

**Step 3: Implement minimal dashboard changes**
- Thread `actorId/source` through recent activity, timeline, and grouped history.
- Derive stable values for implicit job/application milestone events.

**Step 4: Re-run tests**

Run:
```bash
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

### Task 4: Surface attribution in the web UI

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`

**Step 1: Update client API typing**
- Thread `actorId/source` through the existing request helpers.

**Step 2: Update dashboard rendering**
- Show `actorId` and `source` in timeline/history rows without adding new controls.

**Step 3: Update submission-review rendering**
- Show `actorId` and `source` in history rows.

**Step 4: Build the web app**

Run:
```bash
npm run build --workspace @openclaw/web
```

### Task 5: Verify end to end

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run targeted tests**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts
npm run test --workspace @openclaw/api -- applications.service.test.ts
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

**Step 2: Run root verification**

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
curl -sS "http://localhost:3001/applications/<id>/events?limit=5"
curl -sS "http://localhost:3001/dashboard/timeline?limit=5"
curl -sS http://localhost:3001/dashboard/history
curl -sS http://localhost:3000/dashboard
curl -sS http://localhost:3000/applications/<id>/submission-review
```

**Step 4: Update docs**
- Mark the new phase complete.
- Record the actor/source attribution decision and runtime evidence.
