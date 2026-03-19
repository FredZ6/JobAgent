# Task Plan: OpenClaw Job Agent MVP Bootstrap

## Goal
Define and approve a practical build plan for the OpenClaw Job Agent MVP, then implement the approved starter scope as a runnable local monorepo.

## Current Phase
Phase 46

## Phases
### Phase 1: Requirements & Discovery
- [x] Read the three markdown documents in the project root
- [x] Identify MVP scope, constraints, and required stack
- [x] Capture findings in `findings.md`
- **Status:** complete

### Phase 2: Planning & Structure
- [x] Choose the recommended starting slice for implementation
- [x] Present design sections and get user approval
- [x] Save the approved design to `docs/plans/`
- [x] Create an implementation plan
- **Status:** complete

### Phase 3: Implementation
- [x] Scaffold monorepo structure
- [x] Add Docker Compose and environment defaults
- [x] Build the approved first product slice
- [x] Test incrementally
- **Status:** complete

### Phase 4: Testing & Verification
- [x] Run the relevant verification commands
- [x] Confirm the starter flow works locally
- [x] Fix issues found during verification
- **Status:** complete

### Phase 5: Delivery
- [x] Summarize changes and verification results
- [x] Call out remaining gaps and next phases
- **Status:** complete

### Phase 6: Structured Resume Generation
- [x] Extend the profile and persistence model for grounded resume generation
- [x] Implement resume generation endpoints and review UI
- [x] Verify the resume-generation loop end to end
- **Status:** complete

### Phase 7: PDF Export
- [x] Design and document the single-template PDF export slice
- [x] Add print HTML and PDF API routes for completed resume versions
- [x] Add PDF download actions in the frontend
- [x] Verify PDF export in Docker
- **Status:** complete

### Phase 8: Application Prefill & Human Approval
- [x] Design the best-effort prefill and review slice
- [x] Create the implementation plan
- [x] Implement persisted application records and API endpoints
- [x] Implement worker-driven prefill and review UI
- [x] Verify the prefill and approval flow end to end
- **Status:** complete

### Phase 9: Tracker Dashboard
- [x] Design the tracker dashboard slice
- [x] Create the implementation plan
- [x] Implement dashboard aggregation APIs and page
- [x] Verify the tracker dashboard end to end
- **Status:** complete

### Phase 10: Submission-Safe Flow
- [x] Design the submission-safe flow slice
- [x] Create the implementation plan
- [x] Implement submission review APIs and page
- [x] Verify the submission-safe flow end to end
- **Status:** complete

### Phase 11: Submission Retry & Reopen Flow
- [x] Design the recovery flow slice
- [x] Create the implementation plan
- [x] Implement retry/reopen APIs, events, and UI
- [x] Verify the recovery flow end to end
- **Status:** complete

### Phase 12: Tracker History & Timeline
- [x] Design the tracker history/timeline slice
- [x] Create the implementation plan
- [x] Implement grouped history APIs and dashboard timeline UI
- [x] Verify the tracker history/timeline end to end
- **Status:** complete

### Phase 13: Audit & Actor Attribution
- [x] Design the audit/actor-attribution slice
- [x] Create the implementation plan
- [x] Implement actor-aware events, APIs, and UI
- [x] Verify the audit/actor-attribution flow end to end
- **Status:** complete

### Phase 14: Lightweight Audit Enhancements
- [x] Design the lightweight audit-enhancements slice
- [x] Create the implementation plan
- [x] Implement audit summaries, filters, and UI updates
- [x] Verify the lightweight audit-enhancements flow end to end
- **Status:** complete

### Phase 15: Audit Actor/Source Attribution
- [x] Design the audit actor/source attribution slice
- [x] Create the implementation plan
- [x] Implement `actorId`/`source` persistence, derivation, and UI updates
- [x] Verify the audit actor/source attribution flow end to end
- **Status:** complete

### Phase 16: Audit Query/Search
- [x] Design the audit query/search slice
- [x] Create the implementation plan
- [x] Implement `source`/keyword/date-range filtering in audit APIs and UI
- [x] Verify the audit query/search flow end to end
- **Status:** complete

### Phase 17: Explicit Milestone Events
- [x] Design the explicit milestone-events slice
- [x] Create the implementation plan
- [x] Persist explicit job import, analysis, resume, and prefill milestone events
- [x] Update dashboard history to prefer explicit milestones with fallback for older records
- [x] Verify the explicit milestone-events flow end to end
- **Status:** complete

### Phase 18: Entity-Aware Audit Search
- [x] Design the entity-aware audit-search slice
- [x] Create the implementation plan
- [x] Expand dashboard and application-history query matching to include entity context
- [x] Update search placeholders to reflect the broader query behavior
- [x] Verify the entity-aware audit-search flow end to end
- **Status:** complete

### Phase 19: Application Revision Loop
- [x] Design the application-revision-loop slice
- [x] Create the implementation plan
- [x] Clarify rerun behavior in Job Detail and Application Review
- [x] Verify repeated prefill runs create new application rows without overwriting old evidence
- [x] Verify the application-revision-loop flow end to end
- **Status:** complete

### Phase 20: Application Run Comparison
- [x] Design the application-run-comparison slice
- [x] Create the implementation plan
- [x] Add latest-vs-previous run comparison logic and tests in the web app
- [x] Surface comparison deltas on Job Detail when a job has multiple runs
- [x] Verify the application-run-comparison flow end to end
- **Status:** complete

### Phase 21: Temporal Starter Slice
- [x] Design the Temporal starter slice
- [x] Create the implementation plan
- [x] Extract direct job analysis into a reusable service
- [x] Add `worker-temporal`, Temporal client plumbing, and Docker services
- [x] Route `POST /jobs/:id/analyze` through Temporal when `TEMPORAL_ENABLED=true`
- [x] Verify both direct mode and Temporal mode end to end
- **Status:** complete

### Phase 22: Temporal Resume Slice
- [x] Design the Temporal resume slice
- [x] Create the implementation plan
- [x] Extract direct resume generation into a reusable service
- [x] Route `POST /jobs/:id/generate-resume` through Temporal when `TEMPORAL_ENABLED=true`
- [x] Verify both direct mode and Temporal mode end to end
- **Status:** complete

### Phase 23: Temporal Prefill Slice
- [x] Design the Temporal prefill slice
- [x] Create the implementation plan
- [x] Split prefill into a direct path plus feature-flag dispatcher
- [x] Route `POST /jobs/:id/prefill` through Temporal when `TEMPORAL_ENABLED=true`
- [x] Verify both direct mode and Temporal mode end to end
- **Status:** complete

### Phase 24: Temporal Workflow Observability
- [x] Design the workflow-observability slice
- [x] Create the implementation plan
- [x] Persist orchestration metadata on new analysis, resume, and prefill milestone events
- [x] Expose orchestration metadata through dashboard timeline/history and application event history
- [x] Render execution mode and workflow details in dashboard and submission review history surfaces
- [x] Verify targeted tests, root verification, and Temporal-mode runtime behavior end to end
- **Status:** complete

### Phase 25: Workflow Run Status Tracking
- [x] Design the workflow-run tracking slice
- [x] Create the implementation plan
- [x] Add `workflow_runs` persistence for analyze, resume generation, and prefill attempts
- [x] Track direct-mode runs as `running -> completed/failed`
- [x] Track Temporal-mode runs with queued/running/completed states and workflow metadata
- [x] Add `GET /jobs/:id/workflow-runs` and `GET /workflow-runs/:id`
- [x] Surface latest run summaries on the dashboard and a dedicated workflow-runs panel on Job Detail
- [x] Verify targeted tests, full builds, direct-mode runtime behavior, and Temporal-mode runtime behavior end to end
- **Status:** complete

### Phase 26: Workflow Run Retry Controls
- [x] Design the workflow-run retry-controls slice
- [x] Create the implementation plan
- [x] Add `retryOfRunId` to `workflow_runs`
- [x] Add `POST /workflow-runs/:id/retry`
- [x] Retry failed `analyze`, `generate_resume`, and `prefill` runs by creating fresh workflow runs
- [x] Preserve old failed runs instead of mutating them
- [x] Return newly created failed retry runs instead of hiding them behind a generic 500
- [x] Add `Retry failed run` controls to Job Detail
- [x] Verify targeted tests, root tests, full builds, direct-mode runtime behavior, Temporal-mode runtime behavior, and restore the default Docker env
- **Status:** complete

### Phase 27: Workflow Run Cancel Controls
- [x] Design the workflow-run cancel-controls slice
- [x] Create the implementation plan
- [x] Add `cancelled` to workflow-run status handling
- [x] Add `POST /workflow-runs/:id/cancel` for queued Temporal runs
- [x] Surface `Cancel run` on queued Temporal rows in Job Detail
- [x] Verify targeted tests, root tests/builds, Temporal runtime behavior, and restore the default Docker env
- **Status:** complete

### Phase 28: Workflow Run Live Status UX
- [x] Design the workflow-run live-status UX slice
- [x] Create the implementation plan
- [x] Add a small frontend workflow-run status/presentation helper
- [x] Add Job Detail polling that runs only while workflow runs are active
- [x] Clarify Job Detail run copy for queued/running/completed/failed/cancelled
- [x] Improve dashboard latest-run summary copy
- [x] Verify targeted tests, root tests/builds, and default-stack runtime behavior
- **Status:** complete

### Phase 29: Workflow Run Detail & History
- [x] Design the workflow-run detail/history slice
- [x] Create the implementation plan
- [x] Add `workflow_run_events` persistence and lifecycle writes
- [x] Add `GET /workflow-runs/:id/events`
- [x] Expand `GET /workflow-runs/:id` with linked run context
- [x] Add `/workflow-runs/[id]` and Job Detail entry points
- [x] Verify targeted tests, root tests/builds, and runtime behavior
- **Status:** complete

### Phase 30: Global Workflow Runs View
- [x] Design the global workflow-runs view slice
- [x] Create the implementation plan
- [x] Add `GET /workflow-runs` with lightweight filters and summary counts
- [x] Add `/workflow-runs` with top summary cards and a filtered runs list
- [x] Add main-navigation access to the global workflow-runs page
- [x] Verify targeted tests, root tests/builds, and runtime behavior
- **Status:** complete

### Phase 31: Workflow Runs Search & Date Filters
- [x] Design the workflow-runs search/date-filter slice
- [x] Create the implementation plan
- [x] Extend `GET /workflow-runs` with `q`, `from`, and `to`
- [x] Add keyword and date-range inputs to `/workflow-runs`
- [x] Keep summary cards aligned with the filtered result set
- [x] Verify targeted tests, root tests/builds, and runtime behavior
- **Status:** complete

### Phase 32: Workflow Runs Sorting & Pagination
- [x] Design the workflow-runs sorting/pagination slice
- [x] Create the implementation plan
- [x] Extend `GET /workflow-runs` with `sortBy`, `sortOrder`, `cursor`, and page metadata
- [x] Add sorting controls and `Load more` behavior to `/workflow-runs`
- [x] Keep summary cards aligned with the full filtered result set rather than just the current page
- [x] Verify targeted tests, root tests/builds, and runtime behavior
- **Status:** complete

### Phase 33: Workflow Runs URL Query-State
- [x] Design the workflow-runs URL query-state slice
- [x] Create the implementation plan
- [x] Add URL parsing and normalized serialization for workflow-runs query state
- [x] Sync `/workflow-runs` filter/search/date/sort state with the URL
- [x] Keep pagination cursor state out of the URL and in memory only
- [x] Verify targeted tests, root tests/builds, and runtime behavior
- **Status:** complete

### Phase 34: Workflow Runs Results UX
- [x] Design the workflow-runs results-UX slice
- [x] Create the implementation plan
- [x] Add helper-driven result summaries and active filter chips
- [x] Add `Clear filters` and smarter filtered-empty vs true-empty states
- [x] Keep the existing API and URL query-state model unchanged
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level rendering checks
- **Status:** complete

### Phase 35: Workflow Runs Selection Foundation
- [x] Design the workflow-runs selection-foundation slice
- [x] Create the implementation plan
- [x] Add helper-driven selection semantics for toggle, select-all-loaded, and query-scope reset
- [x] Add per-row checkboxes plus selection summary copy to `/workflow-runs`
- [x] Reset selection on filter/search/date/sort changes while preserving it across `Load more`
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level interaction checks
- **Status:** complete

### Phase 36: Workflow Runs Safe Bulk Actions
- [x] Design the workflow-runs safe-bulk-actions slice
- [x] Create the implementation plan
- [x] Add helper-driven bulk target derivation and limit guards
- [x] Add `Open selected run details` and `Open selected jobs` to `/workflow-runs`
- [x] Keep actions navigation-only and block selections above the `5 target` limit
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level interaction checks
- **Status:** complete

### Phase 37: Workflow Runs Eligibility Guardrails
- [x] Design the workflow-runs eligibility-guardrails slice
- [x] Create the implementation plan
- [x] Add helper-driven retry/cancel eligibility classification for the current loaded selection
- [x] Surface retry-eligible, cancel-eligible, and ineligible counts on `/workflow-runs`
- [x] Add disabled future `Retry eligible runs` and `Cancel eligible runs` controls plus mixed-selection guardrail copy
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level interaction checks
- **Status:** complete

### Phase 38: Workflow Runs Bulk Controls
- [x] Design the workflow-runs bulk-controls slice
- [x] Create the implementation plan
- [x] Add shared bulk retry/cancel request and response schemas
- [x] Add `POST /workflow-runs/bulk-retry` and `POST /workflow-runs/bulk-cancel`
- [x] Reuse the existing single-run retry/cancel services for each eligible run
- [x] Process eligible subsets, skip ineligible runs explicitly, and enforce a `5 eligible runs` mutation limit
- [x] Add inline confirmation and result-summary UX to `/workflow-runs`
- [x] Verify targeted tests, root tests/builds, direct-mode runtime, Temporal queued-cancel runtime, browser interaction checks, and restore the default Docker env
- **Status:** complete

### Phase 39: Workflow Runs Bulk Outcome Details
- [x] Design the workflow-runs bulk-outcome-details slice
- [x] Create the implementation plan
- [x] Add a small web helper to present the latest bulk action response as a result panel
- [x] Add a recent bulk-action result panel to `/workflow-runs`
- [x] Show per-run `success / skipped / failed` rows with optional `Open run detail` links
- [x] Add `Dismiss results` and keep the panel in-memory only
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level interaction checks
- **Status:** complete

### Phase 40: Workflow Runs Bulk Follow-up Guidance
- [x] Design the workflow-runs bulk-follow-up-guidance slice
- [x] Create the implementation plan
- [x] Add a helper that derives follow-up actions from the latest bulk result and the current loaded run list
- [x] Add `Open successful runs`, `Reselect skipped runs`, and `Reselect failed results` to the recent bulk-action panel
- [x] Keep reselection page-local by only targeting runs still present on the current loaded page
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level interaction checks
- **Status:** complete

### Phase 41: Workflow Runs Bulk Preflight Preview
- [x] Design the workflow-runs bulk-preflight-preview slice
- [x] Create the implementation plan
- [x] Add a small web helper that splits the current selection into `Will process` and `Will skip` groups for retry/cancel
- [x] Extend the existing inline bulk-confirmation area on `/workflow-runs` with per-run preflight preview rows
- [x] Keep the slice frontend-only by reusing the existing eligibility rules and bulk mutation APIs
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level preview interaction checks
- **Status:** complete

### Phase 42: Resume PDF Inline Preview
- [x] Design the resume-pdf-inline-preview slice
- [x] Create the implementation plan
- [x] Add a dedicated inline PDF route while preserving the existing download route
- [x] Add embedded PDF preview to Resume Review with a lightweight fallback note
- [x] Reuse the current PDF rendering pipeline instead of introducing a second preview renderer
- [x] Verify targeted tests, root tests/builds, Docker runtime, and browser-level preview checks
- **Status:** complete

### Phase 43: Resume PDF Multi-Template
- [x] Design the resume-pdf-multi-template slice
- [x] Create the implementation plan
- [x] Add `template=classic|modern` support to the print, download, and inline PDF routes while keeping `classic` as the default
- [x] Split PDF HTML rendering into a stable `classic` template and a distinct `modern` template
- [x] Add a `Classic / Modern` template toggle to Resume Review and keep the inline preview plus preview/download links in sync with the current template
- [x] Verify targeted tests, root tests/builds, Docker runtime, API template checks, and browser-level template switching
- **Status:** complete

### Phase 44: Running Temporal Run Cancel
- [x] Design the running-Temporal-run-cancel slice
- [x] Create the implementation plan
- [x] Allow `POST /workflow-runs/:id/cancel` for `temporal + queued|running` workflow runs while continuing to reject direct runs
- [x] Add cooperative cancellation checks to the direct analysis, resume-generation, and prefill paths
- [x] Propagate Temporal activity cancellation into the internal direct routes via request abort signals and heartbeat-backed activity cancellation
- [x] Surface `Cancel run` for running Temporal runs on Job Detail and Workflow Run Detail with honest safe-cancellation-point copy
- [x] Verify targeted tests, root tests/builds, Temporal-mode running-cancel runtime behavior, and restoration to the default Docker env
- **Status:** complete

### Phase 45: Direct Run Cancel
- [x] Design the direct-run-cancel slice
- [x] Create the implementation plan
- [x] Add a process-local direct-run cancellation registry for active direct workflow runs
- [x] Extend `POST /workflow-runs/:id/cancel` to allow `direct + running` when the run is still cancellable in the current API process
- [x] Thread cooperative direct-run cancellation signals through analyze, resume generation, and prefill
- [x] Surface `Cancel run` for running direct runs on Job Detail and Workflow Run Detail with explicit API-process-safe-point copy
- [x] Verify targeted tests, root tests/builds, and direct-mode runtime behavior while keeping Temporal cancel behavior unchanged
- **Status:** complete

### Phase 46: Closeout Delivery Package
- [x] Design the closeout package slice
- [x] Create the implementation plan
- [x] Write a delivery package with capability map, demo walkthrough, verification snapshot, and known limitations
- [x] Update README and tracking files for handoff mode
- [x] Run the final closeout smoke verification and record the result
- **Status:** complete


## Key Questions
1. Which initial slice gives the best balance of visible product value and implementation risk?
2. What architecture should be scaffolded now versus deferred until Temporal and advanced automation?

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Treat the project as an MVP-first monorepo | All three docs align on a local-demo-first strategy |
| Do not start implementation before design approval | Required by the brainstorming workflow |
| Ignore git history for discovery | The folder is not currently a git repository |
| First-round acceptance focuses on Settings/Profile + Job import + Job analysis | This is the smallest slice the user wants truly runnable end to end |
| `worker-playwright` remains scaffolded only in round one | Keeps the repo shape aligned with the target architecture without adding a blocking runtime dependency |
| Use `npm workspaces` instead of `pnpm` in this workspace | `pnpm` is not installed locally, and `npm` lets the first slice move without extra setup work |
| Use OpenAI Responses API for structured analysis output | It better matches the current OpenAI integration path for validated JSON results |
| Remove host port mappings for `postgres` and `redis` | The app only needs them on the Docker network, and local host ports were already occupied |
| Use explicit Nest `@Inject(...)` annotations for runtime services/controllers | `tsx watch` in the container did not provide constructor metadata reliably enough for implicit DI |
| Reuse `candidate_profiles` as the source of resume facts | It keeps the second phase small and avoids introducing an unnecessary parallel profile system |
| Defer PDF and ship structured resume JSON first | This adds real user value without pulling layout/rendering complexity into the current slice |
| Render PDF from API-side print HTML via headless Chromium | This keeps the first export path simple, Docker-compatible, and easy to evolve into additional templates later |
| Start application automation with best-effort prefill plus human approval only | This proves the workflow safely without taking on full submit automation or ATS-specific depth |
| Serve worker screenshots through the API from the shared application-storage volume | The review UI needs browser-safe access to evidence files without exposing container paths directly |
| Extend `applications` with submission-safe fields and a manual confirmation page | This closes the loop after approval without violating the no-auto-submit product boundary |
| Add a lightweight `application_events` table for reopen and retry-ready actions | This keeps submission recovery auditable without dragging in a full workflow engine |
| Build grouped tracker history on top of current records rather than adding a tracker-specific persistence layer | This keeps the timeline truthful, smaller, and easier to evolve |
| Add `actorType` and `actorLabel` directly to `application_events` | This keeps actor attribution queryable and avoids hiding audit metadata inside JSON payloads |
| Add API-generated audit summaries instead of pushing raw payload formatting into the frontend | This keeps timeline and history rendering consistent across dashboard and application review surfaces |
| Standardize lightweight audit payload keys around `note`, status fields, and API-generated `summary` strings | This keeps event rendering stable while remaining compatible with older history rows |
| Add `actorId` and `source` as the next audit-layer fields before expanding filters further | This improves audit trust and future queryability without forcing a larger event-sourcing rewrite |
| Add query/search on top of the strengthened audit model without creating a new audit page | This adds immediate operator value while keeping the product shape compact and reusing the existing dashboard/review surfaces |
| Persist new milestone events close to the writes that create jobs, analyses, resumes, and prefills | This reduces dashboard dependence on derived timestamps while keeping older records readable through fallback logic |
| Expand audit search by broadening existing haystacks instead of adding a dedicated index | This makes ids, titles, companies, and URLs searchable now without adding new persistence or infrastructure |
| Keep application revisions as new `applications` rows instead of mutating an old run | This preserves screenshots, worker logs, and approval history while making reruns cheap to reason about |
| Compare the latest application run against the immediately previous run in the frontend | This closes the rerun-feedback gap without adding schema or API complexity |
| Start Temporal with a single workflow-backed `AnalyzeJobWorkflow` behind `TEMPORAL_ENABLED` | This proves real orchestration without pulling resume generation, prefill, or human approval into a larger migration |
| Extend the Temporal starter slice to `GenerateResumeWorkflow` before touching prefill orchestration | This keeps adjacent non-Playwright work on one orchestration path and avoids mixing durable workflows with browser automation too early |
| Route prefill through Temporal without moving approval/review state transitions into workflows | This extends orchestration to the long-running browser-backed step while keeping the human-in-the-loop product state simple and unchanged |
| Add orchestration metadata to new milestone events instead of building a separate workflow dashboard first | This makes direct-vs-Temporal execution visible immediately in the existing tracker surfaces with much less product and persistence overhead |
| Add a lightweight `workflow_runs` table before introducing workflow controls like retry/cancel | This makes execution attempts observable now and gives future workflow controls a stable place to attach without mixing process state into business-result tables |
| Add retry controls before cancel controls on workflow runs | Retrying failed runs is safer, immediately useful, and reuses the current execution paths without having to interrupt in-flight direct or Temporal work |
| Limit the first cancel control to queued Temporal runs only | Current workflows can be cancelled safely before a worker starts them, but running/direct execution still lacks a trustworthy interruption model, so queued-only cancel keeps the UI promise honest |
| Add `workflow_run_events` plus a dedicated run detail page before building a broader workflow console | This keeps the next observability step narrow, reuses existing run controls, and makes retries/cancels explainable without opening a new admin surface |
| Add a global `/workflow-runs` page before any richer workflow console | This gives operators one place to scan and filter cross-job execution attempts while keeping controls and detailed history in the existing run-detail surface |
| Improve `/workflow-runs` query/result clarity before adding heavier workflow operations | Active filters, result counts, and reset affordances make the current list much easier to use without committing early to bulk actions or saved views |
| Add selection semantics to `/workflow-runs` before any bulk retry/cancel actions | This separates “which runs are selected” from “what actions are allowed,” which keeps later bulk operations easier to reason about and safer to stage in |
| Start bulk actions with navigation-only opens rather than bulk retry/cancel | This makes selection immediately useful while keeping the first bulk-action phase low risk and free of backend state changes |
| Add eligibility counts and mixed-selection guardrails before enabling bulk retry/cancel | This makes future bulk controls honest about what they can operate on and avoids surprising users with partial mixed-selection behavior |
| Bulk retry/cancel should act on the eligible subset and report skipped runs explicitly | This keeps mixed selections usable while preserving clear per-run feedback instead of forcing a perfectly pure selection upfront |
| Show the most recent bulk mutation as per-run outcome rows directly on `/workflow-runs` | This makes bulk retry/cancel explainable without inventing a bulk-history backend or a new operations surface |
| Add follow-up actions to the recent bulk-result panel instead of inventing a separate bulk-ops workspace | This keeps the next-step guidance close to the latest outcome and reuses the current page-local selection model |
| Add inline bulk preflight preview before confirming retry/cancel on `/workflow-runs` | This makes mixed selections much easier to reason about without changing the existing bulk mutation APIs or adding a new page |
| Add browser-embedded PDF preview by splitting `inline` from `attachment` response semantics on the existing PDF route | This reuses the same rendering pipeline for preview and download, keeps behavior consistent, and avoids pulling in a heavier client-side viewer too early |
| Add PDF template selection as a request-scoped `template` query parameter instead of persisting template choice in the database | This keeps the second template small, makes preview/download behavior easy to reason about, and avoids adding per-resume or per-user persistence before template ergonomics are proven |
| Implement running Temporal cancel as a cooperative stop-at-safe-point flow rather than a hard interrupt | This keeps cancellation semantics honest, lets direct services stop before irreversible writes, and avoids inventing rollback or fake `cancelled` outcomes after work already completed |
| Implement direct run cancel as a process-local cooperative cancel flow rather than a hard interrupt or rollback | This fits the current single-API-process architecture, reuses the existing `AbortSignal` checkpoints, and keeps direct cancel honest about what can actually be stopped |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| `git log` failed because the folder is not a git repository | 1 | Continued discovery from local files only |
| `prisma generate` failed because the sandbox blocked Prisma cache writes | 1 | Re-ran with elevated permissions and generated the client successfully |
| `docker compose up --build -d` initially failed because host ports `5432` and `6379` were occupied | 1 | Removed those host bindings and kept database/cache internal to Docker |
| API endpoints returned `500` because injected services were `undefined` at runtime | 1 | Added explicit `@Inject(...)` on constructors so Nest no longer depends on missing runtime metadata |
| Adding required JSON columns to `CandidateProfile` initially failed in Prisma because existing rows had no values | 1 | Added database defaults of `[]` so the schema could be pushed without resetting data |
| Review screenshots were initially only stored as container paths | 1 | Mounted the shared storage volume into the API and added `/applications/:id/screenshots/:name` |
| The live API container briefly used an outdated Prisma client after the submission-safe schema change | 1 | Ran `prisma db push` and `prisma generate` in the container, then restarted the API before re-running the flow |
| Recovery-flow build initially failed after adding `ApplicationEvent` access and mixed action handlers | 1 | Regenerated Prisma, wrapped the new delegate behind a typed helper, split frontend submission vs. recovery handlers, and reran the full build |
| Root workspace build briefly hit an intermittent Next.js `next-font-manifest.json` lookup failure | 1 | Re-ran the root build after a successful standalone web build and the full workspace build passed on the second run |
| Dashboard and application-history search initially did not match raw entity IDs | 1 | Expanded query haystacks in Phase 18 so ids, metadata, and payload text now match without adding a new search backend |
| `curl` briefly returned `Empty reply from server` for the Job Detail route immediately after a Docker rebuild | 1 | Retried after the containers settled; the route then returned the expected HTML shell |
| The first root `npm run build` after adding `/workflow-runs/[id]` failed on a transient Next `.next/types/.../page.ts` lookup | 1 | Re-ran the root build after confirming the standalone web build passed; the second root build completed successfully |
| The first root `npm run build` during Phase 30 again hit the intermittent Next `.next/types/.../page.ts` lookup failure | 1 | Re-ran the root build after successful targeted builds and runtime checks; the second root build completed successfully |
| The first root `npm run build` during Phase 31 again hit the intermittent Next `.next/types/.../page.ts` lookup failure | 1 | Re-ran the root build after the targeted builds and runtime checks passed; the second root build completed successfully |
| The first root `npm run build` during Phase 32 failed on a generated Next types import for `./routes.js` even though the standalone web build was green | 1 | Treated it as another transient `.next/types` generation issue, re-ran the root build after confirming the standalone web build and Docker runtime were healthy, and the second root build completed successfully |
| The first root `npm run build` during Phase 33 again hit the intermittent Next `.next/types/.../page.ts` lookup failure | 1 | Re-ran the root build after the targeted web build, root tests, and Docker runtime checks were already green; the second root build completed successfully |
| The first browser-level verification for Phase 34 failed because headless Chromium could not launch under the local sandbox | 1 | Re-ran the check with elevated permissions, then confirmed the `/workflow-runs` page rendered active chips, result-summary text, and the filtered-empty state correctly |
| Browser-level verification for Phase 35 also required elevated permissions to launch headless Chromium locally | 1 | Re-ran the interaction check with elevated permissions and confirmed selection count, `Clear selection`, and query-change reset behavior |
| A health check during Phase 36 briefly returned `Recv failure: Connection reset by peer` right after the Docker rebuild | 1 | Re-ran the probe after the containers settled and confirmed `GET /health` was healthy before running browser-level bulk-action verification |
| Browser-level verification for Phase 37 again required elevated permissions to launch headless Chromium locally | 1 | Re-ran the mixed-selection interaction check with elevated permissions and confirmed the eligibility counts, disabled future controls, and guardrail copy rendered correctly |
| Phase 38 bulk-cancel verification needed a genuinely queued Temporal run, which the normal local stack usually drains too quickly | 1 | Switched the stack to `TEMPORAL_ENABLED=true`, temporarily stopped `worker-temporal`, created a queued analyze run, bulk-cancelled it, then restarted the worker and restored the default stack |
| Browser-level verification for Phase 38 again required elevated permissions to launch headless Chromium locally | 1 | Re-ran the bulk retry interaction check with elevated permissions and confirmed inline confirmation, result-summary text, disabled cancel behavior, and selection reset on `/workflow-runs` |
| The first root `npm run build` during Phase 39 failed on another transient Next page-resolution error for `/_document` even though the standalone web build was green | 1 | Re-ran the root build after confirming the targeted web build and Docker runtime were healthy; the second root build completed successfully |
| Browser-level verification for Phase 39 again required elevated permissions to launch headless Chromium locally | 1 | Re-ran the bulk retry interaction check with elevated permissions and confirmed the recent bulk-action result panel, row-level messages, run-detail link, and `Dismiss results` behavior on `/workflow-runs` |
| The first root `npm run build` during Phase 40 hit the same intermittent Next page-resolution error for `/_document` even though the standalone web build was green | 1 | Re-ran the root build after confirming the targeted web build and Docker runtime were healthy; the second root build completed successfully |
| Browser-level verification for Phase 40 again required elevated permissions to launch headless Chromium locally | 1 | Re-ran the follow-up interaction check with elevated permissions and confirmed `Open successful runs`, `Reselect skipped runs`, and the page-local reselection feedback on `/workflow-runs` |
| The local environment did not have Python Playwright installed for the planned browser verification path during Phase 41 | 1 | Fell back to the repo's existing Node Playwright setup, then re-ran the browser preview check with elevated permissions after the sandbox blocked headless Chromium launch |
| The first API probes after the Phase 42 Docker rebuild hit the Nest restart window and returned `Recv failure: Connection reset by peer` | 1 | Checked `docker compose ps` and API logs, waited for the app to finish restarting, then re-ran `GET /health` and the resume endpoints successfully |
| Browser-level verification for Phase 43 again required elevated permissions to launch headless Chromium locally | 1 | Re-ran the Resume Review template-switching check with elevated permissions and confirmed the inline preview plus preview/download links switched cleanly between `classic` and `modern` |
| Phase 44 initially failed to build because the new cancellation helper relied on unavailable Express type imports and `llm-analysis` still referenced `input.signal` after destructuring | 1 | Replaced the request typing with a minimal structural type, passed `signal` explicitly through the LLM integration, and re-ran the API, worker, web, and root builds successfully |
| Running Temporal cancel verification needed a truly in-flight workflow run instead of the already-supported queued case | 1 | Switched the stack back to `TEMPORAL_ENABLED=true`, started a real Temporal prefill run, cancelled it while `running`, confirmed the run settled as `cancelled` and the original request returned `409`, then restored the default Docker env |
| Temporal workflow mode initially stalled because `worker-temporal` tried to call `http://localhost:3001` from inside the container | 1 | Changed the worker `API_URL` to `http://api:3001`, rebuilt the stack in `TEMPORAL_ENABLED=true`, and re-verified the workflow-backed analysis path |
| The first Temporal-mode resume verification hit the API during the Nest restart window and returned `Recv failure: Connection reset by peer` | 1 | Waited for the API health check to turn green, retried the same request, and then confirmed `GenerateResumeWorkflow` plus worker-side resume activity logs |
| A direct-mode prefill verification initially failed because the synthetic `example.com` apply URL was not resolvable inside the browser container at that moment | 1 | Re-ran after the stack settled; the same flow then completed and still demonstrated the intended boundary that prefill failures or successes are both persisted as application evidence |
| The first `GET /health` right after the Temporal-observability rebuild returned `Recv failure: Connection reset by peer` | 1 | Waited for the Nest dev server restart window to finish, confirmed `docker compose ps` plus `GET /health`, and then ran the Temporal-mode workflow verification successfully |
| The initial Phase 25 build failed because a no-op fallback around `WorkflowRunsService` returned shapes that were too loose for TypeScript | 1 | Tightened the local fallback interface to the exact call sites that only need run ids or side-effect acknowledgements, then re-ran the full workspace build |
| A direct-mode Phase 25 prefill verification returned `500` on the synthetic `example.com` job | 1 | Confirmed the worker/browser failure was a real `ERR_NAME_NOT_RESOLVED`, verified that the new `workflow_run` recorded a truthful `failed` state with the linked application id, and then re-ran success-path verification against a reachable local apply URL |
| `docker compose --env-file ... up` did not switch the already-running stack into Temporal mode by itself during Phase 25 verification | 1 | Verified the rendered Compose config, corrected the temporary env file, then re-ran `docker compose --env-file ... up --build -d --force-recreate` before validating Temporal-mode workflow runs |
| The first Phase 26 retry endpoint returned `500` even though the new failed retry run had already been recorded | 1 | Traced it to async error propagation in the retry service, then returned the new persisted retry run when the retry itself failed again |
| `TEMPORAL_ENABLED=true` was not actually reaching the running containers when using `docker compose --env-file ...` during Phase 26 verification | 1 | Verified the rendered Compose config and switched to `TEMPORAL_ENABLED=true docker compose ...`, which correctly propagated `true` into both `api` and `worker-temporal` |
| The first queued Temporal cancel verification left the original `POST /jobs/:id/analyze` request hanging and eventually surfaced as a generic `500` | 1 | Kept the run-level cancel flow, then translated Temporal cancellation into a `409 Workflow run was cancelled` response so cancelled runs no longer look like generic server errors |

## Notes
- Re-read this file before major planning or implementation decisions.
- Update phase status when the design is approved and work moves into implementation.
