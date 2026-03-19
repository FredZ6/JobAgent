# OpenClaw Job Agent MVP Bootstrap Design

## Goal
Build the first runnable slice of OpenClaw Job Agent as a local monorepo where `Settings/Profile + Job import + Job analysis` work end to end.

## Scope

### In Scope
- Monorepo scaffold
- `web`, `api`, `postgres`, `redis` startup via Docker Compose
- Settings storage for a single LLM provider, model, and API key
- Candidate profile storage and editing
- Job import by URL
- Job detail view with imported JD data
- Manual job analysis trigger with structured result rendering

### Out of Scope
- Resume generation
- PDF export
- Application prefill
- Human approval submission flow
- Tracker dashboard
- Temporal workflows
- Runnable `worker-playwright` integration

## Architecture

### Repository Shape

```text
openclaw-job-agent/
├─ apps/
│  ├─ web/
│  ├─ api/
│  └─ worker-playwright/
├─ packages/
│  ├─ shared-types/
│  └─ config/
├─ prisma/
├─ docs/
├─ docker-compose.yml
├─ package.json
├─ pnpm-workspace.yaml
└─ .env.example
```

### Module Boundaries
- `apps/web`: Next.js UI for settings, profile, jobs list, and job detail.
- `apps/api`: NestJS API, Prisma data access, job import, and LLM-backed analysis.
- `apps/worker-playwright`: placeholder app only, not part of round-one acceptance.
- `packages/shared-types`: shared Zod schemas and TypeScript DTOs.
- `packages/config`: shared environment parsing and base configuration.

## Data Model

### `candidate_profiles`
- `id`
- `fullName`
- `email`
- `phone`
- `linkedinUrl`
- `githubUrl`
- `location`
- `workAuthorization`
- `summary`
- `skills`
- `defaultAnswers`
- timestamps

### `llm_settings`
- `id`
- `provider`
- `model`
- `apiKey`
- `isConfigured`
- timestamps

### `jobs`
- `id`
- `sourceUrl`
- `applyUrl`
- `title`
- `company`
- `location`
- `description`
- `rawText`
- `importStatus`
- timestamps

### `job_analyses`
- `id`
- `jobId`
- `matchScore`
- `summary`
- `requiredSkills`
- `missingSkills`
- `redFlags`
- `structuredResult`
- `status`
- `errorMessage`
- timestamps

## API Design
- `GET /profile`
- `PUT /profile`
- `GET /settings/llm`
- `PUT /settings/llm`
- `POST /jobs/import-by-url`
- `GET /jobs`
- `GET /jobs/:id`
- `POST /jobs/:id/analyze`

### Boundary Rules
- Job import only fetches and stores job data.
- Job analysis is triggered separately for retryability and easier debugging.
- The product assumes a single local user in round one.

## UI Flow
- `Settings`: provider, model, API key
- `Profile`: candidate details and skills
- `Jobs`: import form plus list of imported jobs
- `Job Detail`: imported JD, import metadata, analyze action, analysis result

## Acceptance Criteria
1. `docker compose up --build` starts `web`, `api`, `postgres`, and `redis`.
2. Settings and profile can be saved from the UI and persist in the database.
3. A job URL can be imported into a stored job record and viewed in the UI.
4. Job analysis can be triggered manually and returns a validated structured result.
5. The job detail page renders `matchScore`, `summary`, `requiredSkills`, `missingSkills`, and `redFlags`.

## Deferred Decisions
- Proper encryption for stored API keys
- Authentication and multi-user support
- Temporal workflow orchestration
- Real browser automation integration

## Notes
- The workspace is not currently a git repository, so the design doc cannot be committed yet.
