# Rolecraft Rename Design

## Goal

Rename the active product, package, and runtime branding from `OpenClaw` / `@openclaw/*` to `Rolecraft` / `@rolecraft/*` without rewriting historical planning inputs that are better preserved as records of the earlier name.

## Current Context

- The repo currently mixes `OpenClaw` across multiple layers:
  - public-facing docs and release notes
  - package names and workspace scripts
  - TypeScript path aliases
  - code imports
  - runtime identifiers such as queue names and user-agent strings
  - seed/test fixture values
- The repository now has a full open-source alpha package, so leaving the old name in the active surfaces would be confusing.
- The user explicitly wants the package scope to change too:
  - `@openclaw/*` should become `@rolecraft/*`

## Recommended Scope

### 1. Active Product and Repo Surfaces

Rename all current outward-facing references to `Rolecraft`, including:

- `README.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `CHANGELOG.md`
- `docs/releases/*`
- `docs/closeout/2026-03-18-delivery-package.md`
- web metadata such as the app title in `apps/web/src/app/layout.tsx`

These are the documents and surfaces a user or contributor will actually read today, so they should not keep the old brand.

### 2. Package / Workspace Scope

Rename all current package identities:

- root package name:
  - `openclaw-job-agent` -> `rolecraft-job-agent`
- workspace package names:
  - `@openclaw/api` -> `@rolecraft/api`
  - `@openclaw/web` -> `@rolecraft/web`
  - `@openclaw/worker-playwright` -> `@rolecraft/worker-playwright`
  - `@openclaw/worker-temporal` -> `@rolecraft/worker-temporal`
  - `@openclaw/config` -> `@rolecraft/config`
  - `@openclaw/shared-types` -> `@rolecraft/shared-types`

This requires updating:

- `package.json` files
- workspace command strings
- TypeScript path aliases
- all source imports and dependency references

### 3. Runtime Identifiers and Fixture Strings

Rename active runtime strings and representative fixture values where they would otherwise leak the old brand, including:

- Temporal task queue names
- HTTP user-agent strings
- app metadata title
- seeded placeholder organization names where appropriate
- test fixture strings that are intended to reflect the current product name

### 4. Historical Inputs and Plan Docs

Keep historical planning inputs and original specs **unchanged** unless they are still directly used as current release or onboarding material.

That means the following should remain as historical records:

- `roadmap.md`
- `spec.md`
- `system-design.md`
- `docs/plans/*`

The goal is to avoid rewriting history just to reduce grep noise. Current truth should be renamed; historical context should remain historically accurate.

## Migration Strategy

### Rename Order

Use this order to reduce breakage:

1. package names in `package.json`
2. TypeScript path aliases
3. source imports and dependency references
4. workspace command strings and supporting docs
5. runtime identifiers and outward-facing product text

This keeps the source-of-truth package identities aligned before import rewrites and script rewrites begin.

### Directory Boundaries

Do **not** rename physical directories in this slice.

Specifically:

- keep `apps/*` and `packages/*` folder names as they are
- keep the repo checkout directory name unchanged

The rename should change logical identifiers, not file layout.

## Risk Areas

The biggest technical risks are:

- incomplete scope migration causing mixed `@openclaw/*` and `@rolecraft/*` imports
- stale workspace names in root scripts, Docker Compose commands, or test commands
- package-lock churn
- accidentally rewriting historical plan docs and creating a huge low-signal diff

The design intentionally avoids the last risk by drawing a hard boundary around historical docs.

## Verification Strategy

Validation should focus on:

- ensuring there are no remaining `@openclaw/*` references in active code paths
- ensuring public-facing docs use `Rolecraft`
- ensuring workspace commands still resolve after the package-scope rename
- confirming the repo still builds and tests successfully after the rename

## Acceptance Criteria

1. Active product and release-facing docs use `Rolecraft` instead of `OpenClaw`.
2. All current package scopes move from `@openclaw/*` to `@rolecraft/*`.
3. Root scripts, Docker commands, and workspace references still work after the rename.
4. Runtime identifiers and active fixture strings no longer leak the old brand.
5. Historical spec/roadmap/plan docs remain intentionally untouched.
6. The repo test and build commands still pass after the rename.
