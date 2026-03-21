# Browser Web E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a first browser-level happy-path Playwright test that proves the core web flow works from profile setup through application review.

**Architecture:** Create lightweight Playwright infrastructure under `apps/web`, launch a real web server, API server, Postgres container, and worker stub, then drive one stable browser journey through the main product path. Keep external dependencies controlled with mock/stub modes while preserving real browser and route behavior.

**Tech Stack:** Playwright, Next.js, NestJS, Prisma, Postgres, TypeScript

---

### Task 1: Add failing browser e2e skeleton

**Files:**
- Create: `apps/web/playwright.config.ts`
- Create: `apps/web/e2e/happy-path.spec.ts`

**Steps:**
1. Add a Playwright config with a dedicated browser e2e test directory.
2. Write a first happy-path spec that expects to visit the running web app and reach the profile page.
3. Add a dedicated workspace script to run the browser e2e suite.
4. Run the spec and confirm RED because the runtime harness does not exist yet.

### Task 2: Add runtime harness

**Files:**
- Create: `apps/web/e2e/support/runtime.ts`

**Steps:**
1. Add helper code to start a Postgres container.
2. Apply Prisma migrations against the temporary database.
3. Start a worker stub HTTP server that returns a deterministic prefill payload.
4. Start the API process with mock/stub environment variables.
5. Start the web process pointing at the test API.
6. Re-run the first spec and confirm RED on real page interactions rather than missing infrastructure.

### Task 3: Drive the happy-path through the browser

**Files:**
- Modify: `apps/web/e2e/happy-path.spec.ts`
- Modify: relevant web pages only if a minimal stable selector is needed

**Steps:**
1. Extend the spec to save the profile form.
2. Extend the spec to save settings.
3. Import a job from the jobs page.
4. Open job detail, run analyze, generate a resume, and run prefill.
5. Open application review and assert key evidence blocks.
6. Add only the minimal selector support needed to stabilize the path.
7. Run the spec and confirm GREEN.

### Task 4: Verify repository health

**Files:**
- No production file changes expected

**Steps:**
1. Run the browser e2e happy-path in isolation.
2. Run:
   - `npm run test`
   - `npm run build`
3. Commit the browser e2e slice.
