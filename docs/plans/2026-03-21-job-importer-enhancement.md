# Job Importer Enhancement Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the job importer more trustworthy by improving live extraction, distinguishing synthetic fallbacks from real imports, and recording import diagnostics in job events.

**Architecture:** Keep the `Job` table stable, enrich `JobImporterService` results with source/warning/diagnostic metadata, and persist those diagnostics through `job_imported` event payloads. Use TDD to lock in live extraction, warning behavior, and truthful fallback semantics before touching implementation.

**Tech Stack:** NestJS, Prisma, TypeScript, Vitest

---

### Task 1: Add failing importer service tests

**Files:**
- Create: `apps/api/src/jobs/job-importer.service.test.ts`

**Steps:**
1. Write a mock-mode test that expects a synthetic fallback result with `importSource`.
2. Write a live HTML test that expects JSON-LD `JobPosting` fields to win over weaker metadata.
3. Write a live HTML test that expects an apply CTA link to become `applyUrl`.
4. Write a fallback test that expects `importStatus: "failed"` and `importSource: "synthetic_fallback"` when fetch fails.
5. Run the targeted test file and confirm RED.

### Task 2: Add failing controller event-payload test

**Files:**
- Create: `apps/api/src/jobs/jobs.controller.test.ts`

**Steps:**
1. Write a controller unit test for `importByUrl`.
2. Expect the created `job_imported` event payload to include:
   - `importSource`
   - `warnings`
   - `diagnostics`
3. Run the targeted test file and confirm RED.

### Task 3: Implement enriched importer extraction

**Files:**
- Modify: `apps/api/src/jobs/job-importer.service.ts`

**Steps:**
1. Extend the internal importer result type with source, warnings, and diagnostics.
2. Add helper extraction for:
   - JSON-LD `JobPosting`
   - richer title/description metadata
   - apply-link heuristics
3. Make synthetic fallback honest with `importStatus: "failed"` and `importSource: "synthetic_fallback"`.
4. Re-run targeted importer tests and confirm GREEN.

### Task 4: Persist import diagnostics in events

**Files:**
- Modify: `apps/api/src/jobs/jobs.controller.ts`

**Steps:**
1. Keep job creation based on the existing persisted `Job` fields.
2. Expand `job_imported` event payload to include importer warnings/diagnostics.
3. Re-run the controller test and confirm GREEN.

### Task 5: Verify end-to-end repository health

**Files:**
- No production file changes expected

**Steps:**
1. Run targeted tests:
   - `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts`
   - `npm run test --workspace @rolecraft/api -- src/jobs/jobs.controller.test.ts`
2. Run full verification:
   - `npm run test`
   - `npm run build`
3. Commit the importer enhancement.
