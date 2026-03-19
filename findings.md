# Findings & Decisions

## Requirements
- Build a local-first MVP for a semi-automated AI job application assistant.
- Required stack: `Next.js`, `NestJS`, `TypeScript`, `PostgreSQL`, `Prisma`, `Redis`, `Playwright`, `Docker Compose`, `Zod`.
- Required flow: import job by URL, extract JD, analyze fit, generate tailored resume, prefill application, pause for human approval, track application status.
- First version supports exactly one LLM provider, one API key path, and one model name.
- The system must remain human-in-the-loop and must not auto-submit final applications.
- The repository should be monorepo-shaped and optimized for open-source local startup.
- First-round acceptance must prioritize a real end-to-end run of `Settings/Profile + Job import + Job analysis`.
- `worker-playwright` should not be part of the first-round required runtime path.

## Research Findings
- `spec.md` defines the hard MVP boundaries and the minimum environment variables.
- `roadmap.md` recommends building in this order: skeleton and Docker, then settings/profile, then job import and analysis.
- `system-design.md` adds the desired module split, API surface, and future Temporal expansion, but also makes clear that Temporal can be deferred.
- The current folder only contains the three markdown documents; no app scaffold exists yet.
- `pnpm` is not installed locally, while `node`, `npm`, and `docker` are available.
- The current OpenAI path should use the `Responses API` with JSON-schema output for analysis responses.
- Local host ports `5432` and `6379` were already occupied, even though the app only needed those services inside Docker.
- Nest service injection under `tsx watch` in Docker was not reliably receiving constructor metadata, causing controllers and services to get `undefined` dependencies.
- Phase two can stay small by reusing `candidate_profiles` and extending it with experience/project libraries.
- Prisma cannot add new required fields to an existing table with live rows unless defaults are provided.
- Phase three can stay small by exporting an existing completed `resume version` instead of persisting generated PDF files.
- Phase four should start with best-effort prefill evidence and explicit human approval instead of final submission automation.
- Review screenshots need an API-served path; raw container file paths are not usable from the browser.
- Tracker dashboard can derive stage state from existing job, analysis, resume, and application records without adding a new table.
- Final submission can stay safe and useful by recording a manual outcome on the existing `applications` record instead of automating the click or adding a separate submissions table.
- Submission recovery can stay small by adding a lightweight `application_events` trail for reopen and retry-ready actions instead of introducing a full workflow timeline.
- Tracker history can stay honest and useful by combining implicit milestones from entity timestamps with explicit `application_events`, instead of backfilling synthetic rows into the database.
- Actor attribution can stay lightweight in the current single-user mode by storing `actorType + actorLabel` on `application_events` and deriving stable defaults for implicit milestones in the dashboard read-model.
- Lightweight audit enhancements can stay small by standardizing common payload keys, adding API-generated summaries, and filtering by actor at read time instead of introducing a separate audit product surface.
- The next highest-value audit step is to add stable `actorId + source` fields before investing further in search/filter UX, because the data model needs stronger identifiers first.
- Once actor/source attribution is in place, the next best operator improvement is to add query/search to the current timeline surfaces instead of building a separate audit page.
- The next best audit hardening step after query/search is to persist new milestone events for imports, analyses, resume generations, and prefills, while leaving older records on a safe derived fallback path.
- After explicit milestone persistence, the next highest-value improvement is to make search match entity context directly so operators can look up history by ids, titles, companies, and URL fragments.
- After entity-aware audit search, the next practical product gap is revision ergonomics: users need a clear way to create a fresh prefill attempt without losing the previous run.
- After revision ergonomics, the next practical gap is revision feedback: users need to see whether the newest prefill run improved anything over the previous attempt.
- After application-run comparison, the next safest orchestration step is to move only job analysis into Temporal behind a feature flag while keeping other flows on their current direct paths.
- After the three starter Temporal slices are live, the next highest-value improvement is to surface direct-vs-Temporal execution metadata inside the existing tracker instead of building a separate workflow UI.
- After orchestration metadata became visible, the next missing piece was a real attempt-level status model so analyze, resume, and prefill could be tracked as queued/running/completed/failed without inferring from final business records.
- After workflow-run status became visible, the next safest control is retry for failed runs; cancel is a riskier follow-up because it has to interrupt in-flight direct and Temporal execution cleanly.
- The first safe cancel slice should stay limited to queued Temporal runs; current direct and running paths still lack a trustworthy interruption model.
- After retry/cancel controls landed, the next highest-value improvement is live status UX on Job Detail so operators do not need to keep manually refreshing while runs are still active.
- After live status UX, the next highest-value observability gap is run-level history: workflow runs need their own lifecycle timeline and detail surface before a broader workflow console would be worth building.
- After run-level history landed, the next safest workflow-ops step is a global runs list with lightweight filters, rather than jumping straight to a full workflow console with more controls.
- After safe bulk navigation landed, the next safest bulk-ops step is to classify the current selection into retry-eligible, cancel-eligible, and ineligible runs before enabling any real bulk state changes.
- After eligibility guardrails landed, the next safest bulk-ops step is to let bulk retry/cancel act only on eligible subsets while reporting skipped runs explicitly, instead of demanding a perfectly pure selection.
- After first-cut bulk retry/cancel landed, the next missing UX piece is per-run outcome detail so operators can see exactly what happened without manually re-opening the list or scanning for changed rows.
- After recent bulk outcome details landed, the next missing UX piece is follow-up guidance so operators can continue from the latest result without manually rebuilding the next selection.
- After browser-embedded preview landed, the next most practical PDF improvement is a second request-scoped template on Resume Review, because it raises output quality immediately without dragging in template persistence or a heavier viewer.
- After multi-template PDF landed, the next safest workflow-control improvement is cooperative cancellation for running Temporal runs, because queued-only cancel leaves the most important long-running path without an honest stop mechanism.

## Technical Decisions
| Decision | Rationale |
|----------|-----------|
| Recommend starting with monorepo scaffold + Docker + settings/profile + job import + job analysis | This is the smallest slice that makes the product feel alive while keeping risk below resume generation and Playwright automation |
| Defer Temporal and the full prefill flow from the first implementation slice | The docs consistently frame those as later phases and higher complexity |
| Use planning files in the repo root | The task is multi-step and will likely exceed a single context window |
| Keep `worker-playwright` as a non-blocking placeholder service/app in round one | Preserves the intended architecture while keeping acceptance centered on the core settings and analysis loop |
| Implement the monorepo with `npm workspaces` | It matches the local toolchain and still satisfies the monorepo requirement |
| Default development analysis mode to mockable behavior | This keeps the core loop testable without depending on live model calls during setup |
| Add a synthetic job-import fallback | Import remains demoable even when live pages cannot be fetched or parsed reliably |
| Keep only `web` and `api` published to host ports in Docker Compose | This avoids collisions with existing local database/cache services and still satisfies the round-one demo path |
| Add explicit `@Inject(...)` to Nest constructors | This stabilizes DI in the container runtime without changing business logic |
| Add `.dockerignore` and install `openssl` in the API image | This shrinks Docker build context dramatically and removes the Prisma runtime warning path |
| Add structured resume generation before PDF export | This gives phase-two value without taking on rendering/template complexity yet |
| Extend profile with structured experience and project libraries | Resume generation needs factual source material that the current profile did not store |
| Use API-side print HTML plus headless Chromium for PDF export | It fits the current architecture, works inside Docker, and keeps the first PDF path template-friendly |
| Introduce an `applications` record before any submit workflow exists | This creates a stable review object for prefill evidence, approval state, and future submission work |
| Mount the shared application storage volume into both `worker-playwright` and `api` | This lets the worker write screenshots once and the API serve them safely to the web app |
| Build the first tracker dashboard from derived state instead of persisted timeline rows | It keeps the phase small and surfaces useful workflow status without premature tracker-specific schema work |
| Keep the first tracker dashboard as one unified `/dashboard` page | A combined jobs + applications view gives the most useful operator view without splitting context across multiple pages |
| Extend `applications` with submission-safe fields instead of creating a `submissions` table | It keeps the MVP small while still recording the final human-confirmed outcome after approval |
| Add a small `application_events` table for submission recovery actions | It preserves reopen/retry history without expanding into a full workflow engine yet |
| Build dashboard history as a read-model instead of persisting a new tracker table | It reuses current source-of-truth records and keeps the timeline truthful about what is explicitly known |
| Store `actorType` and `actorLabel` directly on `application_events` | It keeps actor attribution queryable and avoids hiding audit metadata inside JSON payloads |
| Standardize new audit payload writes around `note`, status keys, and server-generated `summary` strings | It keeps dashboard and review history rendering consistent without backfilling older rows or inventing a new audit model |
| Add `actorId` and `source` to persisted and derived audit events | It gives history a stronger identity layer now, and future filtering/reporting can build on it without reworking the existing timeline APIs |
| Add `source`, keyword, and date-range filtering to the existing audit endpoints | It makes the current dashboard/review surfaces genuinely investigable without multiplying product surfaces or persistence complexity |
| Add a small `JobEvent` table and explicit `prefill_run` application events for new milestone writes | It hardens timeline accuracy for new records without forcing a risky backfill or full event-sourcing rewrite |
| Expand audit query matching to include entity ids and flattened business context | It closes the main operator gap without needing a search index or new APIs |
| Treat each application revision as a new prefill attempt instead of editing the old run | It keeps history and evidence honest while reusing the existing backend flow |
| Compare the latest application run against the previous one on Job Detail in the web app | It adds immediate rerun feedback without adding persistence or API complexity |
| Introduce Temporal with a single workflow-backed analysis slice behind `TEMPORAL_ENABLED` | It proves durable orchestration with minimal product risk and keeps the direct path available as a safe fallback |
| Extend the Temporal starter slice to resume generation before touching prefill orchestration | It keeps orchestration on adjacent non-browser steps first and avoids coupling durable workflows to Playwright too early |
| Route prefill through Temporal next, but keep approval/review on the existing application state machine | It extends orchestration to the long-running browser-backed step without turning human review into workflow state prematurely |
| Expose orchestration metadata through milestone events and existing history surfaces before building dedicated workflow pages | It gives immediate operational visibility into direct vs Temporal execution while reusing the current tracker model |
| Add a dedicated `workflow_runs` read-model for execution attempts instead of overloading analyses, resume versions, or applications | It keeps process state separate from business outcomes and gives direct-mode and Temporal-mode runs one consistent status model |
| Add retry controls to `workflow_runs` by creating a fresh run linked with `retryOfRunId` | This preserves failed-run evidence, keeps retries auditable, and reuses existing direct/Temporal execution paths without mutating prior attempts |
| Limit cancel controls to queued Temporal runs in the first cut | This adds a real operator control without falsely promising safe interruption of running/direct work or rollback of persisted business records |
| Keep workflow live-refresh local to Job Detail instead of making the whole dashboard realtime | This improves the operator experience where actions actually happen, without turning the broader tracker into a noisy constantly-refreshing console |
| Add workflow-run eligibility counts and disabled future bulk controls before enabling bulk retry/cancel | This makes mixed selections legible, keeps the UI honest about what is currently actionable, and lets the eventual bulk retry/cancel semantics be added on top of a clear foundation |
| Let first-cut bulk retry/cancel act on eligible subsets and report skipped runs explicitly | This keeps mixed selections usable while reusing the existing single-run semantics and preserving honest per-run feedback |
| Show the latest bulk retry/cancel result directly on `/workflow-runs` with row-level outcomes and optional run-detail links | This keeps bulk state changes explainable without introducing a separate bulk-history model or a heavier operations console |
| Add follow-up actions directly to the recent bulk-result panel and keep them page-local | This keeps the next-step guidance close to the latest result while avoiding new APIs, new persistence, or cross-page selection complexity |
| Add inline `Will process / Will skip` preview before confirming bulk retry/cancel on `/workflow-runs` | This gives mixed selections a clearer preflight explanation without changing the existing bulk mutation APIs or introducing a separate review page |
| Add browser-embedded PDF preview by separating `inline` and `attachment` response semantics on the existing PDF route | This keeps preview and download visually consistent while avoiding a heavier client-side PDF viewer too early |
| Add PDF template selection as a request-scoped `template` query parameter and keep it page-local to Resume Review | This adds a real second template with very small surface area, keeps preview/download behavior deterministic, and avoids premature persistence decisions |
| Implement running Temporal cancel as a cooperative stop-at-safe-point flow driven by request abort propagation and Temporal activity heartbeats | This keeps cancellation semantics honest, avoids fake hard-kill behavior, and lets completed business writes remain completed instead of being mislabeled as cancelled |

## Issues Encountered
| Issue | Resolution |
|-------|------------|
| No git repository is initialized in the workspace | Plan without relying on commit history |
| Prisma client generation needed cache writes outside the workspace | Re-ran the command with elevated permissions |
| Docker runtime verification first failed because host ports conflicted with existing local services | Removed unnecessary host bindings for `postgres` and `redis` |
| API runtime returned 500s on profile/settings/jobs even though startup logs looked healthy | Traced to missing Nest DI metadata under `tsx watch` and fixed with explicit `@Inject(...)` |
| Prisma `db push` for phase two first failed on required JSON columns with existing data | Added schema defaults for the new JSON fields and re-ran the stack |
| Installing Chromium in the API image added noticeable build time and image size | Accepted for this phase to avoid a separate PDF worker while keeping export reproducible in Docker |
| Application screenshots were initially visible only as `/app/...` paths in API JSON | Added a screenshot-serving API route and mounted the shared storage volume into the API container |
| Tracker API work briefly failed build even though tests passed | Tightened the approval-breakdown typing and cleaned up overlapping service edits before rerunning `tsc` |
| Running containers briefly used an outdated Prisma client after the submission-safe schema change | Ran `prisma db push` and `prisma generate` inside the live API container, then restarted the API so runtime behavior matched the new code |
| Recovery-flow build briefly failed after adding event history and mixed submission/recovery actions into one client handler | Narrowed the Prisma access behind a small typed helper, split the frontend submission and recovery handlers, and reran the full build |
| Root workspace build briefly hit an intermittent Next.js `next-font-manifest.json` lookup failure even though the web build passed on its own | Re-ran the root build after the standalone web build; the subsequent full build passed cleanly |
| Pre-existing recovery events had no actor attribution after the new schema landed | Kept old rows honest with `system / system` fallback and verified new writes persist `user / local-user` without backfilling synthetic history |
| Approval history notes were still written as `reviewNote`, which did not match the new lightweight audit payload contract | Switched new approval-event writes to `note` and kept the summary builder backward-compatible with older `reviewNote` payloads |
| Older application events had no `source` column value beyond the new default after the schema change | Kept those rows honest with `source=system` fallback and verified that newly written events now persist `source=web-ui` |
| Root workspace build can still hit intermittent Next.js manifest lookup errors even when the standalone web build is clean | Re-ran the standalone web build first, then re-ran the root build; the second full build passed again |
| Existing search/query filters initially did not match raw entity IDs inside dashboard timeline and application-history queries | Expanded the in-memory query haystacks in Phase 18 so ids, metadata values, and payload text now match without adding a separate search layer |
| Immediately after Docker rebuild, the first Job Detail route request returned an empty reply from the web container | Retried after the dev servers settled; the route then returned the expected HTML shell and the comparison flow verified cleanly |
| Temporal-mode analysis initially failed because the worker activity tried to call the API on `localhost` from inside the container | Switched `worker-temporal` to `API_URL=http://api:3001`, rebuilt in `TEMPORAL_ENABLED=true`, and verified the workflow path completed and persisted a fresh `analysis_completed` event |
| The first Temporal-mode resume verification landed during API startup and returned `Recv failure: Connection reset by peer` | Waited for `GET /health` to recover, retried the same request, and then confirmed `GenerateResumeWorkflow`, worker-side resume activity logs, and a fresh `resume_generated` event |
| The first direct-mode prefill verification after the Temporal-prefill refactor failed against the synthetic `example.com` apply URL | Re-ran after the stack settled; the same URL then completed successfully, and the intermediate failed application still confirmed that prefill evidence/failure states remained honest |
| The first health probe after the Temporal-observability Docker rebuild landed during the Nest restart window and returned `Recv failure: Connection reset by peer` | Waited for the restart to settle, re-checked `GET /health`, and then re-ran the Temporal-mode analyze/resume/prefill verification successfully |
| A Phase 25 direct-mode prefill verification returned `500` on the synthetic `example.com` apply URL | Confirmed the browser worker raised a real DNS failure, verified the linked `workflow_run` still recorded `failed` honestly, and then verified the success path against a reachable local apply URL |
| `docker compose --env-file ... up` did not immediately switch the already-running stack into Temporal mode during Phase 25 verification | Verified the rendered Compose config, corrected the temporary env file, and used `--force-recreate` before re-running the Temporal-mode checks |
| The first Phase 26 retry request still returned `500` after a new failed retry run had already been recorded | Traced it to an async `return` escaping the retry-service catch block; awaited the direct retry path and returned the persisted retry run when a retry failed again |
| `docker compose --env-file ...` still rendered `TEMPORAL_ENABLED=false` during Phase 26 verification | Confirmed the rendered config and switched to `TEMPORAL_ENABLED=true docker compose ...`, which correctly propagated the flag into both runtime containers |
| The first queued Temporal cancel verification left the original analyze request surfacing as a generic `500` even though the run itself had been cancelled correctly | Translated Temporal cancellation into an explicit `409 Workflow run was cancelled`, then re-verified queued cancel end to end |
| Workflow run cards still required manual refresh and exposed raw status strings even after retry/cancel controls were live | Added a small web-side status helper plus active-run polling on Job Detail, while keeping the dashboard itself read-oriented |
| The first root `npm run build` during Phase 31 again hit the intermittent Next `.next/types/.../page.ts` lookup failure | Re-ran the root build after the targeted builds and runtime HTTP checks passed; the second root build completed successfully |
| The first root `npm run build` during Phase 32 failed on a generated Next types import for `./routes.js` even though the standalone web build was green | Treated it as another transient Next `.next/types` generation issue, re-ran the root build after the targeted checks and Docker runtime were already green, and the second root build completed successfully |
| Adding URL query-state to `/workflow-runs` initially caused a Next prerender failure because `useSearchParams()` was used without a Suspense boundary | Wrapped the page content in a small Suspense boundary, kept the query-state helper pure and client-side, and re-ran the web and root builds successfully |
| The first root `npm run build` during Phase 33 again hit the intermittent Next `.next/types/.../page.ts` lookup failure | Re-ran the root build after the targeted web build, root tests, and Docker runtime checks were already green; the second root build completed successfully |
| The first browser-level verification for Phase 34 failed because headless Chromium could not launch under the local sandbox | Re-ran the check with elevated permissions, then confirmed the `/workflow-runs` page rendered active chips, result-summary text, and the filtered-empty state correctly |
| Browser-level verification for Phase 35 also required elevated permissions to launch headless Chromium locally | Re-ran the interaction check with elevated permissions and confirmed selection count, `Clear selection`, and query-change reset behavior |
| A health check during Phase 36 briefly returned `Recv failure: Connection reset by peer` right after the Docker rebuild | Re-ran the probe after the containers settled and confirmed `GET /health` was healthy before running browser-level bulk-action verification |
| Browser-level verification for Phase 37 again required elevated permissions to launch headless Chromium locally | Re-ran the mixed-selection interaction check with elevated permissions and confirmed the eligibility counts, disabled future controls, and guardrail copy on `/workflow-runs` |
| Bulk-cancel runtime verification for Phase 38 needed a genuinely queued Temporal run, which the normal local stack usually drains too quickly | Switched the stack to `TEMPORAL_ENABLED=true`, temporarily stopped `worker-temporal`, created a queued analyze run, bulk-cancelled it, then restarted the worker and restored the default direct-mode stack |
| Browser-level verification for Phase 38 again required elevated permissions to launch headless Chromium locally | Re-ran the bulk retry interaction check with elevated permissions and confirmed inline confirmation, result-summary text, disabled cancel behavior, and selection reset on `/workflow-runs` |
| The first root `npm run build` during Phase 39 failed on another transient Next page-resolution error for `/_document` even though the standalone web build was green | Re-ran the root build after the targeted web build and Docker runtime were already healthy; the second root build completed successfully |
| Browser-level verification for Phase 39 again required elevated permissions to launch headless Chromium locally | Re-ran the bulk retry interaction check with elevated permissions and confirmed the recent bulk-action result panel, row-level messages, run-detail link, and `Dismiss results` behavior on `/workflow-runs` |
| The first root `npm run build` during Phase 40 hit the same intermittent Next page-resolution error for `/_document` even though the standalone web build was green | Re-ran the root build after the targeted web build and Docker runtime were already healthy; the second root build completed successfully |
| Browser-level verification for Phase 40 again required elevated permissions to launch headless Chromium locally | Re-ran the follow-up interaction check with elevated permissions and confirmed `Open successful runs`, `Reselect skipped runs`, and page-local reselection feedback on `/workflow-runs` |
| Python Playwright was not installed locally during Phase 41 browser verification | Switched to the repo's existing Node Playwright setup and then re-ran the preview interaction check with elevated permissions after the sandbox blocked headless Chromium launch |
| The first API probes after the Phase 42 Docker rebuild landed during the Nest restart window and returned `Recv failure: Connection reset by peer` | Waited for the API to finish restarting, confirmed the new inline PDF route in container logs, and then re-ran `GET /health` plus the resume PDF endpoints successfully |
| Browser-level verification for Phase 43 initially failed because headless Chromium could not launch under the local sandbox | Re-ran the Resume Review template-switching check with elevated permissions and confirmed the inline preview plus preview/download links changed from `classic` to `modern` correctly |
| Phase 44 initially failed to build because the new cancellation helper relied on unavailable Express type imports and `llm-analysis` still referenced `input.signal` after destructuring | Replaced the request typing with a minimal structural type, passed `signal` explicitly through the LLM integration, and re-ran the API, worker, web, and root builds successfully |
| Running Temporal cancel verification required a truly in-flight workflow run rather than the already-supported queued case | Switched the stack to `TEMPORAL_ENABLED=true`, started a real Temporal prefill run, cancelled it while `running`, confirmed the run settled as `cancelled` and the original request returned `409`, then restored the default Docker env |
| UI-level verification for Phase 44 showed that cancelled running runs still rendered as `Cancelled before execution`, and the initiating Job Detail page leaked raw JSON `Conflict` payloads after cancellation | Split cancelled status copy by `startedAt`, added a small JSON-error-message extractor in the web API client, and re-ran browser-level verification until Job Detail and Run Detail both showed clean cancellation feedback |
| The first direct-cancel runtime script failed inside the sandbox with local `fetch` EPERM and then hit `ECONNRESET` while the rebuilt Docker stack was still restarting | Re-ran the local verification script with elevated permissions, waited for `docker compose up --build -d` plus `GET /health` to settle, then confirmed a real running direct prefill run cancelled cleanly with a `409` response |
| The first browser-level direct-cancel verification tried to prove Job Detail and Run Detail on the same short-lived direct prefill run, but that run often completed before both pages could be exercised | Tightened the UI verification into a faster Job Detail cancel path plus Run Detail terminal-state check, then re-ran it with elevated permissions until a real direct run settled as `cancelled` and the Run Detail copy showed `Cancelled during execution` |

## Resources
- `/Users/fredz/Downloads/job agent/spec.md`
- `/Users/fredz/Downloads/job agent/roadmap.md`
- `/Users/fredz/Downloads/job agent/system-design.md`
- `/Users/fredz/.codex/superpowers/skills/brainstorming/SKILL.md`
- `/Users/fredz/.codex/skills/planning-with-files/SKILL.md`
- OpenAI official docs on the Responses API
- `/Users/fredz/.codex/superpowers/skills/systematic-debugging/SKILL.md`
- `/Users/fredz/.codex/skills/webapp-testing/SKILL.md`

## Visual/Browser Findings
- Frontend routes for Job Detail and Resume Review still return valid HTML shells after the PDF-export changes.
- PDF export returns a one-page PDF from Docker for a real persisted resume version.
- The Application Review route now returns a valid HTML shell, and the screenshot endpoint returns a real `image/png` file from Docker-backed storage.
- The dashboard API returns real aggregated tracker data, and the dashboard page is now wired into the main navigation.
- The Submission Review API route now returns real submission-review payloads, and the dashboard can surface `ready_to_submit` and `submitted` after manual confirmation.
- Submission recovery now returns real `submission_reopened` and `submission_retry_ready` events, and the dashboard recent-activity feed surfaces both.
- The dashboard now exposes both a flat `/dashboard/timeline` feed and grouped `/dashboard/history` timelines for jobs and applications.
- Dashboard timelines and submission-history events now show actor attribution, with `api / apps-api` and `worker / playwright-worker` derived for implicit milestones and persisted `user / local-user` on new recovery writes.
- Dashboard and submission-review history now support actor-aware filtering and API-generated summaries, so users no longer have to read raw payload JSON to understand recent actions.
- Dashboard and submission-review history now expose `actorId` and `source`, which makes it much clearer whether an event came from the UI, derived read-model logic, older system-default rows, or worker-style automation.
- Dashboard global timeline and submission-review history can now filter by `source`, keyword text, and date range, while grouped history remains an intentionally read-only overview for now.
- New job imports, analyses, resume generations, and prefills now persist explicit milestone events, and dashboard/history prefer those rows over derived fallbacks whenever they exist.
- Dashboard timeline and submission-review history search now match raw ids and flattened business context, including job ids, application ids, title/company text, and URL fragments already present in event metadata.
- Job Detail and Application Review now present reruns as fresh prefill attempts, and repeated runs keep older application evidence intact instead of overwriting it.
- Job Detail now compares the latest application run with the immediately previous run, including field-state deltas, screenshot/log deltas, and field-level changes.
- Temporal starter orchestration is now live for analysis: the API can submit `AnalyzeJobWorkflow`, the Temporal worker executes the internal direct-analysis activity, and fresh analysis events still appear in the tracker with source `analysis-service`.
- Temporal starter orchestration now also covers resume generation: the API can submit `GenerateResumeWorkflow`, the Temporal worker executes the internal direct-resume activity, and fresh `resume_generated` events still appear in tracker history with source `resume-service`.
- Temporal starter orchestration now also covers prefill: the API can submit `PrefillJobWorkflow`, the Temporal worker executes the internal direct-prefill activity, and fresh application rows plus `prefill_run` events still appear in tracker history with source `worker-prefill`.
- Tracker history now surfaces orchestration metadata for fresh Temporal-backed analysis, resume, and prefill events, including `executionMode`, `workflowType`, `taskQueue`, and the concrete workflow id, while older rows remain honestly `null`.
- Job Detail now exposes a dedicated workflow-run panel, and the dashboard jobs board now shows the latest analyze/resume/prefill run summaries with direct-vs-Temporal execution mode.
- `GET /jobs/:id/workflow-runs` and `GET /workflow-runs/:id` now return concrete execution-attempt rows, including linked `resumeVersionId` or `applicationId` when those runs produce downstream records.
- Failed workflow runs can now be retried from Job Detail, and successful or failed retries both preserve prior runs while linking the new run with `retryOfRunId`.
- Direct-mode runtime verification now covers both a successful completed prefill run and an honest failed prefill run, while Temporal-mode runtime verification confirms new `analyze`, `generate_resume`, and `prefill` runs persist as `executionMode=temporal`.
- Job Detail and Workflow Run Detail now expose `Cancel run` for queued and running Temporal workflow runs, with running rows explicitly framed as stopping at the next safe cancellation point.
- Queued Temporal analyze runs now remain visibly `cancelled`, and the original canceled request returns `409 Workflow run was cancelled` instead of a generic server error.
- Job Detail now auto-refreshes while any workflow run is still `queued` or `running`, and workflow-run cards use clearer state-specific labels and guidance instead of only raw status strings.
- Dashboard job cards now summarize latest runs with more readable compact copy like `Analyze queued`, `Resume running`, and `Prefill cancelled`.
- Workflow runs now have a dedicated detail page and run-level lifecycle history, so queued/started/completed/failed/cancelled/retried transitions are visible separately from the higher-level audit timeline.
- `GET /workflow-runs/:id` now returns linked job/application/resume/retry context, and `GET /workflow-runs/:id/events` returns persisted run lifecycle events for newer runs.
- There is now a global `/workflow-runs` view for cross-job execution attempts, with lightweight `kind/status/executionMode` filtering and summary cards derived from the filtered result set.
- The global `/workflow-runs` view and `GET /workflow-runs` now also support keyword search plus created-at date ranges, and the summary cards stay aligned with the filtered result set instead of only the unfiltered totals.
- The global `/workflow-runs` view and `GET /workflow-runs` now also support sorting plus cursor-based pagination, while the summary cards continue to reflect the full filtered result set instead of just the currently loaded page.
- `/workflow-runs` now syncs filter/search/date/sort state into the URL, so refreshes and shared links restore the same first-page query without encoding transient pagination cursor state.
- `/workflow-runs` now also surfaces result-summary copy, removable active-filter chips, `Clear filters`, and a smarter filtered-empty state, which makes the current query much easier to read without changing the underlying API.
- `/workflow-runs` now also supports page-local selection with per-row checkboxes, `Select all loaded`, and `Clear selection`, while keeping selection intentionally scoped to the current query.
- `/workflow-runs` now also supports safe bulk actions for the current selection, including opening selected run-detail pages and deduplicated selected job pages, while blocking more than `5` targets at once.
- `/workflow-runs` now also explains mixed selections before any backend bulk controls exist, including retry-eligible, cancel-eligible, and ineligible counts plus disabled future `Retry eligible runs` / `Cancel eligible runs` buttons and guardrail copy.
- `/workflow-runs` now also supports first-cut bulk retry/cancel with inline confirmation, eligible-subset execution, explicit skipped rows, success summaries, and selection reset after the action completes.
- `/workflow-runs` now also shows the most recent bulk retry/cancel result in-page, including row-level `success / skipped / failed` outcomes, optional `Open run detail` links, and a `Dismiss results` control.
- `/workflow-runs` now also adds follow-up actions to the recent bulk-result panel, including opening successful runs and rebuilding a new page-local selection from skipped or failed-result rows that are still visible in the current loaded page.
- `/workflow-runs` now also shows an inline bulk preflight preview before confirmation, splitting the current mixed selection into explicit `Will process` and `Will skip` groups and collapsing cleanly again when the user chooses `Go back`.
- Resume Review now embeds the generated PDF inline through a dedicated `/resume-versions/:id/pdf/inline` route, while `Download PDF` continues to use the attachment response and both paths render the same document bytes.
- Resume Review now also supports `Classic` and `Modern` PDF templates; switching templates updates the inline preview iframe plus the preview/download links in one place, while the API keeps `classic` as the stable default when no template is specified.
- Running Temporal workflow runs can now be cancelled honestly: a real in-flight Temporal prefill run was cancelled mid-execution, the run settled as `cancelled`, and the original public request returned `409 Workflow run was cancelled` instead of a generic server error.
- Browser-level re-verification now also shows clean cancellation UX: Job Detail surfaces `Workflow run was cancelled` without raw JSON noise, and Run Detail no longer labels already-started cancelled runs as `before execution`.
- Running direct workflow runs can now also be cancelled honestly within the current API process: a real direct prefill run was cancelled mid-execution, the run settled as `cancelled`, and the original public request returned `409 Workflow run was cancelled`.
- Completed direct workflow runs still reject cancel with `400 Only running direct workflow runs can be cancelled`, which keeps the new direct cancel control honest about its safe-point boundary.
