# Prisma Migration Workflow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the repo's `prisma db push` startup path with a committed Prisma migration workflow that uses a baseline migration, deploy-time migration application, and explicit seed commands.

**Architecture:** Add a baseline migration under `prisma/migrations/`, update scripts so migration authoring and migration deployment are distinct, switch Docker startup to `prisma migrate deploy`, and document the new workflow in the README. Keep seed available, but remove it from automatic container startup.

**Tech Stack:** Prisma, PostgreSQL, Docker Compose, TypeScript, tsx

---

### Task 1: Create and verify the baseline migration

**Files:**
- Create: `prisma/migrations/<timestamp>_baseline/migration.sql`
- Modify: `prisma/schema.prisma`
- Test: clean local PostgreSQL database or Docker Compose Postgres service

**Step 1: Write the failing verification**

Run:
```bash
npx prisma migrate deploy
```

Expected:
- FAIL because the repo does not yet contain a committed migration history

**Step 2: Generate the baseline migration from the current schema**

Create the first migration from the current `prisma/schema.prisma`, keeping the schema itself unchanged unless the generator requires a minimal cleanup.

**Step 3: Run verification on an empty database**

Run:
```bash
npx prisma migrate deploy
```

Expected:
- PASS on a clean database

**Step 4: Verify Prisma client generation still works**

Run:
```bash
npm run prisma:generate
```

Expected:
- PASS

**Step 5: Commit**

```bash
git add prisma/schema.prisma prisma/migrations
git commit -m "Add baseline Prisma migration"
```

### Task 2: Separate migration deployment from seed data in scripts and compose

**Files:**
- Modify: `package.json`
- Modify: `docker-compose.yml`

**Step 1: Write the failing verification**

Inspect current API startup and confirm it still uses:
- `prisma db push`
- automatic `prisma:seed`

**Step 2: Update package scripts**

Ensure the repo has clear commands for:
- Prisma client generation
- local migration authoring
- deploy-time migration application
- optional seed data

Add `prisma:migrate:deploy` if it does not already exist.

**Step 3: Update Docker Compose**

Change the API service command so it runs:
- `npm install`
- `npm run prisma:generate`
- `npm run prisma:migrate:deploy`
- `npm run dev:api`

and no longer runs:
- `prisma db push`
- automatic seed

**Step 4: Verify startup command shape**

Run:
```bash
docker compose config
```

Expected:
- PASS
- rendered API command shows migration deployment, not `db push`

**Step 5: Commit**

```bash
git add package.json docker-compose.yml
git commit -m "Use Prisma migrate deploy at startup"
```

### Task 3: Document the new database workflow

**Files:**
- Modify: `README.md`

**Step 1: Write the failing verification**

Inspect `README.md` and note the gaps:
- quickstart does not explain migration deploy behavior
- seed lifecycle is not clearly separated
- old local `db push` environments are not warned that recreation may be needed

**Step 2: Update the README**

Document:
- `docker compose up --build` now applies committed migrations
- seed is manual
- schema changes should use `prisma migrate dev`
- older local demo databases may need to be recreated

**Step 3: Verify the README matches the scripts and compose config**

Cross-check:
- commands in README
- `package.json` scripts
- `docker-compose.yml`

Expected:
- all three agree

**Step 4: Commit**

```bash
git add README.md
git commit -m "Document Prisma migration workflow"
```

### Task 4: End-to-end verification on a clean database

**Files:**
- No new product files required

**Step 1: Start from a clean local database state**

Use a fresh database or reset the local Docker Postgres volume for this verification run.

**Step 2: Verify migration deployment and app boot**

Run:
```bash
docker compose up --build -d
```

Expected:
- API starts successfully
- no `prisma db push` dependency remains
- migrations apply cleanly

**Step 3: Verify health**

Run:
```bash
curl -sS http://localhost:3001/health
```

Expected:
- healthy API response

**Step 4: Verify seed is manual**

Run:
```bash
docker compose exec api npm run prisma:seed
```

Expected:
- seed succeeds only when explicitly requested

**Step 5: Commit verification-only doc updates if needed**

If the verification uncovered any startup/doc mismatch, commit the minimal fix before closing the task batch.
