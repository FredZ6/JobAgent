# Browser Web E2E Design

## Goal

Add a first browser-level happy-path test that proves the core user flow works in a real browser: candidate setup, job import, analysis, resume generation, prefill, and application review.

## Scope

- Add Playwright-based browser e2e infrastructure under `apps/web`.
- Cover one happy-path journey:
  - `Profile`
  - `Settings`
  - `Jobs`
  - `Job detail`
  - `Analyze`
  - `Generate resume`
  - `Prefill`
  - `Application Review`
- Start real `web`, `api`, and `postgres`.
- Keep `import`, `analysis`, and `resume` in mock mode.
- Stub the prefill worker with a deterministic test server.

## Non-Goals

- Full Docker Compose browser testing.
- Live LLM/provider verification.
- Real Playwright worker/browser automation inside the prefill worker.
- Covering `Submission Review`, workflow detail, bulk actions, or compare flows in the first browser e2e.

## Problem

The repo already has:

- unit and component tests
- API-level runtime happy-path coverage

But it still lacks the most user-visible verification layer:

- browser interaction
- real route transitions
- real form submission behavior
- real review UI rendering after a completed prefill

That leaves the highest-risk path, “web interaction -> API -> review UI”, mostly guarded by lower-level tests and manual checking.

## Recommended Design

### Test Environment

Run a real browser against:

- a real Next.js web server
- a real Nest API
- a real Postgres container

Control flakiness by configuring:

- `JOB_IMPORT_MODE=mock`
- `JOB_ANALYSIS_MODE=mock`
- `JOB_RESUME_MODE=mock`
- `TEMPORAL_ENABLED=false`
- `WORKER_URL` pointing to a local test stub server

This keeps the browser path real while stabilizing external dependencies.

### File Structure

Add a small Playwright setup under `apps/web`:

- `apps/web/playwright.config.ts`
- `apps/web/e2e/happy-path.spec.ts`
- `apps/web/e2e/support/runtime.ts`

The runtime helper will be responsible for:

- starting/stopping a Postgres container
- applying Prisma migrations
- launching the API process
- launching the web process
- hosting a minimal worker stub HTTP server

### Happy-Path Coverage

The first spec should:

1. Save a candidate profile
2. Save LLM settings
3. Import a job from the jobs page
4. Open job detail
5. Run analyze
6. Generate a resume
7. Run prefill
8. Open application review
9. Assert that key evidence blocks appear

### Selector Strategy

Prefer semantic selectors first:

- `getByRole(...)`
- `getByLabel(...)`
- `getByPlaceholder(...)`

Only add `data-testid` where a key path would otherwise be brittle.

### Verification Targets

The test should assert user-visible outcomes such as:

- success messages after saving profile and settings
- imported job visibility
- status changes after analyze and resume generation
- presence of application review content:
  - field results
  - worker log
  - automation session UI

## Verification

- Add the Playwright harness and first happy-path spec.
- Run the spec in isolation.
- Run the existing repo build/tests to ensure no regression:
  - `npm run test`
  - `npm run build`
