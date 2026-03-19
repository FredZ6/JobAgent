# Temporal Workflow Observability Design

## Goal
Make the existing Temporal-backed workflows visible in tracker/history surfaces without changing the current product flow or adding a separate workflow dashboard.

## Chosen Approach

### Option 1: Add a separate Temporal admin page
- Richest visibility.
- Overkill for the current product stage and duplicates the tracker we already have.

### Option 2: Extend existing events and timeline items with orchestration metadata
- Add a small, shared orchestration metadata shape.
- Persist it into new analysis/resume/prefill events.
- Surface it in dashboard timeline, grouped histories, and recent activity.
- This is the recommended approach.

### Option 3: Only log more details to stdout
- Lowest effort.
- Useful for developers, but does not help the actual product tracker or review flows.

## Architecture
- Introduce a lightweight orchestration metadata shape:
  - `executionMode`: `direct` or `temporal`
  - `workflowId`: optional
  - `workflowType`: optional
  - `taskQueue`: optional
- Thread this metadata through:
  - `TemporalService`
  - `worker-temporal` workflows and activities
  - internal direct routes
  - direct analysis / resume / prefill writers
- Persist orchestration metadata into event payloads for:
  - `analysis_completed`
  - `resume_generated`
  - `prefill_run`
- Extend dashboard read-models so timeline items expose orchestration metadata directly.

## Scope Boundaries
- No new database tables.
- No new public API routes.
- No separate workflow UI.
- No attempt-level visibility into Temporal retries or run history yet.
- No changes to approval, submission, or resume-generation business behavior.

## UI Behavior
- Existing dashboard timeline and grouped history cards should show:
  - `mode direct` or `mode temporal`
  - workflow id when present
- Older rows with no orchestration metadata should stay honest and render without it.

## Error Handling
- If an event has no orchestration metadata, the tracker should treat it as unknown rather than inventing one.
- Direct-mode writes should explicitly persist `executionMode=direct` so new rows stay queryable.
- Temporal-mode writes should persist workflow metadata from the API-generated workflow id and type.

## Testing Strategy
- Extend shared dashboard schemas with optional orchestration metadata.
- Add dashboard-service tests proving persisted payload orchestration data reaches timeline items.
- Add focused tests around Temporal metadata passing where needed.

## Acceptance Criteria
1. New analysis, resume, and prefill events persist orchestration metadata.
2. Dashboard overview/timeline/history responses expose orchestration metadata.
3. Dashboard UI renders direct vs. temporal mode clearly for new rows.
4. Older rows without orchestration metadata still render correctly.
5. `npm test`, `npm run build`, and Docker verification stay green.
