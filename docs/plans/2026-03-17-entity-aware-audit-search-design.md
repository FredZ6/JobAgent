# Entity-Aware Audit Search Design

## Goal
Make audit and timeline search usable for real workflow lookup by matching entity identifiers and business context, not just actor and summary text.

## Recommended Approach

### Option 1: Keep current summary-only search
- Continue matching mostly `summary`, actor fields, and a small slice of payload text.
- Pros: no code changes.
- Cons: searching by `jobId`, `applicationId`, job title, company, or URLs remains unreliable.

### Option 2: Expand the existing read-model search surface
- Keep the current APIs and UI.
- Extend search matching in dashboard timeline and application history to include:
  - entity ids
  - business labels like title/company/location
  - relevant URLs
  - structured payload values already present in memory
- Pros: highest operator value for the least scope; no schema work required.
- Cons: still in-memory matching, not indexed search.

### Option 3: Add a dedicated audit-search index
- Build a separate persistence layer or search document for events.
- Pros: most scalable long term.
- Cons: far too large for the current phase and unnecessary for current data volume.

### Recommendation
Choose **Option 2**. The current product already has the right surfaces and filters; the gap is search semantics, not architecture.

## Scope

### In scope
- Extend `/dashboard/timeline` query matching to include:
  - `jobId`
  - `applicationId`
  - `entityId`
  - title/company/location-like metadata
  - URLs and other string values already present in `meta`
- Extend `/applications/:id/events` query matching to include:
  - `applicationId`
  - event id
  - status fields
  - string/number payload values
- Update frontend search placeholders to reflect the broader matching behavior.
- Add targeted tests for raw id and business-context queries.

### Out of scope
- Full-text indexing.
- New search endpoint.
- Database schema changes.
- New UI screens.

## API Behavior

### Dashboard timeline
`GET /dashboard/timeline?q=...`

Search should match against:
- `item.id`
- `item.entityId`
- `item.jobId`
- `item.applicationId`
- `item.label`
- `item.summary`
- `item.actorType`
- `item.actorLabel`
- `item.actorId`
- `item.source`
- `item.status`
- flattened `meta` text

This means a user can now search by:
- a job id
- an application id
- company/title text
- source URL fragments
- event source labels like `resume-service`

### Application history
`GET /applications/:id/events?q=...`

Search should match against:
- `event.id`
- `event.applicationId`
- default event label
- `event.summary`
- actor fields
- `event.source`
- event type
- status-like payload fields
- other string/number payload values

This keeps the endpoint lightweight while making it much easier to find a specific retry, failure, or prefill record.

## Error Handling
- Empty or whitespace-only queries still behave as “no search filter”.
- Search remains case-insensitive.
- Non-string payload values are ignored unless they are numbers that can be stringified safely.
- Existing source/date/actor/event filters continue to work unchanged.

## Testing
- Dashboard service tests should assert raw `jobId` and business-context search now match timeline items.
- Applications service tests should assert raw `applicationId` and payload fields now match history items.
- Web build should still pass after placeholder copy changes.

## Acceptance Criteria
1. `GET /dashboard/timeline?q=<jobId>` returns matching timeline items.
2. `GET /dashboard/timeline?q=<company-or-url-fragment>` returns matching timeline items.
3. `GET /applications/:id/events?q=<applicationId>` returns matching history items.
4. `GET /applications/:id/events?q=<payload-string>` returns matching history items.
5. Existing actor/source/date/event filters continue to work.
6. Root tests, root build, and Docker verification all pass.
