# Contributing to Rolecraft

Thanks for taking the time to contribute.

This project is a local-first, human-in-the-loop job application copilot. The
repo is still pre-1.0, so the most helpful contributions are the ones that keep
the product honest, testable, and easy to run locally.

## Good First Contributions

- Bug fixes with a focused reproduction
- Documentation improvements
- Test coverage improvements
- Small UI/UX fixes
- Safer automation behavior
- Provider/runtime compatibility fixes

For larger changes, please open an issue or discussion first so we can align on
scope before you spend time building.

## Project Boundaries That Matter

Please preserve these product boundaries unless the change explicitly proposes
to move them:

- Do not automate the final application submit action.
- Do not hide automation failures behind optimistic success states.
- Keep human review visible when behavior is uncertain or high-risk.
- Be explicit when a change affects `mock/live` behavior, provider choice, or
  `TEMPORAL_ENABLED` execution paths.

## Local Setup

The quickest way to run the project locally is:

```bash
cp .env.example .env
docker compose up --build
```

Then open:

- Web: `http://localhost:3000`
- API health: `http://localhost:3001/health`

If you want the optional demo data after startup, run:

```bash
docker compose exec api npm run prisma:seed
```

## Development Notes

- Prisma migrations are committed. Use `npm run prisma:migrate` when you change
  `prisma/schema.prisma`.
- Use `npm run prisma:migrate:deploy` in deploy-like environments where the
  repo should only apply committed migrations.
- The repo uses npm workspaces; root scripts fan out to the app/package
  workspaces.

## Before Opening a Pull Request

Run the minimum verification that matches your change. For most code changes,
that means:

```bash
npm run prisma:generate
npm test
npm run build
```

If your change touches runtime flows, also include any focused command you used
to verify it, such as a specific API/web test or a Docker-based smoke run.

## Pull Request Expectations

Please keep PRs focused and easy to review.

A good PR usually includes:

- a short summary of what changed
- why the change was needed
- how you tested it
- any risks, limitations, or follow-up work

If the change affects user-facing automation behavior, call that out directly in
the PR description.

## Issues

When filing a bug, include the runtime context that matters for this repo:

- Docker Compose vs local npm runtime
- `JOB_IMPORT_MODE`
- `JOB_ANALYSIS_MODE`
- `JOB_RESUME_MODE`
- `TEMPORAL_ENABLED`
- active LLM provider, if relevant

That context usually makes the difference between a fast fix and a blind guess.
