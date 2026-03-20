# OpenClaw Job Agent

OpenClaw Job Agent is a local-first MVP for a semi-automated job application copilot. The current delivery focuses on a practical end-to-end loop: save candidate context, import a job by URL, run structured analysis, and generate a structured tailored resume version before you decide whether the role deserves deeper effort.

## Delivery Status

The current repo is in **closeout / handoff** state for the agreed MVP scope.

- The core candidate -> job -> analysis -> resume -> prefill -> review loop is complete.
- Workflow tracking, retry/cancel controls, audit history, and Temporal starter slices are also in place.
- A delivery-facing summary, demo walkthrough, verification snapshot, and known limitations are collected in [docs/closeout/2026-03-18-delivery-package.md](docs/closeout/2026-03-18-delivery-package.md).

## Current Scope

- Settings page for a single LLM provider, model, and API key
- Profile page for candidate details, skills, experience facts, and project facts
- Job import by URL
- Job detail page with manual analysis trigger
- Structured resume generation per job
- Resume Review page and resume version history
- Multi-template PDF export (`classic` and `modern`) plus browser-embedded preview for completed resume versions
- Best-effort application prefill through `worker-playwright`
- Human Approval review page with field results, worker log, screenshots, and approval states
- Submission Review page for manual final-submit confirmation and result recording
- Submission recovery actions with lightweight event history for reopen and retry-ready
- Tracker dashboard with job stages, application review state, recent activity, grouped history timelines, actor/source filters, API-generated history summaries, richer actor/source attribution, lightweight audit query/search, explicit milestone events for new runs, entity-aware history search, revision-friendly prefill reruns, and latest-vs-previous run comparison on Job Detail
- Temporal-backed job analysis, resume generation, and prefill behind a `TEMPORAL_ENABLED` feature flag, with the direct paths kept as fallbacks
- Workflow run tracking for `analyze`, `generate_resume`, and `prefill`, exposed on Job Detail and through `GET /jobs/:id/workflow-runs`
- Retry controls for failed workflow runs, creating fresh retry runs instead of mutating old failures
- Cancel controls for queued and running Temporal workflow runs, plus running direct workflow runs with process-local safe cancellation
- Live workflow-run UX on Job Detail, including active-run auto-refresh and clearer status guidance
- Workflow run detail/history pages, including linked record context and run-level lifecycle events
- Global workflow-runs page with lightweight filters, keyword search, created-at date filters, sorting, cursor pagination, URL query-state, summary cards, selection, safe bulk navigation, eligibility guardrails, inline bulk preflight preview, first-cut bulk retry/cancel controls, recent per-run bulk outcome details, and next-step follow-up actions
- PostgreSQL + Redis + Docker Compose local runtime

## Not Included Yet

- Full Temporal orchestration beyond the starter analysis, resume, and prefill workflows
- Automatic final application submit automation
- Full audit/event sourcing for every entity

## Tech Stack

- Next.js + React + TypeScript
- NestJS
- Prisma + PostgreSQL
- Redis
- Zod
- Docker Compose

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

`docker compose up --build` now applies the committed Prisma migrations automatically through `npm run prisma:migrate:deploy`.

Then open:

- Web: [http://localhost:3000](http://localhost:3000)
- API health: [http://localhost:3001/health](http://localhost:3001/health)

If you want the seeded demo data after startup, run it explicitly:

```bash
docker compose exec api npm run prisma:seed
```

If you previously booted an older local database from the pre-migration `db push` workflow, recreate your local Postgres volume before relying on the new migration history.

## Environment

Most evaluators only need to set:

```env
LLM_API_KEY=your-key-here
```

Useful round-one toggles:

```env
JOB_IMPORT_MODE=live
JOB_ANALYSIS_MODE=mock
JOB_RESUME_MODE=mock
TEMPORAL_ENABLED=false
```

- `JOB_IMPORT_MODE=mock` keeps imports deterministic when external pages are unreachable.
- `JOB_ANALYSIS_MODE=mock` lets you exercise the UI without spending model tokens.
- `JOB_RESUME_MODE=mock` lets you generate resume versions without spending model tokens.
- `TEMPORAL_ENABLED=true` routes `POST /jobs/:id/analyze`, `POST /jobs/:id/generate-resume`, and `POST /jobs/:id/prefill` through the Temporal worker instead of the direct API paths.

The prefill worker currently uses a best-effort heuristic path and does not require a separate feature flag.

## Database Workflow

- Use `docker compose up --build` to install dependencies, generate the Prisma client, and apply the committed migrations with `npm run prisma:migrate:deploy`.
- Use `docker compose exec api npm run prisma:seed` only when you want the optional demo data; seed is no longer part of container startup.
- Use `npm run prisma:migrate` when you change `prisma/schema.prisma` locally and need to create a new migration.
- Use `npm run prisma:migrate:deploy` in deploy/CI-style contexts where the repo should only apply already-committed migrations.
- If your local Postgres volume came from the older `prisma db push` setup, recreate it before switching to the committed migration workflow.

## Current App Flow

1. Open `Settings` and save provider, model, and API key.
2. Open `Profile` and save candidate details, plus structured experience and project facts.
3. Open `Jobs`, import a job URL, and open the imported record.
4. Trigger `Analyze job` from the detail page.
5. Trigger `Generate resume` from the same job detail page.
6. Open the generated `Resume Review` page to inspect the structured version.
7. Use the template toggle on Resume Review to switch between the `Classic` and `Modern` PDF layouts for the current review session.
8. Use the embedded PDF preview on Resume Review when you want to sanity-check the currently selected PDF template without leaving the page.
9. Download a PDF either from Job Detail or the Resume Review page.
10. Run `Run prefill` from Job Detail to create an application review record.
11. Open the `Application Review` page to inspect field suggestions, screenshots, and worker notes.
12. Mark the run as `approved_for_submit`, `needs_revision`, or `rejected`.
13. Open `Submission Review` for approved applications, then open the real apply page yourself.
14. Record the outcome as `submitted` or `submit_failed` without any automated final submit action.
15. If needed, use `Reopen submission` or `Mark ready to retry` from Submission Review to move the same application back to a safe manual-submit state.
16. If the same job has multiple prefill runs, review the `Run comparison` panel on Job Detail to see whether the newest attempt improved anything.
17. Use the `Workflow runs` section on Job Detail to inspect the latest direct or Temporal execution attempts.
18. If a workflow run fails, use `Retry failed run` on Job Detail to create a fresh retry run while preserving the older failure as history.
19. If a Temporal run is `queued` or `running`, or a direct run is `running`, use `Cancel run` to stop it immediately or at the next safe cancellation point.
20. Open `Workflow runs` from the top navigation when you want a cross-job list of execution attempts with lightweight filters.
21. Use the results summary, active filter chips, and `Clear filters` action there when you want to understand or reset the current cross-job query quickly.
22. Use the row checkboxes, `Select all loaded`, and `Clear selection` if you want to prepare a set of workflow runs for future bulk actions.
23. Use `Open selected run details` or `Open selected jobs` when you want a safe, navigation-only bulk action from the current loaded selection.
24. Use the eligibility counts to understand how many selected runs are retryable or cancellable from the current loaded page.
25. Use `Retry eligible runs` or `Cancel eligible runs` from `/workflow-runs` when you want the system to first show an inline `Will process / Will skip` preview, then act on the eligible subset and skip the rest after confirmation.
26. Review the recent bulk action panel on `/workflow-runs` when you need to see which selected runs succeeded, which were skipped, and which failed, without leaving the page.
27. Use follow-up actions on that panel like `Open successful runs`, `Reselect skipped runs`, or `Reselect failed results` when you want to continue from the latest bulk outcome without rebuilding the next selection by hand.
28. Open `run detail` from either Job Detail or the global workflow-runs page when you need linked record context or the run-level lifecycle timeline.
29. Open `Dashboard` to monitor job stages, application review state, submission state, the global timeline feed, grouped job/application history cards, and latest workflow-run summaries.

## Notes

- `worker-playwright` is now part of the local runtime, but it still stops before any final submit action.
- The new submission-safe flow records manual submission outcomes but still never clicks final submit for the user.
- Recovery actions are tracked in a lightweight `application_events` history rather than a full workflow engine.
- Timeline history now prefers explicit milestone events for new job imports, analyses, resume generations, and prefills, while older rows still fall back to the earlier derived timestamp model.
- Job analysis, resume generation, and prefill now have Temporal starter slices: when `TEMPORAL_ENABLED=true`, the API submits `AnalyzeJobWorkflow`, `GenerateResumeWorkflow`, and `PrefillJobWorkflow`, the Temporal worker executes the matching internal direct activities, and the same completed records/events are still persisted.
- Fresh Temporal-backed analysis, resume, and prefill events now expose orchestration metadata in dashboard history and submission-review history, so you can see whether a record came from `direct` execution or a concrete Temporal workflow run.
- Each analyze, resume, and prefill attempt now also creates a `workflow_run` record with `queued/running/completed/failed`, execution mode, timestamps, and optional linked `resumeVersionId` or `applicationId`.
- Each workflow run now also persists `workflow_run_events` for lifecycle steps like queued, started, completed, failed, cancelled, and retried.
- `GET /jobs/:id/workflow-runs`, `GET /workflow-runs/:id`, and `GET /workflow-runs/:id/events` expose those run records directly, and Job Detail links into the dedicated run detail page without needing a separate admin page.
- Failed workflow runs can now be retried from Job Detail; retries create fresh runs linked by `retryOfRunId` and leave older failed runs untouched.
- Queued and running Temporal workflow runs can now be cancelled from Job Detail and Workflow Run Detail, and running direct runs now expose the same control with explicit API-process-only safe-point wording.
- Running Temporal cancellation is cooperative: the worker/direct path now stops at safe cancellation points instead of pretending to hard-kill or roll back work that already completed.
- Running direct cancellation is also cooperative: the direct API path now stops at safe cancellation points in the current API process instead of pretending it can hard-kill or roll back already completed work.
- When a queued or running Temporal run is cancelled before the business write completes, the original in-flight API call now resolves as `409 Workflow run was cancelled` instead of surfacing as a generic `500`.
- When a running direct run is cancelled before the business write completes, the original in-flight API call now also resolves as `409 Workflow run was cancelled`; already completed direct runs still reject cancel.
- The web app now extracts clean `message` text from JSON API errors, so cancellation feedback no longer leaks raw `Conflict` payloads into the UI.
- Direct-run cancellation is intentionally process-local in this MVP: it works while the run is still registered inside the current API container, and it does not yet coordinate across multiple API instances.
- Job Detail now refreshes itself automatically while workflow runs are still `queued` or `running`, so new analyses, resume versions, and applications show up without manual refresh.
- Workflow-run cards now use clearer state-specific copy, and dashboard job cards now summarize latest runs with compact text like `Analyze queued` or `Prefill cancelled`.
- Workflow run detail pages now show linked job/application/resume context, retry lineage, and run-level lifecycle history for newer runs.
- `/workflow-runs` now provides one filtered list across all jobs, with summary cards for the current result set and direct links into the existing run detail pages.
- `/workflow-runs` now also supports `q`, `from`, and `to`, so run ids, linked job/application/resume context, and created-at date ranges can all be queried from one page while the summary cards stay aligned with the filtered result set.
- `/workflow-runs` now also supports sort controls plus cursor-based pagination, so the global runs view stays usable as the list grows without turning into a heavier workflow console.
- `/workflow-runs` now also syncs filter/search/date/sort state into the URL, so refreshes and shared links reliably restore the same first-page query while keeping pagination cursors session-local.
- `/workflow-runs` now also explains the current query with result-summary copy, removable active-filter chips, a one-click `Clear filters` action, and distinct filtered-empty versus first-run-empty states.
- `/workflow-runs` now also supports page-local run selection with per-row checkboxes, `Select all loaded`, and `Clear selection`; the selection intentionally resets when the query changes and currently powers safe navigation actions only.
- `/workflow-runs` now also supports safe bulk actions for the current selection: opening selected run-detail pages or deduplicated job pages, with a guard that blocks more than `5` targets at once.
- `/workflow-runs` now also surfaces retry-eligible, cancel-eligible, and ineligible counts for the current selection, plus guardrail copy that explains mixed selections before mutation happens.
- `/workflow-runs` now also supports first-cut bulk retry/cancel mutations: eligible subsets are processed, ineligible runs are skipped explicitly, inline confirmation is required, and no more than `5` eligible runs can be retried or cancelled at once.
- `/workflow-runs` now also previews bulk retry/cancel work inline before confirmation, splitting the current selection into `Will process` and `Will skip` groups so mixed selections are easier to reason about.
- `/workflow-runs` now also shows the most recent bulk retry/cancel outcome in-page, with per-run `success / skipped / failed` rows, optional `Open run detail` links, and a `Dismiss results` action.
- `/workflow-runs` now also adds follow-up actions to the recent bulk-result panel, including opening successful run details and rebuilding a new page-local selection from skipped or failed-result rows that are still present in the current loaded page.
- `application_events` now store first-class actor attribution via `actorType` and `actorLabel`, and dashboard/application history surfaces both persisted and derived actor metadata.
- Lightweight audit history now exposes API-generated `summary` text and actor-aware filters on dashboard timeline and submission-review history.
- Audit history now also exposes `actorId` and `source`, so newer events can distinguish UI-driven writes from older defaulted rows and derived milestone records.
- New milestone writes now carry concrete sources like `jobs-controller`, `analysis-service`, `resume-service`, and `worker-prefill`, which makes it easier to trust what the tracker is showing for freshly created records.
- Audit search now also matches entity context like `jobId`, `applicationId`, company/title text, and URL fragments already present in event metadata.
- Running prefill again now clearly means “create a fresh application run”; previous screenshots, logs, and approval state remain available as history.
- Job Detail now compares the latest prefill run against the previous run so rerun outcomes are easier to judge without leaving the page.
- Dashboard global timeline and Submission Review history now support `source`, keyword, and date-range querying for faster audit/debug workflows.
- PDF export now supports two request-scoped HTML templates rendered in the API container: `classic` and `modern`.
- Resume Review now lets you switch between those templates for the current session, and the embedded preview plus `Preview PDF` / `Download PDF` links stay in sync with that choice.
- Application screenshots are served back through the API from the shared Docker volume.
- Tracker state is derived from current jobs, analyses, resume versions, and applications rather than a dedicated timeline table.
- Older recovery events created before actor attribution was added fall back to `system / system`; new writes persist their real actor metadata.
- Prefill is intentionally best-effort: partial fills and honest failures are expected for unsupported or complex forms.
- Synthetic demo URLs like `example.com` can still fail inside the browser worker; those failures now surface cleanly as `failed` workflow runs instead of disappearing behind a generic 500.
- In this compose setup, temporarily enabling Temporal for verification works reliably with `TEMPORAL_ENABLED=true docker compose ...`; `docker compose --env-file ...` alone does not currently override the default `false` value in the rendered service env.
