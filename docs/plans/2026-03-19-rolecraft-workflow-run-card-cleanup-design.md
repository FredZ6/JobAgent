# Rolecraft Rename And Workflow Run Card Cleanup Design

## Goal

Polish the Job Detail workflow-run cards so failed runs no longer dump raw JSON into the UI, the card hierarchy reads more clearly, and the visible product name changes from `OpenClaw Job Agent` to `Rolecraft`.

## Scope

- Rename the visible web app brand from `OpenClaw Job Agent` to `Rolecraft`
- Keep internal package names like `@openclaw/*` unchanged
- Clean up the Job Detail workflow-run cards with:
  - shorter status pills
  - cleaner status summaries
  - more structured metadata rows
  - bottom-aligned actions
- Reuse the same cleaned-up workflow-run presentation on the global `/workflow-runs` page where practical
- Preserve full raw failure context on run-detail pages

## Non-Goals

- Renaming workspace package names, task queues, or internal namespaces
- Redesigning the entire app theme
- Changing workflow-run data shape in the database
- Removing detailed error context from dedicated detail views

## Root Cause

The most disruptive UI failure is caused by worker prefill failures returning a JSON response body. The API currently throws `new Error(errorText)` when the worker response is non-OK, which means the entire JSON payload becomes the workflow-run `errorMessage`. The Job Detail card then renders that raw string as its summary text.

## Approach Options

### Option 1: Frontend-Only Sanitization

Keep the backend as-is and only sanitize/clip workflow-run error messages in the web app.

Why not now:
- Fixes the symptom but preserves bad persisted error data for future consumers
- Leaves API-side workflow-run error messages noisy and harder to reason about

### Option 2: Root-Cause Extraction Plus UI Cleanup

Extract a human-readable worker error message in the API when the worker returns a non-OK response, then make the web card presentation more structured and resilient.

Recommended because:
- Fixes new failures at the source
- Keeps older bad data readable through frontend sanitization
- Delivers the requested UI cleanup without expanding scope into a full redesign

### Option 3: Full Workflow-Card Redesign

Create an entirely new workflow-card system with richer visuals and expanded states.

Why not now:
- Higher visual and regression risk
- More design churn than needed for the current reported issue

## Recommended Design

Use **Option 2: Root-Cause Extraction Plus UI Cleanup**.

### Branding

- Introduce a shared front-end brand helper for:
  - app name
  - app subtitle
- Update the browser title and topbar title to `Rolecraft`
- Keep repo/package identifiers unchanged for now

### Error Handling

- Add API-side extraction for non-OK worker responses:
  - prefer `errorMessage`
  - fall back to `error`
  - then fall back to raw text
- Keep a frontend summary helper that can still collapse legacy noisy strings and JSON-like payloads already stored in the database

### Workflow Card Presentation

Restructure workflow-run cards into stable sections:

1. compact pill row
2. optional job title/company context when relevant
3. short summary block
4. metadata rows for time, execution context, and retry lineage
5. bottom action row

Presentation rules:
- use shorter status pill labels such as `Queued`, `Cancelled`, and `Failed`
- keep longer nuance in body copy, not in pills
- clamp or otherwise limit the summary block so one bad run cannot explode the layout
- pin the action row toward the bottom of the card

### Verification

- Add/update tests for:
  - brand helper copy
  - workflow-run status/error summarization
  - API extraction of worker error messages from JSON response bodies
- Run targeted API/web tests
- Run web build to confirm the pages still compile
