# Release Packaging Design

## Goal

Prepare the repository for its first public `v0.1.0-alpha` release by adding release-facing docs, packaging guidance, and GitHub-side configuration artifacts that make the project feel intentionally publishable rather than merely functional.

## Current Context

- The open-source release checklist is down to one remaining item: release packaging.
- The repository already has:
  - governance files
  - a public-facing README
  - Prisma migrations
  - GitHub Actions CI
  - at least one API happy-path e2e
  - a cleaned-up release checklist and stronger product boundaries
- The repo still does **not** have:
  - a changelog
  - release notes for a named version
  - a support matrix
  - documented GitHub label conventions
  - a defined home for future demo screenshots/GIFs

## Recommended Scope

Treat this release as the first public alpha:

- version: `v0.1.0-alpha`
- maturity: pre-1.0, local-first, human-in-the-loop
- target audience: early adopters, contributors, and reviewers who want to run the project locally and evaluate the workflow

The release package should cover both:

1. **repository-side assets**
   - `CHANGELOG.md`
   - release notes
   - support matrix
   - demo-assets placeholder docs
2. **GitHub-side release guidance**
   - a reusable release template
   - a documented label scheme that can be applied manually in the GitHub UI

## Release Packaging Shape

### Root Changelog

Add `CHANGELOG.md` at the repository root.

The first entry should be `v0.1.0-alpha` and should follow a lightweight changelog structure:

- Added
- Changed
- Known limitations

This file should stay concise and read as a version history, not as a duplicate of the README.

### Release Notes

Add `docs/releases/v0.1.0-alpha.md`.

This should be the user-facing release announcement for the first public alpha. It should explain:

- what the release is
- what it includes
- who it is for
- what it still does **not** promise

This file should be suitable for copying into a GitHub Release description with minimal or no editing.

### Support Matrix

Add `docs/releases/support-matrix.md`.

This document should capture:

- supported or tested runtime expectations
- Docker Compose status
- local `npm` workflow expectations
- provider support (`OpenAI`, `Gemini`)
- maturity of `mock`, `live`, and `Temporal` paths

The matrix should be honest and operational rather than promotional.

### Demo Asset Placeholders

Add `docs/releases/demo-assets/README.md`.

This should define:

- the planned screenshot/GIF inventory
- file naming conventions
- which product surfaces each asset should cover
- the role of these assets in future README and release updates

No fake image files should be created in this slice. The goal is to create the structure and expectations for future assets.

### GitHub Release Support

Add `docs/releases/release-template.md`.

This should provide a reusable release template with sections such as:

- Summary
- Highlights
- What is included
- Known limitations
- Setup notes
- Feedback welcome

This gives the repo a stable, file-backed source of truth even if GitHub-native release templates are configured later.

### GitHub Labels Guidance

Add `docs/releases/github-labels.md`.

This should define a recommended label set with:

- name
- category
- color suggestion
- usage guidance

Recommended categories:

- triage
- type
- area
- difficulty
- community

This keeps GitHub-side repo configuration reproducible without needing to automate label creation in this slice.

## README Integration

Update `README.md` so release packaging is discoverable from the homepage.

Add a short release-focused section or link cluster that points to:

- `CHANGELOG.md`
- `docs/releases/v0.1.0-alpha.md`
- `docs/releases/support-matrix.md`

This should connect the public landing page to the release material without cluttering the main onboarding narrative.

## Writing Principles

All release-packaging docs should:

- use `v0.1.0-alpha` consistently
- describe the project as local-first, human-in-the-loop, and best-effort where appropriate
- avoid overclaiming production readiness
- align with the README on:
  - manual final submit
  - best-effort prefill
  - single active provider/model/key
  - current local/developer maturity

## Verification Strategy

Validation for this slice should focus on:

- file completeness
- consistency across README, release notes, and changelog
- link correctness
- accurate reflection of current runtime/provider/support boundaries

## Acceptance Criteria

1. The repo contains a release packaging set for `v0.1.0-alpha`.
2. `CHANGELOG.md`, release notes, support matrix, release template, GitHub label guidance, and demo-asset placeholders all exist.
3. The README links readers to the new release materials.
4. The docs describe current product boundaries honestly and consistently.
5. The open-source release checklist marks the release-packaging item complete.
