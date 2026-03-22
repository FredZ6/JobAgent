# Next.js Workaround Final Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Try to remove the final Next.js web-build workaround layer while keeping build stability as the non-negotiable constraint.

**Architecture:** Use staged cleanup. First remove the last App Router `force-dynamic` markers. Then cautiously attempt deleting legacy `pages` fallback files in a fixed order, validating build after every step. Only treat the cleanup as complete if build remains stable.

**Tech Stack:** Next.js app router, legacy pages fallback files, Vitest, repo-level npm workspace builds

---

### Task 1: Remove the last App Router `force-dynamic` declarations

**Files:**
- Modify: `apps/web/src/app/page.tsx`
- Modify: `apps/web/src/app/not-found.tsx`

**Step 1: Write the minimal change**

Remove:

- `export const dynamic = "force-dynamic"`

from both files.

**Step 2: Verify build immediately**

Run:

```bash
npm run build --workspace @rolecraft/web
```

Expected: PASS

If this fails, stop the cleanup effort and restore these changes before proceeding.

### Task 2: Attempt to remove legacy `404` / `500` pages

**Files:**
- Delete: `apps/web/src/pages/404.tsx`
- Delete: `apps/web/src/pages/500.tsx`

**Step 1: Delete `404.tsx`**

Remove `apps/web/src/pages/404.tsx`.

**Step 2: Verify build**

Run:

```bash
npm run build --workspace @rolecraft/web
```

Expected: PASS

If this fails, restore `404.tsx` and stop before touching the other legacy files.

**Step 3: Delete `500.tsx`**

Remove `apps/web/src/pages/500.tsx`.

**Step 4: Verify build**

Run:

```bash
npm run build --workspace @rolecraft/web
```

Expected: PASS

If this fails, restore `500.tsx` and stop before touching `_document.tsx`.

### Task 3: Attempt to remove legacy `_document`

**Files:**
- Delete: `apps/web/src/pages/_document.tsx`

**Step 1: Delete `_document.tsx`**

Remove the remaining legacy fallback document.

**Step 2: Verify build**

Run:

```bash
npm run build --workspace @rolecraft/web
```

Expected: PASS

If this fails, restore `_document.tsx` and stop at the conservative end state.

### Task 4: Update README to match the resulting state

**Files:**
- Modify: `README.md`

**Step 1: If cleanup fully succeeded**

Remove the workaround-specific limitation note from README.

**Step 2: If cleanup stopped conservatively**

Rewrite the note so it accurately describes the smaller remaining workaround layer instead of implying a larger unresolved state.

### Task 5: Final verification

**Step 1: Run web tests**

Run:

```bash
npm run test --workspace @rolecraft/web
```

Expected: PASS

**Step 2: Run full build**

Run:

```bash
npm run build
```

Expected: PASS

**Step 3: Commit the result**

Create local-only commits reflecting:

- the design/plan docs
- the resulting cleanup state

The effort should stop at the last build-stable point, even if that means legacy fallback files partially remain.
