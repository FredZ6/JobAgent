# Runtime Config Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Finish the high-value runtime/config cleanup by centralizing remaining server-side mode, URL, path, and port resolution into `@rolecraft/config`.

**Architecture:** Add thin helpers in `packages/config/src/env.ts`, verify them with focused config tests, then refactor API and worker call sites to consume those helpers instead of reading `process.env` directly.

**Tech Stack:** TypeScript, NestJS, Express, Vitest

---

### Task 1: Add failing runtime helper tests

**Files:**
- Modify: `packages/config/src/env.test.ts`

**Steps:**
1. Add tests for import, analysis, and resume mode helpers.
2. Add tests for API base URL, worker runtime URL, storage directory, and service port helpers.
3. Confirm the new tests fail before implementation.

### Task 2: Implement runtime helpers

**Files:**
- Modify: `packages/config/src/env.ts`

**Steps:**
1. Add thin helpers for mode resolution.
2. Add thin helpers for API/worker URL resolution.
3. Add thin helpers for application storage directory and service port resolution.
4. Re-run the config test file and confirm GREEN.

### Task 3: Refactor API call sites

**Files:**
- Modify: `apps/api/src/jobs/job-importer.service.ts`
- Modify: `apps/api/src/analysis/llm-analysis.service.ts`
- Modify: `apps/api/src/resume/llm-resume.service.ts`
- Modify: `apps/api/src/internal/long-answer.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/main.ts`

**Steps:**
1. Replace direct mode reads with config helpers.
2. Replace direct URL/path/port reads with config helpers where in scope.
3. Keep behavior unchanged apart from centralization.

### Task 4: Refactor worker call sites

**Files:**
- Modify: `apps/worker-temporal/src/activities.ts`
- Modify: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/index.ts`

**Steps:**
1. Replace direct `API_URL`, `PORT`, and `APPLICATION_STORAGE_DIR` reads with config helpers.
2. Re-run targeted tests if any regressions appear.

### Task 5: Verify repository health

**Files:**
- No production file changes expected

**Steps:**
1. Run targeted config tests:
   - `npm run test --workspace @rolecraft/config -- src/env.test.ts`
2. Run full verification:
   - `npm run test`
   - `npm run build`
3. Commit the runtime/config cleanup.
