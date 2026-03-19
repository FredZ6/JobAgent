# Application Run Comparison Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Show whether the newest application prefill run is better, worse, or unchanged relative to the immediately previous run, without adding backend complexity.

**Architecture:** Keep comparison logic in the web app. Reuse the application runs already returned for Job Detail and compute a focused latest-vs-previous diff in a small frontend utility.

**Tech Stack:** Next.js, TypeScript, Vitest, Docker Compose

---

### Task 1: Build a comparison helper

**Files:**
- Create: `apps/web/src/lib/application-comparison.ts`
- Create: `apps/web/src/lib/application-comparison.test.ts`

**Step 1: Write failing tests**
- Add unit tests that compare two application runs and verify deltas plus field-level state changes.

**Step 2: Implement the helper**
- Normalize field states into a small explicit set.
- Return summary deltas plus changed fields.

**Step 3: Run the targeted web test**

Run:
```bash
npm run test --workspace @openclaw/web -- application-comparison.test.ts
```

### Task 2: Add comparison UI to Job Detail

**Files:**
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Compute latest-vs-previous comparison**
- Use the first two application runs already shown on Job Detail.
- Only show the panel when both runs exist.

**Step 2: Render a small comparison surface**
- Show delta cards for field states, screenshots, and worker logs.
- Show field-level changes and links to both runs.

### Task 3: Verify end to end

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run verification**

Run:
```bash
npm test
npm run build
docker compose up --build -d
curl -sS http://localhost:3001/health
curl -sS http://localhost:3001/jobs/<job-id>/applications
curl -sS http://localhost:3000/jobs/<job-id>
```

**Step 2: Update docs**
- Mark the phase complete.
- Record that the latest run can now be compared with the previous run directly from Job Detail.
