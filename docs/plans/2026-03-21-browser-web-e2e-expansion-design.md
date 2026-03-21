# Browser Web E2E Expansion Design

## Summary

Expand the existing browser-level Playwright coverage from a single happy path into a small matrix that locks down three recently added product capabilities:

- importer fallback quality UI
- unresolved item manual handling
- workflow pause/resume controls

## Goals

- Reuse the current browser runtime harness instead of replacing it.
- Keep each test focused on one product behavior.
- Cover browser interactions across real `web` and `api` processes.
- Keep the new work local-only for now.

## Test Matrix

### 1. Importer Fallback Quality

Add a focused browser test that:

- opens `Jobs`
- imports a mock/fallback job URL
- verifies the list item shows fallback import state
- opens `Job Detail`
- verifies the import quality panel shows fallback quality details, warnings, and diagnostics

This locks the importer quality UI that now surfaces `importSummary` and `importDiagnostics`.

### 2. Unresolved Item Manual Handling

Add a focused browser test that:

- opens a pre-seeded application review with unresolved items
- marks one item resolved in `Application Review`
- verifies the status updates and action buttons disappear for that item
- opens `Submission Review`
- ignores another unresolved item
- verifies the status updates there too

This locks the new manual handling loop without depending on a full worker-generated unresolved scenario.

### 3. Workflow Pause/Resume Controls

Add a focused browser test that:

- opens a pre-seeded Temporal workflow run detail page
- clicks `Pause run`
- verifies the UI reflects pause-requested/paused state
- clicks `Resume run`
- verifies the UI returns to resumed/running semantics

This locks the workflow controls UI and API interaction without requiring a real Temporal cluster.

## Runtime Harness Strategy

Keep the current `apps/web/e2e/support/runtime.ts` as the single test harness and extend it minimally.

### Keep As-Is

- Postgres container lifecycle
- migrations
- local API startup
- local Web startup
- worker stub server

### Add Minimal Fixture Support

Add runtime helpers that can seed deterministic fixture data into the temporary Postgres database:

- unresolved-item application fixture
- temporal workflow run fixture

Use Prisma from the repo runtime to insert those records directly.

### Fake Temporal Signal Mode

The browser test should not require a real Temporal server.

Add a small runtime-only fake mode for pause/resume:

- API starts with an env flag like `ROLECRAFT_E2E_FAKE_TEMPORAL=true`
- `TemporalService.pauseWorkflow()` and `resumeWorkflow()` become no-ops in that mode
- `WorkflowRunPauseResumeService.pauseWorkflowRun()` immediately marks a run paused in that fake mode after recording the pause request
- resume can continue to use the existing `markResumed()` path

This preserves production behavior while giving the browser tests a stable local control path.

## File Organization

Keep the existing:

- `apps/web/e2e/happy-path.e2e.ts`

Add:

- `apps/web/e2e/importer-quality.e2e.ts`
- `apps/web/e2e/unresolved-items.e2e.ts`
- `apps/web/e2e/workflow-run-controls.e2e.ts`

Keep support code lightweight:

- extend `apps/web/e2e/support/runtime.ts`
- add a small `fixtures.ts` only if the fixture objects become noisy

## Non-Goals

- no real Temporal orchestration in browser e2e
- no new page-object abstraction layer
- no full scenario DSL
- no new UI features beyond what the tests need
