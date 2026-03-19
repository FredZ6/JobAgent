# OpenClaw Job Agent Phase-Three Design

## Goal
Add a practical PDF export path for generated resume versions so the MVP can produce a real deliverable file instead of only structured JSON.

## Scope

### In Scope
- Single-template PDF export from an existing completed `resume version`
- API endpoint that returns a PDF download
- Internal print-friendly HTML route used by the PDF renderer
- Download actions from Job Detail and Resume Review
- Docker-compatible browser rendering with no host GUI dependency

### Out of Scope
- Multi-template resume layouts
- Browser-embedded PDF preview
- Persisting generated PDF files to storage
- User-editable PDF layout controls
- Cover letters, avatars, or decorative resume designs

## Architecture

### Rendering Strategy
- Reuse the existing structured `resume version` as the only PDF content source.
- Render a print-oriented HTML template on the API side.
- Convert that HTML to PDF with a headless browser so layout remains easy to evolve later.

### Runtime Strategy
- Keep PDF generation inside the API service for this phase.
- Install a system Chromium package in the API container instead of introducing a separate worker requirement.
- Treat PDF generation as an on-demand read path, not a background job and not a persisted artifact.

## API Design
- `GET /resume-versions/:id/pdf`
- `GET /resume-versions/:id/print`

### `GET /resume-versions/:id/pdf`
- Validates that the resume version exists
- Requires `status === completed`
- Returns `application/pdf`
- Sets a content-disposition filename based on job/company/headline data

### `GET /resume-versions/:id/print`
- Renders a print-friendly HTML document for local inspection and PDF generation
- Is primarily an internal debugging surface, not a primary user-facing page

## Template Design
- ATS-friendly single-column layout
- Header with candidate name, email, phone, location, LinkedIn, and GitHub when present
- Headline
- Professional summary
- Key skills
- Experience
- Projects

### Content Rules
- Use only persisted profile and resume-version data
- Never introduce text not present in the structured resume version or saved profile identity fields
- Gracefully omit empty sections instead of inventing placeholders

## Frontend Flow

### Job Detail
- If a latest completed resume version exists, show a `Download PDF` action next to that version summary.
- Disable or omit the action when no completed version exists.

### Resume Review
- Add a `Download PDF` action for the current version.
- Preserve existing loading, empty, and error states.

## Error Handling
- `404` when the resume version does not exist
- `409` when the resume version is not completed
- `500` when HTML rendering or browser PDF printing fails
- Missing optional profile fields should downgrade the rendered header, not block export

## Acceptance Criteria
1. `GET /resume-versions/:id/pdf` returns a real PDF file for a completed resume version.
2. `GET /resume-versions/:id/print` returns printable HTML for the same version.
3. Job Detail exposes a working PDF download action for the latest completed resume version.
4. Resume Review exposes a working PDF download action for the displayed version.
5. Docker runtime can generate the PDF without depending on host GUI tooling.
6. Exported PDF content matches the stored resume version and does not fabricate new experience.

## Notes
- Multi-template and preview features stay deferred until the single-template path is stable.
- The print HTML should be simple enough that it can later become the basis for additional templates.
