# Automation Sessions UX Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add complete `automation_sessions` UX inside the application review flow with list, detail, comparison, and evidence access.

**Architecture:** Reuse the existing application detail page as the main automation history surface. Load the application context and full session history separately, then build a master-detail experience that can switch into a simple compare mode for two selected sessions.

**Tech Stack:** Next.js app router, React client components, existing API layer, Vitest, existing shared automation session types

---

### Task 1: Add API helper coverage for automation sessions

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Test: `apps/web/src/lib/api.test.ts` or the nearest existing API utility test file if present

**Step 1: Write the failing test**

Add a test that expects a `fetchAutomationSessions(applicationId)` helper to call:

- `GET /applications/:id/automation-sessions`

and return the parsed session list.

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/web -- api
```

Expected: FAIL because the helper does not exist yet.

**Step 3: Write minimal implementation**

Add `fetchAutomationSessions(applicationId)` in `apps/web/src/lib/api.ts`.

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/web -- api
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/lib/api*.test.*
git commit -m "Add automation sessions API helper"
```

### Task 2: Build session comparison helpers

**Files:**
- Create or Modify: `apps/web/src/lib/automation-session.ts`
- Test: `apps/web/src/lib/automation-session.test.ts`

**Step 1: Write the failing test**

Add tests for helper behavior that compares two sessions and summarizes:

- status differences
- filled / failed / unresolved differences
- screenshot / log count differences

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/web -- automation-session.test.ts
```

Expected: FAIL because compare helpers do not exist yet.

**Step 3: Write minimal implementation**

Add helpers that compute compare summaries from two session objects.

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/web -- automation-session.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/automation-session.ts apps/web/src/lib/automation-session.test.ts
git commit -m "Add automation session compare helpers"
```

### Task 3: Build reusable automation session detail and compare components

**Files:**
- Create: `apps/web/src/components/automation-session-list.tsx`
- Create: `apps/web/src/components/automation-session-detail.tsx`
- Create: `apps/web/src/components/automation-session-compare.tsx`
- Modify: `apps/web/src/components/automation-session-summary.tsx`
- Test: nearest component test files if the workspace already has them

**Step 1: Write the failing test**

Add component tests that prove:

- a list of sessions renders
- the selected session detail renders
- two selected sessions switch the UI into compare mode

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: FAIL on missing components or missing compare behavior.

**Step 3: Write minimal implementation**

Build the components with compact summary-first UI:

- list rows for session metadata
- detail panel for field results / logs / screenshots
- compare panel for summary diffs and side-by-side context

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/automation-session-*.tsx
git commit -m "Build automation session detail and compare components"
```

### Task 4: Wire the application detail page to the full session history

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/page-client.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Test: relevant page/component tests

**Step 1: Write the failing test**

Add tests for:

- loading and rendering the full session list
- defaulting detail to the latest session
- switching selection
- entering compare mode on two selections

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: FAIL because the page still only renders the latest-session summary.

**Step 3: Write minimal implementation**

Update the application detail page to:

- fetch the full session list
- show the `Automation sessions` section
- keep the rest of application review flow intact

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/applications/[id]/page.tsx apps/web/src/app/applications/[id]/page-client.tsx apps/web/src/lib/api.ts
git commit -m "Show automation session history on application pages"
```

### Task 5: Keep submission review lightweight but connected

**Files:**
- Modify: `apps/web/src/app/applications/[id]/submission-review/page-client.tsx`
- Test: relevant page/component tests if present

**Step 1: Write the failing test**

Add coverage that keeps the latest-session summary intact and, if a link/button is added, verifies the navigation affordance exists.

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: FAIL only if new UX affordance is added and not yet implemented.

**Step 3: Write minimal implementation**

Keep the current summary and add a lightweight path back to the fuller application history if useful.

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/applications/[id]/submission-review/page-client.tsx
git commit -m "Link submission review to automation session history"
```

### Task 6: Run verification and update checklist

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Run web tests**

Run:

```bash
npm run test --workspace @openclaw/web
```

Expected: PASS

**Step 2: Run web build**

Run:

```bash
npm run build --workspace @openclaw/web
```

Expected: PASS

**Step 3: Update checklist**

Mark the `automation_sessions` UX item complete only if list, detail, compare, and evidence entry points are all in place and verified.

**Step 4: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark automation sessions UX checklist item complete"
```
