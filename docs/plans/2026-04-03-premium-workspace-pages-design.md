# Premium Workspace Pages Design

## Goal

Extend the approved Executive Workspace direction beyond the homepage and shell so the rest of the product feels like one premium SaaS system instead of a collection of older page layouts.

## Scope

This pass covers:

- Dashboard
- Jobs list
- Job detail
- Workflow runs list
- Workflow run detail
- Settings
- Profile
- Application review
- Submission review

## Design Direction

Keep the same premium SaaS visual system already introduced on the homepage:

- cool neutral product surfaces
- restrained amber and mint accents
- clean, productized hierarchy
- stronger page headers and summary rails
- clearer separation between overview, actions, evidence, and manual review

## Page Model

Each page should follow a consistent workspace rhythm:

1. A page header or hero band that explains the surface and frames the current state.
2. A side rail or summary card when the page benefits from quick metrics or operating notes.
3. Main work panels below, still optimized for actual task flow.

## Per-Page Intent

### Dashboard

Should feel like an executive operations overview: top-level metrics first, then the current queue, then detailed timelines and boards.

### Jobs

Should feel like intake plus pipeline: importing a job and scanning the queue should read as one coherent operating surface.

### Job Detail

Should feel like a case file: role record, source quality, decision support, resumes, workflow runs, and application comparisons should all feel like parts of one high-trust review surface.

### Workflow Runs

Should feel like a run control console: summary, filters, bulk controls, and the run list should be grouped into a clear operations flow.

### Settings

Should feel less like a plain form and more like a model control room: configuration state, provider choice, and save status should be framed as runtime controls.

### Profile

Should feel like a candidate dossier: identity, work context, reusable material, and default answers should read as one structured record.

### Application Review and Submission Review

Should feel like approval desks: context on the left, decision controls on the right, with evidence and manual follow-up stacked below.

## Guardrails

- Preserve existing business logic and testable workflows.
- Avoid turning operational pages into marketing pages.
- Prefer structural changes and visual grouping over large copy rewrites.
- Keep the application review and submission review pages clearly human-controlled.
