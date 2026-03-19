# Phase 31: Workflow Runs Search & Date Filters Design

## Goal

Turn the global workflow-runs page into a practical lookup tool by adding keyword search and created-at date range filters.

## Scope

- Extend `GET /workflow-runs` with:
  - `q`
  - `from`
  - `to`
- Extend `/workflow-runs` with:
  - a keyword search field
  - `from` and `to` date inputs
- Keep the existing filters:
  - `kind`
  - `status`
  - `executionMode`

## Non-Goals

- No pagination
- No sort controls
- No live polling
- No new retry/cancel controls on the global list page

## Design

### Query Semantics

`q` matches these fields:

- `workflowRun.id`
- `workflowRun.workflowId`
- `job.id`
- `job.title`
- `job.company`
- `application.id`
- `resumeVersion.id`
- `resumeVersion.headline`

`from` and `to` filter on `workflowRun.createdAt`.

This keeps date semantics stable for:

- queued runs with no `startedAt`
- failed or cancelled runs where `completedAt` is less useful

### Response Behavior

Summary cards continue to reflect the filtered result set, not the unfiltered total table.

The same `GET /workflow-runs` response still returns:

- `summary`
- `runs`

No second overview endpoint is needed.

### UI

Add to `/workflow-runs`:

- a single text input
- a `From` date input
- a `To` date input

Keep refresh behavior simple:

- change inputs
- fetch again
- update summary and rows together

## Acceptance Criteria

1. `GET /workflow-runs` supports `q`, `from`, and `to`.
2. Search matches ids and linked business context from the approved field list.
3. Date filtering uses `createdAt`.
4. Summary cards reflect the filtered result set.
5. `/workflow-runs` exposes the new inputs and applies them with the existing filters.
6. Root tests, builds, and runtime verification pass.
