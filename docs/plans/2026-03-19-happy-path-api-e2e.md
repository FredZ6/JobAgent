# Happy-Path API E2E Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a real API-level happy-path end-to-end test that covers profile, settings, job import, analysis, resume generation, prefill, and Application Review retrieval.

**Architecture:** Add one opt-in runtime API test under `apps/api/test/` that uses a real Nest app and real database writes while controlling unstable external dependencies. Run analysis and resume generation in mock mode and stub the outbound prefill worker HTTP request so the business flow remains real but deterministic.

**Tech Stack:** NestJS, Prisma, Vitest, Supertest, mock environment flags

---

### Task 1: Add the opt-in happy-path runtime test skeleton

**Files:**
- Create: `apps/api/test/happy-path.e2e.test.ts`

**Step 1: Write the failing test**

Create an opt-in test gated by `RUN_RUNTIME_HAPPY_PATH` that describes the intended API sequence but fails because the runtime flow is not implemented yet in the test.

The test should clearly aim to cover:
- `PUT /profile`
- `PUT /settings/llm`
- `POST /jobs/import-by-url`
- `POST /jobs/:id/analyze`
- `POST /jobs/:id/generate-resume`
- `POST /jobs/:id/prefill`
- `GET /applications/:id`

**Step 2: Run the test to confirm the failure**

Run:

```bash
RUN_RUNTIME_HAPPY_PATH=1 npm run test --workspace @openclaw/api -- happy-path.e2e.test.ts
```

Expected:
- FAIL
- the failure is due to missing runtime test setup, not syntax errors

**Step 3: Commit**

```bash
git add apps/api/test/happy-path.e2e.test.ts
git commit -m "Add happy-path runtime test skeleton"
```

### Task 2: Build the runtime harness and deterministic dependency controls

**Files:**
- Modify: `apps/api/test/happy-path.e2e.test.ts`
- Read: `apps/api/test/runtime-smoke.test.ts`
- Read: `apps/api/src/applications/applications.service.ts`
- Read: `apps/api/src/jobs/jobs.controller.ts`

**Step 1: Add runtime harness setup**

Set up the test so it can talk to the running local stack through HTTP, similar in spirit to `runtime-smoke.test.ts`.

Use explicit environment assumptions for:
- API base URL
- mock analysis mode
- mock resume mode

**Step 2: Add deterministic external controls**

Control the unstable parts:
- use deterministic job import behavior
- ensure analysis/resume are mock-backed
- intercept or stub the outbound prefill worker HTTP boundary

The stub must return a successful payload with enough data to persist Application Review evidence cleanly.

**Step 3: Run the happy-path test**

Run:

```bash
RUN_RUNTIME_HAPPY_PATH=1 npm run test --workspace @openclaw/api -- happy-path.e2e.test.ts
```

Expected:
- PASS
- the test reaches the prefill and application-review read stages

**Step 4: Commit**

```bash
git add apps/api/test/happy-path.e2e.test.ts
git commit -m "Implement happy-path API e2e flow"
```

### Task 3: Tighten assertions around Application Review output

**Files:**
- Modify: `apps/api/test/happy-path.e2e.test.ts`

**Step 1: Add the smallest high-value assertions**

Assert that:
- profile/settings writes succeed
- imported job id is present
- analysis result is completed
- resume version is completed
- prefill returns an application id
- `GET /applications/:id` includes:
  - `application`
  - `job`
  - `resumeVersion`
  - `fieldResults`
  - execution evidence
  - latest automation session when available

**Step 2: Re-run the test**

Run:

```bash
RUN_RUNTIME_HAPPY_PATH=1 npm run test --workspace @openclaw/api -- happy-path.e2e.test.ts
```

Expected:
- PASS
- failures, if any, point to actual business regressions

**Step 3: Commit**

```bash
git add apps/api/test/happy-path.e2e.test.ts
git commit -m "Assert happy-path application review data"
```

### Task 4: Verify the new happy-path test does not slow ordinary test runs

**Files:**
- Modify only if needed: `apps/api/test/happy-path.e2e.test.ts`

**Step 1: Verify default behavior**

Run:

```bash
npm run test --workspace @openclaw/api
```

Expected:
- PASS
- the new happy-path test is skipped unless explicitly enabled

**Step 2: Verify explicit runtime behavior**

Run:

```bash
RUN_RUNTIME_HAPPY_PATH=1 npm run test --workspace @openclaw/api -- happy-path.e2e.test.ts
```

Expected:
- PASS

**Step 3: Commit any gating fix if needed**

If the test accidentally runs by default or requires a gating tweak, make the minimal fix and commit it.

### Task 5: Mark the happy-path checklist item complete

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Update checklist status**

Mark the happy-path end-to-end checklist item as completed after the runtime test is implemented and verified.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark happy-path e2e checklist item complete"
```
