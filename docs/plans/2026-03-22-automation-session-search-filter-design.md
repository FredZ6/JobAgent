# Automation Session Search and Filter Design

## Goal

Improve the application-scoped automation session history UX by adding lightweight local search and filtering so users can quickly find the sessions that matter.

## Current State

The application review flow already supports:

- full automation session history
- selecting one session for detail
- selecting two sessions for comparison
- reviewing screenshots and worker logs

However, once an application has multiple retries, users must visually scan the entire list to answer questions like:

- which session failed
- which session still has unresolved fields
- which session includes screenshots or useful logs
- where a specific workflow run or error message appears

## Desired Outcome

Within the existing `Automation sessions` panel, users should be able to:

- search session history by run id, status, phase, error text, and log text
- filter sessions by status
- filter sessions by “needs attention / evidence” signals
- recover cleanly when filters hide the currently selected or compared session(s)

The experience should remain local and application-scoped. No new backend API or query parameters are required for the first version.

## Recommended Approach

Add local search and filtering directly inside the existing `AutomationSessionHistory` client component, while extracting the matching logic into helper functions in `apps/web/src/lib/automation-session.ts`.

### Why this approach

- Session lists are already loaded client-side and are small enough for local filtering.
- The component already owns selection and compare state, so local filtering fits naturally.
- Helper extraction keeps matching rules testable and prevents the component from becoming too heavy.
- This delivers the UX improvement without changing backend contracts.

## Design

### 1. Search and filter controls

Add a compact controls block above the session list with:

- one text search input
- one status filter
- one attention/evidence filter

The controls should stay visually light and not overwhelm the existing detail and compare views.

### 2. Search behavior

Search should match case-insensitively against:

- `workflowRunId`
- `applicationId`
- `status`
- phase label
- `errorMessage`
- worker log messages

The search box should support broad operational lookup rather than exact-id matching only.

### 3. Filter behavior

#### Status filter

Support:

- `all`
- `completed`
- `running`
- `queued`
- `failed`
- `cancelled`

#### Attention / evidence filter

Support:

- `all`
- `has_failures`
- `has_unresolved`
- `has_screenshots`
- `has_worker_logs`

This is more useful than a first-version phase filter because the typical user intent is “show me the sessions that need attention” rather than “show me phase X”.

### 4. Selection and compare behavior under filters

When filters hide the currently selected session:

- automatically select the first visible session

When filters hide one or both compare selections:

- remove hidden session ids from compare state

This keeps the detail and compare panels stable and prevents invisible selections from leaving the UI in a broken state.

### 5. Empty filtered state

If no sessions match the current search and filters, show:

- a dedicated empty state message
- a `Clear filters` action

This should be distinct from the existing “no sessions exist” state.

## Data Strategy

No backend changes are required.

Filtering should happen entirely on the client using the existing `sessions` prop passed into `AutomationSessionHistory`.

Move the matching logic into `apps/web/src/lib/automation-session.ts`:

- `AutomationSessionFilterState`
- `filterAutomationSessions(...)`
- optional focused matching helpers for query and attention filtering

## Testing Strategy

### Helper coverage

Add tests for:

- query matching across workflow run id, status, error message, and worker logs
- status filtering
- attention/evidence filtering
- combined query + filter behavior
- default “no filters” behavior

### Component coverage

Add tests for:

- filtering down to matching sessions
- switching selected detail when the current session is filtered out
- filtering compare selections out safely
- showing the filtered empty state
- clearing filters

## Risks

- Too many controls could make the history section visually noisy.
- Search rules can become hard to reason about if they are left inside the component.
- Compare state can drift if filtered selections are not pruned carefully.

These risks are manageable if we keep the first version small and helper-driven.

## Acceptance Criteria

- `AutomationSessionHistory` supports local search.
- It supports status filtering.
- It supports attention/evidence filtering.
- Selection and compare state recover safely when filters hide sessions.
- Filtered empty state includes a clear reset affordance.
- `npm run test --workspace @rolecraft/web` and `npm run build --workspace @rolecraft/web` pass.
