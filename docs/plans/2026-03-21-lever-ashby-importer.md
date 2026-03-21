# Lever And Ashby Importer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Lever and Ashby job-page adapters behind a lightweight importer registry so Rolecraft extracts better job data from common ATS pages without regressing the generic importer path.

**Architecture:** Keep `JobImporterService` as the sole orchestrator for mock/live mode, fetching, adapter selection, generic extraction, and synthetic fallback. Move adapter-specific logic into dedicated modules with a tiny shared registry so Greenhouse, Lever, and Ashby all follow the same contract and diagnostics shape.

**Tech Stack:** NestJS, TypeScript, Vitest, existing importer heuristics in `apps/api/src/jobs`

---

### Task 1: Add Adapter Registry Contract

**Files:**
- Create: `apps/api/src/jobs/job-importer-adapters.ts`
- Modify: `apps/api/src/jobs/greenhouse-importer.ts`
- Test: `apps/api/src/jobs/job-importer.service.test.ts`

**Step 1: Write the failing test**

Add a focused importer test that expects adapter diagnostics to still work when adapters are sourced from a shared registry instead of hard-coded Greenhouse branching.

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts`

Expected: FAIL because the shared adapter registry does not exist yet.

**Step 3: Write minimal implementation**

Create a small shared adapter type and exported ordered adapter list. Update the Greenhouse module to implement that shared contract without changing behavior.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/jobs/job-importer-adapters.ts apps/api/src/jobs/greenhouse-importer.ts apps/api/src/jobs/job-importer.service.test.ts
git commit -m "refactor: add importer adapter registry"
```

### Task 2: Add Lever Adapter

**Files:**
- Create: `apps/api/src/jobs/lever-importer.ts`
- Modify: `apps/api/src/jobs/job-importer.service.ts`
- Test: `apps/api/src/jobs/lever-importer.test.ts`
- Test: `apps/api/src/jobs/job-importer.service.test.ts`

**Step 1: Write the failing tests**

Add:

- adapter tests for Lever `matches(...)`
- adapter tests for successful Lever extraction
- importer tests for Lever adapter success and adapter insufficiency fallback

**Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/lever-importer.test.ts src/jobs/job-importer.service.test.ts`

Expected: FAIL because Lever adapter does not exist.

**Step 3: Write minimal implementation**

Implement `lever-importer.ts`, register it in the adapter list, and update `JobImporterService` to iterate the registry before the generic importer path.

**Step 4: Run tests to verify they pass**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/lever-importer.test.ts src/jobs/job-importer.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/jobs/lever-importer.ts apps/api/src/jobs/job-importer-adapters.ts apps/api/src/jobs/job-importer.service.ts apps/api/src/jobs/lever-importer.test.ts apps/api/src/jobs/job-importer.service.test.ts
git commit -m "feat: add Lever job importer adapter"
```

### Task 3: Add Ashby Adapter

**Files:**
- Create: `apps/api/src/jobs/ashby-importer.ts`
- Test: `apps/api/src/jobs/ashby-importer.test.ts`
- Modify: `apps/api/src/jobs/job-importer.service.ts`
- Test: `apps/api/src/jobs/job-importer.service.test.ts`

**Step 1: Write the failing tests**

Add:

- adapter tests for Ashby `matches(...)`
- adapter tests for successful Ashby extraction
- importer tests for Ashby adapter success and adapter insufficiency fallback

**Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/ashby-importer.test.ts src/jobs/job-importer.service.test.ts`

Expected: FAIL because Ashby adapter does not exist.

**Step 3: Write minimal implementation**

Implement `ashby-importer.ts`, add it to the registry, and keep `JobImporterService` registry-driven.

**Step 4: Run tests to verify they pass**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/ashby-importer.test.ts src/jobs/job-importer.service.test.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/jobs/ashby-importer.ts apps/api/src/jobs/job-importer-adapters.ts apps/api/src/jobs/job-importer.service.ts apps/api/src/jobs/ashby-importer.test.ts apps/api/src/jobs/job-importer.service.test.ts
git commit -m "feat: add Ashby job importer adapter"
```

### Task 4: Full API Verification

**Files:**
- Test: `apps/api/src/jobs/job-importer.service.test.ts`

**Step 1: Run focused API tests**

Run: `npm run test --workspace @rolecraft/api -- src/jobs/job-importer.service.test.ts src/jobs/greenhouse-importer.test.ts src/jobs/lever-importer.test.ts src/jobs/ashby-importer.test.ts`

Expected: PASS

**Step 2: Run full API test suite**

Run: `npm run test --workspace @rolecraft/api`

Expected: PASS

**Step 3: Run API build**

Run: `npm run build --workspace @rolecraft/api`

Expected: PASS

**Step 4: Commit**

```bash
git add apps/api/src/jobs/*.ts
git commit -m "test: verify ATS importer adapters"
```
