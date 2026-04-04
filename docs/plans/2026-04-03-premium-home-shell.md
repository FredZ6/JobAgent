# Premium Home Shell Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the homepage and global shell into a premium SaaS "Executive Workspace" direction without changing the rest of the application pages.

**Architecture:** Update shared brand copy and shell structure first, then replace homepage content with a productized hero, proof sections, and workspace launch area. Keep the change scoped to home and shell CSS so the rest of the app continues to work with the shared theme tokens.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Vitest, Testing Library

---

### Task 1: Lock the new direction in docs and design context

**Files:**
- Modify: `/Users/fredz/Downloads/job agent/.impeccable.md`
- Create: `/Users/fredz/Downloads/job agent/docs/plans/2026-04-03-premium-home-shell-design.md`
- Create: `/Users/fredz/Downloads/job agent/docs/plans/2026-04-03-premium-home-shell.md`

**Step 1: Update the design context**

Describe the premium SaaS direction in `.impeccable.md` while preserving the product's human-in-the-loop positioning.

**Step 2: Save the design doc**

Capture the chosen "Executive Workspace" direction and the shell/homepage goals in the design doc.

**Step 3: Save the implementation plan**

Document the scoped implementation and verification steps for this pass.

### Task 2: Update tests to describe the new shell and homepage

**Files:**
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/components/app-shell.test.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/page.test.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/lib/brand.test.ts`

**Step 1: Write the failing shell test**

Assert the new shell labels and trust messaging that define the premium workspace frame.

**Step 2: Write the failing homepage test**

Assert the new hero title, CTA labels, and workflow proof copy for the premium SaaS homepage.

**Step 3: Update the shared brand test**

Confirm the shared product positioning text matches the new direction.

### Task 3: Implement the premium shell and homepage

**Files:**
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/components/app-shell.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/page.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/lib/brand.ts`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/globals.css`

**Step 1: Rebuild the shell**

Implement the new utility row, brand block, nav treatment, and product trust signal.

**Step 2: Rebuild the homepage**

Replace the editorial structure with a premium hero, proof rail, workflow section, and launch pad section.

**Step 3: Update theme tokens and scoped styles**

Shift the light and dark theme toward a cleaner premium SaaS palette and add the new shell/homepage classes.

### Task 4: Verify the redesign

**Files:**
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/components/app-shell.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/page.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/lib/brand.test.ts`

**Step 1: Run targeted tests**

Run: `npm run test --workspace @rolecraft/web -- src/components/app-shell.test.tsx src/app/page.test.tsx src/lib/brand.test.ts`

Expected: PASS for the shell, homepage, and brand copy changes.

**Step 2: Run full web tests**

Run: `npm run test --workspace @rolecraft/web`

Expected: PASS for the full `@rolecraft/web` test suite.
