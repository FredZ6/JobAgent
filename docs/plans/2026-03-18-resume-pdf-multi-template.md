# Resume PDF Multi-Template Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a second professional PDF template and let Resume Review switch between templates for preview and download.

**Architecture:** Keep the existing printable resume document model, add a small template enum/parser, and dispatch HTML rendering between `classic` and `modern`. The web app keeps template state local to Resume Review and passes it through preview/download URLs.

**Tech Stack:** NestJS, Next.js, TypeScript, Vitest, Docker Compose

---

### Task 1: Add template parsing and rendering tests

**Files:**
- Modify: `apps/api/src/resume/resume-pdf.service.test.ts`
- Modify: `apps/api/src/resume/resume.controller.test.ts`

**Step 1: Write failing tests**

Add tests for:
- default template falls back to `classic`
- invalid template falls back to `classic`
- `classic` and `modern` render different HTML markers

**Step 2: Run tests to verify failure**

Run:
- `npm run test --workspace @openclaw/api -- resume-pdf.service.test.ts`
- `npm run test --workspace @openclaw/api -- resume.controller.test.ts`

**Step 3: Implement minimal parsing/rendering support**

Add:
- template parser/helper
- classic/modern renderer split

**Step 4: Re-run tests**

### Task 2: Add web template-aware PDF link helpers

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/lib/resume-pdf-links.test.ts`

**Step 1: Write failing tests**

Extend link tests to cover:
- default download/inline URLs
- template-specific URLs for `classic` and `modern`

**Step 2: Run tests to verify failure**

Run:
- `npm run test --workspace @openclaw/web -- resume-pdf-links.test.ts`

**Step 3: Implement minimal URL support**

Add optional template arguments to the PDF URL builders.

**Step 4: Re-run tests**

### Task 3: Add template switcher to Resume Review

**Files:**
- Modify: `apps/web/src/app/resume-versions/[id]/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add page-local template state**

Default to `classic`.

**Step 2: Add Classic/Modern toggle**

Use the selected template for:
- iframe preview
- `Preview PDF`
- `Download PDF`

**Step 3: Keep the fallback note**

### Task 4: Verify and document

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Verification**

Run:
- `npm test`
- `npm run build`
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`

**Step 2: Browser checks**

Confirm:
- Resume Review can switch between Classic and Modern
- iframe preview updates
- preview/download links update

**Step 3: Update planning/progress docs**
