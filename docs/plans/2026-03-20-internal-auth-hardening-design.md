# Internal Auth Hardening Design

## Goal

Separate internal worker-to-API authentication from `JWT_SECRET` and make the default public-deployment guidance safer without breaking the current local-first development flow.

## Current Context

- Internal API routes currently authenticate `x-internal-token` by directly comparing it to `process.env.JWT_SECRET`.
- Both workers currently send `process.env.JWT_SECRET` as the internal token.
- `.env.example` still presents `JWT_SECRET=dev-secret`, which is convenient for local demos but too weak and too ambiguous for a public open-source repo.
- The repository is still local-first and pre-1.0, so this slice should improve security boundaries without turning setup into a heavy production-only story.

## Recommended Shape

### New Environment Variable

Add:

- `INTERNAL_API_TOKEN`

Keep:

- `JWT_SECRET`

But separate their responsibilities:

- `JWT_SECRET` is for user/public auth concerns and future auth work
- `INTERNAL_API_TOKEN` is for internal worker-to-API calls only

### Shared Resolution Rule

Introduce one shared helper for resolving the effective internal token:

- use `INTERNAL_API_TOKEN` when it is explicitly set
- if it is not set and `NODE_ENV !== "production"`, allow fallback to `JWT_SECRET`
- if it is not set and `NODE_ENV === "production"`, do not fall back

This gives the repo:

- a safer production boundary
- a compatible local/test path
- one source of truth for workers and the API

### API Behavior

The internal controller should stop comparing directly against `JWT_SECRET` and instead use the shared resolution rule.

Effects:

- development/test keeps working even if only `JWT_SECRET` is present
- production requires `INTERNAL_API_TOKEN`
- invalid or missing internal tokens still return `401`

### Worker Behavior

Both worker paths should use the same shared helper:

- `apps/worker-playwright`
- `apps/worker-temporal`

This keeps worker behavior aligned with API expectations and avoids future drift.

### Public-Deployment Hardening

Update:

- `.env.example`
- `README.md`

So that:

- `INTERNAL_API_TOKEN` is visible as a first-class secret
- `JWT_SECRET` no longer looks like a safe long-term default
- public deployment notes explain that `JWT_SECRET` and `INTERNAL_API_TOKEN` should be configured separately

## Intentional Omissions

Do not add these in this slice:

- mTLS or network-allowlist enforcement
- secrets-manager integration
- broad auth middleware refactors
- startup hard-fail for every missing env in every process

Those are larger production-hardening topics and would overshoot the current checklist item.

## Verification Strategy

Validation should prove:

- the shared helper resolves tokens correctly across environments
- API internal auth now follows the new rule
- both workers send the right token
- docs reflect the new deployment boundary

## Acceptance Criteria

1. `INTERNAL_API_TOKEN` exists as a real config input.
2. Production no longer falls back to `JWT_SECRET` for internal worker auth.
3. Development and test environments still work with the old fallback path.
4. API, Playwright worker, and Temporal worker all use the same token-resolution rule.
5. `.env.example`, `README.md`, and the release checklist reflect the new hardening step.
