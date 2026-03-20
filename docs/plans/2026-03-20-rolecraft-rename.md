# Rolecraft Rename Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rename the active repository branding from `OpenClaw` to `Rolecraft`, including package scope migration from `@openclaw/*` to `@rolecraft/*`, while preserving historical planning/spec docs as historical records.

**Architecture:** Treat the rename as a layered migration. First rename package identities and TypeScript aliases, then rewrite active imports and workspace command strings, then update active docs/runtime strings. Keep physical folder names and historical plan/spec inputs unchanged to avoid unnecessary churn.

**Tech Stack:** npm workspaces, TypeScript path aliases, Next.js, NestJS, Markdown docs

---

### Task 1: Rename package identities and path aliases

**Files:**
- Modify: `package.json`
- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json`
- Modify: `apps/worker-playwright/package.json`
- Modify: `apps/worker-temporal/package.json`
- Modify: `packages/config/package.json`
- Modify: `packages/shared-types/package.json`
- Modify: `tsconfig.base.json`

**Step 1: Update the root package name**

Change:

- `openclaw-job-agent` -> `rolecraft-job-agent`

**Step 2: Rename workspace package names**

Update each workspace package name from `@openclaw/*` to `@rolecraft/*`.

**Step 3: Update workspace dependency references**

Where package dependencies currently reference `@openclaw/config` or `@openclaw/shared-types`, switch them to `@rolecraft/*`.

**Step 4: Update TypeScript aliases**

Change `tsconfig.base.json` paths from:

- `@openclaw/config`
- `@openclaw/shared-types`

to:

- `@rolecraft/config`
- `@rolecraft/shared-types`

**Step 5: Refresh the lockfile**

Run:

```bash
npm install --package-lock-only
```

Expected:
- `package-lock.json` reflects the renamed package/workspace identities without modifying installed dependencies.

### Task 2: Rewrite active imports, scripts, and runtime identifiers

**Files:**
- Modify: active source files under `apps/*` and `packages/*` that import `@openclaw/*`
- Modify: `docker-compose.yml`
- Modify: `.github/workflows/ci.yml` only if any workspace command strings require rename support
- Modify: other active config/runtime files that still use `openclaw` queue or identity strings

**Step 1: Rewrite imports**

Replace all active source imports from `@openclaw/*` to `@rolecraft/*`.

This includes:

- API imports
- web imports
- worker imports
- shared test imports in active code trees

**Step 2: Rewrite root workspace commands**

Update root `package.json` scripts from `@openclaw/*` workspaces to `@rolecraft/*`.

**Step 3: Rewrite Docker/runtime command strings**

Update:

- Docker Compose workspace command strings
- active queue or identifier strings such as `openclaw-analysis`
- active user-agent strings and app metadata that still expose the old brand

**Step 4: Verify no active code references remain**

Run:

```bash
rg -n "@openclaw|openclaw" package.json package-lock.json tsconfig.base.json apps packages docker-compose.yml .github/workflows README.md CHANGELOG.md docs/releases docs/closeout CONTRIBUTING.md SECURITY.md
```

Expected:
- PASS
- no remaining old-brand references in active code and active docs

### Task 3: Rename active product-facing docs and metadata

**Files:**
- Modify: `README.md`
- Modify: `CONTRIBUTING.md`
- Modify: `SECURITY.md`
- Modify: `CHANGELOG.md`
- Modify: `docs/releases/v0.1.0-alpha.md`
- Modify: `docs/releases/release-template.md`
- Modify: `docs/closeout/2026-03-18-delivery-package.md`
- Modify: `apps/web/src/app/layout.tsx`
- Modify: any other active outward-facing file still showing `OpenClaw`

**Step 1: Update outward-facing product name**

Switch visible product naming from `OpenClaw Job Agent` to `Rolecraft` in active docs and app metadata.

**Step 2: Update active placeholder/sample strings**

Rename representative seed/test/demo values that still intentionally show `OpenClaw` as a company or product identity where the string is part of an active user-facing surface.

**Step 3: Leave historical docs untouched**

Do not rewrite:

- `roadmap.md`
- `spec.md`
- `system-design.md`
- `docs/plans/*`

unless an unexpected dependency forces a narrower exception.

### Task 4: Validate the rename and commit

**Files:**
- Modify: `package-lock.json`
- Modify: any files touched during validation if minor corrections are needed

**Step 1: Run focused checks**

Run:

```bash
npm run test
```

Expected:
- PASS

Run:

```bash
npm run build
```

Expected:
- PASS

**Step 2: Run rename-specific grep checks**

Run:

```bash
rg -n "@openclaw|openclaw" package.json package-lock.json tsconfig.base.json apps packages docker-compose.yml README.md CHANGELOG.md docs/releases docs/closeout CONTRIBUTING.md SECURITY.md
```

Expected:
- PASS
- no active-surface old-brand references remain

Run:

```bash
rg -n "OpenClaw" README.md CHANGELOG.md docs/releases docs/closeout CONTRIBUTING.md SECURITY.md apps/web/src/app/layout.tsx
```

Expected:
- PASS
- no outward-facing active branding still uses the old name

**Step 3: Commit**

```bash
git add package.json package-lock.json tsconfig.base.json apps packages docker-compose.yml README.md CHANGELOG.md CONTRIBUTING.md SECURITY.md docs/releases docs/closeout/2026-03-18-delivery-package.md
git commit -m "Rename OpenClaw to Rolecraft"
```
