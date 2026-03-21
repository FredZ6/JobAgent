# Unresolved Automation Items and Temporal Pause/Resume Design

## Goal

Close the two remaining implementation gaps from the earlier MVP-vs-spec comparison, excluding the user system:

1. add an independent unresolved-automation model instead of representing everything only through `fieldResults`
2. add real Temporal `pause/resume` support, limited to safe checkpoints

The intent is to strengthen manual handoff and workflow control without destabilizing the current `Application` + `AutomationSession` model.

## Current Context

- `AutomationSession` already exists and now holds detailed execution evidence for prefill attempts.
- Unresolved items are still only implicit:
  - `manual_review_required`
  - `failed`
  - `unhandled`
  - `skipped`
  all live inside `fieldResults`
- The app can already render automation sessions, screenshots, and logs, but it does not have a first-class "needs attention" queue.
- Temporal currently supports starter workflows for:
  - analyze
  - generate resume
  - prefill
- `cancel` exists, but there is no true `pause/resume`.

## Recommended Scope

### 1. Independent unresolved automation items

Add a dedicated Prisma model named `UnresolvedAutomationItem`.

It should be attached to `AutomationSession` and also reference `Application`, so the app can answer both questions:

- what unresolved items came out of this specific automation run?
- what unresolved items are still outstanding for this application?

Recommended fields:

- `id`
- `automationSessionId`
- `applicationId`
- `fieldName`
- `fieldLabel?`
- `fieldType`
  - `basic_text`
  - `resume_upload`
  - `long_text`
- `questionText?`
- `status`
  - `unresolved`
  - `resolved`
  - `ignored`
- `resolutionKind?`
  - `manual_answer`
  - `skipped_by_user`
  - `fixed_by_rerun`
- `failureReason?`
- `source?`
- `suggestedValue?`
- `metadata` JSON
- `resolvedAt?`
- `createdAt`
- `updatedAt`

This model should not replace `fieldResults`. Instead:

- `fieldResults` remains the raw execution evidence
- `UnresolvedAutomationItem` becomes the manual follow-up queue derived from that evidence

### 2. Safe-checkpoint pause/resume for Temporal workflows

Add pause/resume only for Temporal-based workflow runs.

The behavior should be deliberately conservative:

- no mid-activity freezing
- no attempt to stop Playwright or LLM activities partway through
- pause only takes effect when the workflow reaches a safe checkpoint

The first version should extend `WorkflowRun` instead of adding a separate pause table.

Recommended additions:

- `status` includes `paused`
- `pauseRequestedAt?`
- `pausedAt?`
- `pauseReason?`
- `resumeRequestedAt?`

Pause/resume history should continue to flow through the existing `WorkflowRunEvent` timeline instead of a separate event model.

## Backend Design

### Unresolved item generation

The best insertion point is `ApplicationsService.prefillJobDirect()`.

Flow:

1. worker returns `fieldResults`, screenshots, logs, and status
2. API persists those results into:
   - `Application`
   - `AutomationSession`
3. API derives unresolved items from `fieldResults` where `status !== "filled"`
4. API upserts those records into `UnresolvedAutomationItem`

Resolution behavior:

- if a later rerun succeeds for the same `applicationId + fieldName`
- older unresolved items for that field should be marked:
  - `status = resolved`
  - `resolutionKind = fixed_by_rerun`

The first slice does not include manual answer entry or direct in-app resolution.

### Pause/resume API behavior

Add:

- `POST /workflow-runs/:id/pause`
- `POST /workflow-runs/:id/resume`

Pause rules:

- only Temporal runs
- only `queued` or `running`
- API records `pauseRequestedAt`
- API sends a Temporal pause signal
- workflow transitions to `paused` only when it reaches the next safe checkpoint

Resume rules:

- only Temporal runs
- only `paused`
- API records `resumeRequestedAt`
- API sends a Temporal resume signal
- workflow transitions back to active execution

Events should record:

- `run_pause_requested`
- `run_paused`
- `run_resumed`

### Safe checkpoints

For the current starter workflows, safe checkpoints should be inserted before the major activity call in each workflow:

- analyze
- generate resume
- prefill

This is intentionally smaller than "pause anywhere" and fits the current workflow design.

## Frontend Design

### Unresolved items UI

Add a read-only unresolved-items section to:

- application detail
- submission review

Suggested labels:

- `Needs attention`
- `Manual follow-up`

Each item should show:

- field/question name
- field type
- failure reason
- suggested value when present
- source session / timestamp
- current unresolved status

This should come from `UnresolvedAutomationItem[]`, not from ad-hoc field result filtering in the page layer.

### Pause/resume UI

Only surface controls on workflow run detail.

Behavior:

- Temporal `queued/running`: show `Pause run`
- Temporal `paused`: show `Resume run`
- direct runs: show neither
- keep existing cancel behavior

Status messaging should be explicit:

- pause requested:
  - `Pause requested. This run will pause at the next safe checkpoint.`
- paused:
  - `This run is paused and can be resumed from the workflow detail page.`

Workflow run list should show the `paused` state but not expose pause/resume controls in the first slice.

## Risks and Non-Goals

### Risks

- incorrectly resolving older unresolved items during reruns
- confusing users if pause appears immediate even though it is checkpoint-based
- mixing direct-run and Temporal-run control semantics

### Non-goals for this slice

- manual unresolved resolution UI
- manual answer entry and writeback
- pause/resume for direct runs
- mid-activity freezing
- new compare/search/filter systems for unresolved items

## Verification Strategy

Validation should cover:

- Prisma modeling and migration generation
- unresolved-item derivation and rerun resolution behavior
- Temporal pause/resume API and workflow state transitions
- workflow run detail UI behavior
- app detail and submission review unresolved-item rendering
- regression checks for prefill, automation sessions, retry, cancel, and build stability

## Acceptance Criteria

1. `UnresolvedAutomationItem` exists as an independent model.
2. Application detail and submission review can render an independent unresolved queue.
3. Temporal workflow runs support safe-checkpoint `pause/resume`.
4. Workflow run detail can display and operate `pause/resume`.
5. Direct runs are not incorrectly treated as pause/resume-capable.
6. Existing prefill, automation session, retry, and cancel flows do not regress.
