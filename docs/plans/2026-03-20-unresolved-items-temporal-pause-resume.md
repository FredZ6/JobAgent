# Unresolved Automation Items and Temporal Pause/Resume Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add an independent unresolved-automation queue and safe-checkpoint Temporal pause/resume support without disrupting the existing `Application` + `AutomationSession` execution flow.

**Architecture:** Treat this work as two coordinated layers. First, add a derived unresolved-items model on top of existing automation evidence. Second, extend Temporal-backed `WorkflowRun` state to support pause requests, paused runs, and resume signals at safe checkpoints. Keep `fieldResults` and current event timelines intact for compatibility.

**Tech Stack:** Prisma, NestJS, Temporal, Next.js, npm workspaces, TypeScript

---

### Task 1: Add Prisma models and shared types

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/job.ts`
- Modify: `packages/shared-types/src/dashboard.ts`
- Modify: any Prisma-generated/shared enum consumers touched by new statuses

**Step 1: Add unresolved-item model**

Add `UnresolvedAutomationItem` with the agreed fields and relations to:

- `AutomationSession`
- `Application`

**Step 2: Extend workflow run status/state**

Update `WorkflowRun` to support:

- `paused` status
- `pauseRequestedAt`
- `pausedAt`
- `pauseReason`
- `resumeRequestedAt`

**Step 3: Reflect the new shapes in shared types**

Expose:

- unresolved item types
- `paused` workflow status
- any new response fields used by the API/web layers

**Step 4: Generate and commit the migration**

Run:

```bash
npm run prisma:migrate -- --name unresolved-items-and-pause-resume
```

Expected:
- a new Prisma migration directory is created
- Prisma client stays in sync with the schema

### Task 2: Persist unresolved automation items in the application flow

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: any API DTO/mapper files needed for application/submission-review responses
- Modify: relevant test files under `apps/api/src/applications`

**Step 1: Derive unresolved items from field results**

After prefill worker results are persisted, derive unresolved items from field results where:

- `status !== "filled"`

Include categories such as:

- high-risk long answers requiring manual review
- upload failures/unhandled upload controls
- basic fields that were not filled
- skipped/unhandled/failed long-text items

**Step 2: Upsert unresolved items**

Write the unresolved items under the current `AutomationSession` and `Application`.

**Step 3: Resolve prior items on rerun success**

If a later rerun fills a previously unresolved field for the same application, mark the old unresolved item:

- `status = resolved`
- `resolutionKind = fixed_by_rerun`

**Step 4: Return unresolved items in read APIs**

Ensure `getApplication()` and submission-review responses include the unresolved queue in a stable shape for the web app.

### Task 3: Add Temporal pause/resume backend APIs and workflow support

**Files:**
- Modify: `apps/api/src/workflow-runs/workflow-runs.controller.ts`
- Modify: `apps/api/src/workflow-runs/workflow-runs.service.ts`
- Modify: `apps/api/src/temporal/temporal.service.ts`
- Modify: `apps/worker-temporal/src/workflows.ts`
- Modify: Temporal-related tests under `apps/api` and `apps/worker-temporal`

**Step 1: Add pause/resume controller actions**

Add:

- `POST /workflow-runs/:id/pause`
- `POST /workflow-runs/:id/resume`

Restrict them to Temporal execution mode only.

**Step 2: Add run-state transitions**

Support:

- pause request from `queued`/`running`
- paused state when workflow reaches checkpoint
- resume from `paused`

Record:

- `pauseRequestedAt`
- `pausedAt`
- `resumeRequestedAt`

**Step 3: Emit workflow-run events**

Write `WorkflowRunEvent` records for:

- `run_pause_requested`
- `run_paused`
- `run_resumed`

**Step 4: Add workflow signals/checkpoints**

Introduce pause/resume signaling in starter workflows and pause gating before each major activity:

- analyze
- generate resume
- prefill

The workflow should wait in a paused state only at the checkpoint boundary, not mid-activity.

### Task 4: Add unresolved-items UI and pause/resume controls

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/applications/[id]/page-client.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page-client.tsx`
- Modify: `apps/web/src/app/workflow-runs/[id]/page-client.tsx`
- Modify: `apps/web/src/app/workflow-runs/page-client.tsx` or equivalent list view
- Add/modify: reusable UI components/helpers as needed
- Modify: corresponding web tests

**Step 1: Surface unresolved items**

Render a read-only `Needs attention` / `Manual follow-up` section in:

- application detail
- submission review

**Step 2: Add workflow-run controls**

On workflow run detail:

- show `Pause run` for Temporal `queued/running`
- show `Resume run` for `paused`
- keep `Cancel run`
- show explanatory checkpoint-based messaging

**Step 3: Show paused status in list/detail surfaces**

Add `paused` badge/state handling in workflow run views, while keeping actions detail-page-only.

### Task 5: Verify, update docs/checklists, and commit

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md` only if a current checklist entry needs status clarification
- Modify: docs or README only if API/UX behavior explanations now require updates

**Step 1: Run focused verification**

Run:

```bash
npm run prisma:generate
```

Expected:
- PASS

Run:

```bash
npm run test
```

Expected:
- PASS

Run:

```bash
npm run build
```

Expected:
- PASS

**Step 2: Confirm feature behavior**

Verify that:

- unresolved items appear independently from raw field results
- Temporal pause/resume works only for Temporal runs
- direct runs do not show pause/resume controls
- existing automation session and retry/cancel flows still work

**Step 3: Commit**

```bash
git add prisma/schema.prisma prisma/migrations packages/shared-types apps/api apps/web apps/worker-temporal docs/plans
git commit -m "Add unresolved automation items and pause resume"
```
