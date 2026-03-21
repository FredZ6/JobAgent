# Main Sync And Runtime Brand Cleanup Design

## Goal

Move the local root checkout back onto the latest `main` baseline, preserve the valuable in-progress Rolecraft workflow-run UI cleanup, and finish the remaining runtime/config cleanup that still feels scattered or inconsistent.

## Scope

- Preserve the existing uncommitted workflow-run card / Rolecraft UI cleanup work from the old prep branch
- Continue implementation from a clean branch based on the latest `main`
- Reapply the valuable stash changes on top of the current `main` code
- Add a shared web brand helper for visible product copy
- Improve workflow-run card presentation on Job Detail and the global workflow-runs page
- Keep worker-prefill JSON error payloads from leaking raw blobs into workflow-run summaries
- Centralize Temporal runtime checks and defaults in `@rolecraft/config`

## Non-Goals

- Reintroducing the old `codex-prefill-upgrades-prep` branch state
- Changing database models or workflow semantics
- Redesigning the whole web app
- Reworking LLM provider behavior
- Touching historical plan/spec documents beyond what is needed for current active docs

## Current State

The local root checkout was sitting on `codex-prefill-upgrades-prep`, which had fallen far behind `main` and still carried stale assumptions:

- old visible branding
- older README and docs tone
- no access to the latest `main` fixes
- runtime/config conclusions that no longer matched the real current project

The latest `main` already fixed part of the earlier P1 concerns:

- internal worker auth already uses `INTERNAL_API_TOKEN` resolution
- visible product name is already `Rolecraft`
- seed data and importer branding were already updated
- unresolved automation items and Temporal pause/resume are already present

That means the remaining work is narrower than it first looked.

## Problem Breakdown

### 1. Valuable uncommitted UI cleanup is trapped on an outdated branch

The stash contains useful work:

- a shared workflow-run card component
- cleaner workflow-run status wording
- visible Rolecraft branding helper for the web UI
- API extraction of nested worker error messages

That work should be preserved, but not by continuing on top of the outdated prep branch.

### 2. Temporal runtime configuration is still scattered

The latest `main` still checks `process.env.TEMPORAL_ENABLED` directly in multiple services and repeats Temporal defaults in multiple places. That makes runtime behavior harder to reason about and harder to test.

### 3. Visible branding is still duplicated

Even on `main`, visible Rolecraft copy is still repeated across the web app instead of coming from one shared source.

## Approach Options

### Option 1: Rebase the old prep branch onto `main`

Why not:

- large branch gap for a very small amount of real value
- unnecessary conflict risk
- easy to reintroduce stale state

### Option 2: Start clean from `main`, selectively restore the valuable work, then finish the cleanup

Recommended because:

- preserves the value without preserving the stale branch context
- makes verification simpler
- keeps the final diff aligned with the current real codebase

### Option 3: Ignore the stash and only do runtime cleanup

Why not:

- discards useful UI and error-handling work that is already mostly designed

## Recommended Design

Use **Option 2**.

### Branch Strategy

- keep the old prep-branch work in a stash snapshot
- switch the root checkout to the latest `main`
- create a fresh cleanup branch from `main`
- reapply only the valuable stash changes

### Web Branding

- add a shared `appBrand` helper for visible UI-facing copy
- use it in app metadata and shell branding
- do not change package names or historical documents again

### Workflow Run Card Cleanup

- introduce a reusable `WorkflowRunCard` component
- use shorter, more stable pill labels
- keep long nuance in the detail text, not the status chip
- make failed worker-prefill runs show a human-readable extracted error instead of raw JSON blobs

### Runtime Cleanup

Add runtime helpers in `@rolecraft/config` for:

- whether Temporal is enabled
- the Temporal task queue default
- the Temporal address / namespace defaults where useful

Then update the API services that currently branch on `process.env.TEMPORAL_ENABLED` directly to use those helpers instead.

This should stay intentionally narrow:

- analysis
- resume
- applications
- retry logic
- temporal client/task-queue default resolution

### Verification

- run targeted tests for the reintroduced web/API cleanup
- run full `npm run test`
- run full `npm run build`

