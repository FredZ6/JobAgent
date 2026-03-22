# Automation Summary Best Run Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an application-level automation summary to `Application Review` that highlights total attempts, latest run state, retry trend, and a transparent best-run recommendation.

**Architecture:** Keep the first version entirely in the web layer by computing a focused overview from the existing `automationSessions` array. Extend the shared automation-session helper module with overview logic, then render a lightweight summary strip in `Application Review` without changing APIs or persistence.

**Tech Stack:** React, Next.js App Router client pages, shared web helpers, Vitest, existing web panel/card components

---

### Task 1: Add overview helper tests

**Files:**
- Modify: `apps/web/src/lib/automation-session.test.ts`
- Modify: `apps/web/src/lib/automation-session.ts`

**Step 1: Write the failing tests**

Add focused tests for:
- `totalAttempts`
- `latestStatus`
- `latestUnresolved`
- retry trend deltas across two sessions
- hiding retry trend when there is only one session
- best-run selection priority and human-readable reason

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts`
Expected: FAIL because `buildAutomationSessionOverview(...)` does not exist yet.

**Step 3: Write minimal implementation**

Add to `automation-session.ts`:
- `buildAutomationSessionOverview(...)`
- best-run ranking helpers
- retry-trend delta calculation
- reason formatting helper

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/automation-session.ts apps/web/src/lib/automation-session.test.ts
git commit -m "Add automation session overview helper"
```

### Task 2: Add Application Review page tests for the summary

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page-client.test.tsx`
- Modify: `apps/web/src/app/applications/[id]/page-client.tsx`

**Step 1: Write the failing tests**

Add page tests that assert:
- summary cards render above the automation session history
- the page shows `Total attempts`, `Latest status`, `Latest unresolved`, and `Best run`
- retry trend text appears when at least two sessions exist
- retry trend text is omitted when only one session exists

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
Expected: FAIL because the summary strip is not rendered yet.

**Step 3: Write minimal implementation**

Teach `page-client.tsx` to:
- compute `buildAutomationSessionOverview(automationSessions)`
- render a compact summary strip above the existing automation-session controls
- show the best-run explanation in plain language

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/applications/[id]/page-client.tsx apps/web/src/app/applications/[id]/page-client.test.tsx
git commit -m "Add automation summary to application review"
```

### Task 3: Polish summary presentation without changing APIs

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page-client.tsx`
- Modify: `apps/web/src/app/globals.css` (only if minor layout support is needed)

**Step 1: Review the summary against existing layout**

Check whether the cards fit the current `Automation sessions` section cleanly on desktop and mobile.

**Step 2: Make the minimal layout adjustment**

If needed:
- tighten card spacing
- keep the summary visually grouped with the session tools
- avoid introducing a new standalone dashboard look

**Step 3: Re-run targeted page test**

Run: `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/src/app/applications/[id]/page-client.tsx apps/web/src/app/globals.css
git commit -m "Polish automation summary layout"
```

### Task 4: Full verification

**Files:**
- Modify: none expected

**Step 1: Run targeted helper and page tests**

Run:
- `npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts`
- `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`

Expected: PASS

**Step 2: Run broader web verification**

Run:
- `npm run test --workspace @rolecraft/web`
- `npm run build --workspace @rolecraft/web`

Expected: PASS

**Step 3: Run final workspace verification**

Run:
- `npm run test`
- `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add .
git commit -m "Finish automation summary best run"
```
