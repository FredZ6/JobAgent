# Resume PDF Inline Preview Design

## Summary

Phase 42 adds browser-embedded PDF preview for completed resume versions without changing the existing PDF generation pipeline. The new slice keeps the current download route intact, adds a dedicated inline-preview route, and embeds that route inside the Resume Review page.

## Goals

- Let users preview the generated resume PDF directly in the browser.
- Preserve the existing `Download PDF` flow.
- Reuse the current API-side PDF rendering so preview and download stay visually identical.
- Provide a graceful fallback when inline PDF rendering is unavailable.

## Scope

- Add `GET /resume-versions/:id/pdf/inline`.
- Add a browser-embedded PDF preview area on the Resume Review page.
- Keep `Download PDF` on the same page.
- Show fallback guidance if the inline preview cannot be used.

## Out of Scope

- Multi-template PDF selection.
- A heavy PDF.js viewer with thumbnails or zoom controls.
- Preview embeds on Job Detail or other pages.
- PDF annotations or editing.

## API Design

The API will continue to use `ResumePdfService.renderPdf(id)` for the binary PDF generation path. A new controller route will expose the same buffer with `Content-Disposition: inline`, while the existing `/pdf` route continues using `attachment`.

This keeps the rendering logic centralized and avoids any duplication between download and preview behavior.

## Web Design

The Resume Review page will add:

- `Preview PDF` action
- `Download PDF` action
- Inline preview region using an `iframe`
- Small fallback note with a download link

The preview should only render after the resume version is loaded. If no version is present or loading fails, the page keeps the current behavior.

## Testing

- Add a small API unit test for PDF response-disposition helpers.
- Add a small web unit test for the inline PDF URL builder.
- Re-run root tests and builds.
- Verify Docker runtime and browser-level inline preview behavior.
