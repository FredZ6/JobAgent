# Rolecraft Rename And Workflow Run Card Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the visible web brand to `Rolecraft`, clean up workflow-run cards, and fix raw worker JSON from leaking into workflow-run summaries.

**Architecture:** Fix the failure-text issue at the API boundary, keep a defensive frontend summary helper for older noisy data, and centralize the updated card presentation in shared web helpers/components. This keeps the work additive and UI-local while preventing future bad error payloads from being persisted as workflow-run messages.

**Tech Stack:** Next.js App Router, React, TypeScript, NestJS, Vitest

---

### Task 1: Add failing tests for brand and error summarization

**Files:**
- Create: `apps/web/src/lib/brand.ts`
- Create: `apps/web/src/lib/brand.test.ts`
- Modify: `apps/web/src/lib/workflow-run-status.test.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`

**Steps:**
1. Add a web brand helper test that expects `Rolecraft` display copy.
2. Add a workflow-run status test that expects JSON-shaped error strings to collapse into a human-readable summary.
3. Add an API service test that expects worker non-OK JSON bodies to surface the nested `errorMessage`, not the whole JSON payload.
4. Run targeted tests and confirm RED.

### Task 2: Implement the minimal helpers and API extraction

**Files:**
- Create: `apps/web/src/lib/brand.ts`
- Modify: `apps/web/src/lib/workflow-run-status.ts`
- Modify: `apps/api/src/applications/applications.service.ts`

**Steps:**
1. Add the shared brand helper.
2. Update workflow-run status copy to use shorter pill labels and better failure summarization.
3. Parse non-OK worker responses and extract the best available error text before throwing.
4. Re-run the targeted tests and confirm GREEN.

### Task 3: Wire Rolecraft branding and card cleanup into the web UI

**Files:**
- Modify: `apps/web/src/app/layout.tsx`
- Modify: `apps/web/src/components/app-shell.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Replace visible brand strings with the shared `Rolecraft` copy.
2. Reorganize workflow-run cards into clearer summary/meta/action sections.
3. Keep action buttons visually anchored and summaries resilient to long text.
4. Apply only the CSS needed for the new workflow-run card presentation.

### Task 4: Verify

**Files:**
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- brand.test.ts workflow-run-status.test.ts`
   - `npm run test --workspace @openclaw/api -- applications.service.test.ts`
2. Run build verification:
   - `npm run build --workspace @openclaw/web`
3. Update `progress.md` with the verification snapshot.
