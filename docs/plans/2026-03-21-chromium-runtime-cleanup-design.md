# Chromium Runtime Cleanup Design

## Goal

Make Chromium runtime resolution for PDF export easier to maintain and easier to debug by extracting it from `ResumePdfService` into `@rolecraft/config` and surfacing a clearer error when no executable is available.

## Scope

- Add a focused Chromium runtime helper to `packages/config/src/env.ts`.
- Update `ResumePdfService` to consume that helper instead of reading `process.env.CHROMIUM_EXECUTABLE_PATH` directly.
- Improve the PDF export failure message when Chromium cannot be resolved.
- Add unit coverage for helper resolution and the readable PDF export error path.

## Non-Goals

- Adding a browser health endpoint or preflight API.
- Expanding platform-specific executable discovery beyond the currently known Linux paths.
- Reworking Playwright launch behavior outside the PDF export service.
- Updating README or `.env.example` in this slice.

## Problem

`ResumePdfService` currently resolves Chromium inline:

- read `CHROMIUM_EXECUTABLE_PATH`
- otherwise try `/usr/bin/chromium`
- otherwise try `/usr/bin/chromium-browser`

That leaves two problems:

1. The runtime logic is not centralized like the other recent mode/URL/path helpers.
2. When Chromium is unavailable, users are left with a lower-level Playwright launch failure instead of a concise, actionable message.

## Recommended Design

### Dedicated Chromium Runtime Helper

Add `resolveChromiumRuntime(env, pathExists?)` to `packages/config/src/env.ts`.

Return a compact result shape:

- `configuredPath`
- `resolvedExecutablePath`
- `knownPaths`

Behavior:

- trim `CHROMIUM_EXECUTABLE_PATH`
- if a configured path exists and the probe says it exists, use it
- otherwise probe the known paths:
  - `/usr/bin/chromium`
  - `/usr/bin/chromium-browser`
- if nothing is available, return `resolvedExecutablePath: undefined`

Allow an optional `pathExists` callback so config tests can verify resolution deterministically without depending on the host filesystem.

### Readable PDF Export Error

Update `ResumePdfService.renderPdf()` to:

- call `resolveChromiumRuntime(process.env)`
- throw a `ConflictException` before `chromium.launch()` if no executable is resolved

The error should clearly tell the user:

- Chromium was not found for PDF rendering
- they can set `CHROMIUM_EXECUTABLE_PATH`
- which default paths were attempted
- when relevant, that a configured path was provided but not found

### Minimal Service Change

Keep the rest of the PDF rendering path unchanged:

- document lookup
- HTML rendering
- PDF generation
- filename generation

This slice should only centralize the runtime resolution and improve the failure mode.

## Verification

- Add helper tests to `packages/config/src/env.test.ts`.
- Add a focused `ResumePdfService` test for the missing-Chromium error path.
- Run:
  - `npm run test --workspace @rolecraft/config -- src/env.test.ts`
  - `npm run test --workspace @rolecraft/api -- src/resume/resume-pdf.service.test.ts`
  - `npm run build --workspace @rolecraft/api`

## Acceptance Criteria

1. `CHROMIUM_EXECUTABLE_PATH` is no longer resolved inline in `ResumePdfService`.
2. `@rolecraft/config` exposes a Chromium runtime helper.
3. Missing Chromium now produces a concise, actionable PDF export error.
4. Helper and service behavior are covered by tests.
5. API/config tests and API build still pass.
