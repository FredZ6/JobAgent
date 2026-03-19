# OpenAI and Gemini Provider Adapter Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a unified provider adapter so Settings can switch the entire product between OpenAI and Gemini for job analysis, resume generation, and eligible long-answer generation.

**Architecture:** Introduce a provider gateway and two adapter implementations in `apps/api/src/llm/`, then migrate analysis, resume, and long-answer generation to consume that shared layer. Keep the product globally single-provider, preserve current mock behavior, and keep high-risk long-answer prompts gated behind saved `defaultAnswers`.

**Tech Stack:** NestJS, TypeScript, Next.js, React, Zod, Prisma, Vitest

---

### Task 1: Lock shared settings types to `openai | gemini`

**Files:**
- Modify: `packages/shared-types/src/settings.ts`
- Modify: `packages/shared-types/src/index.ts`
- Create or modify: `packages/shared-types/src/settings.test.ts`

**Step 1: Write the failing test**

Add tests that expect:
- `provider: "openai"` passes
- `provider: "gemini"` passes
- other provider strings fail validation

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/shared-types -- settings.test.ts
```

Expected:
- FAIL because `provider` currently accepts any non-empty string

**Step 3: Write minimal implementation**

Update `llmSettingsSchema` so `provider` is a literal union of `openai` and `gemini`, then export any helper constants needed by the web and API layers.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 2: Add failing web tests for provider-select settings behavior

**Files:**
- Modify: `apps/web/src/app/settings/page-client.tsx`
- Create: `apps/web/src/app/settings/page-client.test.tsx`

**Step 1: Write the failing test**

Add tests that expect:
- the provider input renders as a select with `OpenAI` and `Gemini`
- switching provider updates the recommended model when the current model matches the old default
- the API-key placeholder changes with the selected provider

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/web -- page-client.test.tsx
```

Expected:
- FAIL because Settings currently uses free-text fields and has no provider-specific defaults

**Step 3: Write minimal implementation**

Update the Settings page to use a constrained provider select, provider-specific helper copy, and recommended defaults for `gpt-5.4` and `gemini-2.5-flash`.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 3: Add failing provider-adapter tests in the API

**Files:**
- Create: `apps/api/src/llm/llm-provider.types.ts`
- Create: `apps/api/src/llm/openai-llm-provider.service.ts`
- Create: `apps/api/src/llm/gemini-llm-provider.service.ts`
- Create: `apps/api/src/llm/llm-gateway.service.ts`
- Create: `apps/api/src/llm/openai-llm-provider.service.test.ts`
- Create: `apps/api/src/llm/gemini-llm-provider.service.test.ts`
- Create: `apps/api/src/llm/llm-gateway.service.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- OpenAI text generation parses `output_text`
- OpenAI structured JSON returns raw JSON text suitable for downstream parsing
- Gemini text generation parses `candidates[0].content.parts[].text`
- Gemini structured JSON returns raw JSON text
- non-OK or malformed provider responses throw explicit errors
- the gateway dispatches correctly for `openai` and `gemini`

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- llm
```

Expected:
- FAIL because the provider layer does not exist yet

**Step 3: Write minimal implementation**

Add the shared provider types, two provider services, the gateway service, and provider registration in `AppModule`.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 4: Migrate analysis generation to the provider gateway

**Files:**
- Modify: `apps/api/src/analysis/llm-analysis.service.ts`
- Modify: `apps/api/src/analysis/direct-analysis.service.ts`
- Create or modify: `apps/api/src/analysis/llm-analysis.service.test.ts`
- Create or modify: `apps/api/src/analysis/direct-analysis.service.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- the analysis service calls the gateway instead of direct vendor fetch logic
- mock mode still returns the existing mock analysis without gateway calls
- saved settings with `provider: "gemini"` reach the gateway unchanged

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- llm-analysis.service.test.ts direct-analysis.service.test.ts
```

Expected:
- FAIL because analysis still hard-codes OpenAI request behavior

**Step 3: Write minimal implementation**

Inject the gateway into `LlmAnalysisService`, remove direct OpenAI request code from that service, and pass `provider` through from `SettingsService` in the direct-analysis path.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 5: Migrate resume generation to the provider gateway

**Files:**
- Modify: `apps/api/src/resume/llm-resume.service.ts`
- Modify: `apps/api/src/resume/direct-resume.service.ts`
- Create or modify: `apps/api/src/resume/llm-resume.service.test.ts`
- Create or modify: `apps/api/src/resume/direct-resume.service.test.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- the resume service calls the gateway instead of direct OpenAI request logic
- mock mode still returns the existing mock resume without gateway calls
- saved settings with `provider: "gemini"` reach the gateway unchanged

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- llm-resume.service.test.ts direct-resume.service.test.ts
```

Expected:
- FAIL because resume generation still hard-codes OpenAI request behavior

**Step 3: Write minimal implementation**

Inject the gateway into `LlmResumeService`, remove direct OpenAI request code from that service, and pass `provider` through from `SettingsService` in the direct-resume path.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 6: Add provider-backed long-answer generation behind current safety rules

**Files:**
- Create: `apps/api/src/internal/llm-long-answer.service.ts`
- Create: `apps/api/src/internal/llm-long-answer.service.test.ts`
- Modify: `apps/api/src/internal/long-answer.service.ts`
- Modify: `apps/api/src/internal/long-answer.service.test.ts`
- Modify: `apps/api/src/internal/internal.controller.test.ts`
- Modify: `apps/api/src/app.module.ts`

**Step 1: Write the failing tests**

Add tests that expect:
- matched `defaultAnswers` do not call the LLM path
- unmatched high-risk prompts do not call the LLM path and return `manual_review_required`
- unmatched non-high-risk prompts call `LlmLongAnswerService` when provider settings are usable
- successful model answers return `decision: "fill"` and `source: "llm_generated"`
- missing API key, mock mode, or provider failure falls back to `deterministic_fallback`

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/api -- long-answer.service.test.ts llm-long-answer.service.test.ts internal.controller.test.ts
```

Expected:
- FAIL because long answers still only use defaults plus deterministic fallback

**Step 3: Write minimal implementation**

Add `LlmLongAnswerService`, use the provider gateway for non-high-risk eligible prompts, and keep the current manual-review and deterministic-fallback rules intact.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 7: Add worker compatibility coverage for `llm_generated` long answers

**Files:**
- Modify: `apps/worker-playwright/src/prefill.test.ts`
- Modify: `apps/worker-playwright/src/prefill.ts`

**Step 1: Write the failing test**

Add a test that expects the worker to keep auto-filling long-answer fields when the API returns:
- `decision: "fill"`
- `source: "llm_generated"`

**Step 2: Run test to verify it fails**

Run:
```bash
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

Expected:
- FAIL if the worker is too tightly coupled to the old default/fallback assumptions

**Step 3: Write minimal implementation**

Make any minimal worker adjustment needed so `llm_generated` behaves exactly like other fillable long-answer results.

**Step 4: Run test to verify it passes**

Run the same test again.

Expected:
- PASS

### Task 8: Verify the integrated dual-provider slice

**Files:**
- No new files required

**Step 1: Run targeted tests**

```bash
npm run test --workspace @openclaw/shared-types -- settings.test.ts
npm run test --workspace @openclaw/web -- page-client.test.tsx
npm run test --workspace @openclaw/api -- llm
npm run test --workspace @openclaw/api -- long-answer.service.test.ts llm-long-answer.service.test.ts
npm run test --workspace @openclaw/worker-playwright -- prefill.test.ts
```

**Step 2: Run broader package tests**

```bash
npm run test --workspace @openclaw/api
npm run test --workspace @openclaw/web
```

**Step 3: Run package builds**

```bash
npm run build --workspace @openclaw/shared-types
npm run build --workspace @openclaw/api
npm run build --workspace @openclaw/web
npm run build --workspace @openclaw/worker-playwright
```

**Step 4: Commit**

```bash
git add packages/shared-types/src/settings.ts \
  packages/shared-types/src/index.ts \
  packages/shared-types/src/settings.test.ts \
  apps/web/src/app/settings/page-client.tsx \
  apps/web/src/app/settings/page-client.test.tsx \
  apps/api/src/llm \
  apps/api/src/analysis/llm-analysis.service.ts \
  apps/api/src/analysis/direct-analysis.service.ts \
  apps/api/src/resume/llm-resume.service.ts \
  apps/api/src/resume/direct-resume.service.ts \
  apps/api/src/internal/llm-long-answer.service.ts \
  apps/api/src/internal/llm-long-answer.service.test.ts \
  apps/api/src/internal/long-answer.service.ts \
  apps/api/src/internal/long-answer.service.test.ts \
  apps/api/src/internal/internal.controller.test.ts \
  apps/worker-playwright/src/prefill.ts \
  apps/worker-playwright/src/prefill.test.ts \
  apps/api/src/app.module.ts \
  docs/plans/2026-03-19-openai-gemini-provider-adapter-design.md \
  docs/plans/2026-03-19-openai-gemini-provider-adapter.md \
  task_plan.md findings.md progress.md
git commit -m "Add OpenAI and Gemini provider adapter"
```
