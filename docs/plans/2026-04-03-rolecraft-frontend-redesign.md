# Rolecraft Frontend Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the Rolecraft frontend into a crafted dual-theme workspace that better reflects the product's human-in-the-loop job application workflow.

**Architecture:** Keep the existing route structure and client/server data flow, but centralize a new design token system in global CSS, add a shell-level theme toggle, and restyle the highest-traffic pages around stronger hierarchy and workflow framing. Favor presentation refactors over behavioral rewrites so the redesign remains low-risk.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Vitest, Testing Library

---

### Task 1: Establish design context and landing-page expectations

**Files:**
- Create: `.impeccable.md`
- Create: `docs/plans/2026-04-03-rolecraft-frontend-redesign-design.md`
- Modify: `apps/web/src/app/page.test.tsx`

**Step 1: Write the failing test**

Add assertions for the new landing-page structure and call-to-action copy in `apps/web/src/app/page.test.tsx`.

**Step 2: Run test to verify it fails**

Run: `npm test --workspace apps/web -- src/app/page.test.tsx`
Expected: FAIL because the new headings or action labels do not exist yet.

**Step 3: Write minimal implementation**

Rebuild `apps/web/src/app/page.tsx` to reflect the new "studio ledger" overview and workflow sections.

**Step 4: Run test to verify it passes**

Run: `npm test --workspace apps/web -- src/app/page.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add .impeccable.md docs/plans/2026-04-03-rolecraft-frontend-redesign-design.md docs/plans/2026-04-03-rolecraft-frontend-redesign.md apps/web/src/app/page.tsx apps/web/src/app/page.test.tsx
git commit -m "feat: redesign rolecraft landing page direction"
```

### Task 2: Add dual-theme shell foundation

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/app/layout.test.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/app/globals.css`
- Create: `apps/web/src/components/theme-toggle.tsx`
- Create: `apps/web/src/lib/theme.ts`

**Step 1: Write the failing test**

Add tests for the shell rendering the theme toggle and preserving the shell structure.

**Step 2: Run test to verify it fails**

Run: `npm test --workspace apps/web -- src/app/layout.test.tsx`
Expected: FAIL because the theme toggle and theme-aware shell hooks do not exist.

**Step 3: Write minimal implementation**

Add root theme wiring, a client-side theme toggle, and tokenized light/dark global styles.

**Step 4: Run test to verify it passes**

Run: `npm test --workspace apps/web -- src/app/layout.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/layout.tsx apps/web/src/app/layout.test.tsx apps/web/src/components/app-shell.tsx apps/web/src/components/theme-toggle.tsx apps/web/src/lib/theme.ts apps/web/src/app/globals.css
git commit -m "feat: add rolecraft dual-theme shell"
```

### Task 3: Upgrade shared UI primitives

**Files:**
- Modify: `apps/web/src/components/panel.tsx`
- Modify: `apps/web/src/components/field.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Write the failing test**

Add or extend component tests if needed for any changed semantic labels or shared structure. If no current tests cover these primitives, document manual verification and keep semantic markup stable.

**Step 2: Run test to verify it fails**

Run the most relevant page tests impacted by the primitive updates.
Expected: FAIL if the changed primitive structure affects existing expectations.

**Step 3: Write minimal implementation**

Introduce stronger panel framing, field descriptions, control density, and utility classes used by multiple pages.

**Step 4: Run test to verify it passes**

Run the impacted page tests again.
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/components/panel.tsx apps/web/src/components/field.tsx apps/web/src/app/globals.css
git commit -m "feat: upgrade rolecraft shared ui primitives"
```

### Task 4: Redesign the dashboard, jobs list, and job detail pages

**Files:**
- Modify: `apps/web/src/app/dashboard/dashboard-client.tsx`
- Modify: `apps/web/src/app/jobs/page-client.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page-client.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Write the failing test**

Update route tests or add targeted assertions for revised copy and key page landmarks where coverage already exists. If route coverage is missing, add focused tests for the most user-visible structure.

**Step 2: Run test to verify it fails**

Run: `npm test --workspace apps/web -- src/app/jobs/page-client.test.tsx src/app/jobs/[id]/page-client.test.tsx`
Expected: FAIL on outdated copy or missing structure.

**Step 3: Write minimal implementation**

Restructure these operational pages into clearer sections with improved status, action, and evidence presentation while keeping existing data flows intact.

**Step 4: Run test to verify it passes**

Run the same tests plus any dashboard-related coverage.
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/dashboard/dashboard-client.tsx apps/web/src/app/jobs/page-client.tsx apps/web/src/app/jobs/[id]/page-client.tsx apps/web/src/app/globals.css
git commit -m "feat: redesign rolecraft workflow surfaces"
```

### Task 5: Verify the redesigned frontend

**Files:**
- Modify: no source files expected

**Step 1: Run targeted tests**

Run: `npm test --workspace apps/web -- src/app/layout.test.tsx src/app/page.test.tsx src/app/jobs/page-client.test.tsx src/app/jobs/[id]/page-client.test.tsx`
Expected: PASS

**Step 2: Run broader web test suite if time permits**

Run: `npm test --workspace apps/web`
Expected: PASS or a clear list of unrelated failures

**Step 3: Manual verification**

Start the web app locally and verify light/dark themes and the redesigned shell, home, dashboard, jobs list, and job detail pages.

**Step 4: Commit**

```bash
git add -A
git commit -m "chore: verify rolecraft frontend redesign"
```
