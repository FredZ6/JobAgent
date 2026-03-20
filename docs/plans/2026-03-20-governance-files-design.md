# Governance Files Design

## Goal

Add the missing open-source governance files so the repository reads like a public project instead of only a handoff/demo codebase.

## Current Context

- The repo already has a working CI baseline in `.github/workflows/ci.yml`.
- The repo does not yet have any of the standard governance files expected by outside users:
  - `LICENSE`
  - `CONTRIBUTING.md`
  - `CODE_OF_CONDUCT.md`
  - `SECURITY.md`
  - issue templates
  - PR template
- The project is still an early-stage local-first MVP, so the docs should be honest and lightweight rather than pretending there is a large maintainer team or heavy enterprise process.

## Recommended Shape

### License

Add a standard `MIT` license with no project-specific carve-outs.

Why:

- It is familiar to contributors.
- It keeps reuse friction low.
- It matches the current project stage well.

### Code of Conduct

Add `CODE_OF_CONDUCT.md` based on `Contributor Covenant 2.1`.

Project-specific customization should stay minimal:

- name the project correctly as `OpenClaw Job Agent`
- point the enforcement contact at the repository maintainer through a private GitHub contact path

The rest should stay close to the standard text so contributors immediately recognize it.

### Contributing Guide

Add a lightweight `CONTRIBUTING.md` that explains:

- the kinds of contributions that are welcome
- how to get the repo running locally
- the minimum verification commands to run before opening a PR
- when to open an issue before a large change
- the safety boundaries that matter most for this repo:
  - do not bypass human final submit
  - do not hide automation failures
  - be explicit when behavior changes touch `mock/live`, provider choice, or Temporal routing

This should read like an onboarding document, not an internal process handbook.

### Security Policy

Add `SECURITY.md` that explains:

- do not report vulnerabilities through public issues
- contact the maintainer privately first
- best-effort response expectations
- the supported-version reality for a fast-moving pre-1.0 repo

The language should be straightforward and honest about current maintainer bandwidth.

### GitHub Templates

Add:

- `.github/ISSUE_TEMPLATE/bug_report.yml`
- `.github/ISSUE_TEMPLATE/feature_request.yml`
- `.github/ISSUE_TEMPLATE/config.yml`
- `.github/pull_request_template.md`

These should stay intentionally lightweight.

The bug template should collect the repo-specific runtime context that actually matters:

- Docker vs local runtime
- `JOB_IMPORT_MODE`
- `JOB_ANALYSIS_MODE`
- `JOB_RESUME_MODE`
- `TEMPORAL_ENABLED`
- LLM provider (`OpenAI`, `Gemini`, or not applicable)

The feature template should guide contributors to place requests in the product workflow:

- Settings
- Profile
- Jobs/import
- Analyze
- Resume
- Prefill
- Review/submission
- Workflow runs

The PR template should mirror how this repo already documents changes:

- summary
- what changed
- how to test
- risks / follow-ups

## Intentional Omissions

Do not add these in this slice:

- `SUPPORT.md`
- discussion templates
- multilingual governance docs
- a maintainer-only handbook
- contributor license agreement text

These are unnecessary for the current project stage and would add ceremony without much value.

## Verification Strategy

This slice is mostly documentation/configuration, so validation should focus on:

- all required files exist in the expected GitHub locations
- the Markdown content matches the current project reality
- issue-template YAML is structurally valid and uses the right repo-specific fields
- the checklist reflects completion once the files are in place

## Acceptance Criteria

1. The repo contains `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, and `SECURITY.md`.
2. The repo contains bug and feature issue templates plus a PR template.
3. The governance text matches the repo's current local-first, human-in-the-loop product boundaries.
4. The templates collect the runtime context needed to debug or review this project effectively.
5. The open-source release checklist marks the governance-files item complete.
