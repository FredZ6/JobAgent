# Chromium Runtime Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Centralize Chromium executable resolution for resume PDF export and replace the current low-level failure mode with a clearer, actionable error.

**Architecture:** Add a thin Chromium runtime helper to `@rolecraft/config`, lock its behavior down with helper tests, then switch `ResumePdfService` to use it and add a focused service-level error-path test. Keep the actual PDF rendering flow unchanged.

**Tech Stack:** TypeScript, NestJS, Playwright, Vitest

---

### Task 1: Add failing helper and service tests

**Files:**
- Modify: `packages/config/src/env.test.ts`
- Modify: `apps/api/src/resume/resume-pdf.service.test.ts`

**Steps:**
1. Add helper tests for:
   - preferred configured path
   - fallback known path resolution
   - unresolved path when nothing exists
2. Add a focused service test that expects a readable error when Chromium cannot be resolved.
3. Run the targeted tests and confirm RED.

### Task 2: Implement the Chromium runtime helper

**Files:**
- Modify: `packages/config/src/env.ts`

**Steps:**
1. Add `resolveChromiumRuntime(env, pathExists?)`.
2. Return configured path, resolved executable path, and known paths.
3. Re-run config tests and confirm GREEN.

### Task 3: Integrate the helper into PDF export

**Files:**
- Modify: `apps/api/src/resume/resume-pdf.service.ts`

**Steps:**
1. Replace the inline executable resolution logic with the helper.
2. Throw a readable `ConflictException` before `chromium.launch()` when no executable is resolved.
3. Keep the PDF rendering flow unchanged otherwise.

### Task 4: Verify targeted and package-level health

**Files:**
- No production file changes expected

**Steps:**
1. Run:
   - `npm run test --workspace @rolecraft/config -- src/env.test.ts`
   - `npm run test --workspace @rolecraft/api -- src/resume/resume-pdf.service.test.ts`
2. Run broader verification:
   - `npm run test --workspace @rolecraft/api`
   - `npm run build --workspace @rolecraft/api`
3. Commit the cleanup.
