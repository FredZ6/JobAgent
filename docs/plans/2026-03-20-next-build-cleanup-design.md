# Next.js Build Cleanup Design

## Goal

Reduce the current Next.js build workaround surface conservatively, without reintroducing the `/404` and legacy error-path build regressions that previously broke `apps/web`.

## Current Context

- The web build is currently stable.
- Stability was achieved through two broad workaround classes:
  - many app-route wrappers were forced to `dynamic = "force-dynamic"`
  - legacy fallback pages and a custom `_document.tsx` were added under `src/pages`
- The current open-source checklist item is not asking for a full rewrite. It is asking for the current workaround surface to be reduced when it is safe to do so.

## Recommended Shape

### What to Tackle First

Start by reducing `force-dynamic` on low-risk wrapper pages that do not appear to need server-side forcing:

- `apps/web/src/app/settings/page.tsx`
- `apps/web/src/app/profile/page.tsx`
- `apps/web/src/app/jobs/page.tsx`
- `apps/web/src/app/dashboard/page.tsx`
- `apps/web/src/app/workflow-runs/page.tsx`

These files are thin wrappers around client pages and are the safest place to learn whether the current workaround set is broader than necessary.

### What to Tackle Second

If the first batch is safe, move on to the thin dynamic-segment wrappers:

- `apps/web/src/app/jobs/[id]/page.tsx`
- `apps/web/src/app/resume-versions/[id]/page.tsx`
- `apps/web/src/app/workflow-runs/[id]/page.tsx`
- `apps/web/src/app/applications/[id]/page.tsx`
- `apps/web/src/app/applications/[id]/submission-review/page.tsx`

These are still wrapper-style routes, but they carry more risk because they sit on dynamic segments.

### What to Leave Alone for Now

Do not remove or substantially rewrite these in this conservative slice:

- `apps/web/src/pages/_document.tsx`
- `apps/web/src/pages/404.tsx`
- `apps/web/src/pages/500.tsx`
- `apps/web/src/app/not-found.tsx`
- `apps/web/src/app/page.tsx`

Those files are still the most likely place to destabilize the old `/404` failure mode. Keeping them intact gives this slice a clear, low-risk boundary.

## Verification Strategy

The main safety rule is simple:

- remove one batch
- run `npm run build --workspace @openclaw/web`
- only proceed if build stays green

After the final accepted batch, run:

- `npm run test --workspace @openclaw/web`
- `npm run build --workspace @openclaw/web`

This slice should trust actual build results, not intuition.

## Acceptance Criteria

1. At least one batch of unnecessary `force-dynamic` wrappers is removed.
2. `npm run build --workspace @openclaw/web` still passes.
3. `npm run test --workspace @openclaw/web` still passes.
4. The legacy fallback pages and `_document.tsx` remain intact in this conservative slice.
5. The open-source release checklist marks the Next.js build-cleanup item complete.
