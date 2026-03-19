# Progress Log

## Session: 2026-03-11

### Phase 1: Requirements & Discovery
- **Status:** complete
- **Started:** 2026-03-11
- Actions taken:
  - Read the `using-superpowers` and `brainstorming` skill instructions.
  - Listed markdown files in the project root.
  - Read `spec.md`, `roadmap.md`, and `system-design.md`.
  - Verified the workspace is not a git repository after `git log` failed.
  - Initialized file-based planning artifacts for the project.
  - Confirmed with the user that round-one acceptance should exclude a runnable `worker-playwright` requirement.
- Files created/modified:
  - `task_plan.md` (created)
  - `findings.md` (created)
  - `progress.md` (created)

### Phase 2: Planning & Structure
- **Status:** complete
- Actions taken:
  - Proposed and got approval for project structure, data model, API surface, UI flow, and acceptance criteria.
  - Wrote the approved design doc to `docs/plans/2026-03-11-mvp-bootstrap-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-11-mvp-bootstrap.md`.
- Files created/modified:
  - `docs/plans/2026-03-11-mvp-bootstrap-design.md` (created)
  - `docs/plans/2026-03-11-mvp-bootstrap.md` (created)

### Phase 3: Implementation
- **Status:** complete
- Actions taken:
  - Scaffolded the monorepo with `npm workspaces`.
  - Added shared config, shared Zod schemas, Prisma schema, seed script, and environment files.
  - Implemented the NestJS API endpoints for health, settings, profile, jobs, and analysis.
  - Implemented the Next.js pages for overview, settings, profile, jobs, and job detail.
  - Added Docker Compose, Dockerfiles, README, and a placeholder `worker-playwright` app.
- Files created/modified:
  - `package.json` (created)
  - `pnpm-workspace.yaml` (created)
  - `.env.example` (created)
  - `.env` (created)
  - `docker-compose.yml` (created)
  - `README.md` (created)
  - `prisma/schema.prisma` (created)
  - `prisma/seed.ts` (created)
  - `apps/api/*` (created)
  - `apps/web/*` (created)
  - `packages/config/*` (created)
  - `packages/shared-types/*` (created)

### Phase 4: Testing & Verification
- **Status:** complete
- Actions taken:
  - Installed dependencies with `npm install`.
  - Generated the Prisma client.
  - Ran shared-types tests and fixed schema/test mismatches.
  - Ran API and Web builds and fixed TypeScript/export issues.
  - Verified root `npm run build`, root `npm test`, and `docker compose config`.
  - Started Docker services and traced startup failures to host port conflicts on `5432` and `6379`.
  - Removed unnecessary host port bindings for `postgres` and `redis`, then restarted the stack successfully.
  - Traced API `500` responses to missing Nest dependency injection metadata under `tsx watch`.
  - Added explicit `@Inject(...)` annotations and verified that `profile`, `settings`, `jobs`, import, and analysis endpoints recovered.
  - Rebuilt the API image with `openssl`, added `.dockerignore`, and re-verified the stack.
  - Verified the full round-one acceptance loop over HTTP: settings/profile persisted, job import succeeded, analysis completed, and job detail/list reflected the analysis.
- Files created/modified:
  - `apps/web/next.config.ts` (created)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/api/src/profile/profile.controller.ts` (modified)
  - `apps/api/src/settings/settings.controller.ts` (modified)
  - workspace `package.json` files (modified for test script behavior)
  - `docker-compose.yml` (modified)
  - `.dockerignore` (created)
  - `apps/api/Dockerfile` (modified)
  - `apps/api/src/jobs/jobs.controller.ts` (modified)
  - `apps/api/src/profile/profile.service.ts` (modified)
  - `apps/api/src/settings/settings.service.ts` (modified)
  - `apps/api/src/analysis/analysis.service.ts` (modified)
  - `apps/api/test/runtime-smoke.test.ts` (created)

### Phase 5: Delivery
- **Status:** complete
- Actions taken:
  - Collected final verification evidence for build, test, Docker health, and end-to-end HTTP flow.
  - Updated planning files with final decisions, fixes, and residual risks.
- Files created/modified:
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 6: Phase-Two Expansion
- **Status:** complete
- Actions taken:
  - Wrote the phase-two design and implementation docs for richer frontend interaction and resume generation.
  - Extended shared schemas for experience/project libraries and structured resume versions.
  - Extended Prisma with `resume_versions` plus new profile JSON fields.
  - Implemented resume generation endpoints and a mockable resume-generation service.
  - Enhanced the frontend with unsaved-state handling, validation, auto-redirect after import, job-level resume generation, and a Resume Review page.
  - Debugged Prisma schema rollout for existing profile rows by adding defaults on the new JSON fields.
  - Verified the second-phase flow over HTTP: profile update, job import, job analysis, resume generation, resume version listing, and resume detail retrieval.
- Files created/modified:
  - `docs/plans/2026-03-11-resume-generation-design.md` (created)
  - `docs/plans/2026-03-11-resume-generation.md` (created)
  - `packages/shared-types/src/resume.ts` (created)
  - `packages/shared-types/src/resume.test.ts` (created)
  - `apps/api/src/resume/*` (created)
  - `apps/web/src/app/resume-versions/[id]/page.tsx` (created)
  - `apps/web/src/components/structured-editors.tsx` (created)
  - `prisma/schema.prisma` (modified)
  - `prisma/seed.ts` (modified)
  - `README.md` (modified)

### Phase 20: Application Run Comparison
- **Status:** complete
- Actions taken:
  - Added a small frontend comparison helper that computes latest-vs-previous application run deltas for field states, screenshots, worker logs, and changed field values.
  - Added focused web tests covering changed states and missing prior fields.
  - Extended Job Detail with a `Run comparison` panel that appears when a job has at least two application runs.
  - Verified the comparison flow against a real job that already has two prefill runs.
- Files created/modified:
  - `docs/plans/2026-03-17-application-run-comparison-design.md` (created)
  - `docs/plans/2026-03-17-application-run-comparison.md` (created)
  - `apps/web/src/lib/application-comparison.ts` (created)
  - `apps/web/src/lib/application-comparison.test.ts` (created)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 21: Temporal Starter Slice
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-temporal-starter-slice-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-temporal-starter-slice.md`.
  - Added a new `worker-temporal` workspace with a Temporal worker, workflow, and analysis activity.
  - Extracted the old direct analysis logic into `DirectAnalysisService` and kept `AnalysisService` as the feature-flag switch between direct and workflow-backed execution.
  - Added a small API-side Temporal client/service plus an internal direct-analysis route for the worker activity.
  - Extended Docker Compose and `.env.example` with Temporal services and feature-flag settings.
  - Re-ran analysis-service tests, workspace tests, full builds, Docker rebuilds, direct-mode HTTP verification, and Temporal-mode HTTP verification.
  - Traced a failing Temporal activity to the worker using `localhost` inside Docker, corrected the worker `API_URL` to `http://api:3001`, and re-verified the workflow-backed analysis path.
- Files created/modified:
  - `docs/plans/2026-03-17-temporal-starter-slice-design.md` (created)
  - `docs/plans/2026-03-17-temporal-starter-slice.md` (created)
  - `apps/api/src/analysis/analysis.service.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.ts` (created)
  - `apps/api/src/analysis/analysis.service.test.ts` (created)
  - `apps/api/src/temporal/temporal.service.ts` (created)
  - `apps/api/src/internal/internal.controller.ts` (created)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/worker-temporal/package.json` (created)
  - `apps/worker-temporal/tsconfig.json` (created)
  - `apps/worker-temporal/Dockerfile` (created)
  - `apps/worker-temporal/src/index.ts` (created)
  - `apps/worker-temporal/src/workflows.ts` (created)
  - `apps/worker-temporal/src/activities.ts` (created)
  - `docker-compose.yml` (modified)
  - `.env.example` (modified)
  - `package-lock.json` (modified)
  - `apps/api/package.json` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 22: Temporal Resume Slice
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-temporal-resume-slice-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-temporal-resume-slice.md`.
  - Added a `DirectResumeService` so the old resume-generation business logic now has a reusable direct path.
  - Turned `ResumeService` into a feature-flag dispatcher between direct execution and Temporal-backed workflow execution.
  - Added `GenerateResumeWorkflow` plus a worker activity that calls the new internal direct-resume route.
  - Extended the internal API surface with `POST /internal/jobs/:id/generate-resume-direct`.
  - Re-ran resume-service tests, API/worker-temporal builds, direct-mode runtime verification, and Temporal-mode runtime verification.
  - Verified the Temporal path by confirming API submission logs, worker-side `direct resume generation` activity logs, a fresh persisted `resumeVersion`, and a fresh `resume_generated` milestone event.
- Files created/modified:
  - `docs/plans/2026-03-17-temporal-resume-slice-design.md` (created)
  - `docs/plans/2026-03-17-temporal-resume-slice.md` (created)
  - `apps/api/src/resume/direct-resume.service.ts` (created)
  - `apps/api/src/resume/resume.service.ts` (modified)
  - `apps/api/src/resume/resume.service.test.ts` (created)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/worker-temporal/src/workflows.ts` (modified)
  - `apps/worker-temporal/src/activities.ts` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 23: Temporal Prefill Slice
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-temporal-prefill-slice-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-temporal-prefill-slice.md`.
  - Split `ApplicationsService.prefillJob()` into a feature-flag dispatcher plus `prefillJobDirect()`.
  - Added `POST /internal/jobs/:id/prefill-direct` so the Temporal worker can call the direct prefill path without recursively re-entering the public route.
  - Extended `TemporalService`, `worker-temporal` workflows, and activities with `PrefillJobWorkflow` and `runDirectPrefill(jobId)`.
  - Re-ran application-service tests, API/worker-temporal builds, direct-mode runtime verification, and Temporal-mode runtime verification.
  - Verified the Temporal path by confirming API submission logs, worker-side `direct prefill` activity logs, a fresh persisted application row, and a fresh `prefill_run` milestone event.
- Files created/modified:
  - `docs/plans/2026-03-17-temporal-prefill-slice-design.md` (created)
  - `docs/plans/2026-03-17-temporal-prefill-slice.md` (created)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/worker-temporal/src/workflows.ts` (modified)
  - `apps/worker-temporal/src/activities.ts` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 27: Workflow Run Cancel Controls
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-run-cancel-controls-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-run-cancel-controls.md`.
  - Extended shared workflow-run status handling with `cancelled`.
  - Added `WorkflowRunCancelService`, `POST /workflow-runs/:id/cancel`, and a Temporal client cancel helper.
  - Updated Temporal workflow execution paths so a cancelled queued run is preserved as `cancelled` instead of being overwritten as `failed`.
  - Added queued Temporal `Cancel run` controls to Job Detail and kept running Temporal rows read-only with a clear hint.
  - Verified targeted tests, API/web builds, root `npm test`, root `npm run build`, queued Temporal cancel runtime behavior, and restoration to the default `TEMPORAL_ENABLED=false` Docker stack.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-run-cancel-controls-design.md` (created)
  - `docs/plans/2026-03-17-workflow-run-cancel-controls.md` (created)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.ts` (created)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts` (created)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 28: Workflow Run Live Status UX
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-run-live-status-ux-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-run-live-status-ux.md`.
  - Added a small web-side workflow-run status helper with tests for labels, compact summaries, error compression, and active-run detection.
  - Updated Job Detail to poll job detail, applications, and workflow runs every 3 seconds while any run is `queued` or `running`.
  - Clarified Job Detail workflow-run cards with state-specific copy for queued, running, completed, failed, and cancelled runs.
  - Updated dashboard job cards to render clearer latest-run summaries instead of raw `status · executionMode` strings.
  - Re-ran targeted web tests, workspace tests, full builds, and default-stack route/health verification.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-run-live-status-ux-design.md` (created)
  - `docs/plans/2026-03-17-workflow-run-live-status-ux.md` (created)
  - `apps/web/src/lib/workflow-run-status.ts` (created)
  - `apps/web/src/lib/workflow-run-status.test.ts` (created)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 29: Workflow Run Detail & History
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-run-detail-history-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-run-detail-history.md`.
  - Added `workflow_run_events` to Prisma and generated the updated Prisma client.
  - Added shared schemas for workflow-run events and workflow-run detail payloads, plus focused shared-types tests.
  - Extended `WorkflowRunsService` to persist lifecycle events for queued, started, completed, failed, cancelled, and retried transitions.
  - Added `GET /workflow-runs/:id/events` and expanded `GET /workflow-runs/:id` with linked job, application, resume, and retry context.
  - Added `Open run detail` entry points on Job Detail and implemented `/workflow-runs/[id]` with linked records, lifecycle history, and existing retry/cancel controls.
  - Verified targeted shared-types and API tests, workspace-wide `npm test`, standalone and root builds, Docker rebuilds, and runtime HTTP checks for the new detail/events routes plus a fresh workflow run that recorded real lifecycle events.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-run-detail-history-design.md` (created)
  - `docs/plans/2026-03-17-workflow-run-detail-history.md` (created)
  - `prisma/schema.prisma` (modified)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.test.ts` (created)
  - `apps/api/src/workflow-runs/workflow-run-retries.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-retries.service.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/workflow-runs/[id]/page.tsx` (created)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 30: Global Workflow Runs View
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-global-workflow-runs-view-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-global-workflow-runs-view.md`.
  - Added shared schemas for workflow-runs list queries, list rows, summary counts, and list responses.
  - Extended `WorkflowRunsService` and `WorkflowRunsController` with `GET /workflow-runs`, including lightweight filters and filtered summary counts.
  - Added a top-level `Workflow runs` navigation entry and a new `/workflow-runs` page with summary cards, filter controls, linked rows, and an empty state.
  - Verified targeted tests, root `npm test`, root `npm run build`, Docker rebuilds, and runtime HTTP checks for the new API route and frontend page.
- Files created/modified:
  - `docs/plans/2026-03-17-global-workflow-runs-view-design.md` (created)
  - `docs/plans/2026-03-17-global-workflow-runs-view.md` (created)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/components/app-shell.tsx` (modified)
  - `apps/web/src/app/workflow-runs/page.tsx` (created)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 31: Workflow Runs Search & Date Filters
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-runs-search-date-filters-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-runs-search-date-filters.md`.
  - Extended the shared workflow-runs list query schema with `q`, `from`, and `to`.
  - Added keyword and created-at date-range filtering to `WorkflowRunsService`, keeping summary counts aligned with the filtered result set.
  - Added keyword and date inputs to `/workflow-runs` and wired them through the existing list fetch path without expanding the page into a heavier console flow.
  - Re-ran targeted shared-types and workflow-runs service tests, root `npm test`, root `npm run build`, Docker rebuilds, and runtime HTTP checks for keyword/date filtering and the workflow-runs page.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-runs-search-date-filters-design.md` (created)
  - `docs/plans/2026-03-17-workflow-runs-search-date-filters.md` (created)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 32: Workflow Runs Sorting & Pagination
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-runs-sorting-pagination-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-runs-sorting-pagination.md`.
  - Extended the shared workflow-runs query/response schemas with sort fields, cursor support, and `pageInfo`.
  - Added in-memory workflow-runs sorting, cursor pagination, and filtered summary alignment to `WorkflowRunsService`.
  - Added sort controls and `Load more` behavior to `/workflow-runs`, resetting pagination whenever filters or sort settings change.
  - Re-ran targeted shared-types and workflow-runs service tests, root `npm test`, root `npm run build`, Docker rebuilds, and runtime HTTP checks for sorted and paginated workflow-runs queries.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-runs-sorting-pagination-design.md` (created)
  - `docs/plans/2026-03-17-workflow-runs-sorting-pagination.md` (created)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 33: Workflow Runs URL Query-State
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-url-query-state-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-url-query-state.md`.
  - Added a small workflow-runs query-state helper plus tests for parsing URL params and normalizing them back into shareable query strings.
  - Synced `/workflow-runs` filter/search/date/sort state into the URL with `router.replace(...)`, while keeping pagination cursor state in memory only.
  - Added a Suspense boundary around the workflow-runs page content so `useSearchParams()` remains build-safe in Next's static rendering path.
  - Re-ran targeted web tests, standalone web build, root `npm test`, root `npm run build`, Docker rebuilds, and runtime checks against deep-linked `/workflow-runs` URLs.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-url-query-state-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-url-query-state.md` (created)
  - `apps/web/src/lib/workflow-runs-query-state.ts` (created)
  - `apps/web/src/lib/workflow-runs-query-state.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

## Test Results
| Test | Input | Expected | Actual | Status |
|------|-------|----------|--------|--------|
| Repository history check | `git log --oneline -5` | Recent commits or a clear repo-state result | `fatal: not a git repository` | expected constraint |
| Shared schema tests | `npm run test --workspace @openclaw/shared-types` | Zod schema tests pass | 7 tests passed | pass |
| API build | `npm run build --workspace @openclaw/api` | API compiles cleanly | build succeeded | pass |
| Web build | `npm run build --workspace @openclaw/web` | Web app compiles cleanly | build succeeded | pass |
| Root build | `npm run build` | all workspaces compile | build succeeded | pass |
| Root test | `npm test` | workspace tests run successfully | shared-types passed; uncovered workspaces passed with `--passWithNoTests` | pass |
| Compose config | `docker compose config` | compose file validates | config rendered successfully | pass |
| Compose runtime | `docker compose up --build -d` | local stack starts | containers started successfully | pass |
| API health | `curl -sS http://localhost:3001/health` | healthy JSON payload | `{"status":"ok","service":"api"}` | pass |
| Web home | `curl -sS http://localhost:3000 | head -c 400` | HTML document returned | HTML shell returned | pass |
| Profile read | `curl -sS http://localhost:3001/profile` | persisted profile JSON | returned saved profile | pass |
| Settings read | `curl -sS http://localhost:3001/settings/llm` | persisted settings JSON | returned saved settings | pass |
| Job import | `POST /jobs/import-by-url` | stored job record | returned imported job JSON | pass |
| Job analysis | `POST /jobs/:id/analyze` | completed analysis result | returned completed analysis JSON | pass |
| Job detail after analysis | `GET /jobs/:id` | includes analysis record | returned `analyses` array with saved analysis | pass |
| Shared resume schema tests | `npm run test --workspace @openclaw/shared-types` | resume/profile schema tests pass | 10 tests passed | pass |
| Resume routes startup | `docker compose logs api --tail=120` | API starts with resume routes mapped | resume endpoints mapped and app started | pass |
| Profile extension save | `PUT /profile` | stores experience/project libraries | returned updated profile JSON | pass |
| Resume generation | `POST /jobs/:id/generate-resume` | stores a structured resume version | returned completed resume version JSON | pass |
| Resume versions list | `GET /jobs/:id/resume-versions` | returns persisted resume versions | returned saved version array | pass |
| Resume version detail | `GET /resume-versions/:id` | returns persisted resume version | returned saved resume version JSON | pass |
| Job detail with resume | `GET /jobs/:id` | includes `resumeVersions` | returned resume version in job detail payload | pass |
| Resume review page | `GET /resume-versions/:id` on web app | returns HTML document | HTML shell returned | pass |
| Resume print route | `GET /resume-versions/:id/print` | returns printable HTML | printable HTML returned | pass |
| Resume PDF route | `GET /resume-versions/:id/pdf` | returns PDF bytes | 34,185-byte PDF with `application/pdf` | pass |
| Resume Review route after PDF work | `GET /resume-versions/:id` on web app | returns HTML document | HTML shell returned | pass |
| Job Detail route after PDF work | `GET /jobs/:id` on web app | returns HTML document | HTML shell returned | pass |
| Application schemas | `npm run test --workspace @openclaw/shared-types` | application schemas validate statuses and payloads | 16 shared-type tests passed | pass |
| Application API tests | `npm run test --workspace @openclaw/api` | application service rules pass | 14 passed, 1 skipped | pass |
| Worker tests | `npm run test --workspace @openclaw/worker-playwright` | prefill helper logic passes | 1 test passed | pass |
| Root test after prefill work | `npm test` | all workspace tests succeed | API, worker, shared-types passed | pass |
| Root build after prefill work | `npm run build` | all workspaces compile | API, web, worker, shared-types built | pass |
| Application prefill runtime | `POST /jobs/:id/prefill` | persisted application with worker evidence | returned completed application JSON with screenshot path and worker log | pass |
| Application list runtime | `GET /jobs/:id/applications` | includes latest prefill run | returned application summary array | pass |
| Application approval runtime | `POST /applications/:id/approval` | approval state and review note update | returned updated `needs_revision` state and saved review note | pass |
| Screenshot serving runtime | `GET /applications/:id/screenshots/prefill.png` | returns real screenshot bytes | returned `200 image/png`, 319,622-byte PNG | pass |
| Application Review route | `GET /applications/:id` on web app | returns HTML document | HTML shell returned | pass |
| Shared tracker schema tests | `npm run test --workspace @openclaw/shared-types` | tracker/dashboard schema tests pass | 24 tests passed | pass |
| Dashboard API tests | `npm run test --workspace @openclaw/api` | dashboard aggregation tests pass | 15 passed, 1 skipped | pass |
| Dashboard web build | `npm run build --workspace @openclaw/web` | dashboard route compiles cleanly | build succeeded with `/dashboard` route | pass |
| Root test after tracker work | `npm test` | all workspace tests succeed with tracker changes | API 15 passed/1 skipped, worker 1 passed, shared-types 24 passed | pass |
| Root build after tracker work | `npm run build` | all workspaces compile with tracker changes | build succeeded | pass |
| Compose runtime after tracker work | `docker compose up --build -d` | stack rebuilds and starts with tracker changes | api, web, worker, postgres, redis started successfully | pass |
| Dashboard overview API | `curl -sS http://localhost:3001/dashboard/overview` | returns tracker metrics, pipeline, jobs, and recent activity | returned real aggregated JSON with metrics, pipeline, jobs, and 10 recent activity items | pass |
| Applications list API | `curl -sS http://localhost:3001/applications` | returns persisted application list for dashboard | returned saved application with linked job and resume summary | pass |
| Dashboard route | `curl -sS http://localhost:3000/dashboard` | returns dashboard HTML shell | returned HTML document with dashboard route and nav | pass |
| Shared submission-safe schema tests | `npm run test --workspace @openclaw/shared-types` | submission-safe application and dashboard schemas pass | 29 tests passed | pass |
| Submission-safe API tests | `npm run test --workspace @openclaw/api` | submission-safe application service and dashboard rules pass | 18 passed, 1 skipped | pass |
| Submission-safe API build | `npm run build --workspace @openclaw/api` | API compiles with new submission fields and routes | build succeeded after Prisma client refresh | pass |
| Submission-safe web build | `npm run build --workspace @openclaw/web` | submission review page compiles cleanly | build succeeded with `/applications/[id]/submission-review` route | pass |
| Root test after submission-safe work | `npm test` | all workspace tests succeed with submission-safe changes | API 18 passed/1 skipped, worker 1 passed, shared-types 29 passed | pass |
| Root build after submission-safe work | `npm run build` | all workspaces compile with submission-safe changes | build succeeded | pass |
| Submission review API | `GET /applications/:id/submission-review` | returns final manual-review payload | returned application, linked job/resume, unresolved count, and failed count | pass |
| Approval to ready-to-submit | `POST /applications/:id/approval` with `approved_for_submit` | approval and submission-prep states update together | returned `approvalStatus=approved_for_submit` and `submissionStatus=ready_to_submit` | pass |
| Mark submitted API | `POST /applications/:id/mark-submitted` | records manual submit outcome | returned `submissionStatus=submitted`, `submittedAt`, `submissionNote`, and a snapshot | pass |
| Dashboard after submission | `GET /dashboard/overview` after `mark-submitted` | job stage and pipeline reflect the final recorded outcome | returned `submitted: 1` and the job row moved to `stage=submitted` | pass |
| Submission review route | `GET /applications/:id/submission-review` on web app | returns HTML document | HTML shell returned | pass |
| Shared recovery-flow schema tests | `npm run test --workspace @openclaw/shared-types` | recovery request and event schemas pass | 34 tests passed | pass |
| Recovery-flow API tests | `npm run test --workspace @openclaw/api` | reopen/retry-ready service and dashboard activity rules pass | 21 passed | pass |
| Recovery-flow API build | `npm run build --workspace @openclaw/api` | API compiles with `application_events` and recovery routes | build succeeded after Prisma generate | pass |
| Recovery-flow web build | `npm run build --workspace @openclaw/web` | submission review page compiles with recovery actions and history | build succeeded with `/applications/[id]/submission-review` route | pass |
| Root test after recovery work | `npm test` | all workspace tests succeed with recovery changes | API 24 passed/1 skipped, worker 1 passed, shared-types 34 passed | pass |
| Root build after recovery work | `npm run build` | all workspaces compile with recovery changes | build succeeded | pass |
| Compose runtime after recovery work | `docker compose up --build -d` | stack rebuilds and starts with recovery changes | api, web, worker, postgres, redis started successfully | pass |
| Reopen submission API | `POST /applications/:id/reopen-submission` | `submitted` applications move back to `ready_to_submit` | returned `submissionStatus=ready_to_submit`, cleared `submittedAt`, and cleared final snapshot | pass |
| Application events API | `GET /applications/:id/events` | returns newest recovery events first | returned `submission_reopened`, `submission_failed`, and `submission_retry_ready` history entries | pass |
| Retry-ready API | `POST /applications/:id/mark-retry-ready` | `submit_failed` applications move back to `ready_to_submit` | returned `submissionStatus=ready_to_submit` with the new retry note | pass |
| Dashboard after recovery actions | `GET /dashboard/overview` after reopen and retry-ready | tracker stage and recent activity reflect recovery flow | returned `stage=ready_to_submit` and recent activity included `submission_reopened` and `submission_retry_ready` | pass |
| Shared timeline schema tests | `npm run test --workspace @openclaw/shared-types -- dashboard.test.ts` | timeline/history schemas parse correctly | 15 tests passed | pass |
| Dashboard history API tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | overview, timeline, and grouped history rules pass | 3 tests passed | pass |
| Dashboard API build after timeline work | `npm run build --workspace @openclaw/api` | API compiles with timeline/history routes | build succeeded | pass |
| Dashboard web build after timeline work | `npm run build --workspace @openclaw/web` | dashboard page compiles with timeline sections | build succeeded with `/dashboard` route | pass |
| Root test after timeline work | `npm test` | all workspace tests succeed with timeline changes | API 26 passed/1 skipped, worker 1 passed, shared-types 39 passed | pass |
| Root build after timeline work | `npm run build` | all workspaces compile with timeline changes | build succeeded on rerun after a transient Next manifest lookup failure | pass |
| Dashboard timeline API | `GET /dashboard/timeline` | returns a mixed job/application newest-first timeline | returned persisted submission recovery, prefill, resume, analysis, and import events | pass |
| Filtered dashboard timeline API | `GET /dashboard/timeline?entityType=application&eventType=submission_retry_ready&limit=5` | timeline filtering works | returned only the retry-ready application event | pass |
| Dashboard history API | `GET /dashboard/history` | returns grouped global/job/application history | returned grouped timelines with ordered job and application event lists | pass |
| Dashboard route after timeline work | `GET /dashboard` on web app | returns HTML document | HTML shell returned for the dashboard route | pass |
| Shared actor schema tests | `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts` | actor-aware application and dashboard schemas parse correctly | 30 tests passed | pass |
| Application actor tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | approval/submission/recovery writes include actor attribution | 20 tests passed | pass |
| Dashboard actor tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | overview/timeline/history expose persisted and derived actor attribution | 3 tests passed | pass |
| Root test after actor attribution | `npm test` | all workspaces succeed with actor-aware events | API 26 passed/1 skipped, worker 1 passed, shared-types 40 passed | pass |
| Root build after actor attribution | `npm run build` | all workspaces compile with actor-aware timeline payloads | build succeeded | pass |
| Actor-aware events API | `GET /applications/:id/events` | returns actor attribution for persisted events | latest `submission_failed` and `submission_retry_ready` returned `user / local-user` while older events fell back to `system / system` | pass |
| Actor-aware timeline API | `GET /dashboard/timeline?entityType=application&eventType=submission_retry_ready&limit=3` | returns actor attribution in filtered timeline feed | latest retry-ready event returned `user / local-user` | pass |
| Actor-aware history API | `GET /dashboard/history` | grouped job/application histories expose actor attribution | returned derived `api / apps-api`, `worker / playwright-worker`, and persisted `user / local-user` items | pass |
| Shared lightweight-audit schema tests | `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts` | summary-aware application and dashboard schemas parse correctly | 31 tests passed | pass |
| Applications lightweight-audit tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | application history filtering and summary generation work | 21 tests passed | pass |
| Dashboard lightweight-audit tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | dashboard timeline/history expose actor filtering and summary text | 3 tests passed | pass |
| Root test after lightweight-audit work | `npm test` | all workspaces succeed with summary-aware audit payloads | API 27 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after lightweight-audit work | `npm run build` | all workspaces compile with lightweight audit filters and summaries | build succeeded | pass |
| Filtered application events API | `GET /applications/:id/events?actorType=user&eventType=submission_retry_ready&limit=2` | application history filters by actor and event while returning summary text | returned filtered `submission_retry_ready` event with `user / local-user` and summary text | pass |
| Actor-filtered dashboard timeline API | `GET /dashboard/timeline?actorType=user&eventType=submission_retry_ready&limit=3` | dashboard timeline filters by actor and event while returning summary text | returned filtered retry-ready timeline item with summary text | pass |
| Summary-aware dashboard history API | `GET /dashboard/history` | grouped history includes summary strings for implicit and explicit events | returned summaries for global, job, and application timeline entries | pass |
| Submission review route after lightweight-audit work | `GET /applications/cmmtrobxu0006nq4fbudv5vfn/submission-review` on web app | returns HTML document with client-side history filters available | HTML shell returned | pass |
| Shared actor/source schema tests | `npm run test --workspace @openclaw/shared-types -- application.test.ts dashboard.test.ts` | audit schemas parse `actorId` and `source` correctly | 31 tests passed | pass |
| Applications actor/source tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | application event writes and reads expose `actorId/source` | 21 tests passed | pass |
| Dashboard actor/source tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | dashboard overview/timeline/history expose persisted and derived `actorId/source` | 3 tests passed | pass |
| Root test after actor/source work | `npm test` | all workspaces succeed with stronger audit attribution | API 27 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after actor/source work | `npm run build` | all workspaces compile with `actorId/source` in shared schemas, APIs, and UI | build succeeded after rerunning past the transient Next manifest issue | pass |
| Actor/source events API | `GET /applications/:id/events?actorType=user&limit=4` | newer user events expose persisted `actorId/source` while older rows stay honest | latest events returned `actorId=local-user` and `source=web-ui`, older rows still showed `source=system` | pass |
| Actor/source timeline API | `GET /dashboard/timeline?actorType=user&limit=4` | filtered timeline exposes `actorId/source` for persisted user events | latest retry-ready and failed events returned `actorId=local-user` and `source=web-ui` | pass |
| Health check after actor/source work | `curl -sS http://localhost:3001/health` | API remains healthy after the audit schema extension | `{\"status\":\"ok\",\"service\":\"api\"}` | pass |
| Applications query/search tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | application history supports `source/q/from/to` filtering | 21 tests passed | pass |
| Dashboard query/search tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | dashboard timeline supports `source/q/from/to` filtering | 3 tests passed | pass |
| Web build after audit-query work | `npm run build --workspace @openclaw/web` | dashboard and submission-review pages compile with query controls | build succeeded with larger dashboard and submission-review bundles | pass |
| Root test after audit-query work | `npm test` | all workspaces succeed with audit query/search changes | API 27 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after audit-query work | `npm run build` | all workspaces compile with audit query/search changes | build succeeded after rerunning past the intermittent Next manifest lookup issue | pass |
| Applications query/search API | `GET /applications/:id/events?source=web-ui&q=actor/source&from=2026-03-17&to=2026-03-17&limit=5` | application history filters by source, keyword, and date | returned only the two matching `web-ui` runtime-verification events on 2026-03-17 | pass |
| Dashboard query/search API | `GET /dashboard/timeline?source=web-ui&q=local-user&from=2026-03-17&to=2026-03-17&limit=5` | dashboard timeline filters by source, keyword, and date | returned only the two matching user events from 2026-03-17 | pass |
| Dashboard route after audit-query work | `GET /dashboard` on web app | returns dashboard HTML shell after query UI changes | HTML shell returned | pass |
| Submission review route after audit-query work | `GET /applications/cmmtrobxu0006nq4fbudv5vfn/submission-review` on web app | returns submission-review HTML shell after query UI changes | HTML shell returned | pass |
| Shared explicit-milestone schema tests | `npm run test --workspace @openclaw/shared-types -- application.test.ts` | shared application schemas accept explicit `prefill_run` events | 16 tests passed | pass |
| Applications explicit-prefill tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | prefill writes an explicit worker-attributed `prefill_run` event | 21 tests passed | pass |
| Dashboard explicit-milestone tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | dashboard prefers explicit milestone events over derived duplicates | 4 tests passed | pass |
| Root test after explicit milestone work | `npm test` | all workspaces succeed with explicit milestone persistence | API 28 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after explicit milestone work | `npm run build` | all workspaces compile with `JobEvent` and explicit prefill milestone support | build succeeded | pass |
| Explicit prefill event API | `GET /applications/cmmv1aji5000co74i4xf0zizy/events?eventType=prefill_run&limit=5` | returns persisted worker-attributed prefill milestone | returned `worker / playwright-worker / worker-prefill` plus screenshot and field counts | pass |
| Explicit import event timeline API | `GET /dashboard/timeline?eventType=job_imported&source=jobs-controller&limit=5` | returns persisted job-import milestone rather than a derived fallback | returned the new imported job with `source=jobs-controller` | pass |
| Explicit resume event timeline API | `GET /dashboard/timeline?eventType=resume_generated&source=resume-service&limit=5` | returns persisted resume-generation milestone | returned the new job with `source=resume-service` and the generated headline | pass |
| Explicit prefill timeline API | `GET /dashboard/timeline?eventType=prefill_run&source=worker-prefill&limit=5` | returns persisted prefill milestone rather than a derived fallback | returned the new application with `source=worker-prefill` and worker summary | pass |
| Grouped history after explicit milestone work | `GET /dashboard/history` | grouped job/application timelines prefer explicit milestones for new rows while older rows still fall back safely | new job showed `jobs-controller`, `analysis-service`, `resume-service`, and `worker-prefill`; older jobs remained on derived sources | pass |
| Applications entity-aware query tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | application history search matches raw ids and payload text | 22 tests passed | pass |
| Dashboard entity-aware query tests | `npm run test --workspace @openclaw/api -- dashboard.service.test.ts` | dashboard timeline search matches entity ids and business-context metadata | 5 tests passed | pass |
| Root test after entity-aware search work | `npm test` | all workspaces succeed with broader audit search matching | API 30 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after entity-aware search work | `npm run build` | all workspaces compile with entity-aware audit search changes | build succeeded | pass |
| Dashboard timeline by job id | `GET /dashboard/timeline?q=cmmv1affq0000o74i7dxfvkau&limit=5` | timeline search matches raw job ids | returned the imported job plus its related timeline items | pass |
| Application events by application id | `GET /applications/cmmv1aji5000co74i4xf0zizy/events?q=cmmv1aji5000co74i4xf0zizy&limit=5` | application history search matches raw application ids | returned the matching `prefill_run` event | pass |
| Dashboard timeline by URL fragment | `GET /dashboard/timeline?q=staff-platform-engineer&limit=5` | timeline search matches URL fragments present in metadata | returned the matching import event from `sourceUrl` metadata | pass |
| Application revision-loop tests | `npm run test --workspace @openclaw/api -- applications.service.test.ts` | repeated prefill runs create distinct application rows | 23 tests passed | pass |
| Web build after revision-loop work | `npm run build --workspace @openclaw/web` | Job Detail and Application Review compile with rerun controls and copy changes | build succeeded | pass |
| Root test after revision-loop work | `npm test` | all workspaces succeed with revision-loop changes | API 31 passed/1 skipped, worker 1 passed, shared-types 41 passed | pass |
| Root build after revision-loop work | `npm run build` | all workspaces compile with revision-loop changes | build succeeded | pass |
| Repeated prefill run API | `GET /jobs/cmmv1affq0000o74i7dxfvkau/applications` after rerun | the same job can hold multiple application rows without overwriting the old run | returned both `cmmv2dzm30001ue4hje29eiun` and `cmmv1aji5000co74i4xf0zizy` | pass |
| Job detail route after revision-loop work | `GET /jobs/cmmv1affq0000o74i7dxfvkau` on web app | route remains accessible after revision-loop UI changes | HTML shell returned | pass |
| Application review route after revision-loop work | `GET /applications/cmmv1aji5000co74i4xf0zizy` on web app | route remains accessible after adding rerun controls | HTML shell returned | pass |
| Application comparison helper tests | `npm run test --workspace @openclaw/web -- application-comparison.test.ts` | latest-vs-previous run deltas compute correctly | 2 tests passed | pass |
| Web build after application-run-comparison work | `npm run build --workspace @openclaw/web` | Job Detail compiles with the new comparison panel | build succeeded | pass |
| Root test after application-run-comparison work | `npm test` | all workspaces succeed with comparison helper coverage | API 31 passed/1 skipped, web 1 passed, worker 1 passed, shared-types 41 passed | pass |
| Root build after application-run-comparison work | `npm run build` | all workspaces compile with the run-comparison UI | build succeeded | pass |
| Compose runtime after application-run-comparison work | `docker compose up --build -d` | local stack starts after comparison UI changes | containers started successfully | pass |
| API health after application-run-comparison work | `curl -sS http://localhost:3001/health` | API remains healthy after the comparison phase | `{"status":"ok","service":"api"}` | pass |
| Application runs API for comparison job | `GET /jobs/cmmv1affq0000o74i7dxfvkau/applications` | comparison target job still exposes latest and previous application runs | returned both `cmmv2dzm30001ue4hje29eiun` and `cmmv1aji5000co74i4xf0zizy` | pass |
| Job detail route after application-run-comparison work | `GET /jobs/cmmv1affq0000o74i7dxfvkau` on web app | route remains accessible after the comparison panel lands | HTML shell returned | pass |

## Error Log
| Timestamp | Error | Attempt | Resolution |
|-----------|-------|---------|------------|
| 2026-03-11 | `git log` failed because the folder is not a git repository | 1 | Continued with document-based discovery only |
| 2026-03-11 | `prisma generate` failed with sandbox cache permissions | 1 | Re-ran with elevated permissions and succeeded |
| 2026-03-11 | Root tests failed because several workspaces had no test files | 1 | Updated non-covered workspaces to use `vitest --passWithNoTests` while keeping shared-types tests real |
| 2026-03-11 | `docker compose up --build -d` failed because host ports `5432` and `6379` were already in use | 1 | Removed those host bindings from Compose |
| 2026-03-11 | `GET /profile` and `GET /settings/llm` returned 500 despite healthy startup logs | 1 | Traced to Nest DI under `tsx watch`; fixed with explicit `@Inject(...)` |
| 2026-03-11 | Runtime smoke test could not call `localhost:3001` from sandboxed Vitest | 1 | Marked it opt-in with `RUN_RUNTIME_SMOKE` and used real HTTP verification outside Vitest |
| 2026-03-12 | Prisma could not add required JSON columns to `CandidateProfile` because existing rows lacked values | 1 | Added schema defaults for the new JSON fields and rebuilt the stack |
| 2026-03-16 | `package-lock.json` initially did not reflect the new API dependency declaration for Playwright | 1 | Re-ran `npm install` to synchronize the lock file before rebuilding Docker |
| 2026-03-16 | Screenshot evidence initially only existed as internal worker container paths | 1 | Mounted the shared storage volume into the API and added a screenshot-serving endpoint |
| 2026-03-16 | `web` build briefly failed because `buildApplicationScreenshotUrl` was declared twice during UI merge | 1 | Removed the duplicate helper and rebuilt successfully |
| 2026-03-16 | The live API container briefly used an outdated Prisma client after the submission-safe schema change | 1 | Ran `prisma db push` and `prisma generate` inside the running container, then restarted the API |
| 2026-03-16 | Recovery-flow build initially failed after adding `ApplicationEvent` access and mixed action handlers | 1 | Regenerated Prisma, wrapped event access behind a typed helper, split frontend submission vs. recovery handlers, and reran the full build |
| 2026-03-17 | The first `curl` to Job Detail immediately after a Docker rebuild returned `Empty reply from server` | 1 | Waited for the dev servers to settle and retried; the next request returned the expected HTML shell |
| 2026-03-17 | Root workspace build briefly failed with a missing Next.js `next-font-manifest.json` after the web workspace had already built cleanly | 1 | Re-ran the standalone web build, then re-ran the root build; the second root build passed |
| 2026-03-17 | Querying dashboard timeline by a raw job id returned no matches during explicit milestone runtime checks | 1 | Left search semantics unchanged for now and verified the new milestone rows through `eventType` and `source` filters instead |

## 5-Question Reboot Check
| Question | Answer |
|----------|--------|
| Where am I? | Phase 19, with revision-friendly prefill reruns now verified on top of the searchable audit and milestone-event model |
| Where am I going? | The next likely step is to build on this safer rerun flow, either by making revisions more guided or by improving comparison between runs |
| What's the goal? | Implement a runnable MVP starter slice for OpenClaw Job Agent |
| What have I learned? | Once the audit surface is searchable and trustworthy, the next best usability win is making reruns explicit and safe so users can iterate without losing old evidence |
| What have I done? | Planned, implemented, debugged runtime issues, and verified analysis, resume generation, PDF export, prefill, approval, tracker, submission-safe flow, submission recovery, grouped history/timeline, lightweight audit enhancements, actor/source attribution, audit query/search, explicit milestone-event persistence, entity-aware audit search, and the application revision loop |

### Phase 7: PDF Export Planning
- **Status:** complete
- Actions taken:
  - Re-synced planning files and verified the phase-two resume generation baseline.
  - Reviewed the current resume schema, API service, and Resume Review page to prepare a PDF export design.
  - Chose to start from a single-template PDF download flow for existing resume versions.
  - Wrote the approved PDF export design and implementation plan to `docs/plans/2026-03-16-resume-pdf-export-design.md` and `docs/plans/2026-03-16-resume-pdf-export.md`.
  - Added unit tests for printable resume mapping and PDF filename generation.
  - Implemented `GET /resume-versions/:id/print` and `GET /resume-versions/:id/pdf` in the API.
  - Added API-side print HTML rendering plus headless Chromium PDF generation in Docker.
  - Added `Download PDF` actions to Job Detail and Resume Review.
  - Verified print HTML, PDF headers, PDF bytes, root tests, root build, and Docker runtime.
- Files created/modified:
  - `docs/plans/2026-03-16-resume-pdf-export-design.md` (created)
  - `docs/plans/2026-03-16-resume-pdf-export.md` (created)
  - `apps/api/src/resume/resume-pdf.service.ts` (created)
  - `apps/api/src/resume/resume-pdf.service.test.ts` (created)
  - `apps/api/src/resume/resume.controller.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/api/package.json` (modified)
  - `apps/api/Dockerfile` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/resume-versions/[id]/page.tsx` (modified)
  - `README.md` (modified)

### Phase 8: Application Prefill & Human Approval Planning
- **Status:** complete
- Actions taken:
  - Re-read the roadmap, spec, and system-design references for prefill, human approval, and worker expectations.
  - Chose the narrow phase-four slice: best-effort prefill, screenshots, field results, and human review, with no final submission.
  - Wrote the approved design doc to `docs/plans/2026-03-16-application-prefill-human-approval-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-16-application-prefill-human-approval.md`.
- Files created/modified:
  - `docs/plans/2026-03-16-application-prefill-human-approval-design.md` (created)
  - `docs/plans/2026-03-16-application-prefill-human-approval.md` (created)
  - `task_plan.md` (modified)
  - `findings.md` (modified)

### Phase 8: Application Prefill & Human Approval Implementation
- **Status:** complete
- Actions taken:
  - Added shared Zod schemas for application records, approval updates, field results, and worker logs.
  - Extended Prisma with the `Application` model and wired application persistence into the API.
  - Implemented `POST /jobs/:id/prefill`, `GET /jobs/:id/applications`, `GET /applications/:id`, and `POST /applications/:id/approval`.
  - Implemented the `worker-playwright` HTTP prefill path with best-effort common-field suggestions, screenshot capture, and structured worker results.
  - Added API screenshot serving with `GET /applications/:id/screenshots/:name` and mounted shared application storage into both the worker and API containers.
  - Extended Job Detail with `Run prefill`, recent application history, and review links.
  - Added the `Application Review` page with approval actions, review notes, field results, worker log, and screenshot rendering.
  - Rebuilt the Docker stack and re-verified the end-to-end flow through import, analysis, resume generation, prefill, screenshot fetch, and approval updates.
- Files created/modified:
  - `packages/shared-types/src/application.ts` (created)
  - `packages/shared-types/src/application.test.ts` (created)
  - `packages/shared-types/src/index.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/applications/applications.controller.ts` (created/modified)
  - `apps/api/src/applications/applications.service.ts` (created/modified)
  - `apps/api/src/applications/applications.service.test.ts` (created)
  - `apps/api/src/jobs/jobs.controller.ts` (modified)
  - `apps/worker-playwright/src/index.ts` (modified)
  - `apps/worker-playwright/src/prefill.ts` (created)
  - `apps/worker-playwright/src/prefill.test.ts` (created)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/page.tsx` (created)
  - `apps/web/src/app/globals.css` (modified)
  - `docker-compose.yml` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 9: Tracker Dashboard Planning
- **Status:** complete
- Actions taken:
  - Re-read the product docs for tracker requirements, status funnels, and dashboard expectations.
  - Chose a single `/dashboard` page that combines job-progress and application-review views.
  - Decided to derive tracker state from existing records instead of adding a tracker-specific table.
  - Wrote the approved design doc to `docs/plans/2026-03-16-tracker-dashboard-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-16-tracker-dashboard.md`.
- Files created/modified:
  - `docs/plans/2026-03-16-tracker-dashboard-design.md` (created)
  - `docs/plans/2026-03-16-tracker-dashboard.md` (created)
  - `task_plan.md` (modified)
  - `findings.md` (modified)

### Phase 9: Tracker Dashboard Implementation
- **Status:** complete
- Actions taken:
  - Added shared tracker schemas for job stages, dashboard metrics, pipeline counts, approval breakdown, job tracker rows, recent activity, and the overview DTO.
  - Implemented `GET /dashboard/overview` and top-level `GET /applications` using derived state from existing persisted records.
  - Added a dashboard service test that verifies stage derivation and approval aggregation.
  - Extended the web API client with dashboard fetch helpers and filter types.
  - Added `/dashboard` with metric cards, pipeline strip, jobs board, applications table, recent activity, and local stage/approval filters.
  - Added the Dashboard link to the app navigation.
  - Re-ran root tests, root build, dashboard API calls, and web route checks.
- Files created/modified:
  - `packages/shared-types/src/dashboard.ts` (created)
  - `packages/shared-types/src/dashboard.test.ts` (created)
  - `packages/shared-types/src/index.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (created)
  - `apps/api/src/dashboard/dashboard.controller.ts` (created)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (created)
  - `apps/api/src/applications/applications.controller.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (created)
  - `apps/web/src/components/app-shell.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 10: Submission-Safe Flow Planning
- **Status:** complete
- Actions taken:
  - Re-read the spec and system design for the post-approval boundary and final manual submission requirement.
  - Chose to extend the existing `applications` record instead of creating a separate `submissions` table.
  - Wrote the approved design doc to `docs/plans/2026-03-16-submission-safe-flow-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-16-submission-safe-flow.md`.
- Files created/modified:
  - `docs/plans/2026-03-16-submission-safe-flow-design.md` (created)
  - `docs/plans/2026-03-16-submission-safe-flow.md` (created)
  - `task_plan.md` (modified)

### Phase 10: Submission-Safe Flow Implementation
- **Status:** complete
- Actions taken:
  - Extended shared application and dashboard schemas with submission-safe status and review payloads.
  - Extended Prisma `Application` with submission status, timestamps, notes, user confirmation flags, and a final snapshot.
  - Implemented `GET /applications/:id/submission-review`, `POST /applications/:id/mark-submitted`, and `POST /applications/:id/mark-submit-failed`.
  - Updated approval handling so `approved_for_submit` moves an application into `ready_to_submit`.
  - Extended dashboard stage derivation and activity items to surface `ready_to_submit`, `submitted`, and `submit_failed`.
  - Added a new Submission Review page plus links from the existing Application Review page.
  - Refreshed the Prisma client in the running API container and restarted it so runtime behavior matched the new schema before final verification.
  - Verified the flow over HTTP: approval update, submission review payload, manual submit recording, and dashboard transition to `submitted`.
- Files created/modified:
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/applications/applications.controller.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/applications/[id]/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (created)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 11: Submission Retry & Reopen Flow Planning
- **Status:** complete
- Actions taken:
  - Re-read the submission-safe flow, tracker requirements, and the approved recovery-flow boundaries.
  - Chose the lightweight recovery slice: `submitted -> ready_to_submit`, `submit_failed -> ready_to_submit`, plus a small event trail.
  - Wrote the approved design doc to `docs/plans/2026-03-16-submission-retry-reopen-flow-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-16-submission-retry-reopen-flow.md`.
- Files created/modified:
  - `docs/plans/2026-03-16-submission-retry-reopen-flow-design.md` (created)
  - `docs/plans/2026-03-16-submission-retry-reopen-flow.md` (created)
  - `task_plan.md` (modified)

### Phase 11: Submission Retry & Reopen Flow Implementation
- **Status:** complete
- Actions taken:
  - Extended shared application schemas with recovery request payloads and typed `application_events`.
  - Added Prisma `ApplicationEvent` and wired event creation into approval/submission recovery actions.
  - Implemented `GET /applications/:id/events`, `POST /applications/:id/reopen-submission`, and `POST /applications/:id/mark-retry-ready`.
  - Extended the dashboard recent-activity feed to surface `submission_reopened` and `submission_retry_ready`.
  - Updated Submission Review to show recovery-history entries plus conditional `Reopen submission` and `Mark ready to retry` actions.
  - Refreshed Prisma locally and inside the running API container, then rebuilt and re-verified the stack.
  - Verified over HTTP that a submitted application could be reopened, marked submit-failed, moved back to retry-ready, and reflected correctly in dashboard activity.
- Files created/modified:
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/applications/applications.controller.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 12: Tracker History & Timeline Implementation
- **Status:** complete
- Actions taken:
  - Extended shared dashboard schemas with global timeline, job timelines, and application timelines.
  - Added `GET /dashboard/timeline` and `GET /dashboard/history` on top of a mixed implicit/explicit read-model.
  - Updated `/dashboard` to show the global feed plus grouped job and application history cards.
  - Verified filtered timeline queries, grouped history output, and the dashboard route in Docker.
- Files created/modified:
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.controller.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 13: Audit & Actor Attribution
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-audit-actor-attribution-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-audit-actor-attribution.md`.
  - Added actor-aware shared schemas for application events, recent activity, and timeline items.
  - Extended Prisma `ApplicationEvent` with `actorType` and `actorLabel`.
  - Persisted `user / local-user` on approval/submission/recovery writes and added derived actor defaults for implicit job and worker milestones.
  - Updated dashboard and submission-review history UI to render actor attribution.
  - Verified new runtime events over HTTP and in Postgres, then restored the demo application to `ready_to_submit`.
- Files created/modified:
  - `docs/plans/2026-03-17-audit-actor-attribution-design.md` (created)
  - `docs/plans/2026-03-17-audit-actor-attribution.md` (created)
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 14: Lightweight Audit Enhancements
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-lightweight-audit-enhancements-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-lightweight-audit-enhancements.md`.
  - Extended shared application and dashboard schemas so events, recent activity, and timeline items all require `summary`.
  - Added actor-aware filtering to `GET /applications/:id/events` and `GET /dashboard/timeline`.
  - Standardized new approval-event payload writes around `note` while keeping summary builders backward-compatible with older `reviewNote` history rows.
  - Updated dashboard and submission-review history UI to show actor filters and API-generated summary text instead of raw payload formatting.
  - Verified targeted tests, root tests, root builds, filtered HTTP endpoints, grouped history output, and the affected frontend routes in Docker.
- Files created/modified:
  - `docs/plans/2026-03-17-lightweight-audit-enhancements-design.md` (created)
  - `docs/plans/2026-03-17-lightweight-audit-enhancements.md` (created)
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `apps/api/src/applications/applications.controller.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.controller.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 15: Audit Actor/Source Attribution
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-audit-actor-source-attribution-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-audit-actor-source-attribution.md`.
  - Extended shared audit schemas so application events, recent activity, and timeline items now require `actorId` and `source`.
  - Extended Prisma `ApplicationEvent` with `actorId` and `source`.
  - Updated application-event writes to persist `actorId=local-user` and `source=web-ui` for new user-driven actions.
  - Kept older rows honest with conservative fallbacks while deriving stable `actorId/source` values for implicit job and prefill milestones.
  - Updated dashboard and submission-review history UI to render `actorId/source` alongside the existing actor and summary text.
  - Verified targeted tests, root tests, root builds, Docker rebuilds, filtered event endpoints, filtered timeline endpoints, and health/runtime behavior.
- Files created/modified:
  - `docs/plans/2026-03-17-audit-actor-source-attribution-design.md` (created)
  - `docs/plans/2026-03-17-audit-actor-source-attribution.md` (created)
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 16: Audit Query/Search
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-audit-query-search-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-audit-query-search.md`.
  - Extended the applications and dashboard timeline query schemas with `source`, `q`, `from`, and `to`.
  - Added in-memory source, keyword, and date-range filtering to application history and dashboard timeline reads.
  - Updated dashboard global timeline and submission-review history with source pills, keyword search, and date-range inputs.
  - Re-ran targeted tests, root tests, standalone web builds, root builds, Docker rebuilds, filtered HTTP verification, and affected route probes.
- Files created/modified:
  - `docs/plans/2026-03-17-audit-query-search-design.md` (created)
  - `docs/plans/2026-03-17-audit-query-search.md` (created)
  - `apps/api/src/applications/applications.controller.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.controller.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 17: Explicit Milestone Events
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-explicit-milestone-events-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-explicit-milestone-events.md`.
  - Added a `JobEvent` model so new imports, analyses, and resume generations persist explicit milestone rows with actor/source metadata.
  - Extended application events to persist explicit worker-attributed `prefill_run` milestones after prefill results are written back.
  - Updated the dashboard read-model to prefer explicit milestone events for new records and keep safe derived fallbacks for older rows.
  - Updated submission-review history controls to expose `prefill_run` consistently.
  - Re-ran targeted tests, root tests, Prisma generation, root builds, Docker rebuilds, and new HTTP verification over a fresh import/analyze/resume/prefill flow.
- Files created/modified:
  - `docs/plans/2026-03-17-explicit-milestone-events-design.md` (created)
  - `docs/plans/2026-03-17-explicit-milestone-events.md` (created)
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `prisma/schema.prisma` (modified)
  - `apps/api/src/jobs/jobs.controller.ts` (modified)
  - `apps/api/src/analysis/analysis.service.ts` (modified)
  - `apps/api/src/resume/resume.service.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 18: Entity-Aware Audit Search
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-entity-aware-audit-search-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-entity-aware-audit-search.md`.
  - Expanded application-history search so it now matches event ids, application ids, event types, and flattened payload values.
  - Expanded dashboard timeline search so it now matches event ids, entity ids, job ids, application ids, and flattened metadata values.
  - Updated dashboard and submission-review search placeholders to reflect the broader query semantics.
  - Re-ran targeted tests, root tests, root builds, Docker rebuilds, and real HTTP verification against raw ids and URL fragments.
- Files created/modified:
  - `docs/plans/2026-03-17-entity-aware-audit-search-design.md` (created)
  - `docs/plans/2026-03-17-entity-aware-audit-search.md` (created)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 19: Application Revision Loop
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-application-revision-loop-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-application-revision-loop.md`.
  - Added a regression test proving repeated prefill runs create fresh application ids for the same job.
  - Updated Job Detail copy so reruns are clearly described as fresh application runs while older attempts remain visible as history.
  - Added a `Run another prefill` action to Application Review so `needs_revision` can naturally lead to a new run.
  - Re-ran targeted tests, root tests, root builds, Docker rebuilds, and runtime verification against a job with multiple application rows.
- Files created/modified:
  - `docs/plans/2026-03-17-application-revision-loop-design.md` (created)
  - `docs/plans/2026-03-17-application-revision-loop.md` (created)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 24: Temporal Workflow Observability
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-temporal-workflow-observability-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-temporal-workflow-observability.md`.
  - Added lightweight orchestration metadata to the shared dashboard timeline types and application-event history types.
  - Propagated orchestration metadata from `TemporalService` through Temporal workflows and activities into the internal direct routes.
  - Updated direct analysis, direct resume generation, and direct prefill to persist `executionMode`, `workflowId`, `workflowType`, and `taskQueue` on new milestone events.
  - Extended dashboard recent activity, global timeline, grouped histories, and submission-review history to expose the new orchestration data without fabricating it for older rows.
  - Re-ran targeted tests, root tests, root builds, Temporal-mode Docker rebuilds, real analyze/resume/prefill workflow execution, and HTTP verification against timeline/history endpoints.
- Files created/modified:
  - `docs/plans/2026-03-17-temporal-workflow-observability-design.md` (created)
  - `docs/plans/2026-03-17-temporal-workflow-observability.md` (created)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `packages/shared-types/src/application.ts` (modified)
  - `apps/api/src/analysis/analysis.service.ts` (modified)
  - `apps/api/src/analysis/analysis.service.test.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.ts` (modified)
  - `apps/api/src/resume/resume.service.ts` (modified)
  - `apps/api/src/resume/resume.service.test.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/worker-temporal/src/workflows.ts` (modified)
  - `apps/worker-temporal/src/activities.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/applications/[id]/submission-review/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 25: Workflow Run Status Tracking
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-run-status-tracking-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-run-status-tracking.md`.
  - Added shared `workflowRun` schemas and a Prisma `WorkflowRun` model to track analyze, resume, and prefill execution attempts separately from business results.
  - Added a `WorkflowRunsService` plus `GET /jobs/:id/workflow-runs` and `GET /workflow-runs/:id`.
  - Updated direct analysis, direct resume generation, and direct prefill flows to create or advance workflow-run state, including linked `resumeVersionId` and `applicationId`.
  - Updated Temporal workflow submission and internal direct routes to pass workflow-run ids so queued Temporal runs advance to running/completed/failed cleanly.
  - Extended dashboard overview rows with latest analyze/resume/prefill run summaries and added a `Workflow runs` panel to Job Detail.
  - Re-ran targeted tests, Prisma generation, root tests, workspace builds, direct-mode Docker verification, Temporal-mode Docker verification, and finally restored the stack to the default direct-mode env.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-run-status-tracking-design.md` (created)
  - `docs/plans/2026-03-17-workflow-run-status-tracking.md` (created)
  - `prisma/schema.prisma` (modified)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `packages/shared-types/src/dashboard.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.test.ts` (created)
  - `apps/api/src/resume/direct-resume.service.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.test.ts` (created)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.ts` (modified)
  - `apps/api/src/dashboard/dashboard.service.test.ts` (modified)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/jobs/jobs.controller.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (created)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (created)
  - `apps/worker-temporal/src/workflows.ts` (modified)
  - `apps/worker-temporal/src/activities.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/dashboard/page.tsx` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 26: Workflow Run Retry Controls
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-17-workflow-run-retry-controls-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-17-workflow-run-retry-controls.md`.
  - Extended `workflow_runs` with `retryOfRunId` so retried runs link back to the failed run they came from.
  - Added `WorkflowRunRetriesService` and `POST /workflow-runs/:id/retry`.
  - Reused the existing direct and Temporal execution paths so retries stay on the same business logic as normal analyze/resume/prefill actions.
  - Updated the retry path to return the newly persisted retry run even when the retry itself fails again, instead of hiding that run behind a generic 500.
  - Added `Retry failed run` controls and retry lineage display to Job Detail.
  - Re-ran targeted retry tests, full root tests, full workspace builds, direct-mode runtime verification, Temporal-mode runtime verification, and restored the Docker stack to default `TEMPORAL_ENABLED=false`.
- Files created/modified:
  - `docs/plans/2026-03-17-workflow-run-retry-controls-design.md` (created)
  - `docs/plans/2026-03-17-workflow-run-retry-controls.md` (created)
  - `prisma/schema.prisma` (modified)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `packages/shared-types/src/dashboard.test.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/api/src/temporal/temporal.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-retries.service.ts` (created)
  - `apps/api/src/workflow-runs/workflow-run-retries.service.test.ts` (created)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 34: Workflow Runs Results UX
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-results-ux-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-results-ux.md`.
  - Added a dedicated `workflow-runs-results` helper plus targeted tests for active filter chips, active-filter counting, result-summary copy, and filtered-empty versus first-run-empty behavior.
  - Updated `/workflow-runs` to render result-summary copy, removable active-filter chips, and a one-click `Clear filters` action while keeping cursor pagination session-local.
  - Replaced the previous single empty-state message with distinct filtered-empty and no-runs states.
  - Re-ran targeted web tests, full root tests, full workspace builds, Docker runtime verification, route checks, and browser-level checks for the new workflow-runs UI.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-results-ux-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-results-ux.md` (created)
  - `apps/web/src/lib/workflow-runs-results.ts` (created)
  - `apps/web/src/lib/workflow-runs-results.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 35: Workflow Runs Selection Foundation
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-selection-foundation-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-selection-foundation.md`.
  - Added a small `workflow-runs-selection` helper plus targeted tests for toggle, select-all-loaded, selected-count, and query-scope reset semantics.
  - Updated `/workflow-runs` with per-row checkboxes, a selection summary, `Select all loaded`, and `Clear selection`.
  - Scoped selection to the current query by resetting selected runs whenever filter/search/date/sort state changes, while preserving selection across `Load more`.
  - Re-ran targeted web tests, full root tests, full workspace builds, Docker runtime verification, and browser-level interaction checks for the new selection behavior.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-selection-foundation-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-selection-foundation.md` (created)
  - `apps/web/src/lib/workflow-runs-selection.ts` (created)
  - `apps/web/src/lib/workflow-runs-selection.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 36: Workflow Runs Safe Bulk Actions
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-safe-bulk-actions-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-safe-bulk-actions.md`.
  - Added a `workflow-runs-bulk-actions` helper plus targeted tests for run-detail targets, deduplicated job targets, and the `5 target` guard.
  - Updated `/workflow-runs` to surface a bulk action bar when runs are selected, with `Open selected run details`, `Open selected jobs`, and `Clear selection`.
  - Kept the first bulk-action slice navigation-only by using `window.open(...)` for run/job pages and surfacing clear error text instead of performing any backend mutations.
  - Re-ran targeted web tests, full root tests, full workspace builds, Docker runtime verification, and browser-level checks with intercepted `window.open(...)` calls to confirm the generated run/job targets and over-limit guard.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-safe-bulk-actions-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-safe-bulk-actions.md` (created)
  - `apps/web/src/lib/workflow-runs-bulk-actions.ts` (created)
  - `apps/web/src/lib/workflow-runs-bulk-actions.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 37: Workflow Runs Eligibility Guardrails
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-eligibility-guardrails-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-eligibility-guardrails.md`.
  - Added a small `workflow-runs-eligibility` helper plus targeted tests for retry-eligible, cancel-eligible, ineligible, and mixed-selection guardrail copy.
  - Updated `/workflow-runs` to show retry/cancel/ineligible counts for the current selection and to surface disabled future bulk retry/cancel controls with clear explanatory text.
  - Kept the phase read-only by not introducing any backend mutations or bulk-control APIs yet.
  - Re-ran targeted web tests, full root tests, full workspace builds, Docker runtime verification, and a browser-level mixed-selection check confirming the eligibility counts and disabled controls.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-eligibility-guardrails-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-eligibility-guardrails.md` (created)
  - `apps/web/src/lib/workflow-runs-eligibility.ts` (created)
  - `apps/web/src/lib/workflow-runs-eligibility.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 38: Workflow Runs Bulk Controls
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-bulk-controls-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-bulk-controls.md`.
  - Added shared bulk retry/cancel schemas and types, including a `5 eligible runs` mutation limit.
  - Added `WorkflowRunBulkActionsService` plus `POST /workflow-runs/bulk-retry` and `POST /workflow-runs/bulk-cancel`, reusing the existing single-run retry/cancel services for each eligible item.
  - Kept bulk mutations non-transactional and explicit: eligible runs are processed, ineligible runs are skipped with per-row messages, and partial success is surfaced instead of hidden.
  - Updated `/workflow-runs` with inline confirmation, real bulk retry/cancel actions, and compact result-summary feedback after the action completes.
  - Verified targeted shared-types/API/web tests, root tests/builds, direct-mode bulk retry runtime behavior, queued-Temporal bulk cancel runtime behavior, browser-level bulk retry behavior, and restored the Docker stack to default `TEMPORAL_ENABLED=false`.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-bulk-controls-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-bulk-controls.md` (created)
  - `packages/shared-types/src/job.ts` (modified)
  - `packages/shared-types/src/job.test.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.ts` (created)
  - `apps/api/src/workflow-runs/workflow-run-bulk-actions.service.test.ts` (created)
  - `apps/api/src/workflow-runs/workflow-runs.controller.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/web/src/lib/workflow-runs-bulk-controls.ts` (created)
  - `apps/web/src/lib/workflow-runs-bulk-controls.test.ts` (created)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 39: Workflow Runs Bulk Outcome Details
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-bulk-outcome-details-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-bulk-outcome-details.md`.
  - Added a `workflow-runs-bulk-outcomes` helper plus targeted tests for panel titles, aggregate summary reuse, row-level status tones, and optional run-detail links.
  - Updated `/workflow-runs` to show the most recent bulk retry/cancel result as an in-page panel with row-level `success / skipped / failed` outcomes.
  - Added `Dismiss results` while keeping the panel intentionally in-memory only and leaving the existing bulk APIs unchanged.
  - Re-ran targeted web tests, root tests, root builds, Docker runtime verification, and browser-level interaction checks for the new result panel behavior.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-bulk-outcome-details-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-bulk-outcome-details.md` (created)
  - `apps/web/src/lib/workflow-runs-bulk-outcomes.ts` (created)
  - `apps/web/src/lib/workflow-runs-bulk-outcomes.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 40: Workflow Runs Bulk Follow-up Guidance
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-bulk-follow-up-guidance-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-bulk-follow-up-guidance.md`.
  - Added a `workflow-runs-bulk-follow-up` helper plus targeted tests for successful run-detail targets, skipped-run reselection, failed-result reselection, and current-page availability messages.
  - Updated the recent bulk-action panel on `/workflow-runs` to show `Open successful runs`, `Reselect skipped runs`, and `Reselect failed results` when they apply.
  - Kept follow-up reselection intentionally page-local by only targeting runs still present in the current loaded list.
  - Re-ran targeted web tests, root tests, root builds, Docker runtime verification, and browser-level interaction checks for the new follow-up actions.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-bulk-follow-up-guidance-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-bulk-follow-up-guidance.md` (created)
  - `apps/web/src/lib/workflow-runs-bulk-follow-up.ts` (created)
  - `apps/web/src/lib/workflow-runs-bulk-follow-up.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 41: Workflow Runs Bulk Preflight Preview
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-workflow-runs-bulk-preflight-preview-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-workflow-runs-bulk-preflight-preview.md`.
  - Added a `workflow-runs-bulk-preflight` helper plus targeted tests for retry and cancel previews across mixed selections.
  - Extended the existing inline bulk-confirmation area on `/workflow-runs` to show `Will process` and `Will skip` groups before the user confirms retry or cancel.
  - Reused the existing eligibility rules and bulk mutation APIs, keeping the whole slice frontend-only and focused on decision clarity rather than new backend behavior.
  - Re-ran targeted web tests, root tests, root builds, Docker runtime verification, and a browser-level retry-preview check that confirmed `Will process`, `Will skip`, and `Go back` behavior.
- Files created/modified:
  - `docs/plans/2026-03-18-workflow-runs-bulk-preflight-preview-design.md` (created)
  - `docs/plans/2026-03-18-workflow-runs-bulk-preflight-preview.md` (created)
  - `apps/web/src/lib/workflow-runs-bulk-preflight.ts` (created)
  - `apps/web/src/lib/workflow-runs-bulk-preflight.test.ts` (created)
  - `apps/web/src/app/workflow-runs/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 42: Resume PDF Inline Preview
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-resume-pdf-inline-preview-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-resume-pdf-inline-preview.md`.
  - Added a small API helper plus controller test coverage for `attachment` vs `inline` PDF response semantics.
  - Added `GET /resume-versions/:id/pdf/inline` while preserving the existing download route.
  - Added a lightweight embedded PDF preview area to Resume Review, along with `Preview PDF`, `Download PDF`, and a small fallback note for browsers that do not render embedded PDFs cleanly.
  - Re-ran targeted API/web tests, targeted builds, root tests/builds, Docker runtime verification, header-level PDF response checks, and browser-level preview checks on the Resume Review page.
- Files created/modified:
  - `docs/plans/2026-03-18-resume-pdf-inline-preview-design.md` (created)
  - `docs/plans/2026-03-18-resume-pdf-inline-preview.md` (created)
  - `apps/api/src/resume/resume.controller.ts` (modified)
  - `apps/api/src/resume/resume.controller.test.ts` (created)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/lib/resume-pdf-links.test.ts` (created)
  - `apps/web/src/app/resume-versions/[id]/page.tsx` (modified)
  - `apps/web/src/app/globals.css` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 43: Resume PDF Multi-Template
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-resume-pdf-multi-template-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-resume-pdf-multi-template.md`.
  - Added `template=classic|modern` support to the resume print, download, and inline-preview API routes while keeping `classic` as the default when the query is omitted or invalid.
  - Split the API-side PDF HTML rendering into the existing `classic` template and a new visually distinct `modern` template.
  - Added a `Classic / Modern` toggle to Resume Review and kept the embedded iframe plus `Preview PDF` / `Download PDF` links synchronized with the current template.
  - Re-ran targeted API and web tests, root tests/builds, Docker runtime verification, API-level template checks, and browser-level Resume Review template-switching checks.
- Files created/modified:
  - `docs/plans/2026-03-18-resume-pdf-multi-template-design.md` (created)
  - `docs/plans/2026-03-18-resume-pdf-multi-template.md` (created)
  - `apps/api/src/resume/resume-pdf.service.ts` (modified)
  - `apps/api/src/resume/resume-pdf.service.test.ts` (modified)
  - `apps/api/src/resume/resume.controller.ts` (modified)
  - `apps/api/src/resume/resume.controller.test.ts` (modified)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/lib/resume-pdf-links.test.ts` (modified)
  - `apps/web/src/app/resume-versions/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 44: Running Temporal Run Cancel
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-running-temporal-run-cancel-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-running-temporal-run-cancel.md`.
  - Added a shared workflow-run cancellation helper that turns internal request aborts into explicit cancellation checks and a typed `WorkflowRunCancelledError`.
  - Extended Temporal cancel handling to allow `running` workflow runs in addition to the existing queued case, while still rejecting direct-mode runs.
  - Propagated cooperative cancellation through the internal direct analysis, resume-generation, and prefill routes by wiring request abort signals into the direct services and OpenAI fetches.
  - Added heartbeat-backed cancellation propagation inside `worker-temporal` activities so running Temporal workflows stop at safe cancellation points instead of pretending to hard-kill completed work.
  - Updated Job Detail and Workflow Run Detail so running Temporal runs now expose `Cancel run` with explicit `safe cancellation point` guidance.
  - Follow-up UI verification exposed two frontend issues: cancelled running runs still said `Cancelled before execution`, and Job Detail surfaced raw JSON error payloads after cancellation.
  - Added a small API-error helper plus a more accurate cancelled status copy, then re-ran browser-level verification until Job Detail and Workflow Run Detail both reflected the running-cancel flow cleanly.
  - Re-ran targeted API/web tests, root tests/builds, direct-mode negative verification, Temporal-mode running-cancel runtime verification, and restored the Docker stack to default `TEMPORAL_ENABLED=false`.
- Files created/modified:
  - `docs/plans/2026-03-18-running-temporal-run-cancel-design.md` (created)
  - `docs/plans/2026-03-18-running-temporal-run-cancel.md` (created)
  - `apps/api/src/lib/workflow-run-cancellation.ts` (created)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts` (modified)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.test.ts` (modified)
  - `apps/api/src/analysis/llm-analysis.service.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.test.ts` (modified)
  - `apps/api/src/resume/llm-resume.service.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/worker-temporal/src/workflows.ts` (modified)
  - `apps/worker-temporal/src/activities.ts` (modified)
  - `apps/web/src/lib/workflow-run-status.ts` (modified)
  - `apps/web/src/lib/workflow-run-status.test.ts` (modified)
  - `apps/web/src/lib/api-error.ts` (created)
  - `apps/web/src/lib/api-error.test.ts` (created)
  - `apps/web/src/lib/api.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/workflow-runs/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 45: Direct Run Cancel
- **Status:** complete
- Actions taken:
  - Wrote the approved design doc to `docs/plans/2026-03-18-direct-run-cancel-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-direct-run-cancel.md`.
  - Added a small process-local direct-run cancellation registry that tracks active direct workflow-run abort controllers inside the API process.
  - Extended `POST /workflow-runs/:id/cancel` so running direct workflow runs can be cancelled when they are still registered in the current API process, while keeping terminal direct runs non-cancellable.
  - Added merged cancellation-signal plumbing so direct analyze, resume-generation, and prefill paths reuse the existing `AbortSignal` checkpoints instead of inventing a second cancellation mechanism.
  - Updated direct cancellation handling so cancelled direct runs settle as `cancelled` with a `409 Workflow run was cancelled` response, while too-late cancels still allow already-completed work to remain `completed`.
  - Updated Job Detail, Workflow Run Detail, and workflow-run status copy so running direct runs now expose `Cancel run` with explicit `next safe cancellation point in this API process` guidance.
  - Re-ran targeted API/web tests, root tests/builds, Docker runtime verification, direct-mode running-cancel runtime verification, and a direct negative check against a completed run.
  - Followed up with browser-level verification against a real running direct prefill run, confirming Job Detail can trigger `Cancel run` from a live direct execution and Run Detail lands on `Cancelled during execution` once the cancellation reaches a safe point.
- Files created/modified:
  - `docs/plans/2026-03-18-direct-run-cancel-design.md` (created)
  - `docs/plans/2026-03-18-direct-run-cancel.md` (created)
  - `apps/api/src/workflow-runs/direct-run-cancellation-registry.service.ts` (created)
  - `apps/api/src/workflow-runs/direct-run-cancellation-registry.service.test.ts` (created)
  - `apps/api/src/lib/workflow-run-cancellation.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.ts` (modified)
  - `apps/api/src/workflow-runs/workflow-run-cancel.service.test.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.ts` (modified)
  - `apps/api/src/analysis/direct-analysis.service.test.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.ts` (modified)
  - `apps/api/src/resume/direct-resume.service.test.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/web/src/lib/workflow-run-status.ts` (modified)
  - `apps/web/src/lib/workflow-run-status.test.ts` (modified)
  - `apps/web/src/app/jobs/[id]/page.tsx` (modified)
  - `apps/web/src/app/workflow-runs/[id]/page.tsx` (modified)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 46: Closeout Delivery Package
- **Status:** complete
- Actions taken:
  - Wrote the closeout design doc to `docs/plans/2026-03-18-closeout-delivery-package-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-18-closeout-delivery-package.md`.
  - Added a dedicated delivery package at `docs/closeout/2026-03-18-delivery-package.md` covering delivery status, capability map, demo walkthrough, verification snapshot, known limitations, and suggested next steps.
  - Updated `README.md` so the repo now explicitly points evaluators at the delivery package and describes the current repo state as closeout / handoff.
  - Advanced `task_plan.md` into a closeout phase rather than another feature phase.
  - Re-ran the final smoke verification for closeout: `npm test`, `npm run build`, `docker compose up --build -d`, and `curl http://localhost:3001/health`.
  - Confirmed the Docker stack settled back into the default non-Temporal mode after the closeout verification pass.
- Files created/modified:
  - `docs/plans/2026-03-18-closeout-delivery-package-design.md` (created)
  - `docs/plans/2026-03-18-closeout-delivery-package.md` (created)
  - `docs/closeout/2026-03-18-delivery-package.md` (created)
  - `README.md` (modified)
  - `task_plan.md` (modified)
  - `progress.md` (modified)

### Phase 47: Original-Docs Drift Assessment
- **Status:** complete
- Actions taken:
  - Re-read the original planning documents: `roadmap.md`, `spec.md`, and `system-design.md`.
  - Compared their intended scope, architecture, API surface, and MVP boundaries against the current repository state.
  - Logged the conclusion that the implementation stayed aligned on core product direction while expanding significantly in workflow operations and audit tooling.
- Files created/modified:
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 48: Prefill Upgrade Design & Plan
- **Status:** complete
- Actions taken:
  - Used the approved priority order `resume upload -> open-answer autofill -> automation_sessions`.
  - Reviewed the current prefill worker, application persistence, resume PDF endpoints, and Application Review page to ground the design in the existing codebase.
  - Collected user decisions on upload scope, open-answer behavior, and additive session modeling.
  - Wrote the approved design doc to `docs/plans/2026-03-19-prefill-upload-open-answers-automation-sessions-design.md`.
  - Wrote the implementation plan to `docs/plans/2026-03-19-prefill-upload-open-answers-automation-sessions.md`.
- Files created/modified:
  - `docs/plans/2026-03-19-prefill-upload-open-answers-automation-sessions-design.md` (created)
  - `docs/plans/2026-03-19-prefill-upload-open-answers-automation-sessions.md` (created)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)

### Phase 49: Prefill Upgrade Implementation
- **Status:** in progress
- Actions taken:
  - Created an isolated implementation worktree at `.worktrees/prefill-upgrades` on branch `codex-prefill-upgrades-impl`.
  - Extended the shared `fieldResults` schema so prefill evidence can describe `basic_text`, `resume_upload`, and `long_text` results while remaining backward-compatible with older application rows.
  - Added API groundwork for the richer prefill flow without changing the public `POST /jobs/:id/prefill` entrypoint.
  - Extended the API -> worker payload with `resume.pdfDownloadUrl`, `resume.pdfFileName`, `job`, `analysis`, and `defaultAnswers`.
  - Added `POST /internal/applications/:id/generate-long-answers` with internal-token auth plus request validation.
  - Added a small `LongAnswerService` that prefers `defaultAnswers` and falls back to deterministic API-side answer generation until real LLM-backed drafting is wired in.
  - Re-ran shared-types tests, targeted API tests, the full API package tests, and the API TypeScript build after the groundwork changes.
- Files created/modified:
  - `packages/shared-types/src/application.ts` (modified)
  - `packages/shared-types/src/application.test.ts` (modified)
  - `apps/api/src/app.module.ts` (modified)
  - `apps/api/src/applications/applications.service.ts` (modified)
  - `apps/api/src/applications/applications.service.test.ts` (modified)
  - `apps/api/src/internal/internal.controller.ts` (modified)
  - `apps/api/src/internal/internal.controller.test.ts` (created)
  - `apps/api/src/internal/long-answer.service.ts` (created)
  - `apps/api/src/internal/long-answer.service.test.ts` (created)
  - `apps/api/src/profile/profile.service.ts` (modified)
  - `apps/api/src/resume/resume.service.ts` (modified)
  - `task_plan.md` (modified)
  - `findings.md` (modified)
  - `progress.md` (modified)
