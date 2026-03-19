# OpenClaw Job Agent MVP Bootstrap Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a runnable first slice of OpenClaw Job Agent where settings, profile, job import, and job analysis work end to end in a local monorepo.

**Architecture:** Use a pnpm monorepo with a Next.js web app, a NestJS API, shared TypeScript/Zod packages, Prisma-backed PostgreSQL persistence, and Redis in Docker Compose. Keep `worker-playwright` scaffolded but non-blocking so the first delivery stays centered on the core configuration and analysis flow.

**Tech Stack:** pnpm workspaces, TypeScript, Next.js, NestJS, Prisma, PostgreSQL, Redis, Zod, Vitest/Jest, Testing Library, Docker Compose

---

### Task 1: Scaffold the workspace

**Files:**
- Create: `package.json`
- Create: `pnpm-workspace.yaml`
- Create: `tsconfig.base.json`
- Create: `.gitignore`
- Create: `.npmrc`
- Create: `apps/web/package.json`
- Create: `apps/api/package.json`
- Create: `apps/worker-playwright/package.json`
- Create: `packages/shared-types/package.json`
- Create: `packages/config/package.json`

**Step 1: Create the root workspace files**

Create the root package manifests and workspace configuration with scripts for install, dev, build, lint, and test orchestration.

**Step 2: Create package manifests for each app and package**

Define dependencies and scripts for `web`, `api`, `worker-playwright`, `shared-types`, and `config`.

**Step 3: Verify workspace wiring**

Run: `pnpm install`
Expected: the workspace installs successfully and links all packages.

**Step 4: Commit**

Skip commit if the workspace is still not a git repository.

### Task 2: Add shared configuration and schemas

**Files:**
- Create: `packages/config/src/env.ts`
- Create: `packages/config/src/index.ts`
- Create: `packages/config/tsconfig.json`
- Create: `packages/shared-types/src/profile.ts`
- Create: `packages/shared-types/src/settings.ts`
- Create: `packages/shared-types/src/job.ts`
- Create: `packages/shared-types/src/index.ts`
- Create: `packages/shared-types/tsconfig.json`
- Test: `packages/shared-types/src/*.test.ts`

**Step 1: Write the failing schema tests**

Add tests that prove profile, settings, import job, and analysis result schemas accept valid payloads and reject invalid ones.

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw/shared-types test`
Expected: FAIL because schemas are not implemented yet.

**Step 3: Implement the schemas**

Add Zod schemas and exported inferred TypeScript types for profile, settings, job import, job entity, and analysis result.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/shared-types test`
Expected: PASS.

### Task 3: Create Prisma data model and database bootstrap

**Files:**
- Create: `prisma/schema.prisma`
- Create: `prisma/seed.ts`
- Create: `.env.example`
- Create: `apps/api/src/lib/prisma.service.ts`
- Test: `apps/api/test/prisma-schema.spec.ts`

**Step 1: Write the failing data model test**

Add a test that validates the Prisma client exposes `candidateProfile`, `llmSetting`, `job`, and `jobAnalysis` models.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw/api test prisma-schema`
Expected: FAIL because Prisma schema and client do not exist yet.

**Step 3: Implement the Prisma schema and seed**

Define the four round-one models, generate the Prisma client, and add a minimal seed with one profile stub and one setting stub.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw/api test prisma-schema`
Expected: PASS.

### Task 4: Add Docker Compose and local runtime defaults

**Files:**
- Create: `docker-compose.yml`
- Create: `apps/web/Dockerfile`
- Create: `apps/api/Dockerfile`
- Create: `apps/worker-playwright/Dockerfile`
- Modify: `.env.example`
- Create: `README.md`

**Step 1: Create Docker and environment files**

Define services for `web`, `api`, `postgres`, and `redis`, plus a non-blocking placeholder image for `worker-playwright`.

**Step 2: Add startup documentation**

Document the minimal startup flow and required environment variables.

**Step 3: Verify the compose configuration**

Run: `docker compose config`
Expected: valid rendered compose output with no schema errors.

### Task 5: Build the NestJS API shell

**Files:**
- Create: `apps/api/src/main.ts`
- Create: `apps/api/src/app.module.ts`
- Create: `apps/api/src/health/health.controller.ts`
- Create: `apps/api/src/profile/*`
- Create: `apps/api/src/settings/*`
- Create: `apps/api/src/jobs/*`
- Create: `apps/api/src/analysis/*`
- Test: `apps/api/test/health.e2e-spec.ts`

**Step 1: Write the failing health check test**

Add an e2e test that expects `GET /health` to return a healthy payload.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw/api test health`
Expected: FAIL because the Nest app is not implemented.

**Step 3: Implement the API shell**

Create the Nest app bootstrap, root module, and health controller. Wire configuration and Prisma into the application.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw/api test health`
Expected: PASS.

### Task 6: Implement Settings and Profile API

**Files:**
- Create: `apps/api/test/profile.e2e-spec.ts`
- Create: `apps/api/test/settings.e2e-spec.ts`
- Modify: `apps/api/src/profile/*`
- Modify: `apps/api/src/settings/*`

**Step 1: Write the failing API tests**

Add e2e tests for:
- `GET /profile`
- `PUT /profile`
- `GET /settings/llm`
- `PUT /settings/llm`

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw/api test profile`
Run: `pnpm --filter @openclaw/api test settings`
Expected: FAIL because the endpoints are not implemented yet.

**Step 3: Implement the endpoints**

Add controllers, services, DTO validation, and Prisma persistence for profile and LLM settings.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/api test profile`
Run: `pnpm --filter @openclaw/api test settings`
Expected: PASS.

### Task 7: Implement Job import API

**Files:**
- Create: `apps/api/test/jobs-import.e2e-spec.ts`
- Modify: `apps/api/src/jobs/*`
- Create: `apps/api/src/jobs/job-importer.service.ts`

**Step 1: Write the failing import test**

Add an e2e test for `POST /jobs/import-by-url` that stores a normalized job using a deterministic importer stub.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw/api test jobs-import`
Expected: FAIL because the importer and endpoint are not implemented.

**Step 3: Implement minimal import behavior**

Add URL validation, a deterministic extraction path for round one, job persistence, and `GET /jobs` plus `GET /jobs/:id`.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/api test jobs-import`
Expected: PASS.

### Task 8: Implement Job analysis API

**Files:**
- Create: `apps/api/test/jobs-analysis.e2e-spec.ts`
- Modify: `apps/api/src/analysis/*`
- Modify: `apps/api/src/jobs/*`
- Create: `apps/api/src/analysis/llm-analysis.service.ts`

**Step 1: Write the failing analysis test**

Add an e2e test for `POST /jobs/:id/analyze` that returns a validated structured analysis payload for an imported job.

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @openclaw/api test jobs-analysis`
Expected: FAIL because analysis logic is missing.

**Step 3: Implement minimal analysis behavior**

Add a round-one LLM service abstraction with a mockable provider, persist analysis results, and validate them with shared Zod schemas.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @openclaw/api test jobs-analysis`
Expected: PASS.

### Task 9: Build the Next.js UI shell

**Files:**
- Create: `apps/web/src/app/layout.tsx`
- Create: `apps/web/src/app/page.tsx`
- Create: `apps/web/src/app/settings/page.tsx`
- Create: `apps/web/src/app/profile/page.tsx`
- Create: `apps/web/src/app/jobs/page.tsx`
- Create: `apps/web/src/app/jobs/[id]/page.tsx`
- Create: `apps/web/src/lib/api.ts`
- Create: `apps/web/src/components/*`
- Test: `apps/web/src/app/*.test.tsx`

**Step 1: Write the failing page tests**

Add component or route-level tests that verify the shell renders navigation and target forms.

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw/web test`
Expected: FAIL because the UI is not implemented.

**Step 3: Implement the UI shell**

Create the four pages, shared layout, API client helpers, and basic form components.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/web test`
Expected: PASS.

### Task 10: Wire Settings and Profile UI to the API

**Files:**
- Create: `apps/web/src/app/settings/page.test.tsx`
- Create: `apps/web/src/app/profile/page.test.tsx`
- Modify: `apps/web/src/app/settings/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`

**Step 1: Write the failing UI interaction tests**

Add tests that verify the settings and profile forms load existing values and submit updates.

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw/web test settings`
Run: `pnpm --filter @openclaw/web test profile`
Expected: FAIL because the forms are not wired.

**Step 3: Implement the UI interactions**

Connect the forms to the API, handle loading and save states, and render success or error messages.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/web test settings`
Run: `pnpm --filter @openclaw/web test profile`
Expected: PASS.

### Task 11: Wire Job import and analysis UI to the API

**Files:**
- Create: `apps/web/src/app/jobs/page.test.tsx`
- Create: `apps/web/src/app/jobs/[id]/page.test.tsx`
- Modify: `apps/web/src/app/jobs/page.tsx`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`

**Step 1: Write the failing job UI tests**

Add tests that verify a URL can be submitted from the jobs page and that the job detail page renders analysis results after manual trigger.

**Step 2: Run tests to verify they fail**

Run: `pnpm --filter @openclaw/web test jobs`
Expected: FAIL because the pages are not yet wired.

**Step 3: Implement the job UI interactions**

Connect import, list, detail fetch, and analysis trigger flows to the API and render the structured results.

**Step 4: Run tests to verify they pass**

Run: `pnpm --filter @openclaw/web test jobs`
Expected: PASS.

### Task 12: Verify the end-to-end acceptance path

**Files:**
- Modify: `README.md`
- Modify: `progress.md`

**Step 1: Run the app-level verification**

Run:
- `pnpm test`
- `pnpm build`
- `docker compose config`

Expected: test suite passes, builds succeed, compose is valid.

**Step 2: Run the acceptance flow**

Run the services locally and verify:
- settings save
- profile save
- job import
- analysis trigger

**Step 3: Document any gaps**

Record blockers, workarounds, and any deferred issues in `progress.md` and `README.md`.

**Step 4: Commit**

Skip commit if the workspace is still not a git repository.
