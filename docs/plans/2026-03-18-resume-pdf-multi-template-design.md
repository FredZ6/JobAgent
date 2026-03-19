# Resume PDF Multi-Template Design

## Summary

Phase 43 extends the current PDF export pipeline from a single hard-coded template into a small, explicit two-template system. The goal is to support a second professional PDF style without adding database state, without changing the resume data model, and without introducing a heavier client-side PDF renderer.

## Goals

- Keep the current template as the default `classic` option.
- Add a second `modern` template with visibly different layout treatment.
- Let the same template choice flow through print HTML, inline preview, and download.
- Add a lightweight template switcher to the Resume Review page.

## Scope

- Support `template=classic|modern` on:
  - `GET /resume-versions/:id/print`
  - `GET /resume-versions/:id/pdf`
  - `GET /resume-versions/:id/pdf/inline`
- Refactor the PDF HTML rendering path into a template-dispatch layer.
- Add a Resume Review template switcher that updates preview and download links.

## Out of Scope

- Persisting template selection to the database.
- Adding template controls to Job Detail or Submission Review.
- More than two templates.
- A template marketplace or user-defined templates.

## Data Model

No database changes are required.

Template selection is request-scoped only:
- default: `classic`
- optional query param: `template`

This keeps the first multi-template slice small and backwards-compatible.

## API Design

The controller layer will accept an optional `template` query parameter and normalize it against a small template schema. The service layer will continue to build a single `PrintableResumeDocument`, then dispatch HTML generation to a selected renderer:

- `renderClassicResumeHtml(document)`
- `renderModernResumeHtml(document)`

Both preview and download routes will call the same PDF rendering path so the bytes remain consistent.

## Web Design

The Resume Review page will add a small two-state template switch:
- `Classic`
- `Modern`

That selection will update:
- embedded iframe preview
- `Preview PDF`
- `Download PDF`

The selection remains page-local for now.

## Testing

- Add API-side helper tests for template parsing and divergent HTML output.
- Add web-side tests for PDF URL builders with template params.
- Re-run targeted tests, full tests, builds, Docker, and browser verification for both templates.
