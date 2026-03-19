# Default Answers Editor and High-Risk Manual-Review Design

## Goal

Make `defaultAnswers` genuinely usable by:

1. adding a non-technical `Question / Answer` editor to the Profile page
2. changing long-answer generation so high-risk questions are only auto-filled when a saved default answer matches

This should improve the current prefill flow without changing the underlying `CandidateProfile.defaultAnswers` storage format or weakening the human-in-the-loop safety boundary.

## Scope

- Keep `CandidateProfile.defaultAnswers` stored as `Record<string, string>`
- Add a dedicated `Default answers` editor to the Profile page
- Show example questions in the empty state without seeding real values automatically
- Normalize and validate edited rows before saving
- Upgrade internal long-answer generation so high-risk prompts that do not match a saved default answer return `manual_review_required`
- Ensure the worker does not auto-fill those blocked high-risk prompts and instead records reviewable evidence
- Document the next ten open-source-hardening steps in a repo file so they are no longer trapped in chat history

## Non-Goals

- Replacing `defaultAnswers` with a structured category/tag model
- Auto-generating default answers for the user
- Solving all long-answer quality concerns in this slice
- Reworking the entire Application Review page
- Shipping the full open-source hardening roadmap in this same change

## Approach Options

### Option 1: Lightweight UI + Protocol Upgrade

- Keep persistence as `Record<string, string>`
- Convert to row state only inside the Profile page
- Expand the internal long-answer response so the worker can distinguish auto-fillable answers from manual-review-required answers

Recommended because:
- it matches the current schema and API shape
- it lands the missing user-facing capability quickly
- it safely enforces the new high-risk rule without a broad model rewrite

### Option 2: Structured Default-Answer Model

- Replace `Record<string, string>` with an array of objects containing question, answer, category, and risk metadata

Why not now:
- it would force schema, API, frontend, and compatibility changes together
- it is more than this slice needs

### Option 3: UI Only

- Add the editor but leave long-answer generation behavior unchanged

Why not now:
- it would leave the unsafe "hard-code a fallback for high-risk prompts" behavior in place
- it would not satisfy the newly agreed rule

## Recommended Design

Use **Option 1: Lightweight UI + Protocol Upgrade**.

The Profile page becomes the place where users maintain a reusable library of common application answers. The saved shape remains a simple `Record<string, string>` so existing persistence and worker payload behavior stay intact.

The internal long-answer API gains a clearer contract:

- `fill`: an answer is available and safe to auto-fill
- `manual_review_required`: do not auto-fill; surface the prompt and the reason in review

This lets the Playwright worker stay honest:

- use saved defaults when present
- never invent or force-fill high-risk prompts when no saved answer exists

## Current Constraints To Preserve

- `defaultAnswers` already lives on `CandidateProfile`
- `ProfileController` and `ProfileService` already save and load that field
- the current frontend fetch/save path already carries `defaultAnswers`
- the worker already calls `POST /internal/applications/:id/generate-long-answers`
- the current long-answer flow already records `FieldResult` evidence per prompt

## Architecture

### Persistence Model

Do not change Prisma or shared profile schema for this slice.

Keep:

- `CandidateProfile.defaultAnswers: Json`
- shared type: `Record<string, string>`

The Profile page will own the row-based editing state locally and convert it back to an object before saving.

### Profile Page Data Flow

When loading:

- fetch `defaultAnswers` as an object
- transform it into editable rows:
  - `id`
  - `question`
  - `answer`

When saving:

- trim whitespace
- reject partial rows
- reject duplicate normalized questions
- convert rows back into `Record<string, string>`
- send the existing profile payload shape to `PUT /profile`

### Empty State

If there are no saved rows:

- show helper copy explaining what default answers are for
- show a small list of suggested example questions
- keep the actual form empty until the user clicks `Add answer`

This keeps the UX friendly without silently writing content into the profile.

### High-Risk Long-Answer Policy

High-risk prompts should only be auto-filled from saved defaults.

Rule:

- if `defaultAnswers` matches a high-risk prompt: return `fill`
- if no saved answer matches a high-risk prompt: return `manual_review_required`
- if a prompt is not high-risk and no saved answer matches: keep the existing non-LLM fallback path for now

This preserves current non-high-risk behavior while tightening the safety boundary where it matters most.

### High-Risk Detection

The first version should use a conservative keyword-based classifier against normalized:

- `questionText`
- `fieldLabel`
- `fieldName`
- `hints`

Recommended categories:

- sponsorship / visa / work authorization
- salary / compensation / pay expectation
- notice period / start date / availability
- relocation
- legal declaration / certification / attestation / agreement

The service should also return the matched category when manual review is required so review surfaces can explain why the answer was blocked.

### Internal Long-Answer Response Shape

The worker-facing response should become explicit per question, for example:

```json
{
  "fieldName": "salary_expectation",
  "questionText": "What is your salary expectation?",
  "decision": "manual_review_required",
  "source": "manual_review_required",
  "manualReason": "high_risk_question_missing_default_answer",
  "matchedRiskCategory": "salary_expectation"
}
```

or:

```json
{
  "fieldName": "why_company",
  "questionText": "Why do you want to work here?",
  "decision": "fill",
  "answer": "I enjoy building reliable internal platforms with thoughtful teams.",
  "source": "default_answer_match"
}
```

### Worker Behavior

When the worker receives:

- `decision=fill`: auto-fill the prompt and record a filled `FieldResult`
- `decision=manual_review_required`: do not touch the field; record:
  - `fieldType: "long_text"`
  - `status: "unhandled"`
  - `source: "manual_review_required"`
  - `failureReason` set to the returned manual-review reason

This keeps browser behavior aligned with the approved product rule.

## UI Design

### Placement

Add a new `Default answers` section to the existing Profile page, below the experience and project editors and above the save row.

### Editing Model

Each row contains:

- `Question`
- `Answer`
- `Remove`

Controls:

- `Add answer` button

### Validation

Before save:

- ignore fully empty rows
- reject rows missing only `question` or only `answer`
- reject duplicate normalized questions

Error messages should stay local and plain-language so non-technical users can correct them quickly.

## Testing Strategy

### Frontend

Add tests that cover:

- object-to-row hydration
- row add/remove behavior
- validation for partial rows
- validation for duplicate questions
- row-to-object serialization on save
- empty-state helper copy without auto-populated values

### API

Add tests that cover:

- matched defaults for normal prompts
- matched defaults for high-risk prompts
- manual-review-required results for unmatched high-risk prompts
- unchanged fallback behavior for unmatched non-high-risk prompts

### Worker

Add tests that cover:

- `manual_review_required` responses do not call fill helpers
- those blocked prompts become `status: "unhandled"` field results with the expected source/reason

## Acceptance Criteria

- Users can add, remove, and save default answers from the Profile page
- Saved answers remain persisted as the existing profile payload shape
- High-risk prompts without a saved default answer are never auto-filled
- Review evidence clearly shows which high-risk prompts require manual follow-up

