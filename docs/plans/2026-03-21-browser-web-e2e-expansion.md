# Browser Web E2E Expansion Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand browser-level Playwright coverage with importer fallback, unresolved item handling, and workflow pause/resume paths while keeping the local runtime harness lightweight and deterministic.

**Architecture:** Reuse the existing Playwright runtime harness to start Postgres, API, Web, and a worker stub. Add Prisma-backed fixture seeding plus a small fake Temporal signal mode so browser tests can exercise unresolved item handling and workflow controls without a real Temporal cluster.

**Tech Stack:** Playwright, Next.js, NestJS, Prisma, TypeScript, Vitest-compatible repo tooling

---

### Task 1: Add browser e2e plan docs

**Files:**
- Create: `docs/plans/2026-03-21-browser-web-e2e-expansion-design.md`
- Create: `docs/plans/2026-03-21-browser-web-e2e-expansion.md`

**Step 1: Save the approved design**

Write the validated browser e2e expansion design to the design doc.

**Step 2: Save the implementation plan**

Write this implementation plan to the plan doc.

**Step 3: Commit**

```bash
git add docs/plans/2026-03-21-browser-web-e2e-expansion-design.md docs/plans/2026-03-21-browser-web-e2e-expansion.md
git commit -m "docs: plan browser web e2e expansion"
```

### Task 2: Add importer fallback browser test

**Files:**
- Create: `apps/web/e2e/importer-quality.e2e.ts`
- Modify: `apps/web/e2e/support/runtime.ts`

**Step 1: Write the failing test**

Add a browser test that imports a fallback job and expects:

- `Fallback import` on the jobs page
- `Import quality` on job detail
- fallback/warning diagnostics copy on the detail page

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e --workspace @rolecraft/web -- importer-quality.e2e.ts`

Expected: FAIL because the dedicated spec and/or runtime helpers are not fully wired yet.

**Step 3: Write minimal implementation**

Add the spec and any minimal runtime helper needed to keep the import path deterministic.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e --workspace @rolecraft/web -- importer-quality.e2e.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/e2e/importer-quality.e2e.ts apps/web/e2e/support/runtime.ts
git commit -m "test: add importer fallback browser e2e"
```

### Task 3: Add unresolved item browser test

**Files:**
- Create: `apps/web/e2e/unresolved-items.e2e.ts`
- Modify: `apps/web/e2e/support/runtime.ts`

**Step 1: Write the failing test**

Add a browser test that opens a seeded application review, resolves one unresolved item, opens submission review, and ignores another item.

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e --workspace @rolecraft/web -- unresolved-items.e2e.ts`

Expected: FAIL because the seeded unresolved fixture does not exist yet.

**Step 3: Write minimal implementation**

Extend runtime support with a Prisma-backed unresolved-item fixture and update the spec to use it.

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e --workspace @rolecraft/web -- unresolved-items.e2e.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/e2e/unresolved-items.e2e.ts apps/web/e2e/support/runtime.ts
git commit -m "test: add unresolved item browser e2e"
```

### Task 4: Add workflow pause/resume browser test

**Files:**
- Create: `apps/web/e2e/workflow-run-controls.e2e.ts`
- Modify: `apps/web/e2e/support/runtime.ts`
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-pause-resume.service.ts`

**Step 1: Write the failing test**

Add a browser test that opens a seeded temporal workflow run, pauses it, then resumes it.

**Step 2: Run test to verify it fails**

Run: `npm run test:e2e --workspace @rolecraft/web -- workflow-run-controls.e2e.ts`

Expected: FAIL because the runtime has no temporal fixture and pause/resume depends on a real Temporal server.

**Step 3: Write minimal implementation**

Add:

- seeded temporal workflow run fixture support
- fake-temporal signal mode for browser e2e only
- the workflow controls spec

**Step 4: Run test to verify it passes**

Run: `npm run test:e2e --workspace @rolecraft/web -- workflow-run-controls.e2e.ts`

Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/e2e/workflow-run-controls.e2e.ts apps/web/e2e/support/runtime.ts apps/api/src/temporal/temporal.service.ts apps/api/src/workflow-runs/workflow-run-pause-resume.service.ts
git commit -m "test: add workflow controls browser e2e"
```

### Task 5: Full verification

**Files:**
- Test: `apps/web/e2e/*.e2e.ts`

**Step 1: Run browser e2e suite**

Run: `npm run test:e2e --workspace @rolecraft/web`

Expected: PASS

**Step 2: Run full repo test suite**

Run: `npm run test`

Expected: PASS

**Step 3: Run full repo build**

Run: `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add apps/web/e2e apps/api/src/temporal/temporal.service.ts apps/api/src/workflow-runs/workflow-run-pause-resume.service.ts
git commit -m "test: verify browser web e2e expansion"
```
