# Automation Sessions Enhancement Roadmap

## Purpose

Capture the next useful directions for `automation sessions` so future product work can build on the current application-scoped history experience without rediscovering the same ideas.

## Current Baseline

The product already supports:

- application-scoped automation session history
- selecting one session for detail
- selecting two sessions for comparison
- screenshot and worker-log evidence access
- local search by:
  - workflow run id
  - application id
  - status
  - phase label
  - error message
  - worker log text
- local filters for:
  - status
  - failures
  - unresolved items
  - screenshots
  - worker logs

This is already a useful application-level review surface, but it is not yet a full automation operations workspace.

## Low-Cost, High-Value Enhancements

These are the most natural next steps if we want to improve the current application-level UX without changing backend contracts:

- add more filters:
  - `kind`
  - `has error`
  - `date range`
  - `linked workflow run`
- add grouped views:
  - by `status`
  - by `phase`
  - by `latest / older retries`
- strengthen compare summaries:
  - fields that improved from `failed` to `filled`
  - unresolved items that were fixed on rerun
  - which run has the strongest evidence coverage
- persist search and filter state in the URL
- add one-click “show only sessions that need attention”

## Mid-Term Productization

These items move the feature from “history browser” toward “application-level automation review workspace”:

- application-level summary cards:
  - total attempts
  - latest success rate
  - unresolved trend
  - retry improvement summary
  - “best run” suggestion
- group sessions into retry chains or time-based clusters
- identify the most review-worthy run automatically
- export an evidence bundle for the current application

## Long-Term Platformization

These items turn the feature into a broader automation operations surface:

- a global automation sessions page across applications
- cross-application search and filters:
  - ATS/source
  - company
  - provider
  - workflow kind
  - error keyword
- failure taxonomy and trend reporting
- backend query, pagination, and aggregation APIs
- saved views and reusable filter presets
- regression detection or alerting for rising automation failures

## Recommended Sequence

1. Keep strengthening the application-level workspace.
2. Add application-level aggregate summaries once the local workflow feels solid.
3. Only then consider a cross-application operations surface.

## Notes

- The current recommendation is to avoid jumping straight to a global automation console.
- The best near-term investments are still the ones that help a reviewer answer:
  - which run is best
  - what got better after a rerun
  - what still needs attention
  - where the strongest evidence lives
