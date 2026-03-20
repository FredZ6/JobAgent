# Long-Answer Job Focus Design

## Goal

Improve generated long-answer quality so non-high-risk answers feel more job-aware, with responses that first acknowledge what the role is trying to do and then connect the candidate to the most relevant requirements.

## Current State

The current long-answer path already follows the correct high-level safety flow:

- `defaultAnswers` match -> use the saved answer
- high-risk prompt without a saved default -> `manual_review_required`
- non-high-risk prompt with provider access -> call `LlmLongAnswerService`
- missing provider access or provider failure -> deterministic fallback

The main weakness is not control flow. It is answer quality. The LLM prompt currently receives only broad job and candidate context:

- raw `job.description`
- `resumeHeadline`
- `profileSummary`
- optional `analysisSummary`

That leaves too much work to the model. It often knows the job title and description, but it is not guided to first answer “what this job is about.”

## Desired Outcome

Generated long answers should:

- prioritize the role mission and core responsibilities first
- then connect the candidate to the most relevant requirements
- stay concise: `2-4` sentences, usually `3`
- remain truthful and avoid unsupported claims
- preserve the existing safety rules and fallbacks

## Recommended Approach

Use a lightweight local `jobFocus` extraction step plus a stronger long-answer prompt.

### Why this approach

- It materially improves prompt quality without adding another LLM hop.
- It keeps the current architecture intact.
- It is deterministic, cheap, and easy to test.
- It preserves the existing `defaultAnswers -> manual review / LLM / fallback` decision flow.

## Design

### 1. Add a local `jobFocus` extraction step

Add a small internal helper in the long-answer slice that parses `job.description` and returns:

- `topResponsibilities: string[]`
- `topRequirements: string[]`

The extraction should be best-effort and deterministic:

- split the job description into candidate lines/sentences
- prioritize lines under or near headings like:
  - `Responsibilities`
  - `What you'll do`
  - `Requirements`
  - `Qualifications`
- also allow fallback keyword matching when there is no explicit section
- cap both arrays at `3`
- return empty arrays when there is not enough signal

This helper is not a new shared platform component. It should stay close to the long-answer workflow until there is a stronger reuse case.

### 2. Expand the long-answer LLM input

`LlmLongAnswerService.generate(...)` should receive richer job context:

- `jobCore`
  - `title`
  - `company`
  - `location`
  - `description`
- `jobFocus`
  - `topResponsibilities`
  - `topRequirements`
- `analysis`
  - `summary`
  - `requiredSkills`
  - `missingSkills`
  - `redFlags`
- `candidate`
  - `resumeHeadline`
  - `profileSummary`

This lets the prompt emphasize the job’s actual work rather than forcing the model to infer everything from the raw description.

### 3. Rework the long-answer prompt

Update the instructions so answers follow this order:

1. First explain what the role is trying to do, using `topResponsibilities` when available.
2. Then connect the candidate to the most relevant requirements or skills.
3. End with a brief, grounded motivation or fit statement.

Style constraints:

- `2-4` sentences, aiming for `3`
- natural, professional, concise
- no bullet lists
- no invented facts, years, projects, certifications, sponsorship status, or salary details
- do not restate the entire JD
- do not use exaggerated language like “perfect fit”

### 4. Keep the current safety and fallback flow

This change must not alter the control rules:

- saved `defaultAnswers` still win first
- high-risk prompts still require saved defaults
- non-high-risk prompts still prefer the selected provider
- provider failures still fall back to deterministic output
- generated answers still remain ephemeral and are not written back into `defaultAnswers`

## Testing Strategy

### Unit tests for `jobFocus` extraction

Cover:

- explicit `Responsibilities` sections
- explicit `Requirements` or `Qualifications` sections
- messy freeform descriptions with only keyword signals
- short/noisy descriptions that should safely return empty arrays
- max length behavior (`<= 3` per category)

### Long-answer service tests

Cover:

- non-high-risk LLM generation receives extracted `jobFocus`
- payload sent to the LLM includes:
  - `topResponsibilities`
  - `topRequirements`
  - `requiredSkills`
  - `missingSkills`
  - `redFlags`
- prompt instructions explicitly prioritize:
  - role mission / responsibilities first
  - requirement alignment second
  - short closing sentence last

### Regression coverage

Keep existing coverage for:

- `defaultAnswers` short-circuit
- high-risk manual review handling
- fallback behavior on missing config or provider failure

## Risks

- Heuristic extraction will not perfectly classify every JD format.
- Overly aggressive keyword rules could surface noisy lines.
- Stronger prompt constraints may improve focus but can also slightly reduce stylistic variety.

These are acceptable for this iteration because the goal is better role alignment, not perfect JD structuring.

## Acceptance Criteria

- Long-answer generation receives `jobFocus` with extracted responsibilities and requirements.
- Prompt instructions now explicitly prioritize “what the role does” before candidate alignment.
- Generated answers stay in the `2-4` sentence range by instruction, targeting `3`.
- Existing safety boundaries remain unchanged.
- Tests prove the new job-focused context is actually reaching the LLM path.
