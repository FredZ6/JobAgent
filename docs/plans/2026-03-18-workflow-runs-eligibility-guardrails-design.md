# Phase 37: Workflow Runs Eligibility Guardrails Design

## Goal

Explain which selected workflow runs are eligible for future bulk retry or cancel actions before introducing any real bulk state-changing controls.

## Scope

- Classify the current selection into:
  - retry eligible
  - cancel eligible
  - ineligible
- Show those counts in the `/workflow-runs` bulk action area
- Add disabled future bulk controls:
  - `Retry eligible runs`
  - `Cancel eligible runs`
- Add guardrail copy for mixed selections

## Non-Goals

- No backend changes
- No real bulk retry
- No real bulk cancel
- No confirmation modal
- No changes to single-run retry/cancel behavior

## Design

### Eligibility Rules

Eligibility should follow the same rules as the existing single-run controls.

- `retry eligible`
  - `status = failed`
- `cancel eligible`
  - `executionMode = temporal`
  - `status = queued`
- `ineligible`
  - everything else

These rules stay entirely read-only in this phase.

### Selection Summary

When one or more runs are selected, the bulk action area should show:

- `N runs selected`
- `X retry eligible`
- `Y cancel eligible`
- `Z not eligible`

This gives the user a clear picture of the current mixed selection before any bulk mutation exists.

### Future Controls

Render these controls, but keep them disabled in this phase:

- `Retry eligible runs`
- `Cancel eligible runs`

Their purpose here is explanatory:

- establish the future control surface
- show that eligibility is being computed
- avoid surprising users when real bulk state changes arrive later

### Guardrail Copy

Use helper-generated messaging to explain mixed selections:

- `Only failed runs are retry eligible.`
- `Only queued Temporal runs are cancel eligible.`

If none of the selected runs are eligible for either future action, use a stronger summary:

- `No selected runs are eligible for retry or cancel.`

## Acceptance Criteria

1. `/workflow-runs` shows retry/cancel/ineligible counts for the current selection.
2. The page renders disabled future bulk controls for retry and cancel.
3. Mixed selections show clear guardrail copy.
4. No real retry/cancel state changes happen in this phase.
5. Root tests, builds, Docker verification, and browser-level checks pass.
