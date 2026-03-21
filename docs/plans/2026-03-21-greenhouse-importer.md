# Greenhouse Importer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a Greenhouse-specific importer adapter that improves live job extraction quality without regressing the generic importer path.

**Architecture:** `JobImporterService` stays responsible for fetch/runtime/fallback orchestration while a new `greenhouse-importer.ts` module handles Greenhouse matching and extraction. The adapter returns a partial import result plus diagnostics; the service decides whether to accept it or fall back to the generic parser.

**Tech Stack:** NestJS, TypeScript, Vitest

---

### Task 1: Add failing Greenhouse importer tests

**Files:**
- Modify: `apps/api/src/jobs/job-importer.service.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- successful Greenhouse extraction
- Greenhouse match with insufficient content falling back
- Greenhouse apply URL using `sourceUrl` when no CTA is better

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts`
Expected: FAIL because no Greenhouse adapter path exists yet.

**Step 3: Commit**

```bash
git add apps/api/src/jobs/job-importer.service.test.ts
git commit -m "test: cover Greenhouse importer behavior"
```

### Task 2: Implement Greenhouse adapter

**Files:**
- Create: `apps/api/src/jobs/greenhouse-importer.ts`
- Modify: `apps/api/src/jobs/job-importer.service.ts`

**Step 1: Write the minimal adapter**

Implement:
- Greenhouse URL matching
- title/company/location/description/applyUrl extraction
- adapter diagnostics output

**Step 2: Wire the adapter into the importer**

Call the adapter after HTML fetch and before generic extraction. Keep fallback semantics in the service.

**Step 3: Run targeted tests**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts`
Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/jobs/greenhouse-importer.ts apps/api/src/jobs/job-importer.service.ts apps/api/src/jobs/job-importer.service.test.ts
git commit -m "Add Greenhouse job importer adapter"
```

### Task 3: Verify no regressions

**Files:**
- Verify existing files only

**Step 1: Run broader API tests**

Run: `npm run test --workspace @rolecraft/api`
Expected: PASS

**Step 2: Run API build**

Run: `npm run build --workspace @rolecraft/api`
Expected: PASS

**Step 3: Commit if needed**

If verification triggers tiny cleanup changes, commit them with a focused message.
