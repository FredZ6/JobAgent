# Lever And Ashby Importer Design

## Summary

Add first-party Lever and Ashby job-page adapters to the existing importer so Rolecraft can extract higher-quality job data from those common ATS pages before falling back to the generic HTML heuristics.

## Goals

- Keep the existing `Job` model shape unchanged.
- Reuse the same five imported fields:
  - `title`
  - `company`
  - `location`
  - `description`
  - `applyUrl`
- Preserve the current import semantics:
  - adapter success returns `live_html`
  - adapter insufficiency falls back honestly
  - synthetic fallback remains the final safety net

## Approach

### Lightweight Adapter Registry

Promote the current Greenhouse special-case into a small adapter registry owned by `JobImporterService`.

`JobImporterService` keeps responsibility for:

- `mock/live` mode branching
- fetching HTML
- trying adapters in order
- generic HTML/JSON-LD extraction
- synthetic fallback

The new registry module provides a shared adapter interface and an ordered adapter list:

- `greenhouse`
- `lever`
- `ashby`

Each adapter exposes:

- `name`
- `matches(sourceUrl, html?)`
- `extract(html, sourceUrl)`

Each `extract(...)` result keeps the same semantics as the current Greenhouse attempt:

- `matched`
- `result | null`
- `warnings`
- `diagnostics`

### Adapter-Specific Extraction

Each adapter only targets the five existing `Job` fields.

#### Lever

The Lever adapter should prefer:

- job title from the main posting title, then metadata fallbacks
- company from page branding or board slug fallback
- location from posting categories/location metadata
- description from the posting body container, not a whole-page body flatten
- `applyUrl` from a clear CTA when present, otherwise `sourceUrl`

#### Ashby

The Ashby adapter should prefer:

- job title from the primary title/header
- company from page branding/header metadata
- location from header metadata / role metadata
- description from the main posting body container
- `applyUrl` from a clear CTA when present, otherwise `sourceUrl`

### Success Threshold

Adapters should not "succeed" on a title alone.

Minimum success threshold:

- `title` and `description` are present
- at least one of `company`, `location`, or `applyUrl` is a credible supporting field

If a page matches an adapter but extracted content is insufficient:

- the adapter returns `matched: true` and `result: null`
- diagnostics include:
  - `adapterAttempted`
  - `adapterMatched`
  - `adapterFallbackReason`
- `JobImporterService` falls back to the current generic importer path

## Diagnostics

Adapter diagnostics should follow the same shape used by Greenhouse so downstream consumers stay consistent:

- `adapter`
- `adapterMatched`
- `descriptionSource`
- `locationSource`
- `applyUrlSource`
- `usedStructuredPosting`

Warnings should stay intentionally small and high-signal.

## Testing Strategy

Focus on importer-layer confidence, not controller/UI behavior.

Add:

- adapter-level tests for `matches(...)` and success/insufficient extraction
- `JobImporterService` tests for:
  - Lever success
  - Ashby success
  - adapter matched but insufficient content
  - non-adapter pages still using generic logic

## Non-Goals

- No new `Job` fields
- No UI changes
- No real-network fixture crawling
- No large plugin framework
- No controller/event payload changes beyond what already exists
