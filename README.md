# OpenClaw Job Agent

OpenClaw Job Agent is a local-first, human-in-the-loop job application copilot. It helps you move from a saved candidate profile to imported jobs, structured job analysis, tailored resume versions, best-effort application prefills, and manual submission review without pretending the final submit step can be safely automated away.

## Why This Project Exists

Most job application tooling swings between two extremes: manual copy-paste everywhere, or risky "one-click apply" promises that hide brittle automation behind optimistic UX.

This project takes a narrower path:

- keep candidate context structured
- use LLMs where they are helpful
- automate the repeatable parts
- surface logs, screenshots, and review states when automation is uncertain
- keep the final submit step manual on purpose

## What It Can Do

- Save candidate profile, experience, projects, and reusable default answers
- Import jobs by URL with live and mock-friendly paths
- Run structured job analysis with selectable LLM providers
- Generate tailored resume versions per job
- Export resume PDFs with `classic` and `modern` templates plus inline preview
- Run best-effort application prefills through Playwright
- Review field results, screenshots, worker logs, and approval state before submission
- Track workflow runs, retries, cancellations, and automation-session history
- Compare multiple prefill attempts for the same application

## Product Boundaries

This repo is intentionally opinionated about a few boundaries:

- Final application submit is still manual by design.
- Prefill is best-effort, not ATS-complete automation.
- Human review stays visible whenever the system is uncertain or a question is high-risk.
- The project is currently local-first and effectively single-user.
- LLM configuration is global: one active provider, model, and key at a time.

## Screenshots / Demo

Real screenshots and GIFs are still being prepared. The README now reserves space for the first public demo assets:

- Planned GIF: Dashboard overview and stage tracking
- Planned screenshot: Job detail with analysis, resume, and workflow-run surfaces
- Planned screenshot: Resume review with template switching and inline PDF preview
- Planned screenshot: Application review with automation sessions, screenshots, and worker logs

For a current text walkthrough, see [docs/closeout/2026-03-18-delivery-package.md](docs/closeout/2026-03-18-delivery-package.md).

## Quick Start

```bash
cp .env.example .env
docker compose up --build
```

This startup path:

- installs dependencies in the containers
- generates the Prisma client
- applies committed Prisma migrations with `npm run prisma:migrate:deploy`
- starts the local web, API, worker, Redis, and Postgres runtime

Then open:

- Web: [http://localhost:3000](http://localhost:3000)
- API health: [http://localhost:3001/health](http://localhost:3001/health)

If you want the optional seeded demo data after startup:

```bash
docker compose exec api npm run prisma:seed
```

Without that explicit seed step, the app starts with an empty database and expects you to create `Settings` and `Profile` data through the UI.

If your local Postgres volume came from the older `prisma db push` era, recreate that volume before relying on the committed migration history.

## Configuration

The project currently supports:

- `OpenAI`
- `Gemini`

You choose the active provider, model, and API key from the `Settings` page. The same setting is reused for:

- job analysis
- resume generation
- eligible long-answer generation

Useful environment toggles:

```env
JOB_IMPORT_MODE=live
JOB_ANALYSIS_MODE=mock
JOB_RESUME_MODE=mock
TEMPORAL_ENABLED=false
```

What they do:

- `JOB_IMPORT_MODE=mock` keeps imports deterministic when the target job page is unreachable.
- `JOB_ANALYSIS_MODE=mock` lets you exercise the UI without spending model tokens.
- `JOB_RESUME_MODE=mock` lets you generate resume versions without spending model tokens.
- `TEMPORAL_ENABLED=true` routes analyze, resume, and prefill through the Temporal worker instead of the direct API paths.

The prefill worker itself is always best-effort and does not require a separate feature flag.

## Walkthrough

If you want to see the full product loop quickly:

1. Open `Settings` and save the active LLM provider, model, and API key.
2. Open `Profile` and enter candidate details, experience facts, projects, and optional default answers.
3. Open `Jobs`, import a job URL, and open the imported record.
4. Run `Analyze job`, then `Generate resume`.
5. Open `Resume Review` to inspect the tailored content, switch PDF templates, and preview or download the PDF.
6. Return to Job Detail and run `Run prefill`.
7. Open `Application Review` to inspect field suggestions, screenshots, worker logs, and automation-session history.
8. Mark the application `approved_for_submit`, `needs_revision`, or `rejected`.
9. Open `Submission Review` for approved applications, complete the real application yourself, and record the result as `submitted` or `submit_failed`.
10. Use `Dashboard` and `Workflow runs` to inspect history, retries, cancellation, and recent activity across jobs.

## Architecture

Repo layout:

- `apps/web` - Next.js frontend
- `apps/api` - NestJS API
- `apps/worker-playwright` - best-effort browser automation worker
- `apps/worker-temporal` - Temporal worker for optional orchestration slices
- `packages/shared-types` - shared Zod schemas and shared application types
- `packages/config` - shared config helpers
- `prisma` - schema, migrations, and seed script

Runtime shape:

- PostgreSQL stores candidate, job, resume, application, and workflow state
- Redis supports the local runtime stack
- Playwright handles best-effort form interaction
- Temporal is optional and currently limited to starter slices for analysis, resume generation, and prefill

## Known Limitations

- Final submit is not automated.
- Prefill support is heuristic and will not handle every ATS or custom control.
- The project is not a multi-tenant production system yet.
- Temporal support exists, but only for the current starter workflow slices.
- The web build is currently stable but still carries some workaround-specific implementation that should be cleaned up later.
- Security and public-deployment hardening are still in progress for the internal worker trust boundary.

## Roadmap

Near-term priorities:

- tighten public-deployment and internal-worker auth defaults
- reduce or remove the current Next.js build workarounds once a cleaner route is safe
- add release packaging such as changelog, versioning guidance, and public demo assets

Broader product directions:

- richer open-source onboarding and docs
- better demo assets and walkthrough material
- safer, more transparent automation behavior rather than broader hidden automation

## Additional Docs

- [Delivery package and demo walkthrough](docs/closeout/2026-03-18-delivery-package.md)
- [Original roadmap](roadmap.md)
- [Original product spec](spec.md)
- [Original system design](system-design.md)
- [Open-source release checklist](docs/plans/2026-03-19-open-source-release-checklist.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for local setup expectations, verification commands, and contribution boundaries.

## Security

See [SECURITY.md](SECURITY.md) for private vulnerability reporting guidance.
