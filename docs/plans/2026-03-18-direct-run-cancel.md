# Direct Run Cancel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add honest cooperative cancel support for running direct workflow runs without introducing rollback semantics or pretending the API can hard-stop already-completed work.

**Architecture:** Add a small process-local cancellation registry for active direct workflow runs, merge its abort signal into the existing direct execution paths, and extend the current cancel endpoint to allow `direct + running`. Keep the current workflow-run status model and UI surfaces, but update them to explain the API-process-only safe-cancellation boundary clearly.

**Tech Stack:** NestJS, TypeScript, Prisma, Next.js, React, Vitest, Docker Compose

---

### Task 1: Add failing tests for direct-run cancel eligibility

**Files:**
- Create: `apps/api/src/workflow-runs/direct-run-cancellation-registry.service.test.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- a running direct run can enter the cancel path if it is registered in the current API process
- a direct run that is not registered returns a clear error
- direct completed/failed/cancelled runs still reject cancel
- bulk cancel still skips direct runs for now

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
```

Expected:
- FAIL because direct runs still reject cancel unconditionally

**Step 3: Write minimal implementation**

Add a new direct-run cancellation registry service and update cancel-service validation to use it for `direct + running`.

**Step 4: Run test to verify it passes**

Run:
```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
```

Expected:
- PASS

### Task 2: Add failing tests for direct-service cancellation checkpoints

**Files:**
- Modify: `apps/api/src/analysis/direct-analysis.service.test.ts`
- Modify: `apps/api/src/resume/direct-resume.service.test.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/lib/workflow-run-cancellation.ts`
- Create: `apps/api/src/workflow-runs/direct-run-cancellation-registry.service.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- direct analyze stops and settles cleanly when its signal is aborted at a safe checkpoint
- direct resume stops before persisting a resume version when cancelled in time
- direct prefill stops honestly and preserves the current application failure-on-cancel behavior where applicable

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- direct-analysis.service.test.ts
npm run test --workspace @openclaw/api -- direct-resume.service.test.ts
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

Expected:
- FAIL because no direct-run registry signal is wired yet

**Step 3: Write minimal implementation**

Implement the registry and thread its `AbortSignal` through:
- `DirectAnalysisService.analyzeJob()`
- `DirectResumeService.generateResume()`
- `ApplicationsService.prefillJobDirect()`

Add registry cleanup on terminal states.

**Step 4: Run test to verify it passes**

Run the same targeted suites again.

Expected:
- PASS

### Task 3: Wire direct cancel into the public entry points

**Files:**
- Modify: `apps/api/src/analysis/analysis.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/workflow-runs/workflow-run-cancel.service.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- a direct run created through the public analyze/resume/prefill path is cancellable while still running
- cancel does not immediately force the run to `cancelled`; it settles when the direct path hits a safe checkpoint

**Step 2: Run test to verify it fails**

Run the most targeted API suites for each path.

**Step 3: Write minimal implementation**

Make sure public direct execution paths register/carry the cancellation signal and settle the run honestly on cancellation.

**Step 4: Run test to verify it passes**

Re-run the targeted suites.

### Task 4: Add failing frontend tests for direct-run cancel affordances

**Files:**
- Modify: `apps/web/src/lib/workflow-run-status.test.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/workflow-runs/[id]/page.tsx`

**Step 1: Write the failing tests**

Add tests that expect:
- running direct runs now show `Cancel run`
- direct-run helper copy says:
  - `Stops the run at the next safe cancellation point in this API process.`

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/web -- workflow-run-status.test.ts
```

Expected:
- FAIL because direct running rows still do not expose cancel guidance

**Step 3: Write minimal implementation**

Update the workflow-run status helper and the two UI surfaces to expose the direct-running cancel affordance with the new copy.

**Step 4: Run test to verify it passes**

Run the targeted web suite again.

Expected:
- PASS

### Task 5: Run full verification

**Files:**
- No new files required

**Step 1: Run targeted tests**

```bash
npm run test --workspace @openclaw/api -- workflow-run-cancel.service.test.ts
npm run test --workspace @openclaw/api -- direct-analysis.service.test.ts
npm run test --workspace @openclaw/api -- direct-resume.service.test.ts
npm run test --workspace @openclaw/api -- applications.service.test.ts
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
- a real direct run can be cancelled while `running`
- the run settles as `cancelled` only if the safe checkpoint catches it in time
- already-completed direct runs stay `completed`
- Temporal cancel behavior still works unchanged

### Task 6: Sync docs

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Update scope and notes**

Document the new direct-run cancel semantics and their single-process boundary.

**Step 2: Record verification**

Add the verification outcomes and any runtime caveats, especially that direct cancel is currently API-process-local.
