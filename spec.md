# OpenClaw Job Agent — Spec for AI Coding Agent

## 1. Objective
Build an MVP of a semi-automated AI job application assistant that helps a user:

- import a job posting by URL
- analyze job fit using one LLM provider
- generate a tailored resume version
- prefill application forms with browser automation
- stop before final submission for human approval
- track application status
- run locally with Docker Compose

---

## 2. Product Positioning
This is a **human-in-the-loop job application copilot**, not a fully autonomous mass-apply bot.

The system must preserve a human approval step before final submission.

---

## 3. In Scope
The MVP must include:

- user profile settings
- single LLM API key configuration
- single model name configuration
- job import by URL
- JD extraction and storage
- job analysis with structured output
- tailored resume generation
- resume PDF export
- application prefill for basic fields
- screenshot capture for review
- unresolved questions list
- human approval page
- application tracking dashboard
- local Docker deployment

---

## 4. Out of Scope
The MVP must not include:

- multi-provider LLM orchestration
- ChatGPT OAuth as an official auth method
- full automatic application submission without review
- CAPTCHA bypass
- recruiter email parsing
- email automation
- mass cross-platform scraping
- advanced recommendation engine
- multi-tenant organization support

---

## 5. Required Tech Stack
The implementation must use:

- **Frontend:** Next.js + React + TypeScript
- **Backend:** NestJS
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Cache:** Redis
- **Automation:** Playwright
- **Containers:** Docker + Docker Compose
- **Validation:** Zod

Temporal may be added after the core MVP, but the initial implementation should prioritize a working end-to-end flow first.

---

## 6. High-Level Architecture

```text
web (Next.js)
  -> api (NestJS)
     -> postgres
     -> redis
     -> local file storage
     -> llm provider
     -> playwright worker
```

The architecture must be organized as a monorepo.

---

## 7. Core Workflow
The system must support this core workflow:

```text
Import Job by URL
  -> Extract JD
  -> Analyze Job
  -> Generate Tailored Resume
  -> Prefill Application
  -> Human Review
  -> Track Application
```

---

## 8. Agent Responsibilities
These are business-role agents, not fully autonomous general-purpose coding agents.

### 8.1 Job Collector Agent
Responsibilities:
- accept job URL
- fetch job page
- extract title, company, location, description, apply URL if available
- store normalized job record

LLM usage:
- not required for normal operation

### 8.2 Job Analyzer Agent
Responsibilities:
- analyze JD against candidate profile
- produce structured match result

LLM usage:
- required

### 8.3 Resume Customizer Agent
Responsibilities:
- generate a tailored resume version from existing profile and projects
- must not invent experience
- export resume to PDF

LLM usage:
- required

### 8.4 Application Pre-fill Agent
Responsibilities:
- open apply page
- fill basic fields
- upload resume
- capture screenshot
- return unresolved questions
- stop before final submission

LLM usage:
- optional for open-ended answers only

### 8.5 Application Tracker Agent
Responsibilities:
- store application status
- show timeline and dashboard views

LLM usage:
- not required

---

## 9. Mandatory Constraints
The coding agent must follow these constraints:

1. Use a monorepo structure.
2. Keep web, api, and playwright worker logically separated.
3. First version must support exactly one LLM API key configuration path.
4. Do not implement ChatGPT OAuth as a production feature.
5. Do not implement fully automatic final submission.
6. Do not fabricate resume content.
7. Optimize for local Docker setup and open-source usability.
8. Prefer clear module boundaries over premature abstraction.

---

## 10. Docker Requirement
The project must be runnable locally with a minimal setup.

Expected developer flow:

```bash
cp .env.example .env
# fill LLM_API_KEY
docker compose up --build
```

The system should aim to make the LLM API key the only value a normal evaluator must customize for a local demo.

---

## 11. Required Services
The repository must include these services:

- `web`
- `api`
- `postgres`
- `redis`
- `worker-playwright`

Optional later:
- `worker-temporal`
- `temporal`
- `temporal-ui`

---

## 12. Environment Variables
At minimum, support these variables:

```env
LLM_PROVIDER=openai
LLM_MODEL=gpt-5.4
LLM_API_KEY=

DATABASE_URL=postgresql://postgres:postgres@postgres:5432/job_agent
REDIS_URL=redis://redis:6379
JWT_SECRET=dev-secret
FILE_STORAGE_PATH=/app/storage

APP_URL=http://localhost:3000
API_URL=http://localhost:3001
```

The coding agent should also generate a `.env.example` file.

---

## 13. Repository Structure
Use a structure close to:

```text
openclaw-job-agent/
├─ apps/
│  ├─ web/
│  ├─ api/
│  ├─ worker-playwright/
│  └─ worker-temporal/
├─ packages/
│  ├─ shared-types/
│  ├─ prompts/
│  ├─ ui/
│  └─ config/
├─ prisma/
├─ docs/
└─ docker-compose.yml
```

If Temporal is not implemented in the first coding pass, the `worker-temporal` app may be scaffolded but not fully wired.

---

## 14. Core Entities
The coding agent must model at least these entities.

### 14.1 users
Fields:
- id
- email
- name
- created_at
- updated_at

### 14.2 candidate_profiles
Fields:
- id
- user_id
- full_name
- email
- phone
- location
- linkedin_url
- github_url
- portfolio_url
- work_authorization
- master_resume_json
- default_answers_json
- created_at
- updated_at

### 14.3 jobs
Fields:
- id
- source
- title
- company
- location
- job_url
- apply_url
- description_raw
- description_clean
- created_at
- updated_at

### 14.4 job_analysis
Fields:
- id
- job_id
- user_id
- match_score
- fit_level
- required_skills_json
- missing_skills_json
- red_flags_json
- summary
- analysis_json
- created_at

### 14.5 resume_versions
Fields:
- id
- job_id
- user_id
- version_name
- resume_json
- pdf_url
- diff_summary
- created_at

### 14.6 applications
Fields:
- id
- job_id
- user_id
- resume_version_id
- status
- submitted_at
- notes
- created_at
- updated_at

### 14.7 automation_sessions
Fields:
- id
- application_id
- status
- screenshot_url
- unresolved_questions_json
- created_at
- updated_at

---

## 15. API Requirements
The API must expose endpoints equivalent to:

### Jobs
- `POST /jobs/import-by-url`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/analyze`

### Resume
- `POST /jobs/:id/generate-resume`
- `GET /jobs/:id/resume-versions`
- `GET /resume-versions/:id`

### Application
- `POST /jobs/:id/prefill`
- `GET /applications`
- `GET /applications/:id`
- `POST /applications/:id/submit`

### Profile
- `GET /profile`
- `POST /profile`
- `PATCH /profile/default-answers`

### Settings
- `GET /settings/llm`
- `PATCH /settings/llm`

---

## 16. Frontend Requirements
The web app must provide these pages.

### 16.1 Jobs Dashboard
Must show:
- job title
- company
- location
- analysis status
- actions

### 16.2 Job Detail Page
Must show:
- original JD
- match score
- required skills
- missing skills
- red flags
- summary
- buttons for analyze and resume generation

### 16.3 Resume Review Page
Must show:
- generated tailored resume
- diff summary
- PDF download link

### 16.4 Application Review Page
Must show:
- screenshot
- autofilled fields
- unresolved questions
- human approval action

### 16.5 Tracker Dashboard
Must show:
- application list
- application status
- filter or search controls if practical

### 16.6 Settings Page
Must show:
- user profile fields
- default answers
- LLM provider, model, and API key config

---

## 17. LLM Behavior Requirements
The coding agent must implement structured prompting.

### 17.1 Job Analysis Output
The LLM output for job analysis must be validated against a schema with fields similar to:

```json
{
  "matchScore": 82,
  "fitLevel": "strong",
  "requiredSkills": ["TypeScript", "Node.js"],
  "missingSkills": ["Kubernetes"],
  "redFlags": ["Requires 5+ years experience"],
  "summary": "Good fit for a junior-to-mid backend role."
}
```

### 17.2 Resume Customization Rules
The LLM must:
- rewrite or reorder based on existing experience
- not invent new companies, projects, achievements, or years of experience
- produce output in a structured resume format suitable for PDF rendering

### 17.3 Prefill Answer Assistance
The LLM may generate draft answers for open-ended application questions, but the result must be surfaced for human review.

---

## 18. Non-Functional Requirements
The implementation should satisfy:

### Usability
- local startup should be straightforward
- documentation should be enough for a first-time evaluator

### Maintainability
- modules should be separated by concern
- schemas and DTOs should be centralized where practical
- prompts should live in a dedicated package or folder

### Observability
- log import events
- log analysis events
- log prefill runs
- store screenshots for prefill review

### Safety
- keep a human approval step
- do not misrepresent generated content as verified truth
- keep sensitive values out of source control

---

## 19. Milestones

### Milestone 1: Scaffolding and Docker
Deliver:
- monorepo
- base apps
- docker-compose
- `.env.example`
- health checks

Acceptance:
- project starts locally with Docker Compose

### Milestone 2: Profile and Settings
Deliver:
- candidate profile CRUD
- LLM settings storage
- settings page

Acceptance:
- user can save profile and one API key

### Milestone 3: Job Import
Deliver:
- import-by-url flow
- jobs table and list view
- job detail page

Acceptance:
- valid job URL becomes a stored job record

### Milestone 4: Job Analysis
Deliver:
- analysis prompt
- schema validation
- analysis UI

Acceptance:
- user can analyze a job and see structured results

### Milestone 5: Resume Generation
Deliver:
- tailored resume flow
- PDF export
- resume review page

Acceptance:
- user can generate and download a tailored resume

### Milestone 6: Prefill MVP
Deliver:
- playwright worker
- prefill API
- screenshot review

Acceptance:
- user can run prefill and inspect results before submission

### Milestone 7: Tracking
Deliver:
- application records
- tracker dashboard

Acceptance:
- user can view application history and statuses

### Milestone 8: Workflow Engine
Deliver:
- optional Temporal integration
- retry and pause/resume support

Acceptance:
- workflows become resumable and more durable

---

## 20. Acceptance Criteria for MVP
The MVP is complete only if all of the following are true:

1. A user can start the system locally with Docker.
2. A user can configure one LLM API key.
3. A user can import a job by URL.
4. A user can run job analysis and see structured output.
5. A user can generate a tailored resume PDF.
6. A user can run a prefill flow and review a screenshot.
7. The system stops before final submission.
8. A user can view application tracking data.
9. The repository includes a clear README and `.env.example`.

---

## 21. Explicit Non-Goals for the Coding Agent
The coding agent must not spend effort on these unless explicitly requested later:

- supporting multiple LLM providers in the UI
- implementing full auto-submit
- building a CAPTCHA solver
- adding recruiter email automation
- building a production-grade cloud deployment
- adding ChatGPT OAuth login for LLM usage

---

## 22. Final Instruction to the Coding Agent
Prioritize a working, clear, open-source-friendly MVP over sophistication.

When choices conflict, prefer:
- simpler setup
- clearer architecture
- fewer moving parts
- stronger boundaries
- human approval over risky automation
