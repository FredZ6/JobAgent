# Unresolved Items Manual Actions Design

## Summary

Add a lightweight manual-handling loop for unresolved automation items so the existing `Needs attention` list becomes an actionable queue instead of a read-only report. The first version supports two user actions from both `Application Review` and `Submission Review`:

- mark an item as resolved
- ignore an item

Each update records audit history through `ApplicationEvent` and returns the updated unresolved item so the UI can patch local state without reloading the whole page.

## Goals

- Make unresolved automation items actionable in both review surfaces.
- Keep the first version small: no inline answer editor, no rerun orchestration, no undo flow.
- Preserve the existing unresolved-item data model and event timeline.

## Non-Goals

- Persisting manual answers for future reruns
- Reopening resolved/ignored items
- Bulk actions
- New pages or dashboards for unresolved items

## API Design

Add a single endpoint:

- `POST /applications/:applicationId/unresolved-items/:itemId`

Request payload:

- `status: "resolved" | "ignored"`
- `note?: string`

The backend maps the request to canonical resolution kinds:

- `resolved -> manual_answer`
- `ignored -> skipped_by_user`

The endpoint only allows updates from `unresolved` to one of those two terminal states. Attempts to update an item that belongs to another application return `404`. Attempts to re-process an item that is already `resolved` or `ignored` return `409`.

The response returns the updated unresolved item, not the whole application context.

## Data and Event Model

The current `UnresolvedAutomationItem` schema already carries the fields needed for first-pass manual handling:

- `status`
- `resolutionKind`
- `resolvedAt`
- `metadata`

This feature updates:

- `status`
- `resolutionKind`
- `resolvedAt`
- `metadata.note` when a note is provided

Add a new `ApplicationEventType`:

- `unresolved_item_updated`

Event payload should contain:

- `itemId`
- `fieldName`
- `fromStatus`
- `toStatus`
- `resolutionKind`
- `note`

This keeps unresolved-item actions visible in the existing application event history.

## Frontend UX

Enhance the shared `UnresolvedAutomationItems` component instead of building separate page-specific controls.

For items with `status === "unresolved"`:

- show `Mark resolved`
- show `Ignore`
- allow an optional short note
- apply loading/error state per item only

For items already in `resolved` or `ignored`:

- keep the item visible
- hide action buttons
- show the updated status pills and timestamps

Both pages should support the exact same actions:

- `Application Review`
- `Submission Review`

The first version keeps notes lightweight and inline. It does not introduce a separate modal or a multiline workflow.

## Architecture

### Shared Types

Add:

- `updateUnresolvedAutomationItemRequestSchema`
- `unresolved_item_updated` to `applicationEventTypeSchema`

### API

Add:

- controller endpoint in `ApplicationsController`
- focused service method in `ApplicationsService`

The service method:

1. loads the item and validates application ownership
2. validates that the current state is still `unresolved`
3. updates the item fields
4. writes an application event
5. returns the formatted unresolved item

### Web

Add:

- `updateUnresolvedAutomationItem(applicationId, itemId, payload)` in the shared API client

The two page clients keep local unresolved-item state and patch a single item after successful updates.

## Error Handling

- `404` when the item or application relationship is invalid
- `409` when the item has already been handled
- item-level error messaging in the shared component so a single failure does not block the page

## Testing

### API

- resolve an unresolved item successfully
- ignore an unresolved item successfully
- reject items from another application
- reject already handled items
- record `unresolved_item_updated` events

### Web

- unresolved items show action buttons
- resolved/ignored items do not show action buttons
- item-level loading only locks the active row
- `Application Review` can update an item
- `Submission Review` can update an item

### Verification

- `npm run test`
- `npm run build`

## Acceptance Criteria

1. `Needs attention` is no longer read-only.
2. Both review pages support `Mark resolved` and `Ignore`.
3. Each action records an audit event.
4. Already handled items do not remain actionable.
5. The feature does not introduce manual-answer rerun logic yet.
