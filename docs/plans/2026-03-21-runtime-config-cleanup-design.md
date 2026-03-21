# Runtime Config Cleanup Design

## Goal

Reduce the remaining high-frequency `process.env` reads in server-side business code by moving mode, URL, path, and port resolution into thin helpers in `@rolecraft/config`.

## Scope

- Add thin runtime helpers to `packages/config/src/env.ts` for:
  - job import mode
  - analysis mode
  - resume mode
  - API base URL
  - worker runtime URL
  - application storage directory
  - service port
- Refactor the main API and worker call sites to use those helpers.
- Add unit tests for the new helpers in `packages/config/src/env.test.ts`.

## Non-Goals

- Unifying browser-side or Next.js client env handling in `apps/web/src/lib/api.ts`.
- Refactoring `CHROMIUM_EXECUTABLE_PATH` in the PDF service.
- Replacing every `process.env` read in the repository in a single slice.
- Introducing one giant runtime config object that all services must consume.

## Problem

The repository already centralized Temporal enablement and internal worker auth, but a second layer of runtime decisions still lives inside business services and workers:

- `JOB_IMPORT_MODE`
- `JOB_ANALYSIS_MODE`
- `JOB_RESUME_MODE`
- `API_URL`
- `WORKER_URL`
- `APPLICATION_STORAGE_DIR`
- `PORT`

That leaves mode and endpoint behavior scattered across API services, workers, and bootstraps, which raises maintenance cost and makes future changes harder to audit.

## Recommended Design

### Thin Runtime Helpers

Add the following helpers to `packages/config/src/env.ts`:

- `resolveJobImportRuntime(env)`
- `resolveAnalysisRuntime(env)`
- `resolveResumeRuntime(env)`
- `resolveApiBaseUrl(env, fallback?)`
- `resolveWorkerRuntime(env, fallback?)`
- `resolveApplicationStorageDir(env, fallback?)`
- `resolveServicePort(env, fallback?)`

Each helper should stay narrow:

- mode helpers return `{ mode: "mock" | "live" }`
- URL/path helpers trim input and apply a default
- port helper parses an integer with a fallback

### Call-Site Refactors

Use those helpers in these high-value server-side locations:

- `apps/api/src/jobs/job-importer.service.ts`
- `apps/api/src/analysis/llm-analysis.service.ts`
- `apps/api/src/resume/llm-resume.service.ts`
- `apps/api/src/internal/long-answer.service.ts`
- `apps/api/src/resume/resume.service.ts`
- `apps/api/src/applications/applications.service.ts`
- `apps/api/src/main.ts`
- `apps/worker-temporal/src/activities.ts`
- `apps/worker-playwright/src/prefill.ts`
- `apps/worker-playwright/src/index.ts`

### Keep Web and PDF Runtime Separate for Now

Do not pull `apps/web/src/lib/api.ts` into this slice, because browser/client env handling has a different lifecycle than the API and workers.

Also leave `CHROMIUM_EXECUTABLE_PATH` alone in this round. It is a valid runtime concern, but it does not carry the same maintenance cost as the repeated mode/URL/path reads above.

## Verification

- Add helper tests to `packages/config/src/env.test.ts`.
- Reuse existing service/worker tests where possible.
- Run:
  - `npm run test`
  - `npm run build`

## Acceptance Criteria

1. `JOB_IMPORT_MODE`, `JOB_ANALYSIS_MODE`, and `JOB_RESUME_MODE` are no longer read directly inside business services.
2. `API_URL`, `WORKER_URL`, `APPLICATION_STORAGE_DIR`, and `PORT` high-frequency reads are centralized in `@rolecraft/config`.
3. API and worker call sites use the new helpers.
4. `packages/config` has unit coverage for the new runtime helpers.
5. Full repository tests and builds still pass.
