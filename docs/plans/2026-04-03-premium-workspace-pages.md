# Premium Workspace Pages Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the Executive Workspace premium SaaS direction across the remaining core application pages while preserving current workflows and test behavior.

**Architecture:** Introduce shared page-level layout classes in global CSS, then apply them page-by-page using existing `Panel` and content structures. Keep business logic intact and use tests to guard against regressions while improving hierarchy and layout.

**Tech Stack:** Next.js App Router, React, TypeScript, global CSS, Vitest, Testing Library

---

### Task 1: Capture the expanded redesign scope

**Files:**
- Create: `/Users/fredz/Downloads/job agent/docs/plans/2026-04-03-premium-workspace-pages-design.md`
- Create: `/Users/fredz/Downloads/job agent/docs/plans/2026-04-03-premium-workspace-pages.md`

**Step 1: Save the design doc**

Document the premium workspace direction for the remaining application pages.

**Step 2: Save the implementation plan**

Document the scoped implementation and verification steps.

### Task 2: Update page tests where headings or layout framing change

**Files:**
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/page-client.test.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/[id]/page-client.test.tsx`

**Step 1: Adjust tests only where page framing text changes**

Keep assertions focused on durable headings, controls, and links rather than incidental copy.

### Task 3: Apply the premium workspace structure across pages

**Files:**
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/dashboard/dashboard-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/[id]/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/workflow-runs/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/workflow-runs/[id]/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/settings/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/profile/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/applications/[id]/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/applications/[id]/submission-review/page-client.tsx`
- Modify: `/Users/fredz/Downloads/job agent/apps/web/src/app/globals.css`

**Step 1: Add shared page layout classes**

Create reusable workspace header, summary rail, banded metrics, and grouped section styles.

**Step 2: Rebuild the page tops**

Give each page a premium hero/header layer and summary structure using existing data.

**Step 3: Tighten section grouping**

Use shared classes to make mid-page sections read as deliberate product surfaces instead of loose grids.

### Task 4: Verify the redesign

**Files:**
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/jobs/[id]/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/settings/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/profile/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/workflow-runs/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/workflow-runs/[id]/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/applications/[id]/page-client.test.tsx`
- Test: `/Users/fredz/Downloads/job agent/apps/web/src/app/applications/[id]/submission-review/page-client.test.tsx`

**Step 1: Run focused tests**

Run: `npm run test --workspace @rolecraft/web -- src/app/jobs/page-client.test.tsx src/app/jobs/[id]/page-client.test.tsx src/app/settings/page-client.test.tsx src/app/profile/page-client.test.tsx src/app/workflow-runs/page-client.test.tsx src/app/workflow-runs/[id]/page-client.test.tsx src/app/applications/[id]/page-client.test.tsx src/app/applications/[id]/submission-review/page-client.test.tsx`

Expected: PASS for the updated page surfaces.

**Step 2: Run full web tests**

Run: `npm run test --workspace @rolecraft/web`

Expected: PASS for the full `@rolecraft/web` suite.
