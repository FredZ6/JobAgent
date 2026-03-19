# Application Revision Loop Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make it obvious and safe to run a fresh prefill attempt after a review outcome or updated profile/resume context, while preserving every prior application run as audit history.

**Architecture:** Reuse the existing `POST /jobs/:id/prefill` backend behavior, which already creates a fresh `applications` record per run. Focus this phase on UI affordances, messaging, and tests that prove reruns preserve older rows instead of overwriting them.

**Tech Stack:** Next.js, NestJS, TypeScript, Vitest, Docker Compose

---

### Task 1: Add a backend regression test for repeated runs

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing test**
- Add a test that models two separate calls to `prefillJob()` for the same job and asserts they produce distinct application ids.

**Step 2: Run the targeted test**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

### Task 2: Improve Job Detail prefill revision UX

**Files:**
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`

**Step 1: Clarify the action**
- Update copy around prefill so users understand another click creates a new attempt.
- Make the latest run visually prominent and keep older runs clearly labeled as history.

**Step 2: Reuse existing API path**
- Keep the current prefill action behavior unchanged.
- Only adjust messaging and ordering/presentation.

### Task 3: Add a rerun path from Application Review

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Modify: `apps/web/src/lib/api.ts` only if a helper is useful

**Step 1: Add the rerun affordance**
- Add a `Run another prefill` action for the parent job.
- Make `needs_revision` feel like the natural place to rerun.

**Step 2: Keep the old evidence intact**
- Do not mutate the current application row in the client.
- Route the user back through the standard job flow or trigger the existing job prefill call cleanly.

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
curl -sS http://localhost:3001/jobs/<job-id>/applications
curl -sS http://localhost:3000/jobs/<job-id>
curl -sS http://localhost:3000/applications/<application-id>
```

**Step 3: Update docs**
- Mark the phase complete.
- Record that revision attempts create new application rows instead of overwriting history.
