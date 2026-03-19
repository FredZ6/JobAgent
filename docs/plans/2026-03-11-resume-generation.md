# OpenClaw Job Agent Resume Generation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add structured resume generation plus richer frontend interaction states on top of the round-one MVP.

**Architecture:** Extend the existing candidate profile to hold resume source facts, persist generated resume outputs in `resume_versions`, and expose job-scoped resume endpoints from the API. On the frontend, tighten form-state handling and add a dedicated Resume Review route connected from Job Detail.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Zod, Docker Compose, OpenAI Responses API

---

### Task 1: Expand shared schemas for profile facts and resume versions

**Files:**
- Modify: `packages/shared-types/src/profile.ts`
- Create: `packages/shared-types/src/resume.ts`
- Modify: `packages/shared-types/src/index.ts`
- Modify: `packages/shared-types/src/profile.test.ts`
- Create: `packages/shared-types/src/resume.test.ts`

**Step 1: Write the failing schema tests**

Add tests that validate:
- candidate profiles can carry structured experience and project libraries
- resume version payloads accept valid structured content
- invalid resume payloads are rejected

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: FAIL because the new schemas do not exist yet.

**Step 3: Implement the schemas**

Add Zod schemas and inferred types for:
- experience entry
- project entry
- extended candidate profile
- resume content
- resume version

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/shared-types`
Expected: PASS.

### Task 2: Extend Prisma for resume versions and richer profile data

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `prisma/seed.ts`

**Step 1: Update the Prisma schema**

Add profile JSON fields for experience/project libraries and add the `ResumeVersion` model with job/profile relations.

**Step 2: Apply the schema**

Run: `docker compose exec api npx prisma db push`
Expected: the database syncs successfully.

**Step 3: Update seed data**

Seed the demo profile with at least one experience and one project entry.

### Task 3: Implement resume generation services in the API

**Files:**
- Create: `apps/api/src/resume/resume.controller.ts`
- Create: `apps/api/src/resume/resume.service.ts`
- Create: `apps/api/src/resume/llm-resume.service.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/jobs/jobs.controller.ts`
- Modify: `apps/api/src/analysis/analysis.service.ts`

**Step 1: Write the failing API/runtime verification target**

Define the expected behavior:
- `POST /jobs/:id/generate-resume` returns a completed resume version
- `GET /jobs/:id/resume-versions` returns saved versions
- `GET /resume-versions/:id` returns one saved version

**Step 2: Implement minimal generation behavior**

Build a mockable resume generator that uses:
- candidate profile
- job
- latest analysis

Persist one completed structured resume version.

**Step 3: Wire the endpoints**

Add controller routes and app-module registrations for resume generation and retrieval.

**Step 4: Verify the API manually**

Run:
- `curl -sS -X POST http://localhost:3001/jobs/<jobId>/generate-resume`
- `curl -sS http://localhost:3001/jobs/<jobId>/resume-versions`
- `curl -sS http://localhost:3001/resume-versions/<resumeVersionId>`

Expected: all three commands return valid JSON with persisted data.

### Task 4: Improve frontend form-state handling

**Files:**
- Modify: `apps/web/src/app/settings/page.tsx`
- Modify: `apps/web/src/app/profile/page.tsx`
- Modify: `apps/web/src/app/jobs/page.tsx`
- Modify: `apps/web/src/components/field.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add client-side form-state logic**

Track:
- original saved value
- dirty state
- simple validation state
- saving state
- success and error state

**Step 2: Improve import behavior**

After a successful import, route to the new job detail page.

**Step 3: Verify in the browser**

Check that forms show dirty state and invalid fields block save.

### Task 5: Add resume generation to Job Detail

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`

**Step 1: Add resume API client helpers**

Expose:
- `generateResume`
- `fetchResumeVersions`
- `fetchResumeVersion`

**Step 2: Add resume generation state to Job Detail**

Show separate:
- analyze pending/error state
- generate pending/error state
- latest resume summary
- versions list

**Step 3: Verify manually**

Generate a resume from Job Detail and confirm the UI updates with the new version.

### Task 6: Build the Resume Review page

**Files:**
- Create: `apps/web/src/app/resume-versions/[id]/page.tsx`
- Possibly create: `apps/web/src/components/resume-review.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Build the page states**

Render:
- loading
- empty/error
- completed resume content

**Step 2: Render structured sections**

Show headline, summary, skills, experience, projects, and change summary.

**Step 3: Verify manually**

Open a generated resume version URL and confirm the content renders correctly.

### Task 7: Final verification

**Files:**
- Modify: `README.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`
- settings/profile save flow
- job import flow
- analyze flow
- resume generation flow
- resume review page load

Expected: the full round-two path works end to end.

**Step 3: Update docs**

Document the new resume-generation scope and the fact that PDF is still deferred.
