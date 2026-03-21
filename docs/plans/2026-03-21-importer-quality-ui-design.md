# Importer Quality UI Design

## Summary

Surface importer quality information that already exists in `job_imported` event payloads so users can tell whether a job came from live page content or a synthetic fallback.

## Goals

- Show a full importer quality panel on Job Detail.
- Show a lightweight importer quality hint on the Jobs list.
- Reuse the latest `job_imported` event as the source of truth.
- Keep the `Job` model unchanged.

## Non-Goals

- New importer storage tables or new `Job` columns.
- Rendering raw diagnostics JSON directly in the UI.
- New job-events endpoints or front-end event parsing.

## Data Model

Extend `JobDto` with:

- `importSummary`
  - `source: "live_html" | "synthetic_fallback"`
  - `warnings: string[]`
  - `hasWarnings: boolean`
  - `statusLabel: string`
- `importDiagnostics`
  - `fetchStatus?: number | null`
  - `usedJsonLd?: boolean`
  - `usedBodyFallback?: boolean`
  - `applyUrlSource?: string | null`
  - `titleSource?: string | null`
  - `companySource?: string | null`
  - `descriptionSource?: string | null`

The controller derives both fields from the most recent `job_imported` event payload.

## API Strategy

- `GET /jobs`
  - include the latest `job_imported` event per job
  - return `importSummary`
- `GET /jobs/:id`
  - include the latest `job_imported` event
  - return `importSummary` and `importDiagnostics`

If no import event exists, both fields remain absent.

## UI Strategy

### Jobs List

Display a lightweight status pill:

- `Live import`
- `Live import · warnings`
- `Fallback import`

### Job Detail

Add an `Import quality` panel that shows:

- summary label
- warning list
- diagnostics key/value lines

Diagnostics stay human-readable rather than raw JSON.

## Testing

- API controller tests for `listJobs()` and `getJob()` mapping.
- Job Detail page test for import quality section.
- Jobs list page test for importer quality badges.

## Acceptance Criteria

- Latest `job_imported` event is mapped into structured import quality fields.
- Jobs list shows a lightweight quality hint.
- Job Detail shows a full import quality panel.
- Missing or legacy import payloads do not break the UI.
