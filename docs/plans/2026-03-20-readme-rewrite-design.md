# README Rewrite Design

## Goal

Rewrite `README.md` so it works as a public open-source landing page instead of a closeout or handoff document.

## Current Context

- The current README contains a lot of valuable project information, but it is written in a delivery-oriented voice:
  - it opens with `closeout / handoff`
  - it reads like an internal completion summary
  - it includes long implementation-history sections that are too detailed for a GitHub homepage
- The repository now already has a stronger open-source baseline:
  - Prisma migrations are committed
  - CI is present
  - governance files and GitHub templates now exist
- The README should now match that newer repository posture.

## Recommended Shape

### New Top-Level Structure

Rebuild the README around an outside-in reading order:

1. project title and short pitch
2. why the project exists
3. what it can do
4. product boundaries
5. screenshots / demo placeholders
6. quick start
7. configuration
8. walkthrough
9. architecture
10. known limitations
11. roadmap
12. additional docs

This keeps the homepage focused on:

- what the project is
- how to run it
- what not to expect from it yet

### Voice and Positioning

Replace the current `closeout / handoff` language with public-project wording:

- local-first
- human-in-the-loop
- pre-1.0
- best-effort automation
- suitable for experimentation, demos, and iterative improvement

The README should sound welcoming and honest rather than final or self-congratulatory.

### What to Keep

Preserve the high-value facts already in the repo:

- quickstart commands
- migration workflow
- demo-seed command
- provider and feature-flag overview
- current end-to-end app loop
- major architectural components
- important product boundaries

### What to Compress or Move Down

Reduce or reframe:

- the giant `Current Scope` bullet inventory
- the 29-step app-flow list
- the long `Notes` implementation history

Those details are useful, but many belong in:

- shorter summary bullets
- a `Known limitations` section
- links to `docs/closeout`

### Screenshots / Demo Placeholders

Add an explicit `Screenshots / Demo` section even if real assets are not yet checked in.

Use clear placeholder slots for:

- Dashboard overview
- Job detail and workflow runs
- Resume review with PDF preview
- Application review with automation sessions

The placeholders should read as intentional TODOs, not missing content.

## Writing Principles

- Keep the README skimmable.
- Prefer concise bullets and short sections over long narrative paragraphs.
- Be explicit about safety boundaries:
  - final submit remains manual
  - prefill is best-effort
  - provider/runtime behavior can differ between mock and live modes
- Link to deeper docs instead of reproducing every historical detail inline.

## Verification Strategy

Validation for this slice should focus on:

- section coverage
- command accuracy
- link correctness
- consistency with current repo behavior and governance docs

## Acceptance Criteria

1. The README reads like a public open-source homepage rather than a handoff report.
2. A new visitor can quickly understand what the project does, how to run it, and what its boundaries are.
3. Screenshot and GIF placeholders are intentionally structured in the document.
4. Quickstart, migration, and configuration guidance match the current codebase.
5. The open-source release checklist marks the README rewrite item complete.
