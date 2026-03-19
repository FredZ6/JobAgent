# Audit Query/Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add source filtering, keyword search, and simple date-range querying to the existing audit/history endpoints and UI.

**Architecture:** Keep the current audit model and enhance only the read path. Both applications history and dashboard timeline will format canonical DTOs first, then apply the same in-memory filtering rules so the UI gets consistent results without any new persistence layer.

**Tech Stack:** Prisma, NestJS, Next.js, TypeScript, Zod, Vitest, Docker Compose

---

### Task 1: Extend query contracts

**Files:**
- Modify: `apps/api/src/applications/applications.controller.ts`
- Modify: `apps/api/src/dashboard/dashboard.controller.ts`
- Modify: `apps/web/src/lib/api.ts`

**Step 1: Define new query fields**
- Add `source`, `q`, `from`, and `to` to the applications and dashboard timeline query schemas.
- Add matching request-helper params in the web client.

**Step 2: Keep parsing strict**
- Use Zod to coerce/validate date strings and keep current bounds on `limit`.

### Task 2: Add filtering to application history

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`
- Test: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write failing tests**
- Filter by `source`
- Filter by keyword search
- Filter by `from`/`to`

**Step 2: Implement minimal filtering**
- Format events first.
- Apply source/date/search filters in memory.

**Step 3: Re-run tests**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

### Task 3: Add filtering to dashboard timeline

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`
- Test: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write failing tests**
- Filter timeline by `source`
- Filter timeline by keyword
- Filter timeline by date range

**Step 2: Implement minimal filtering**
- Reuse the same normalization approach as application history.
- Keep grouped history unchanged.

**Step 3: Re-run tests**

Run:
```bash
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

### Task 4: Add UI controls

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`

**Step 1: Add source filter controls**
- Add a compact pill row for common sources.

**Step 2: Add search and date inputs**
- Add a keyword input plus `from`/`to` date inputs.
- Keep layout compact and consistent with the existing panel style.

**Step 3: Thread filters into fetch calls**
- Update fetch effects and state management.

**Step 4: Build the web app**

Run:
```bash
npm run build --workspace @openclaw/web
```

### Task 5: Verify and document

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run targeted verification**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

**Step 2: Run root verification**

Run:
```bash
npm test
npm run build
```

**Step 3: Run Docker/runtime verification**

Run:
```bash
docker compose up --build -d
curl -sS "http://localhost:3001/applications/<id>/events?source=web-ui&limit=5"
curl -sS "http://localhost:3001/dashboard/timeline?q=local-user&limit=5"
curl -sS "http://localhost:3001/dashboard/timeline?from=<iso>&to=<iso>&limit=5"
curl -sS http://localhost:3000/dashboard
curl -sS http://localhost:3000/applications/<id>/submission-review
```

**Step 4: Update docs**
- Mark the new phase complete.
- Record the new query/search capability and runtime evidence.
