# Next.js Workaround Final Cleanup Design

## Goal

Attempt to remove the remaining web build workaround layer so the Next.js app can rely on the App Router fallback path without carrying legacy `pages`-based stabilizers.

## Current State

Most route wrappers no longer force dynamic rendering, but the final workaround layer still exists in two places:

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/not-found.tsx`

Both still export:

- `dynamic = "force-dynamic"`

The repository also still carries a legacy fallback stack:

- `apps/web/src/pages/_document.tsx`
- `apps/web/src/pages/404.tsx`
- `apps/web/src/pages/500.tsx`

README still documents this as remaining technical debt.

## Desired Outcome

The best outcome is:

- homepage and app-router not-found page no longer force dynamic rendering
- legacy `pages` fallback files can be removed
- `npm run build --workspace @rolecraft/web` remains stable
- README no longer describes the workaround as active debt

## Recommended Approach

Use a staged cleanup with explicit build checkpoints after every step.

### Why this approach

- This debt originally existed because build behavior around fallback pages was unstable.
- The remaining files are few, so the tempting move is to delete them all at once.
- That would make regressions harder to diagnose.
- Staged cleanup lets us target full removal while preserving a clear fallback path if any step reintroduces instability.

## Design

### 1. Remove the last two `force-dynamic` declarations first

Start with:

- `apps/web/src/app/page.tsx`
- `apps/web/src/app/not-found.tsx`

These are the least invasive remaining workaround markers.

If build becomes unstable even here, then App Router still is not stable enough on its own and the cleanup should stop before touching the legacy fallback files.

### 2. Remove legacy fallback pages in a cautious order

Only after App Router build stability is confirmed should we attempt removing:

1. `apps/web/src/pages/404.tsx`
2. `apps/web/src/pages/500.tsx`
3. `apps/web/src/pages/_document.tsx`

This order keeps the most structural fallback file (`_document`) for last.

If any deletion destabilizes build behavior, revert that step and stop at the more conservative end state.

### 3. Treat README as part of the cleanup

If the full workaround layer is removed successfully:

- delete the workaround note from README

If the cleanup stops at the conservative midpoint:

- update README so it reflects the smaller remaining workaround surface accurately

## Validation Strategy

### Step-by-step validation

After each cleanup step, run:

```bash
npm run build --workspace @rolecraft/web
```

This is the key signal because the technical debt is specifically about build and fallback behavior.

### Final validation

If cleanup succeeds fully, also run:

```bash
npm run test --workspace @rolecraft/web
npm run build
```

## Risks

- App Router fallback behavior may still be intermittently unstable in this repo shape.
- Removing `pages/404` and `pages/500` may expose old Next.js assumptions that do not show up until a full build.
- `_document` removal could surface a subtler compatibility issue than the page files alone.

These risks are acceptable as long as we keep the “full cleanup target, conservative fallback” strategy.

## Acceptance Criteria

### Full cleanup

- `app/page.tsx` and `app/not-found.tsx` no longer force dynamic rendering
- `pages/_document.tsx`, `pages/404.tsx`, and `pages/500.tsx` are removed
- web build remains stable
- web tests and full build pass
- README no longer describes the workaround as active debt

### Conservative completion

If full cleanup proves unstable, this effort still succeeds if:

- the final `force-dynamic` declarations are removed
- we identify exactly which legacy fallback file(s) must remain
- web build remains stable
- README reflects the narrower remaining workaround accurately
