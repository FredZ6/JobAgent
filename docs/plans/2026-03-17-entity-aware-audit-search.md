# Entity-Aware Audit Search Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make dashboard timeline and application-history search match entity identifiers and business context so users can find workflow history by ids, titles, companies, and URLs.

**Architecture:** Keep the current audit APIs and filters, but broaden the in-memory search haystacks used by `DashboardService` and `ApplicationsService`. Reuse existing `meta` and payload data instead of adding a new persistence layer, then update the frontend placeholders so the search affordance matches the new behavior.

**Tech Stack:** NestJS, TypeScript, Zod, Vitest, Next.js, Docker Compose

---

### Task 1: Add failing query tests

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/dashboard/dashboard.service.test.ts`

**Step 1: Write failing tests**
- Add an applications-service test where `q` equals the `applicationId`.
- Add an applications-service test where `q` matches a payload string like a failure reason or field name.
- Add a dashboard-service test where `q` equals the `jobId`.
- Add a dashboard-service test where `q` matches company/title/url-like metadata.

**Step 2: Run targeted tests to confirm the failures**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

### Task 2: Expand application-history search semantics

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`

**Step 1: Update query matching**
- Expand `matchesApplicationEventQuery()` to include:
  - `event.id`
  - `event.applicationId`
  - `event.type`
  - status-like payload fields
  - flattened string/number payload values

**Step 2: Keep compatibility**
- Continue honoring existing `note` / `reviewNote` fallback behavior.
- Keep search case-insensitive and ignore empty strings.

**Step 3: Re-run targeted applications tests**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

### Task 3: Expand dashboard timeline search semantics

**Files:**
- Modify: `apps/api/src/dashboard/dashboard.service.ts`

**Step 1: Update query matching**
- Expand `matchesTimelineQuery()` to include:
  - `item.id`
  - `item.entityId`
  - `item.jobId`
  - `item.applicationId`
  - flattened `meta` text

**Step 2: Preserve existing filters**
- Keep actor/source/entity/event/date filtering untouched.
- Do not add new query parameters in this phase.

**Step 3: Re-run targeted dashboard tests**

Run:
```bash
npm run test --workspace @openclaw/api -- dashboard.service.test.ts
```

### Task 4: Align the UI and verify end to end

**Files:**
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Update search copy**
- Adjust placeholders so users know ids, titles, companies, and URLs are searchable.

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
curl -sS "http://localhost:3001/dashboard/timeline?q=<job-id>&limit=5"
curl -sS "http://localhost:3001/applications/<application-id>/events?q=<application-id>&limit=5"
```

**Step 4: Update docs**
- Mark the phase complete.
- Record the new entity-aware search semantics and any remaining limits.
