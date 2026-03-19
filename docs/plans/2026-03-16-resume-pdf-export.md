# OpenClaw Job Agent Resume PDF Export Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a single-template PDF export flow for completed resume versions.

**Architecture:** Extend the existing resume-version read path with a print HTML route and a PDF route that renders the same content through a headless browser in the API container. Surface download actions from Job Detail and Resume Review without persisting generated files.

**Tech Stack:** Next.js, React, TypeScript, NestJS, Prisma, PostgreSQL, Playwright, Docker Compose

---

### Task 1: Add failing shared and API-facing tests for PDF-related data behavior

**Files:**
- Modify: `packages/shared-types/src/resume.test.ts`
- Create: `apps/api/src/resume/resume-pdf.service.test.ts`

**Step 1: Write the failing tests**

Add tests that verify:
- completed resume versions can be normalized into printable view data
- incomplete resume versions are rejected for PDF export
- PDF filenames are slugged and stable

**Step 2: Run test to verify it fails**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`

Expected: FAIL because the PDF mapping service and filename behavior do not exist yet.

**Step 3: Implement the minimal mapping service**

Create a dedicated service that:
- reads a resume version plus related job/profile context
- maps printable sections
- builds the download filename
- throws on missing or invalid export state

**Step 4: Run test to verify it passes**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`

Expected: PASS.

### Task 2: Implement print HTML and PDF generation in the API

**Files:**
- Create: `apps/api/src/resume/resume-pdf.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`
- Modify: `apps/api/src/resume/resume.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/package.json`
- Modify: `apps/api/Dockerfile`

**Step 1: Write the failing route-level behavior**

Define the expected behavior:
- `GET /resume-versions/:id/print` returns printable HTML
- `GET /resume-versions/:id/pdf` returns PDF bytes with the correct content type and filename

**Step 2: Implement minimal HTML rendering**

Render a stable, single-column HTML document with:
- profile identity block
- headline
- summary
- skills
- experience
- projects

**Step 3: Implement minimal PDF rendering**

Use Playwright with system Chromium to:
- load the generated HTML
- print it to PDF
- return the buffer in the controller response

**Step 4: Verify the routes manually**

Run:
- `curl -sS http://localhost:3001/resume-versions/<id>/print | head -c 500`
- `curl -sS -D - http://localhost:3001/resume-versions/<id>/pdf -o /tmp/resume.pdf`

Expected:
- print route returns HTML
- PDF route returns `application/pdf`

### Task 3: Add PDF download actions to the frontend

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/jobs/[id]/page.tsx`
- Modify: `apps/web/src/app/resume-versions/[id]/page.tsx`

**Step 1: Add a PDF URL helper**

Expose a helper that builds the PDF endpoint URL for a resume version.

**Step 2: Add download actions**

Add `Download PDF` actions to:
- Job Detail for the latest completed resume version
- Resume Review for the current version

**Step 3: Verify manually**

From the browser, click both download actions and confirm a PDF download starts successfully.

### Task 4: Final verification and documentation

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run code verification**

Run:
- `npm run test --workspace @openclaw/shared-types`
- `npm run test --workspace @openclaw/api`
- `npm test`
- `npm run build`

Expected: all commands succeed.

**Step 2: Run runtime verification**

Run:
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`
- `curl -sS http://localhost:3001/resume-versions/<id>/print | head -c 500`
- `curl -sS -D - http://localhost:3001/resume-versions/<id>/pdf -o /tmp/resume.pdf`

Expected: the stack starts cleanly and the PDF export route returns a valid PDF.

**Step 3: Update docs**

Document:
- the new PDF export scope
- the single-template limitation
- the fact that preview and multi-template support are still deferred
