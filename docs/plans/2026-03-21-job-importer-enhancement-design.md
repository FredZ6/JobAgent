# Job Importer Enhancement Design

## Goal

Improve the live job importer so it is more truthful and more useful: extract better job data from reachable pages, surface when imports rely on fallbacks, and record import-quality diagnostics without overhauling the `Job` table.

## Scope

- Keep the current `mock` and `live` import modes.
- Strengthen live extraction with:
  - `og:title`
  - `meta name="title"`
  - `og:description`
  - `application/ld+json` `JobPosting`
  - common apply-link heuristics
- Distinguish live HTML imports from synthetic fallbacks.
- Record warnings and diagnostics in `job_imported` event payloads.
- Keep the persisted `Job` model mostly unchanged.

## Non-Goals

- Building site-specific adapters for Greenhouse, Lever, Ashby, or other ATS vendors.
- Adding browser-based scraping.
- Expanding the `Job` Prisma model with many new columns.
- Adding frontend UI for import warnings in this slice.

## Problem

The current importer is too binary:

- `mock` mode returns deterministic synthetic data.
- `live` mode performs a single `fetch`, reads a few tags, and quietly falls back to synthetic data when anything goes wrong.

That means users cannot tell whether a job was imported from real page content or generated from a slug fallback, and we lose useful diagnostics about import quality.

## Recommended Design

### Import Result Shape

Internally enrich importer results with:

- `importSource`: `live_html | synthetic_fallback`
- `importWarnings: string[]`
- `importDiagnostics: Record<string, unknown>`

The final `Job` record still persists the existing core fields:

- `sourceUrl`
- `applyUrl`
- `title`
- `company`
- `location`
- `description`
- `rawText`
- `importStatus`

### Truthful Fallback Semantics

Synthetic fallback should no longer pretend to be a normal successful live import.

- Live extraction with usable content:
  - `importStatus: "imported"`
  - `importSource: "live_html"`
- Synthetic fallback:
  - `importStatus: "failed"`
  - `importSource: "synthetic_fallback"`

This still allows the app to create a `Job` record for manual follow-up, but it stops masking fallback imports as if they were complete live imports.

### Extraction Priority

#### Title

Prefer:
1. `application/ld+json` `title`
2. `og:title`
3. `meta name="title"`
4. `<title>`
5. URL slug fallback

#### Description

Prefer:
1. `application/ld+json` `description`
2. `og:description`
3. `meta name="description"`
4. body text extraction
5. synthetic fallback description

#### Company

Prefer:
1. `application/ld+json` `hiringOrganization.name`
2. `og:site_name`
3. hostname fallback

#### Apply URL

Prefer:
1. explicit absolute URL from `JobPosting` fields when available
2. matching anchor tags whose text suggests “apply”
3. source URL fallback with warning

### Diagnostics Recording

Store import quality details in `JobEvent.payload` for the `job_imported` event:

- `sourceUrl`
- `importStatus`
- `importSource`
- `warnings`
- `diagnostics`
  - `fetchStatus`
  - `fetchError`
  - `titleSource`
  - `companySource`
  - `descriptionSource`
  - `applyUrlSource`
  - `usedJsonLd`
  - `usedBodyFallback`

This gives us observability without expanding the `Job` schema.

## Verification

- Add service tests for:
  - mock mode
  - JSON-LD extraction
  - richer metadata extraction
  - apply-link extraction
  - fallback truthfulness
- Add controller test to verify event payload enrichment.
- Run targeted API tests, then full `npm run test` and `npm run build`.
