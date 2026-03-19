# Phase 30: Global Workflow Runs View Design

## Goal

Add a single global workflow-runs page so operators can scan and filter execution attempts across all jobs without turning the product into a full workflow console.

## Scope

- Add a global `/workflow-runs` page in the web app.
- Add `GET /workflow-runs` with light filtering.
- Return one response that includes:
  - filtered run rows with linked context
  - lightweight summary counts for the current result set
- Add a top-level navigation entry for the new page.

## Non-Goals

- No new retry/cancel controls on the global list page.
- No live polling or workflow-console behavior.
- No free-text search, date range, pagination, or sorting controls in this phase.
- No dashboard refactor to absorb the global workflow-runs list.

## Design

### API

Add `GET /workflow-runs`.

Supported query params:

- `kind`
  - `analyze`
  - `generate_resume`
  - `prefill`
- `status`
  - `queued`
  - `running`
  - `completed`
  - `failed`
  - `cancelled`
- `executionMode`
  - `direct`
  - `temporal`
- `limit`

The response shape should be:

- `summary`
  - `totalRuns`
  - `queuedRuns`
  - `runningRuns`
  - `completedRuns`
  - `failedRuns`
  - `cancelledRuns`
- `runs`
  - `workflowRun`
  - `job`
  - `application?`
  - `resumeVersion?`

Summary counts are computed from the filtered result set so the cards always match the currently visible list.

### UI

Add `/workflow-runs` with four blocks:

1. Summary cards
2. Filter controls
3. Global runs list
4. Empty state

Each row should show:

- run id
- kind
- status
- execution mode
- job title / company
- linked application or resume when present
- started / completed time
- link to run detail

### Navigation

Add `Workflow runs` to the main app shell navigation.

## Acceptance Criteria

1. `/workflow-runs` loads successfully.
2. `GET /workflow-runs` supports `kind`, `status`, `executionMode`, and `limit`.
3. The response includes summary counts plus linked run rows.
4. The page shows summary cards and filtered rows from a single response.
5. Each row links to the existing run detail page.
6. Root tests, builds, and runtime verification pass.
