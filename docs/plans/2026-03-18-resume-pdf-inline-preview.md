# Resume PDF Inline Preview Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add browser-embedded PDF preview for completed resume versions while preserving the existing download flow.

**Architecture:** Reuse the current API-side PDF rendering and split response semantics into `attachment` vs `inline`. On the web side, keep the existing Resume Review page and add a simple embedded preview region plus a small fallback note.

**Tech Stack:** NestJS, Next.js, TypeScript, Vitest, Docker Compose

---

### Task 1: Add API support for inline PDF response semantics

**Files:**
- Modify: `apps/api/src/resume/resume.controller.ts`
- Test: `apps/api/src/resume/resume.controller.test.ts`

**Step 1: Write the failing test**

Add a controller-level test that asserts:
- the existing download helper uses `attachment`
- the new inline helper uses `inline`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/api -- resume.controller.test.ts`

**Step 3: Write minimal implementation**

- Add a small helper for PDF `StreamableFile` response options.
- Reuse it in the current download route.
- Add `GET /resume-versions/:id/pdf/inline`.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/api -- resume.controller.test.ts`

### Task 2: Add web support for inline preview URLs

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Test: `apps/web/src/lib/resume-pdf-links.test.ts`

**Step 1: Write the failing test**

Add a small web test for:
- `buildResumePdfUrl(id)`
- `buildResumePdfInlineUrl(id)`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @openclaw/web -- resume-pdf-links.test.ts`

**Step 3: Write minimal implementation**

- Add `buildResumePdfInlineUrl(id)` to the web API helper.

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @openclaw/web -- resume-pdf-links.test.ts`

### Task 3: Embed PDF preview into Resume Review

**Files:**
- Modify: `apps/web/src/app/resume-versions/[id]/page.tsx`
- Modify: `apps/web/src/app/globals.css`

**Step 1: Add the preview UI**

- Keep `Download PDF`
- Add `Preview PDF`
- Add an inline `iframe` region pointing at the new inline PDF route
- Add a fallback note with a download link

**Step 2: Verify locally**

Run:
- `npm run build --workspace @openclaw/web`

### Task 4: Verify the full slice

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Run verification**

Run:
- `npm run test`
- `npm run build`
- `docker compose up --build -d`
- `curl -sS http://localhost:3001/health`

**Step 2: Browser verification**

Confirm that:
- Resume Review shows the embedded preview
- `Download PDF` still works
- The page remains usable if preview is unavailable

**Step 3: Document the phase**

- Add Phase 42 notes to the planning and progress files.
