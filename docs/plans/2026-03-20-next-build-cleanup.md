# Next.js Build Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Reduce the current Next.js build workaround surface by safely removing unnecessary `force-dynamic` route wrappers while keeping the current `/404` fallback stabilizers intact.

**Architecture:** Work in small batches. First remove `dynamic = "force-dynamic"` from the lowest-risk app-route wrappers and verify the web build. Only if that remains green, remove the same wrapper export from the second batch of dynamic-segment pages. Do not touch `src/pages/_document.tsx`, `src/pages/404.tsx`, `src/pages/500.tsx`, `app/not-found.tsx`, or `app/page.tsx` in this slice.

**Tech Stack:** Next.js 15 app router, React, TypeScript, Vitest

---

### Task 1: Remove the lowest-risk `force-dynamic` wrappers

**Files:**
- Modify: `apps/web/src/app/settings/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`
- Modify: `apps/web/src/app/jobs/page.tsx`
- Modify: `apps/web/src/app/dashboard/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/page.tsx`

**Step 1: Verify the current wrappers still force dynamic rendering**

Run:

```bash
rg -n 'force-dynamic' apps/web/src/app/settings/page.tsx apps/web/src/app/profile/page.tsx apps/web/src/app/jobs/page.tsx apps/web/src/app/dashboard/page.tsx apps/web/src/app/workflow-runs/page.tsx
```

Expected:
- PASS
- each file still contains `force-dynamic`

**Step 2: Remove the exports**

Delete the `export const dynamic = "force-dynamic";` line from those wrapper files and leave the wrappers otherwise unchanged.

**Step 3: Verify the web build**

Run:

```bash
npm run build --workspace @openclaw/web
```

Expected:
- PASS
- the build remains green

**Step 4: Commit**

```bash
git add apps/web/src/app/settings/page.tsx apps/web/src/app/profile/page.tsx apps/web/src/app/jobs/page.tsx apps/web/src/app/dashboard/page.tsx apps/web/src/app/workflow-runs/page.tsx
git commit -m "Reduce low-risk Next.js dynamic wrappers"
```

### Task 2: Remove the next batch of thin dynamic-segment wrappers

**Files:**
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/resume-versions/[id]/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/[id]/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page.tsx`

**Step 1: Verify the batch still uses `force-dynamic`**

Run:

```bash
rg -n 'force-dynamic' apps/web/src/app/jobs/[id]/page.tsx apps/web/src/app/resume-versions/[id]/page.tsx apps/web/src/app/workflow-runs/[id]/page.tsx apps/web/src/app/applications/[id]/page.tsx apps/web/src/app/applications/[id]/submission-review/page.tsx
```

Expected:
- PASS
- each file still contains `force-dynamic`

**Step 2: Remove the exports**

Delete the `export const dynamic = "force-dynamic";` line from those wrapper files and leave the wrappers otherwise unchanged.

**Step 3: Verify web tests and build**

Run:

```bash
npm run test --workspace @openclaw/web
npm run build --workspace @openclaw/web
```

Expected:
- PASS
- tests remain green
- build remains green

**Step 4: Commit**

```bash
git add apps/web/src/app/jobs/[id]/page.tsx apps/web/src/app/resume-versions/[id]/page.tsx apps/web/src/app/workflow-runs/[id]/page.tsx apps/web/src/app/applications/[id]/page.tsx apps/web/src/app/applications/[id]/submission-review/page.tsx
git commit -m "Reduce app-route Next.js dynamic wrappers"
```

### Task 3: Update the checklist and verify the final scope

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Confirm the stable fallback files remain**

Run:

```bash
find apps/web/src/pages -maxdepth 2 -type f | sort
```

Expected:
- PASS
- `404.tsx`, `500.tsx`, and `_document.tsx` are still present

**Step 2: Mark the checklist item complete**

Update the checklist to mark item 8 complete and move focus to the final release-packaging item.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark Next.js build cleanup checklist item complete"
```
