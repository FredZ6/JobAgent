# Internal Auth Hardening Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate worker internal auth from `JWT_SECRET` while preserving local development compatibility and improving public-deployment defaults.

**Architecture:** Add `INTERNAL_API_TOKEN` as a first-class environment variable, centralize internal-token resolution in shared config logic, switch the API and both workers to that shared rule, and update tests and docs so the new trust boundary is explicit.

**Tech Stack:** TypeScript, Zod config parsing, NestJS, Playwright worker, Temporal worker, Markdown docs

---

### Task 1: Add shared internal-token config helpers

**Files:**
- Modify: `packages/config/src/env.ts`
- Create or modify test file under `packages/config/src/`

**Step 1: Write the failing tests**

Add tests for:

- `INTERNAL_API_TOKEN` wins when set
- non-production falls back to `JWT_SECRET`
- production does not fall back to `JWT_SECRET`
- empty configuration yields no usable internal token

**Step 2: Run the targeted test to verify failure**

Run a focused config test command after adding the failing cases.

**Step 3: Implement the helper**

Update `env.ts` to:

- add `INTERNAL_API_TOKEN`
- expose a helper that resolves the effective internal token from env

**Step 4: Re-run the targeted test**

Confirm the helper tests now pass.

**Step 5: Commit**

```bash
git add packages/config/src/env.ts packages/config/src/*.test.ts
git commit -m "Add internal API token config helpers"
```

### Task 2: Switch API and worker paths to the shared rule

**Files:**
- Modify: `apps/api/src/internal/internal.controller.ts`
- Modify: `apps/api/src/internal/internal.controller.test.ts`
- Modify: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/prefill.test.ts`
- Modify: `apps/worker-temporal/src/activities.ts`
- Add or modify Temporal worker tests if needed

**Step 1: Write failing tests for the new behavior**

Cover:

- development/test compatibility fallback
- production rejection without `INTERNAL_API_TOKEN`
- worker header generation preferring `INTERNAL_API_TOKEN`

**Step 2: Run the focused tests to verify failure**

Run targeted API and worker tests.

**Step 3: Implement the runtime switch**

Update:

- API internal auth to use the shared helper
- Playwright worker headers to use the shared helper
- Temporal worker headers to use the shared helper

**Step 4: Re-run focused tests**

Confirm the targeted API and worker tests pass.

**Step 5: Commit**

```bash
git add apps/api/src/internal/internal.controller.ts apps/api/src/internal/internal.controller.test.ts apps/worker-playwright/src/prefill.ts apps/worker-playwright/src/prefill.test.ts apps/worker-temporal/src/activities.ts
git commit -m "Separate internal worker auth from JWT secret"
```

### Task 3: Update docs and checklist, then verify the slice

**Files:**
- Modify: `.env.example`
- Modify: `README.md`
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Update docs**

Make the new boundary explicit:

- `INTERNAL_API_TOKEN` added to `.env.example`
- README deployment/security notes explain separate secrets for public deployments
- checklist item 9 marked complete when code and docs are finished

**Step 2: Run verification**

Run the relevant targeted tests plus broader package checks for anything touched.

**Step 3: Commit**

```bash
git add .env.example README.md docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Document internal auth hardening"
```
