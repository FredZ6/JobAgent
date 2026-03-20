# GitHub Actions CI Design

## Goal

Add a first-pass GitHub Actions CI workflow that gives the repo a reliable open-source baseline for dependency installation, Prisma client generation, tests, and builds.

## Current Context

- The repo does not currently have a `.github/` directory or any Actions workflow files.
- The monorepo already exposes stable root scripts for the checks we want to run:
  - `npm ci`
  - `npm run prisma:generate`
  - `npm test`
  - `npm run build`
- Prisma migrations are now committed, but this CI slice is intentionally code-level only and should not bring up Docker or a PostgreSQL service.
- The app Dockerfiles consistently use `node:22-bookworm-slim`, so CI should match Node 22 for fewer environment surprises.

## Recommended Shape

### Workflow Structure

Add one workflow file:

- `.github/workflows/ci.yml`

Trigger it on:

- `pull_request`
- `push` to the default branch

Use one job on:

- `ubuntu-latest`

Use the standard GitHub Actions setup flow:

1. `actions/checkout`
2. `actions/setup-node` with Node 22
3. npm cache enabled through `setup-node`
4. `npm ci`
5. `npm run prisma:generate`
6. `npm test`
7. `npm run build`

### Why a Single Job

The repo is still evolving quickly, and the immediate open-source need is a dependable baseline, not a deeply optimized monorepo pipeline. A single job keeps the YAML readable, avoids duplicated setup cost, and makes it easier for outside contributors to understand what the repo expects before opening a PR.

### Why These Commands

- `npm ci` keeps installs deterministic and is the standard CI choice for a committed `package-lock.json`.
- `npm run prisma:generate` is required because the repo depends on generated Prisma client code in the API and worker paths.
- `npm test` already fans out to workspace tests from the root.
- `npm run build` already fans out to workspace builds from the root and gives strong regression coverage for TypeScript and Next.js.

## Intentional Omissions for This First Pass

Do not include these in the first CI workflow:

- Docker-based smoke tests
- `docker compose up --build`
- PostgreSQL services
- `prisma migrate deploy`
- browser installation for Playwright runtime
- end-to-end tests
- workspace matrix jobs
- path filters for docs-only changes

These can come later as separate workflows once the base CI is in place.

## Small Quality-of-Life Additions

### Concurrency

Add workflow concurrency so newer pushes cancel older runs on the same ref. This keeps the CI queue clean and reduces wasted Actions minutes.

### npm Cache

Use `actions/setup-node` with `cache: npm`. That gives the repo a low-friction speedup without introducing hand-rolled cache keys.

## Local Verification Strategy

The main local validation should mirror the exact workflow commands:

```bash
npm ci
npm run prisma:generate
npm test
npm run build
```

Then manually inspect the workflow file to confirm:

- trigger conditions
- Node version
- command order
- concurrency
- npm cache usage

Using `act` is optional and not required for this repo's first CI slice.

## Acceptance Criteria

1. The repo contains `.github/workflows/ci.yml`.
2. The workflow runs on `pull_request` and default-branch `push`.
3. The workflow uses Node 22 and npm caching.
4. The workflow runs `npm ci`, `npm run prisma:generate`, `npm test`, and `npm run build` in that order.
5. The same commands pass locally in the worktree.
