# Web API Base Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extract the Web app API base URL resolution into a focused helper with explicit browser and server semantics.

**Architecture:** Add a small helper in `apps/web/src/lib/api-base.ts`, lock its behavior down with a focused unit test, then switch `apps/web/src/lib/api.ts` to consume it. Keep the change local to the web app and avoid expanding this slice into a larger frontend runtime system.

**Tech Stack:** TypeScript, Next.js, Vitest

---

### Task 1: Add failing helper tests

**Files:**
- Create: `apps/web/src/lib/api-base.test.ts`

**Steps:**
1. Write a test for browser mode preferring `NEXT_PUBLIC_API_URL`.
2. Write a test for browser mode ignoring `API_URL`.
3. Write a test for server mode falling back to `API_URL`.
4. Write a test for trimming and trailing-slash normalization.
5. Run the targeted test file and confirm RED.

### Task 2: Implement the helper

**Files:**
- Create: `apps/web/src/lib/api-base.ts`

**Steps:**
1. Add `resolveWebApiBaseUrl(env, options?)`.
2. Implement browser and server fallback semantics.
3. Re-run the targeted helper test and confirm GREEN.

### Task 3: Integrate the helper into the Web API client

**Files:**
- Modify: `apps/web/src/lib/api.ts`

**Steps:**
1. Replace the inline `API_BASE` env expression with the helper.
2. Keep request and URL-building behavior unchanged apart from centralization.

### Task 4: Verify web package health

**Files:**
- No production file changes expected

**Steps:**
1. Run:
   - `npm run test --workspace @rolecraft/web -- src/lib/api-base.test.ts`
2. Run broader verification:
   - `npm run test --workspace @rolecraft/web`
   - `npm run build --workspace @rolecraft/web`
3. Commit the cleanup.
