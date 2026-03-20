# Demo Assets Plan

This directory is reserved for public-facing screenshots and GIFs tied to releases and README updates.

The `v0.1.0-alpha` release ships with placeholders only, but future media should follow the conventions below.

## Planned Assets

| Asset | Suggested filename | Format | Purpose |
| --- | --- | --- | --- |
| Dashboard overview | `dashboard-overview.gif` | GIF | Show stage tracking, jobs, and workflow visibility at a glance. |
| Job detail and workflow runs | `job-detail-workflow-runs.png` | PNG | Show imported job context, analysis state, resume state, and workflow surface. |
| Resume review and PDF preview | `resume-review-pdf-preview.png` | PNG | Show tailored resume review, template switching, and inline PDF preview. |
| Application review and automation sessions | `application-review-automation-sessions.png` | PNG | Show prefill evidence, screenshots, logs, and session comparison UI. |

## Naming Conventions

- Use lowercase kebab-case filenames.
- Prefer stable, descriptive names over date-stamped names.
- Keep one canonical asset per surface unless there is a strong reason to version multiple variants.

## Format Guidance

- PNG for static screenshots
- GIF for short UI walkthroughs
- Favor readability over cinematic size; the asset should still make sense embedded in a GitHub README
- Avoid including real secrets, API keys, personal email addresses, or private job links in captures

## Intended Usage

These assets are expected to be reused in:

- `README.md`
- GitHub release notes
- demo or walkthrough docs in `docs/releases`

## Current Status

No final public demo assets are checked in yet for `v0.1.0-alpha`.

This directory exists so the first public alpha has a documented asset plan instead of ad-hoc screenshots later.
