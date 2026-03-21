# Greenhouse Importer Design

## Summary

Add a first site-specific importer adapter for Greenhouse job pages so live imports can extract more reliable title, company, location, description, and apply URL data than the generic HTML heuristics.

## Goals

- Detect common Greenhouse job page URLs and DOM structures.
- Use a dedicated Greenhouse extraction path before the generic importer logic.
- Return clearer adapter-specific diagnostics when Greenhouse parsing succeeds or falls back.
- Keep non-Greenhouse import behavior unchanged.

## Non-Goals

- Lever or Ashby support in this slice.
- A full plugin system for every future job board.
- New database columns or API shape changes.

## Architecture

- `JobImporterService` remains the single orchestrator for mock/live mode, fetch, fallback, and final import result semantics.
- Add a dedicated `greenhouse-importer.ts` module with:
  - `matchesGreenhouseJob(sourceUrl, html?)`
  - `extractGreenhouseJob(html, sourceUrl)`
- Greenhouse extraction runs after HTML fetch and before generic parsing.
- If the adapter succeeds with enough content, its result is returned.
- If it matches but quality is insufficient, importer diagnostics record the attempt and the service falls back to the generic path.

## Data Expectations

The Greenhouse adapter should try to extract:

- `title`
- `company`
- `location`
- `description`
- `applyUrl`

Diagnostics should include:

- `adapter: "greenhouse"`
- `adapterMatched: true`
- `adapterFallbackReason?`
- `descriptionSource`
- `locationSource`
- `applyUrlSource`
- `usedStructuredPosting`

Warnings stay narrow and high-signal, for example:

- `greenhouse_apply_cta_not_detected`
- `greenhouse_location_not_detected`
- `greenhouse_description_trimmed`

## Success Rules

Greenhouse adapter success requires:

- non-empty `title`
- non-empty `description`
- at least one additional high-confidence field among `company`, `location`, or `applyUrl`

If those checks fail, the adapter returns `null` and the main importer records that Greenhouse was attempted before using the generic path.

## Testing

Add importer tests for:

- successful Greenhouse extraction
- Greenhouse match with insufficient content falling back honestly
- non-Greenhouse pages continuing through the generic path unchanged
- Greenhouse pages using `sourceUrl` as the apply URL when no better CTA is found

## Acceptance Criteria

- Greenhouse URLs use a dedicated extraction path.
- Successful Greenhouse imports produce richer field extraction than the generic importer.
- Failed Greenhouse extraction attempts are visible in diagnostics and still fall back safely.
- Existing non-Greenhouse importer behavior does not regress.
