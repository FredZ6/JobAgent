# Default Answers Editor and High-Risk Manual-Review Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a user-friendly Profile-page editor for `defaultAnswers` and enforce the rule that unmatched high-risk long-answer prompts require manual review instead of being auto-filled.

**Architecture:** Keep persistence and the public profile API shape unchanged by editing `defaultAnswers` as row state only in the web layer. Extend the internal long-answer decision protocol so API and worker can distinguish between auto-fillable answers and blocked high-risk prompts that must be surfaced for manual review.

**Tech Stack:** Next.js, React, NestJS, TypeScript, Prisma, Vitest, Playwright worker

---

### Task 1: Add failing web tests for default-answer editor state and validation

**Files:**
- Modify: `apps/web/src/app/profile/page-client.tsx`
- Create or modify: `apps/web/src/app/profile/page-client.test.tsx`

**Step 1: Write the failing tests**

Add tests that expect:
- fetched `defaultAnswers` hydrate into editable rows
- `Add answer` appends a blank row
- `Remove` deletes the selected row
- duplicate questions block save
- partial rows block save
- the empty state shows suggested prompts but does not auto-insert them

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/web -- page-client.test.tsx
```

Expected:
- FAIL because the Profile page does not yet render a default-answer editor

**Step 3: Write minimal implementation**

Add local row-state helpers, validation, and the editor UI to the Profile page while preserving the existing save API payload.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 2: Add failing API tests for high-risk long-answer gating

**Files:**
- Modify: `apps/api/src/internal/long-answer.service.ts`
- Modify: `apps/api/src/internal/long-answer.service.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- matched defaults return `decision: "fill"`
- unmatched sponsorship/salary/start-date/relocation/legal prompts return `decision: "manual_review_required"`
- unmatched non-high-risk prompts still use the current fallback path

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
```

Expected:
- FAIL because the current service only returns answer text plus source

**Step 3: Write minimal implementation**

Add high-risk detection, explicit decision results, and manual-review metadata while leaving non-high-risk fallback behavior intact.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 3: Add failing worker tests for manual-review-required long-answer results

**Files:**
- Modify: `apps/worker-playwright/src/prefill.ts`
- Modify: `apps/worker-playwright/src/prefill.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- the worker does not fill fields when the API returns `manual_review_required`
- the resulting `FieldResult` is `status: "unhandled"`
- the result carries `source: "manual_review_required"` and a useful failure reason

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

Expected:
- FAIL because the worker currently assumes every returned long-answer payload includes `answer`

**Step 3: Write minimal implementation**

Update worker answer handling to branch on `decision`, skip browser fill calls for manual-review-required prompts, and persist the blocked result cleanly.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 4: Verify the integrated slice

**Files:**
- No new files required

**Step 1: Run targeted tests**

```bash
npm run test --workspace @openclaw/web -- page-client.test.tsx
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

**Step 2: Run broader package tests**

```bash
npm run test --workspace @openclaw/api
npm run test --workspace @openclaw/web
```

**Step 3: Run package builds**

```bash
npm run build --workspace @openclaw/api
npm run build --workspace @openclaw/web
```

**Step 4: Commit**

```bash
git add apps/api/src/internal/long-answer.service.ts \
  apps/api/src/internal/long-answer.service.test.ts \
  apps/web/src/app/profile/page-client.tsx \
  apps/web/src/app/profile/page-client.test.tsx \
  apps/worker-playwright/src/prefill.ts \
  apps/worker-playwright/src/prefill.test.ts \
  task_plan.md findings.md progress.md \
  docs/plans/2026-03-19-default-answers-editor-high-risk-manual-review-design.md \
  docs/plans/2026-03-19-default-answers-editor-high-risk-manual-review.md \
  docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Add default answers editor and high-risk manual review"
```

