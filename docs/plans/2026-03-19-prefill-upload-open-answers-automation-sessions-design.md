# Prefill Resume Upload, Open-Answer Autofill, and Automation Sessions Design

## Goal

Improve the current prefill flow in the next three steps, in this order:

1. upload the generated resume PDF into common ATS upload controls
2. detect open-ended application questions and autofill long answers
3. add `automation_sessions` as an execution-layer record without replacing the current `Application` business model

The design should preserve the current local-first, human-in-the-loop product posture while making prefill meaningfully more useful on real application pages.

## Scope

- Keep `POST /jobs/:id/prefill` as the public entry point
- Preserve the current `Application`-centric approval and submission review flow
- Extend the worker payload so `worker-playwright` can:
  - download the current resume PDF
  - upload that PDF into standard file-upload and common dropzone controls
  - detect open-ended text questions
  - request generated answers from the API
  - autofill those answers directly into the page
- Extend field-result modeling so review pages can show:
  - basic-field fills
  - resume-upload attempts
  - long-answer autofill attempts
- Add `automation_sessions` in a later phase as an additive execution record

## Non-Goals

- Automatic final application submit
- Full ATS compatibility across custom upload widgets
- Rich step replay, trace viewer, or browser recording console
- Replacing `Application` with `AutomationSession`
- Immediate migration of all existing execution evidence out of `Application`
- Hard guarantees that every detected open-ended field can be answered correctly

## Approach Options

### Option 1: Architecture First

First introduce `automation_sessions`, move execution evidence there, then add resume upload and long-answer autofill on top.

Why not now:
- It improves internal structure before it improves user value
- It delays the two capabilities that most increase real-world prefill usefulness

### Option 2: Functionality First With Incremental Execution Layer

First add resume upload, then open-answer autofill, then introduce `automation_sessions` as an additive layer.

Recommended because:
- It delivers the highest user-visible value earliest
- It fits the current `Application` + `WorkflowRun` model well enough
- It avoids a risky all-at-once rewrite of the prefill flow

### Option 3: Full Protocol Rewrite

Redesign the worker, API, data model, and review UI in one large pass so uploads, long answers, and automation sessions all land together.

Why not now:
- Too much surface area for one slice
- High regression risk in a repo already in closeout / handoff state

## Recommended Design

Use **Option 2: Functionality First With Incremental Execution Layer**.

The public product flow stays the same:

- user triggers prefill from Job Detail
- the system creates a fresh `Application`
- the worker attempts the prefill
- the user reviews the result on Application Review

Internally, the worker becomes more capable in two steps:

1. it can fetch and upload the current generated resume PDF
2. it can detect open-ended prompts and ask the API to generate answers, then fill them directly

Only after those two capabilities are working do we add `automation_sessions` as the execution-layer record for richer per-run evidence.

## Current Constraints To Preserve

- `Application` is currently the business object that drives approval and submission review
- `WorkflowRun` is the process object that tracks queued/running/completed/failed/cancelled execution
- `Application.fieldResults`, `formSnapshot`, `screenshotPaths`, and `workerLog` already power review UI
- resume PDFs are already available on demand from the API through:
  - `GET /resume-versions/:id/pdf`
  - `GET /resume-versions/:id/pdf/inline`
- final submit remains manual by design

## Architecture

### Public Entry Point

Keep:

- `POST /jobs/:id/prefill`

Semantics stay the same:
- create a new application run
- execute best-effort prefill
- return the new application context

This avoids churn across:
- Job Detail
- Application Review
- Submission Review
- Workflow run creation and retry logic

### API Responsibilities

The API remains the owner of:
- business context
- LLM configuration
- answer generation
- persistence of results

The API will:
- load the current `Job`, `CandidateProfile`, latest completed `ResumeVersion`, and latest analysis
- provide the worker with a downloadable resume PDF URL
- generate long-answer text for detected questions
- persist richer field results and, later, automation session data

### Worker Responsibilities

The Playwright worker remains the owner of:
- page inspection
- DOM interaction
- file upload execution
- long-answer DOM filling
- screenshot and step logging

The worker should not own:
- LLM access
- candidate/business truth
- answer-generation policy

### Resume PDF Handling

Do not persist uploaded PDF files separately for this slice.

Instead:
- the API includes a resume PDF download URL in the worker payload
- the worker downloads the PDF bytes from the API
- the worker writes the file to a temporary local path
- the worker uses that temporary file for:
  - standard file-input upload
  - common dropzone upload simulation

This keeps the slice small and reuses the current on-demand PDF rendering pipeline.

### Open-Answer Generation Flow

Open-answer generation is an API-owned substep inside prefill:

1. worker scans the page for long-answer fields
2. worker extracts:
   - field name
   - label
   - question text
   - placeholder / nearby hint text when available
3. worker calls an internal API endpoint with those questions
4. API resolves each question by:
   - first checking `defaultAnswers`
   - then generating a contextual answer from `Profile + Job + Analysis + Resume`
5. worker fills the generated answer directly into the page
6. all answers and outcomes are persisted for review

## Data Model

### Phase 1-2: Upgrade Field Results In Place

Keep using `Application.fieldResults`, but extend the schema so each result can describe:
- basic fields
- resume upload
- long-answer autofill

Recommended shape additions:

- `fieldLabel?: string`
- `fieldType`: `basic_text | resume_upload | long_text`
- `questionText?: string`
- `status?`: `filled | unhandled | failed | skipped`
- `strategy?`: `text_input | file_input | dropzone | textarea | contenteditable`
- `source?`: `profile | resume_pdf | default_answer | llm_generated`
- `metadata?`: record upload or answer-generation context

Keep `filled` for backward compatibility so current unresolved/failed counting logic still works during the transition.

### Phase 3: Add AutomationSession

Add a new `AutomationSession` model as an additive execution record.

Recommended fields:
- `id`
- `applicationId`
- `workflowRunId?`
- `kind` (`prefill` for the first cut)
- `status`
- `applyUrl`
- `resumeVersionId`
- `formSnapshot`
- `fieldResults`
- `screenshotPaths`
- `workerLog`
- `errorMessage?`
- `startedAt?`
- `completedAt?`
- `createdAt`
- `updatedAt`

Relationship model:
- one `Application` can have one or more `AutomationSession`s
- the latest session becomes the preferred evidence source for review pages
- `Application` remains the business state holder

### Migration Strategy

Do not migrate old application evidence immediately.

Instead:
- Phase 1-2: continue writing only to `Application`
- Phase 3: write new execution evidence to `AutomationSession`
- keep a compatibility snapshot on `Application`
- have read paths prefer the latest session when present

## API Surface

### Public API

Keep existing public prefill entry:
- `POST /jobs/:id/prefill`

No new public page flow is required for phase 1 or 2.

### API -> Worker Payload

Extend the current worker payload to include:

- `applicationId`
- `applyUrl`
- `profile`
- `resume`
  - `id`
  - `headline`
  - `status`
  - `pdfDownloadUrl`
  - `pdfFileName`
- `job`
  - `id`
  - `title`
  - `company`
  - `description`
- `analysis?`
- `defaultAnswers`
- `automation`
  - `enableResumeUpload`
  - `enableLongAnswerAutofill`

### Internal Answer-Generation API

Add a new internal endpoint for the worker, for example:

- `POST /internal/applications/:id/generate-long-answers`

Input:
- detected question list
- field metadata captured by the worker

Output:
- per-question generated answer
- answer source classification:
  - `default_answer`
  - `llm_generated`

This endpoint should remain API-owned so worker code stays deterministic and does not need direct LLM access.

### Later Session Read APIs

When `automation_sessions` land, add:
- `GET /applications/:id/automation-sessions`
- `GET /automation-sessions/:id`

These are intentionally deferred until the execution model actually exists.

## Worker Execution Design

### Resume Upload

Support two strategies in this order:

1. standard `<input type="file">`
2. common dropzone-style controls

Rules:
- if a standard input is available, use it first
- if only a likely dropzone exists, simulate the common upload path
- if a custom uploader cannot be handled safely, record `unhandled`
- upload failure should not necessarily fail the entire prefill run

Each attempt produces a `fieldType=resume_upload` result with:
- strategy used
- success/failure/unhandled state
- uploaded filename when available

### Long-Answer Autofill

Detect likely long-answer controls such as:
- `textarea`
- content-editable regions
- large multiline text inputs

For each candidate:
- extract the best available prompt text
- request an answer from the API
- autofill the answer directly
- persist the exact answer text in the result record

Each attempt produces a `fieldType=long_text` result with:
- detected question text
- suggested/generated answer
- strategy used
- success/failure/unhandled state

### Failure Semantics

Be conservative and honest:

- a single upload failure should not crash the run if other work can continue
- a single long-answer generation or fill failure should not stop other questions
- the whole worker should fail only when the browser/page-level execution is no longer meaningful

## UI Changes

### Application Review

Enhance the existing page rather than creating a new page for phases 1 and 2.

Recommended additions:

- `Resume upload` section
  - whether an upload control was found
  - strategy used
  - filename and resume version context
  - failure reason when applicable

- `Long-answer autofill` section
  - question text
  - generated answer
  - whether it was filled successfully
  - failure reason when applicable

- richer grouped `Field results`
  - Basic fields
  - Resume upload
  - Long answers

This preserves the existing review mental model while making the new automation work visible and auditable.

### Later Session UI

Once `automation_sessions` exist:
- keep `Application Review` as the main page
- show the latest session inline
- optionally add a lightweight session detail page later if the evidence becomes too dense

Do not create a separate automation console in this slice.

## Phase Plan

### Phase A: Resume Upload

Deliver:
- richer worker payload with resume PDF download metadata
- worker support for standard file upload and common dropzone upload
- upload result visibility on Application Review

Acceptance:
- standard file input uploads succeed
- common dropzone uploads either succeed or are honestly marked `unhandled`
- upload results are reviewable in the UI

### Phase B: Open-Answer Autofill

Deliver:
- worker detection of long-answer fields
- internal API answer generation
- direct worker autofill of generated long answers
- review visibility of generated answers and fill outcomes

Acceptance:
- detected questions can be answered from context
- generated text is actually filled into common long-answer controls
- every answer is reviewable after the run

### Phase C: Automation Sessions

Deliver:
- additive `AutomationSession` model and persistence
- session-aware review reads
- compatibility fallback to legacy application-stored evidence

Acceptance:
- each new prefill run creates a session
- latest session data is visible without breaking existing application flows
- old application records remain readable

## Testing Strategy

Follow TDD throughout.

### Resume Upload

Add tests for:
- worker upload strategy selection
- API payload enrichment with resume PDF metadata
- review rendering of upload results

### Open Answers

Add tests for:
- question detection helpers
- internal answer-generation endpoint
- use of `defaultAnswers` before LLM fallback
- review rendering of long-answer results

### Automation Sessions

Add tests for:
- Prisma model persistence
- latest-session read preference
- compatibility fallback for legacy application-only records

## Risks And Guardrails

### Resume Upload Risk

Custom upload widgets vary widely.

Guardrail:
- explicitly support standard inputs and common dropzones first
- mark unsupported flows as `unhandled`

### Long-Answer Risk

Aggressive autofill can write low-quality or contextually wrong answers.

Guardrail:
- keep answer generation grounded in saved profile facts and default answers
- record the exact answer text for review
- do not hide worker-side failures or skipped questions

### Data-Model Risk

Prematurely moving all evidence out of `Application` would create unnecessary migration risk.

Guardrail:
- add `AutomationSession` later as a layer
- keep `Application` stable until the new execution record has proven useful

## Verification

For each phase:

- run targeted tests first
- then run:
  - `npm test`
  - `npm run build`
  - `docker compose up --build -d`
- verify the phase with a real or realistic local prefill target page

Runtime checks should confirm:
- standard uploads succeed
- dropzone attempts are either successful or honestly marked
- long answers are both generated and actually written into the page
- Application Review shows exactly what happened
- later, automation sessions are created and read correctly
