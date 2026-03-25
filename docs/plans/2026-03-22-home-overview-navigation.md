# Home Overview Navigation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the three overview cards on the home page open the corresponding pages and remove the decorative `1/2/3` numbering.

**Architecture:** Keep the change local to the home page by turning each card into a Next.js link wrapper instead of changing the shared `Panel` component API. Add a focused page test that proves the cards link to `Settings`, `Profile`, and `Jobs`, and that the numeric eyebrows are gone.

**Tech Stack:** Next.js App Router, React 19, Vitest, Testing Library

---

### Task 1: Cover current home-page behavior with a failing test

**Files:**
- Create: `apps/web/src/app/page.test.tsx`
- Test: `apps/web/src/app/page.test.tsx`

**Step 1: Write the failing test**

Add a page test that renders the home page and asserts:
- there is a link for `Settings` pointing to `/settings`
- there is a link for `Profile` pointing to `/profile`
- there is a link for `Jobs + Analysis` pointing to `/jobs`
- the standalone eyebrow numbers `1`, `2`, and `3` are not rendered

**Step 2: Run test to verify it fails**

Run: `npm test --workspace @rolecraft/web -- apps/web/src/app/page.test.tsx`
Expected: FAIL because the cards are static panels and the numeric eyebrows still exist.

### Task 2: Implement clickable cards with no numbering

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Write minimal implementation**

- Wrap each overview panel in a `Link`
- remove the `eyebrow` values from those three panels
- add a lightweight card-link class so the whole card remains clickable without changing the visual language

**Step 2: Run targeted test to verify it passes**

Run: `npm test --workspace @rolecraft/web -- apps/web/src/app/page.test.tsx`
Expected: PASS

### Task 3: Verify no regression in related page tests

**Files:**
- Test: `apps/web/src/app/page.test.tsx`
- Test: `apps/web/src/app/settings/page-client.test.tsx`
- Test: `apps/web/src/app/profile/page-client.test.tsx`
- Test: `apps/web/src/app/jobs/page-client.test.tsx`

**Step 1: Run related tests**

Run: `npm test --workspace @rolecraft/web -- apps/web/src/app/page.test.tsx apps/web/src/app/settings/page-client.test.tsx apps/web/src/app/profile/page-client.test.tsx apps/web/src/app/jobs/page-client.test.tsx`
Expected: PASS
