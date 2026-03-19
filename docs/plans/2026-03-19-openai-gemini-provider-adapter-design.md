# OpenAI and Gemini Provider Adapter Design

## Goal

Let the project run all three LLM-backed flows through a single global provider choice:

1. job analysis
2. tailored resume generation
3. long-answer generation for application prefill

The result should keep the product simple for users, lower the barrier for open-source adopters who prefer Gemini's free tier, and avoid duplicating provider-specific logic across three different services.

## Scope

- Keep one global LLM setting for the whole app: `provider + model + apiKey`
- Support `openai` and `gemini` as the only valid providers
- Add a provider adapter layer in the API so business services stop calling vendor APIs directly
- Route job analysis and resume generation through the adapter layer
- Fold long-answer `item 6` into the same adapter layer so non-high-risk long answers can use either provider
- Keep current mock-mode behavior for analysis and resume generation
- Keep the agreed high-risk long-answer rule:
  - matched `defaultAnswers` can auto-fill
  - unmatched high-risk prompts require manual review
- Keep generated long answers ephemeral to the current application run; do not write them back into `defaultAnswers`

## Non-Goals

- Per-feature provider selection
- Per-provider saved credentials
- Provider orchestration, routing, fallback, or multi-model ensembles
- Replacing the current settings storage model
- Reworking job import, resume PDF export, or application review outside the minimum changes needed for provider support
- Adding more providers in this same slice

## Approach Options

### Option 1: Unified Provider Adapter Layer

- Add a shared adapter interface for structured JSON generation and plain-text generation
- Implement `OpenAiLlmProvider` and `GeminiLlmProvider`
- Add a gateway/registry that selects the active provider from saved settings
- Keep prompts, schemas, and product rules inside the existing business services

Recommended because:
- it removes provider branching from business logic
- it scales cleanly across all three LLM-backed flows
- it keeps future providers additive instead of forcing more `if provider === ...` branches

### Option 2: Provider Branches Inside Each Business Service

- Add `if provider === "gemini"` checks to `LlmAnalysisService`, `LlmResumeService`, and `LlmLongAnswerService`

Why not now:
- it repeats provider logic three times
- response parsing and error handling would drift quickly
- it would make long-answer `item 6` harder to evolve cleanly

### Option 3: Thin Shared `generateText()` Utility Only

- Share a small request helper but leave structured JSON handling and provider branching mostly inside each service

Why not now:
- it only partially solves the duplication problem
- structured-output behavior is one of the main places where provider differences matter

## Recommended Design

Use **Option 1: Unified Provider Adapter Layer**.

The API gets a new `llm/` layer with one interface and two provider implementations. Existing business services keep ownership of prompt design, JSON schema selection, and application-specific fallback rules, but they stop talking to OpenAI directly.

This gives the product one clear mental model:

- users choose one provider in Settings
- the same provider powers analysis, resume generation, and long-answer generation
- provider differences stay hidden behind one stable API

## Current Constraints To Preserve

- `SettingsService` already persists one global `LlmSetting`
- the current web Settings page assumes one provider/model/key path
- analysis and resume generation already have working mock paths
- long-answer generation already has an approved `defaultAnswers -> manual review for high-risk -> fallback` safety rule
- final result validation already depends on local Zod parsing and should continue to do so

## Architecture

### Shared Provider Contract

Add a shared API-facing interface with two call shapes:

- `generateStructuredJson<T>()`
- `generateText()`

Each call should accept a common payload including:

- `model`
- `apiKey`
- `instructions`
- `promptPayload`
- `schemaName?`
- `jsonSchema?`
- `signal?`

Business services should not know vendor endpoints, auth headers, or response parsing details.

### Provider Implementations

#### OpenAI

- Continue using `POST https://api.openai.com/v1/responses`
- Structured JSON should continue using `text.format.type = "json_schema"`
- Plain text should use the same Responses API without JSON schema formatting
- Parse `output_text`

#### Gemini

- Use `POST https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent`
- Authenticate with `x-goog-api-key`
- Plain text should read from `candidates[0].content.parts[].text`
- Structured JSON should use:
  - `generationConfig.responseMimeType = "application/json"`
  - `generationConfig.responseJsonSchema = <schema>`

### Gateway / Registry

Add one API service that:

- reads the current provider name
- selects the right adapter
- throws an explicit error for unsupported providers

This service should be the only place that switches on `"openai"` vs `"gemini"`.

### Business-Service Responsibilities

#### `LlmAnalysisService`

Keep:

- analysis prompt
- analysis JSON schema
- mock mode fallback

Change:

- replace the inline OpenAI `fetch` with a gateway call to `generateStructuredJson`

#### `LlmResumeService`

Keep:

- resume prompt
- resume JSON schema
- mock mode fallback

Change:

- replace the inline OpenAI `fetch` with a gateway call to `generateStructuredJson`

#### `LongAnswerService`

Keep:

- `defaultAnswers` first
- explicit high-risk gating
- deterministic fallback for non-high-risk prompts when no model path is available or a model request fails

Change:

- route model-backed long answers through a new `LlmLongAnswerService`
- let that service call the same provider gateway with `generateText`

#### `LlmLongAnswerService`

New service responsible for:

- building a grounded long-answer prompt from job, profile, resume, and latest analysis context
- calling the provider gateway for text generation
- returning a concise answer string only

### Settings and Shared Types

The product remains globally single-provider.

Update `llmSettingsSchema` so:

- `provider` is restricted to `"openai" | "gemini"`
- `model` stays a free-form string
- `apiKey` stays a single free-form string

The Settings page should:

- change provider from a text field to a select
- keep model editable
- seed provider-specific recommended model defaults:
  - OpenAI: `gpt-5.4`
  - Gemini: `gemini-2.5-flash`
- update the API key placeholder based on provider

### Structured Output Strategy

Business services should continue owning one logical JSON schema per use case.

The provider layer should translate that schema into the vendor-specific request format, but the final output should still be validated locally with existing Zod schemas:

- `jobAnalysisResultSchema`
- `resumeContentSchema`

This keeps provider-side structured output as a helper, not the only correctness guard.

### Long-Answer Safety and Fallback Rules

The approved rules remain:

- matched `defaultAnswers` -> `decision = fill`, no model call
- unmatched high-risk prompt -> `decision = manual_review_required`, no model call
- unmatched non-high-risk prompt:
  - use provider-backed `LlmLongAnswerService` when provider settings are usable and not in mock mode
  - otherwise use deterministic fallback
  - if the provider call fails, use deterministic fallback

This means the adapter layer expands capability without weakening the human-in-the-loop boundary.

## Error Handling

### Unsupported Provider

- reject immediately with a clear server-side error
- do not silently fall back to OpenAI

### Analysis and Resume Generation

- provider request failures should still fail the operation
- mock mode should preserve the existing deterministic behavior

### Long Answers

- provider failures should not fail the entire long-answer generation request for non-high-risk prompts
- those prompts should fall back to deterministic copy
- high-risk prompts should never downgrade from manual review into generated output

## Testing Strategy

### Provider Layer

- OpenAI adapter text success
- OpenAI adapter structured JSON success
- OpenAI adapter non-OK response throws
- Gemini adapter text success
- Gemini adapter structured JSON success
- Gemini adapter malformed/empty response throws
- gateway routes to the correct provider

### Settings and Web

- provider field is a select with `OpenAI` and `Gemini`
- switching provider updates the recommended model and API-key placeholder
- invalid provider values are rejected by shared schema validation

### Business Services

- analysis uses the gateway instead of direct vendor fetch logic
- resume generation uses the gateway instead of direct vendor fetch logic
- mock modes continue to bypass provider calls
- long answers obey:
  - `defaultAnswers` first
  - high-risk manual review
  - provider-backed text generation for eligible prompts
  - deterministic fallback on provider unavailability or failure

### Worker Compatibility

- existing worker handling still accepts `decision = fill` plus `source = llm_generated`
- no protocol change is required beyond the source value and current decision field

## Rollout Order

1. tighten Settings/shared types for `openai | gemini`
2. add provider adapters and the gateway
3. migrate analysis and resume services to the gateway
4. add `LlmLongAnswerService`
5. upgrade `LongAnswerService` to use provider-backed generation for eligible prompts
6. add tests and final verification

## Risks and Mitigations

- **Risk:** Gemini structured-output behavior may differ from OpenAI enough to expose schema mismatches.
  - **Mitigation:** keep local Zod parsing as the final guard and keep schemas conservative.
- **Risk:** Switching provider could silently preserve a stale model name.
  - **Mitigation:** update the Settings UI to seed provider-specific recommended defaults when appropriate.
- **Risk:** Long-answer behavior could become less stable if provider calls are required.
  - **Mitigation:** preserve deterministic fallback for eligible non-high-risk prompts.
- **Risk:** Provider branching could leak back into business services.
  - **Mitigation:** keep provider selection centralized in the gateway/registry only.

## Acceptance Criteria

1. Settings supports exactly two providers: `OpenAI` and `Gemini`
2. Job analysis runs through the selected provider
3. Resume generation runs through the selected provider
4. Long-answer generation runs through the selected provider for eligible prompts
5. High-risk long-answer prompts still require matched `defaultAnswers` before auto-fill
6. Non-high-risk long answers prefer provider-backed generation and fall back conservatively on failure
7. Generated long answers are not written back into `defaultAnswers`
8. Existing review and worker protocols remain compatible
