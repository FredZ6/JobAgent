# Happy-Path API E2E Design

## Goal

Add a first real happy-path end-to-end test that proves the main product loop can run from saved candidate context through job import, analysis, resume generation, prefill, and Application Review data retrieval.

## Why This Slice

The repo already has strong unit and service-level coverage, plus a minimal runtime smoke test for `/profile` and `/settings/llm`. What is still missing is one higher-signal test that proves the main product workflow actually holds together as a system.

This test should be:

- stronger than unit tests
- more realistic than isolated controller tests
- less brittle than browser-driven UI automation

That makes API-level end-to-end coverage the right first step.

## Recommended Scope

The first happy-path should cover this sequence through real HTTP requests:

1. `PUT /profile`
2. `PUT /settings/llm`
3. `POST /jobs/import-by-url`
4. `POST /jobs/:id/analyze`
5. `POST /jobs/:id/generate-resume`
6. `POST /jobs/:id/prefill`
7. `GET /applications/:id`

The test should stop once the Application Review payload is available. It should not continue into approval, submission review, or final submit flows.

## Test Shape

### File Placement

Place the test beside the existing runtime smoke coverage:

- `apps/api/test/happy-path.e2e.test.ts`

### Execution Model

Like the existing `runtime-smoke.test.ts`, the first version should run only when explicitly enabled.

Recommended gate:

- `RUN_RUNTIME_HAPPY_PATH=1`

This keeps the test available and real without making every default `npm test` run slower or more environment-dependent.

## Controlled Dependencies

This test should use:

- a real Nest application
- a real Prisma database connection
- real HTTP requests

But it should explicitly control unstable external dependencies.

### Job Import

Do not depend on real external job pages. Use the repo's deterministic import behavior so the request produces a stable imported job record without relying on live scraping.

### Analysis and Resume Generation

Run these in mock mode:

- `JOB_ANALYSIS_MODE=mock`
- `JOB_RESUME_MODE=mock`

The purpose of this e2e is not to validate OpenAI or Gemini. Provider behavior already has focused tests. This test should prove the business flow remains intact.

### Prefill Worker

Do not run a real browser-backed Playwright worker in this first happy-path.

Instead, stub the worker HTTP boundary that `ApplicationsService` calls. The API route and all database writes should remain real, but the worker should return a deterministic successful payload controlled by the test.

This is the best tradeoff because it keeps these parts real:

- `POST /jobs/:id/prefill`
- application creation
- workflow/event writes
- automation session writes
- Application Review response shaping

while avoiding flaky browser/runtime dependencies.

## Prefill Stub Boundary

The stub should live at the outbound worker HTTP edge, not above it.

That means:

- do **not** mock `prefillJob()`
- do **not** mock `prefillJobDirect()`
- do **not** skip persistence logic
- only intercept the worker HTTP request and return a stable response

The stubbed worker result should be minimal but structurally complete enough to support Application Review reads:

- completed/success status
- at least one `fieldResult`
- at least one `workerLog` entry
- stable screenshot metadata or an empty screenshot list
- any automation-session-compatible fields needed by current persistence code

## Key Assertions

The test should assert only the most meaningful milestones:

- profile save succeeds
- settings save succeeds
- job import returns a persisted job id
- analysis completes successfully
- resume generation completes successfully
- prefill creates an application successfully
- application review fetch returns:
  - application
  - job
  - resumeVersion
  - persisted execution evidence
  - latest automation session when available

## Intentional Non-Goals

Do not make this first happy-path responsible for:

- browser selector correctness
- real external job scraping
- live OpenAI/Gemini execution
- approval/submission flows
- front-end browser interactions

Those are separate concerns and would make the test slower and more brittle without improving the signal we need right now.

## Acceptance Criteria

1. The repo contains `apps/api/test/happy-path.e2e.test.ts`.
2. The test performs the real API sequence from profile/settings through prefill and application review fetch.
3. Analysis and resume generation run in mock mode during the test.
4. Prefill uses a deterministic worker HTTP stub instead of a real browser worker.
5. The test proves Application Review data is persisted and readable.
6. The test is opt-in through an explicit environment variable and does not slow ordinary default test runs.
