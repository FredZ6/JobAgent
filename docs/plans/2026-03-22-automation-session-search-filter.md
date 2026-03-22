# Automation Session Search and Filter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add local search and filtering to the automation session history UI so users can find specific sessions, failures, unresolved runs, and evidence-heavy runs without scanning the full list.

**Architecture:** Extend the existing `AutomationSessionHistory` client component with lightweight controls while moving matching logic into shared helpers in `apps/web/src/lib/automation-session.ts`. Keep the implementation fully client-side and application-scoped.

**Tech Stack:** Next.js app router, React client components, existing automation session helpers, Vitest, Testing Library

---

### Task 1: Add filtering helpers

**Files:**
- Modify: `apps/web/src/lib/automation-session.ts`
- Modify: `apps/web/src/lib/automation-session.test.ts`

**Step 1: Write the failing tests**

Add tests for:

- query matching on workflow run id, status, error message, and worker log text
- status filtering
- attention/evidence filtering
- combined search + filter behavior

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts
```

Expected: FAIL because filtering helpers do not exist yet.

**Step 3: Write minimal implementation**

Add:

- `AutomationSessionFilterState`
- `filterAutomationSessions(...)`
- any small internal helpers needed to keep matching logic readable

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/automation-session.ts apps/web/src/lib/automation-session.test.ts
git commit -m "Add automation session filtering helpers"
```

### Task 2: Add component-level search and filter UI

**Files:**
- Modify: `apps/web/src/components/automation-session-history.tsx`
- Modify: `apps/web/src/components/automation-session-history.test.tsx`

**Step 1: Write the failing tests**

Add tests for:

- text search narrowing visible sessions
- status filter narrowing visible sessions
- attention filter narrowing visible sessions
- switching selected detail when current selection is filtered out
- filtered empty state and clear filters action

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @rolecraft/web -- src/components/automation-session-history.test.tsx
```

Expected: FAIL because search/filter controls and behavior do not exist yet.

**Step 3: Write minimal implementation**

Update `AutomationSessionHistory` to:

- track search and filter state
- compute `filteredSessions`
- recover selected and compare state when filters hide sessions
- render compact controls and filtered empty state

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @rolecraft/web -- src/components/automation-session-history.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/automation-session-history.tsx apps/web/src/components/automation-session-history.test.tsx
git commit -m "Add automation session search and filter UI"
```

### Task 3: Run verification

**Files:**
- No further source changes expected unless verification exposes issues

**Step 1: Run targeted web tests**

Run:

```bash
npm run test --workspace @rolecraft/web -- src/lib/automation-session.test.ts
npm run test --workspace @rolecraft/web -- src/components/automation-session-history.test.tsx
```

Expected: PASS

**Step 2: Run full web test suite**

Run:

```bash
npm run test --workspace @rolecraft/web
```

Expected: PASS

**Step 3: Run full build**

Run:

```bash
npm run build
```

Expected: PASS

**Step 4: Commit final verification-safe implementation**

```bash
git add docs/plans/2026-03-22-automation-session-search-filter-design.md docs/plans/2026-03-22-automation-session-search-filter.md
git commit -m "docs: plan automation session search and filter"
```

If code and docs were not yet committed separately, stage the final touched files and create local-only commits after verification.
