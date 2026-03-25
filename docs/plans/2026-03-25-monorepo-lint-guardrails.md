# Monorepo Lint Guardrails Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn `npm run lint` into a real monorepo guardrail that runs ESLint across every workspace and fails on warnings.

**Architecture:** Add a shared root ESLint flat config that covers TypeScript, TSX, and common Node/browser globals, then wire each workspace package to a local `lint` script so the root workspace fan-out becomes meaningful. Keep the first ruleset intentionally small and high-signal to avoid noisy churn, then fix any real lint errors the new guardrail exposes.

**Tech Stack:** npm workspaces, ESLint flat config, TypeScript, Next.js, NestJS, Vitest

---

### Task 1: Add lint tooling and root shared config

**Files:**
- Modify: `package.json`
- Create: `eslint.config.mjs`

**Step 1: Add the tooling dependencies**

Add the root devDependencies needed for a flat ESLint setup:
- `eslint`
- `@eslint/js`
- `typescript-eslint`
- `globals`

**Step 2: Write the shared config**

Create a root `eslint.config.mjs` that:
- ignores generated/build outputs and common cache folders
- applies JS recommended rules
- applies TypeScript recommended rules to `*.ts` and `*.tsx`
- enables browser globals for the web app and Node globals for config/test/server code
- treats unused variables as errors, while allowing `_ignored` parameters

### Task 2: Wire lint scripts into every workspace

**Files:**
- Modify: `apps/web/package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/worker-playwright/package.json`
- Modify: `apps/worker-temporal/package.json`
- Modify: `packages/config/package.json`
- Modify: `packages/shared-types/package.json`

**Step 1: Add workspace lint commands**

Give each package a `lint` script that runs ESLint on its local source tree with `--max-warnings=0`.

### Task 3: Run lint, fix first-wave issues, and verify the guardrail

**Files:**
- Modify: any source files with real lint errors, only if surfaced by ESLint

**Step 1: Run workspace lint**

Run: `npm run lint`
Expected: initial FAIL if the new rules catch existing issues.

**Step 2: Fix only the surfaced issues**

Make the smallest safe code changes needed to satisfy the rules without broad refactors.

**Step 3: Re-run verification**

Run:
- `npm run lint`
- `npm test`

Expected: both PASS, proving lint is now a real monorepo guardrail and does not break the current test baseline.
