# Web API Base Cleanup Design

## Goal

Make the Web-side API base URL resolution explicit and easier to maintain by extracting it from `apps/web/src/lib/api.ts` into a small dedicated helper with clear browser and server semantics.

## Scope

- Add a focused Web helper for resolving the API base URL.
- Update `apps/web/src/lib/api.ts` to consume that helper.
- Add unit tests covering browser and server fallback behavior.

## Non-Goals

- Refactoring all frontend env handling into a larger runtime framework.
- Moving browser-aware env logic into `@rolecraft/config`.
- Changing `.env.example`, README, or the e2e harness in this slice.
- Touching `CHROMIUM_EXECUTABLE_PATH` or PDF rendering runtime behavior.

## Problem

`apps/web/src/lib/api.ts` currently inlines its env resolution:

- `NEXT_PUBLIC_API_URL`
- `API_URL`
- default `http://localhost:3001`

That makes the behavior harder to read and leaves one subtle ambiguity unresolved:

- browser code should only rely on `NEXT_PUBLIC_*` env
- server-side code can reasonably use `API_URL` as a fallback

The current inline constant works, but it does not document those semantics clearly.

## Recommended Design

### Dedicated Web Helper

Add `apps/web/src/lib/api-base.ts` with a single exported helper:

- `resolveWebApiBaseUrl(env, options?)`

The helper should:

- trim values
- remove trailing slashes
- prefer `NEXT_PUBLIC_API_URL`
- in browser mode, ignore `API_URL`
- in server mode, fall back to `API_URL`
- finally fall back to `http://localhost:3001`

### Explicit Browser vs Server Semantics

Model the distinction directly:

- browser mode:
  - `NEXT_PUBLIC_API_URL`
  - default fallback
- server mode:
  - `NEXT_PUBLIC_API_URL`
  - `API_URL`
  - default fallback

That keeps browser-safe env handling local to the web app without mixing it into the server/runtime helpers in `@rolecraft/config`.

### Minimal Integration

Update only `apps/web/src/lib/api.ts` to use the new helper.

Do not introduce a larger “web runtime” layer in this slice.

## Verification

- Add focused tests in `apps/web/src/lib/api-base.test.ts`.
- Run:
  - `npm run test --workspace @rolecraft/web`
  - `npm run build --workspace @rolecraft/web`

## Acceptance Criteria

1. `apps/web/src/lib/api.ts` no longer inlines `NEXT_PUBLIC_API_URL ?? API_URL ?? ...`.
2. A dedicated Web API base helper exists.
3. The helper explicitly distinguishes browser and server fallback rules.
4. Tests cover default, trimming, trailing-slash, browser-only, and server fallback behavior.
5. Web tests and build still pass.
