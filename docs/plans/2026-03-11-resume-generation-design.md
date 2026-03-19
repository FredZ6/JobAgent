# OpenClaw Job Agent Phase-Two Design

## Goal
Extend the MVP with richer frontend interaction states and structured resume generation that stays honest to the saved candidate profile.

## Scope

### In Scope
- Richer frontend form states for Settings, Profile, Jobs, and Job Detail
- Candidate profile expansion to support structured resume source facts
- Structured resume generation per job
- Resume version persistence
- Resume Review page
- Resume version listing from job detail

### Out of Scope
- PDF export
- Resume template layouting
- Rich inline resume editor
- Final application upload integration
- Education/certifications beyond light placeholders

## Architecture

### Data Source Strategy
- Reuse `candidate_profiles` as the single source of resume facts.
- Extend the profile with structured experience and project libraries.
- Persist generated outputs in a new `resume_versions` table.

### UX Strategy
- Make page states legible: loading, dirty, invalid, saving, success, and failure.
- Keep the main orchestration in `Job Detail`, where the user can analyze a role and then generate a resume from that context.
- Use a dedicated Resume Review page for the generated output.

## Data Model

### `candidate_profiles` additions
- `experienceLibrary`
- `projectLibrary`

Each experience entry should carry:
- `role`
- `company`
- `startDate`
- `endDate`
- `bullets`

Each project entry should carry:
- `name`
- `tagline`
- `bullets`
- `skills`

### `resume_versions`
- `id`
- `jobId`
- `sourceProfileId`
- `status`
- `headline`
- `professionalSummary`
- `skills`
- `experienceSections`
- `projectSections`
- `changeSummary`
- `structuredContent`
- `errorMessage`
- `createdAt`
- `updatedAt`

## Resume Output Shape
- `headline`
- `professionalSummary`
- `keySkills`
- `experience`
  - `title`
  - `company`
  - `bullets`
- `projects`
  - `name`
  - `tagline`
  - `bullets`
- `changeSummary`
  - `highlightedStrengths`
  - `deemphasizedItems`
  - `notes`

## API Design
- `POST /jobs/:id/generate-resume`
- `GET /jobs/:id/resume-versions`
- `GET /resume-versions/:id`

### Generation Inputs
- candidate profile
- saved experience library
- saved project library
- job record
- latest job analysis if present

### Constraints
- Never invent experience
- Only re-rank, rephrase, and emphasize existing facts
- Return conservative output when input detail is weak

## UI Flow

### Settings and Profile
- Show unsaved changes while form state differs from last saved state
- Disable submit when the form is invalid or already saving
- Show save success and failure messages distinctly

### Jobs
- After successful import, route directly to the new job detail page
- Preserve a visible import error state

### Job Detail
- Keep analyze and generate actions independent
- Show separate pending and error states for analysis vs. resume generation
- Show latest analysis summary and latest resume version summary together
- List saved resume versions with links into review

### Resume Review
- Show loading, empty, failure, and completed states
- Render headline, summary, skills, experience, projects, and change summary

## Acceptance Criteria
1. Settings and Profile show unsaved state and block invalid submission.
2. Jobs import routes the user directly to the imported job detail page.
3. `POST /jobs/:id/generate-resume` stores a structured resume version.
4. `GET /jobs/:id/resume-versions` and `GET /resume-versions/:id` return persisted resume data.
5. Resume Review renders the generated structured content and change summary.
6. Generated resumes stay grounded in saved profile facts and do not fabricate experience.

## Notes
- PDF export stays deferred to a later phase.
- The same mock/live pattern used for analysis should be reused for resume generation.
