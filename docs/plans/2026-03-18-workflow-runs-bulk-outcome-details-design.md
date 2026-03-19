# Workflow Runs Bulk Outcome Details Design

## Goal
Make bulk retry/cancel results on `/workflow-runs` explainable by showing the per-run outcomes from the most recent bulk action, instead of only a single aggregate summary line.

## Recommended Approach
Reuse the existing bulk action response shape and add a lightweight result panel directly to `/workflow-runs`.

- keep using the current bulk API response
- show the most recent bulk action only
- preserve the existing compact summary
- add a row-level outcome list beneath it
- let successful rows link directly to the returned run detail

This keeps the phase small and makes the new bulk controls much easier to trust without introducing bulk-history persistence or a separate operations page.

## Scope

### Frontend
- Add a small helper to normalize and present the current bulk action response
- Extend `/workflow-runs` with a `Recent bulk action` result panel
- Show per-run `success / skipped / failed` rows
- Add `Open run detail` for rows that include a returned `workflowRun`
- Add `Dismiss results`

### API
- No new routes
- No schema changes
- Reuse the existing bulk retry/cancel response shape as-is

## Out of Scope
- Bulk action history
- A dedicated bulk action detail page
- Persisting dismissed results
- Additional backend aggregation
- New bulk actions beyond retry/cancel

## Result Panel Shape

The result panel should present:

1. a short heading
   - `Bulk retry completed`
   - `Bulk cancel completed`
2. the existing aggregate summary
   - for example `Retried 1 run, 0 failed, 1 skipped.`
3. a row list for `results[]`
   - `runId`
   - row status
   - message
   - optional `Open run detail`

## Display Rules
- `success` rows use positive styling
- `skipped` rows use neutral styling
- `failed` rows use error styling
- skipped rows should never look like system failures
- dismissing the panel only clears the most recent in-memory result
- the next bulk action replaces the current panel content

## UX Notes
- Place the panel in `/workflow-runs` near the existing bulk action bar
- Keep the panel close to the controls that triggered it
- Avoid adding another modal or route
- Preserve the current aggregate success message because it is still useful as a top-line summary

## Testing Strategy
- Add helper tests for row presentation data and heading/summary behavior
- Verify the page can show:
  - success rows
  - skipped rows
  - failed rows
  - optional `Open run detail` links
  - `Dismiss results`
- Re-run existing bulk-control tests to ensure the new detail panel does not regress inline confirmation or selection reset behavior
