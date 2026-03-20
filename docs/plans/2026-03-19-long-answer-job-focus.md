# Long-Answer Job Focus Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make non-high-risk long-answer generation more job-aware by extracting focused job context and using a stronger role-first prompt.

**Architecture:** Keep the existing `LongAnswerService -> LlmLongAnswerService -> LlmGatewayService` flow, but insert a deterministic local `jobFocus` extraction helper before the LLM call. Expand the LLM input and prompt so answers first respond to the role mission and responsibilities, then connect the candidate to the most relevant requirements, while preserving current safety and fallback behavior.

**Tech Stack:** NestJS, TypeScript, Vitest, existing OpenAI/Gemini LLM gateway, existing shared Prisma-backed services

---

### Task 1: Add failing tests for `jobFocus` extraction

**Files:**
- Create or Modify: `apps/api/src/internal/long-answer.service.test.ts`
- Modify: `apps/api/src/internal/long-answer.service.ts`

**Step 1: Write the failing test**

Add tests that expect a helper-driven `jobFocus` extraction result from representative JD text:

- explicit responsibilities section -> responsibilities extracted
- explicit requirements section -> requirements extracted
- noisy/freeform description -> best-effort extraction
- empty/noisy description -> empty arrays
- arrays capped at `3`

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
```

Expected: FAIL because `jobFocus` extraction does not yet exist or is not exposed through the tested path.

**Step 3: Write minimal implementation**

In `apps/api/src/internal/long-answer.service.ts`:

- add a local helper that extracts `topResponsibilities` and `topRequirements`
- keep it deterministic and best-effort
- do not introduce another service or LLM call

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/internal/long-answer.service.ts apps/api/src/internal/long-answer.service.test.ts
git commit -m "Add job focus extraction for long answers"
```

### Task 2: Expand long-answer LLM input and add failing prompt-payload tests

**Files:**
- Modify: `apps/api/src/internal/llm-long-answer.service.ts`
- Modify: `apps/api/src/internal/llm-long-answer.service.test.ts`
- Modify: `apps/api/src/internal/long-answer.service.ts`

**Step 1: Write the failing test**

Add tests that expect the LLM payload to include:

- `jobFocus.topResponsibilities`
- `jobFocus.topRequirements`
- `analysis.requiredSkills`
- `analysis.missingSkills`
- `analysis.redFlags`

Also assert the instructions mention:

- role mission / responsibilities first
- requirement alignment second
- concise `2-4` sentence output

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/api -- llm-long-answer.service.test.ts
```

Expected: FAIL because the current payload/instructions are still too thin.

**Step 3: Write minimal implementation**

Update `LlmLongAnswerService.generate(...)` to accept richer input:

- job core fields
- extracted `jobFocus`
- structured analysis fields

Update the prompt instructions and `promptPayload` accordingly.

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/api -- llm-long-answer.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/internal/llm-long-answer.service.ts apps/api/src/internal/llm-long-answer.service.test.ts apps/api/src/internal/long-answer.service.ts
git commit -m "Strengthen long-answer role-focused prompt"
```

### Task 3: Prove the richer context reaches the LLM path from `LongAnswerService`

**Files:**
- Modify: `apps/api/src/internal/long-answer.service.test.ts`
- Modify: `apps/api/src/internal/long-answer.service.ts`

**Step 1: Write the failing test**

Add a non-high-risk test where:

- `defaultAnswers` do not match
- provider settings are usable
- analysis exists
- JD has recognizable responsibilities and requirements

Assert that `LongAnswerService` calls `LlmLongAnswerService` with extracted `jobFocus` and structured analysis context.

**Step 2: Run test to verify it fails**

Run:

```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
```

Expected: FAIL because the richer context is not yet wired end-to-end.

**Step 3: Write minimal implementation**

Wire the extracted `jobFocus` and structured analysis fields into the LLM call path without changing:

- `defaultAnswers` short-circuit
- high-risk manual review
- deterministic fallback rules

**Step 4: Run test to verify it passes**

Run:

```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
```

Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/internal/long-answer.service.ts apps/api/src/internal/long-answer.service.test.ts
git commit -m "Wire job focus into long-answer generation"
```

### Task 4: Run regression verification for the API package

**Files:**
- Verify only

**Step 1: Run targeted long-answer tests**

Run:

```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts
npm run test --workspace @openclaw/api -- llm-long-answer.service.test.ts
```

Expected: PASS

**Step 2: Run full API tests**

Run:

```bash
npm run test --workspace @openclaw/api
```

Expected: PASS with the opt-in runtime tests still skipped by default

**Step 3: Run API build**

Run:

```bash
npm run build --workspace @openclaw/api
```

Expected: PASS

**Step 4: Commit**

```bash
git add .
git commit -m "Verify long-answer job focus enhancements"
```

### Task 5: Update checklist state if implementation is complete

**Files:**
- Modify: `docs/plans/2026-03-19-open-source-release-checklist.md`

**Step 1: Update checklist**

Mark the long-answer item complete only if all tests and build checks are green and the role-focused job context is fully wired.

**Step 2: Commit**

```bash
git add docs/plans/2026-03-19-open-source-release-checklist.md
git commit -m "Mark long-answer checklist item complete"
```
