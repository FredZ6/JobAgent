# Prisma Migration Workflow Design

## Goal

Replace the repo's current `prisma db push`-driven startup with a proper Prisma migration workflow that is safer for open-source collaboration and closer to normal CI/deployment expectations.

## Current State

Today the repo still behaves like a local demo environment:

- there is no `prisma/migrations/` directory
- `docker-compose.yml` starts the API with `npx prisma db push`
- seed data is applied automatically during API startup

That is convenient for a one-machine MVP, but it weakens reproducibility, hides schema history, and makes future CI and contributor workflows harder to trust.

## Approved Decisions

### 1. `docker compose up` should apply committed migrations automatically

The API container should switch from `prisma db push` to `prisma migrate deploy`.

That means startup becomes:

1. install dependencies
2. generate Prisma client
3. apply committed migrations
4. start the API

It should no longer mutate schema based only on the local `schema.prisma`.

### 2. Seed data stays available, but becomes explicit

`npm run prisma:seed` remains part of the repo, but it should no longer run automatically from `docker compose up`.

This keeps demo data available for development while separating:

- schema lifecycle
- sample data lifecycle

### 3. Migration history starts with a baseline

The repo should not try to reconstruct every historical schema change since the MVP started.

Instead, it should create one baseline migration representing the current `schema.prisma` and treat that as the formal migration starting point for open-source usage.

This is the lowest-risk path because the repo historically used `db push`, not migrations.

### 4. Old local demo databases are not guaranteed in-place upgrade support

For contributors who already have a local database created through `db push`, the recommended path should be:

- recreate the database volume, or
- start from a fresh empty database

The first migration workflow should optimize for correctness and clarity, not clever recovery logic for earlier throwaway local data.

## Recommended Approach

Use a standard single-path migration workflow:

- add a committed baseline migration under `prisma/migrations/`
- keep `prisma migrate dev` for local schema development
- use `prisma migrate deploy` in startup and future CI/deploy contexts
- keep seed as an opt-in developer command

This is preferred over:

- keeping a `db push` fallback path, which would create a confusing dual-track workflow
- adding a separate migrator container immediately, which is heavier than needed for the current repo

## File-Level Design

### `prisma/migrations/`

Add the first baseline migration directory and SQL generated from the current schema.

### `package.json`

Keep or clarify these scripts:

- `prisma:generate`
- `prisma:migrate` or `prisma:migrate:dev`
- `prisma:migrate:deploy`
- `prisma:seed`

The naming should make it obvious which command is for:

- local schema authoring
- environment startup
- optional demo data

### `docker-compose.yml`

Update the API command so it no longer runs:

- `prisma db push`
- automatic seed

Instead it should run:

- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run dev:api`

### `README.md`

Update quickstart and database instructions so external users understand:

- `docker compose up --build` applies committed migrations
- seed is manual
- changing schema requires a new migration
- older local demo databases may need to be recreated

## Validation Strategy

The implementation should prove:

1. the repo now contains a formal baseline migration
2. `prisma migrate deploy` succeeds on an empty database
3. Docker startup no longer depends on `db push`
4. seed is manual, not automatic
5. the app still boots successfully on a clean database

## Non-Goals

This slice does not need to:

- backfill a perfect historical migration chain
- build automatic migration repair for old local demo databases
- add a dedicated migration service/container yet
- redesign seed data contents
