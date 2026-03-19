# Running Temporal Run Cancel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Allow running Temporal workflow runs to stop at the next safe cancellation point without pretending direct work can be hard-interrupted or rolled back.

**Architecture:** Keep the existing cancel endpoint and workflow-run status model, but extend the Temporal-only cancel path to `running` runs and add cooperative cancellation checks inside the internal direct execution flow. UI changes stay small and only expose the richer cancel affordance on existing Job Detail and Run Detail surfaces.

**Tech Stack:** NestJS, TypeScript, Prisma, Temporal, Next.js, React, Vitest, Docker Compose

---

### Task 1: Add failing backend tests for running Temporal cancel

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- `cancelWorkflowRun()` accepts `status=running` for Temporal runs
- direct runs still reject cancel
- bulk-cancel eligibility keeps skipping running runs for now

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
```

Expected:
- FAIL because the service still rejects `running`

**Step 3: Write minimal implementation**

Update cancel validation to allow `queued | running` for Temporal runs.

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
```

Expected:
- PASS

### Task 2: Add failing tests for cooperative cancellation checkpoints

**Files:**
- Modify: `apps/api/src/internal/internal.controller.test.ts` or create if missing
- Modify: `apps/api/src/analysis/direct-analysis.service.test.ts`
- Modify: `apps/api/src/resume/direct-resume.service.test.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- internal direct entry points check whether the run was cancelled before doing work
- safe checkpoint checks prevent final writes for cancelled running Temporal runs

**Step 2: Run test to verify it fails**

Run the most targeted failing suites.

**Step 3: Write minimal implementation**

Add a small cancellation-check helper in the API layer and call it from each direct path at the approved checkpoints.

**Step 4: Run test to verify it passes**

Re-run the targeted suites.

### Task 3: Add failing frontend tests for running Temporal cancel affordance

**Files:**
- Modify: `apps/web/src/lib/workflow-run-status.test.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/[id]/page.tsx`

**Step 1: Write the failing tests**

Add tests for:
- running Temporal runs now expose cancel guidance
- copy says `Stops the run at the next safe cancellation point.`

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/web -- workflow-run-status.test.ts
```

Expected:
- FAIL because running cancel guidance does not exist yet

**Step 3: Write minimal implementation**

Update the status-copy helper and the two UI surfaces to expose cancel for running Temporal runs.

**Step 4: Run test to verify it passes**

Run the targeted web suite again.

### Task 4: Run full verification

**Files:**
- No new files required

**Step 1: Run targeted tests**

```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
npm run test --workspace @openclaw/api -- applications.service.test.ts
npm run test --workspace @openclaw/api -- resume.service.test.ts
npm run test --workspace @openclaw/api -- resume.controller.test.ts
npm run test --workspace @openclaw/web -- workflow-run-status.test.ts
```

**Step 2: Run full project verification**

```bash
npm test
npm run build
docker compose up --build -d
```

**Step 3: Run runtime checks**

Verify:
- queued Temporal cancel still works
- running Temporal cancel now works at safe checkpoints
- direct cancel still fails

### Task 5: Sync docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Update scope and notes**

Document the new running Temporal cancel semantics.

**Step 2: Record verification**

Add the verification outcomes and any runtime caveats.
