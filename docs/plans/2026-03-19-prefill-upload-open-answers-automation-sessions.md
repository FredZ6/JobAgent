# Prefill Resume Upload, Open-Answer Autofill, and Automation Sessions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Extend the current prefill flow so it can upload the generated resume PDF, autofill detected long-answer questions, and later persist richer execution evidence in additive `automation_sessions`.

**Architecture:** Keep `POST /jobs/:id/prefill` and the current `Application` approval flow as the public product path. Enrich the API -> worker payload with resume PDF and answer-generation context, upgrade worker/result schemas for upload and long-answer actions, then add `AutomationSession` as a separate execution-layer record while leaving `Application` in place as the business object.

**Tech Stack:** NestJS, TypeScript, Prisma, Next.js, React, Playwright, Vitest, Docker Compose

---

### Task 1: Add failing shared-type tests for richer prefill result modeling

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Modify: `packages/shared-types/src/application.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- `fieldResultSchema` accepts `fieldType` values for `basic_text`, `resume_upload`, and `long_text`
- `fieldResultSchema` accepts optional `fieldLabel`, `questionText`, `status`, `strategy`, `source`, and `metadata`
- existing legacy-style results without the new fields still remain valid

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts
```

Expected:
- FAIL because the current field-result schema is still too narrow

**Step 3: Write minimal implementation**

Extend the shared Zod schema and exported types while keeping backward compatibility for old rows.

**Step 4: Run test to verify it passes**

Run the same shared-types suite again.

Expected:
- PASS

### Task 2: Add failing API tests for richer worker payload and internal long-answer generation

**Files:**
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/internal/internal.controller.ts`
- Modify: `apps/api/src/app.module.ts`
- Modify: `apps/api/src/profile/profile.service.ts`
- Modify: `apps/api/src/resume/resume.service.ts`

**Step 1: Write the failing tests**

Add API tests that expect:
- worker payload now includes `resume.pdfDownloadUrl` and `resume.pdfFileName`
- worker payload includes `job`, `analysis`, and `defaultAnswers`
- an internal long-answer generation endpoint rejects invalid calls and returns structured per-question answers for valid calls
- `defaultAnswers` are used before LLM fallback where applicable

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

Expected:
- FAIL because the worker payload and internal answer-generation path do not exist yet

**Step 3: Write minimal implementation**

Add:
- worker payload enrichment inside `ApplicationsService`
- a small internal API entry point for answer generation
- any minimal service/helper needed to resolve default-answer matches and LLM fallback

**Step 4: Run test to verify it passes**

Run the targeted API suite again.

Expected:
- PASS

### Task 3: Add failing worker tests for standard upload and dropzone upload

**Files:**
- Modify: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/prefill.test.ts`
- Modify: `apps/worker-playwright/src/index.ts`

**Step 1: Write the failing tests**

Add worker tests that expect:
- standard file input is preferred when available
- a common dropzone-style control is attempted when no plain file input is present
- unsupported upload widgets are reported as `unhandled`
- upload attempts create `fieldType=resume_upload` results with strategy and outcome metadata

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

Expected:
- FAIL because upload helpers do not exist yet

**Step 3: Write minimal implementation**

Implement worker helpers that:
- download the resume PDF to a temporary file
- perform standard-input upload
- attempt common dropzone upload
- return structured upload field results

**Step 4: Run test to verify it passes**

Run the targeted worker suite again.

Expected:
- PASS

### Task 4: Add failing worker tests for long-answer detection and autofill

**Files:**
- Modify: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/prefill.test.ts`
- Modify: `apps/worker-playwright/src/index.ts`

**Step 1: Write the failing tests**

Add worker tests that expect:
- `textarea` and content-editable regions can be detected as long-answer targets
- question text extraction uses label, prompt, or placeholder hints where available
- generated answers can be filled into detected long-answer controls
- each attempt creates a `fieldType=long_text` result with question text, answer text, strategy, and outcome

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

Expected:
- FAIL because no long-answer flow exists yet

**Step 3: Write minimal implementation**

Add detection and fill helpers, plus worker <-> API request plumbing for answer generation.

**Step 4: Run test to verify it passes**

Run the targeted worker suite again.

Expected:
- PASS

### Task 5: Wire richer prefill results back into application persistence

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `packages/shared-types/src/application.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- richer upload and long-answer results round-trip through `Application.fieldResults`
- unresolved and failed counts remain stable with the new result shape
- partial upload / long-answer failures do not automatically collapse the whole prefill run unless the worker itself returns failure

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- applications.service.test.ts
```

Expected:
- FAIL because the richer worker response shape is not fully persisted or normalized yet

**Step 3: Write minimal implementation**

Update worker response normalization and persistence paths so richer field results are stored and formatted correctly.

**Step 4: Run test to verify it passes**

Run the targeted API suite again.

Expected:
- PASS

### Task 6: Add failing web tests for upload and long-answer review UI

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Modify: `apps/web/src/lib/api.ts`
- Create or modify: targeted web tests near existing review-related helpers

**Step 1: Write the failing tests**

Add tests that expect Application Review to show:
- grouped or clearly distinguishable basic-field, resume-upload, and long-answer results
- generated long-answer text
- upload strategy / failure reason details when available

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/web
```

Expected:
- FAIL because the page still renders only the current flat field list

**Step 3: Write minimal implementation**

Update the review page to render the richer field-result model in a readable grouped presentation.

**Step 4: Run test to verify it passes**

Run the targeted web suite again.

Expected:
- PASS

### Task 7: Verify phase-one and phase-two runtime behavior

**Files:**
- No new files required

**Step 1: Run targeted tests**

```bash
npm run test --workspace @openclaw/shared-types -- application.test.ts
npm run test --workspace @openclaw/api -- applications.service.test.ts
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
npm run test --workspace @openclaw/web
```

**Step 2: Run full verification**

```bash
npm test
npm run build
docker compose up --build -d
```

**Step 3: Run runtime checks**

Verify:
- a local page with a standard file input receives the resume PDF upload
- a local page with a common dropzone either uploads successfully or is marked `unhandled`
- detected long-answer fields are autofilled
- Application Review shows the uploaded file result and the generated long answers

### Task 8: Add failing Prisma and API tests for additive automation sessions

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `packages/shared-types/src/application.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`
- Modify: `apps/api/src/applications/applications.controller.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- each new prefill run creates an `AutomationSession`
- sessions persist status, form snapshot, field results, screenshots, logs, and error state
- latest session data can be fetched without breaking the existing application response model

**Step 2: Run test to verify it fails**

Run the targeted API suite plus any Prisma-backed tests.

Expected:
- FAIL because `AutomationSession` does not exist yet

**Step 3: Write minimal implementation**

Add the Prisma model, write paths, and basic read helpers while keeping `Application` intact.

**Step 4: Run test to verify it passes**

Run the same targeted suites again.

Expected:
- PASS

### Task 9: Prefer latest automation session on read paths

**Files:**
- Modify: `apps/api/src/applications/applications.service.ts`
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/app/applications/[id]/page.tsx`
- Add tests in API and web suites as needed

**Step 1: Write the failing tests**

Add tests that expect:
- Application Review prefers latest-session evidence when present
- legacy applications without sessions still render correctly

**Step 2: Run test to verify it fails**

Run the targeted API and web suites.

Expected:
- FAIL because reads still only reflect application-stored evidence

**Step 3: Write minimal implementation**

Update the read model so latest session data overlays or replaces legacy in-application execution evidence at read time.

**Step 4: Run test to verify it passes**

Run the targeted suites again.

Expected:
- PASS

### Task 10: Run full verification for the automation-session phase

**Files:**
- No new files required

**Step 1: Run targeted tests**

Re-run the most relevant API, worker, web, and shared-type suites.

**Step 2: Run full project verification**

```bash
npm test
npm run build
docker compose up --build -d
```

**Step 3: Run runtime checks**

Verify:
- each new prefill run creates a session
- latest session evidence appears on Application Review
- old applications without sessions still render safely

### Task 11: Sync documentation and planning files

**Files:**
- Modify: `README.md`
- Modify: `task_plan.md`
- Modify: `findings.md`
- Modify: `progress.md`

**Step 1: Update scope and product notes**

Document:
- resume upload support scope
- long-answer autofill scope and reviewability
- additive `automation_sessions` design

**Step 2: Record verification**

Add the new targeted/runtime verification outcomes and any known limitations around unsupported upload widgets or long-answer control types.
