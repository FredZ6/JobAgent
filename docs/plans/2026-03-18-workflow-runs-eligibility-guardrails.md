# Workflow Runs Eligibility Guardrails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add eligibility summaries and mixed-selection guardrails to `/workflow-runs` so future bulk retry/cancel controls have clear, trustworthy semantics.

**Architecture:** Keep the work entirely in the web app. Add a small helper that classifies selected workflow runs using the current single-run eligibility rules, then surface those counts and guardrail messages in the existing bulk action area while keeping future retry/cancel buttons disabled.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest, Docker Compose

---

### Task 1: Add Eligibility Helper Tests

**Files:**
- Create: `apps/web/src/lib/workflow-runs-eligibility.ts`
- Create: `apps/web/src/lib/workflow-runs-eligibility.test.ts`

**Steps:**
1. Write failing tests for:
   - classifying selected runs into retry eligible, cancel eligible, and ineligible
   - generating correct eligibility counts
   - generating guardrail messages for mixed selections
   - generating the stronger no-eligible message when appropriate
2. Run `npm run test --workspace @openclaw/web -- workflow-runs-eligibility.test.ts` and confirm RED.
3. Write the minimal helper implementation.
4. Re-run the same test command and confirm GREEN.

### Task 2: Wire Eligibility UI Into `/workflow-runs`

**Files:**
- Modify: `apps/web/src/app/workflow-runs/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Steps:**
1. Derive eligibility summary data from the current loaded runs and selected ids.
2. Render retry/cancel/ineligible counts when `selectedCount > 0`.
3. Add disabled `Retry eligible runs` and `Cancel eligible runs` buttons.
4. Render helper-driven guardrail copy for mixed selections.
5. Keep all existing safe bulk-open actions intact.

### Task 3: Verification And Docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @openclaw/web -- workflow-runs-eligibility.test.ts`
2. Run full verification:
   - `npm test`
   - `npm run build`
   - `docker compose up --build -d`
3. Run browser-level checks for:
   - eligibility counts
   - disabled future controls
   - mixed-selection guardrail copy
4. Update docs and planning artifacts with final Phase 37 status and any runtime notes.
