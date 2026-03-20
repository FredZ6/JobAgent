# Open-Source Release Checklist

## Goal

Track the concrete steps needed to turn the current repo from a handoff/demo-quality MVP into a stronger public open-source project.

## Checklist

- [x] Add repository governance files: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue templates, and PR template
- [x] Rewrite `README.md` for external users, including screenshots/GIFs, quickstart, architecture, known limitations, and roadmap
- [x] Replace `prisma db push`-only setup with a proper Prisma migration workflow
- [x] Add GitHub Actions CI for install, typecheck, test, and build
- [x] Add at least one happy-path end-to-end test covering the main product loop
- [x] Upgrade `LongAnswerService` to `defaultAnswers -> LLM -> deterministic fallback`, while high-risk prompts still require saved defaults
- [x] Build complete `automation_sessions` UX: list, detail, and comparison surfaces
- [x] Reduce or remove the current Next.js build workarounds once a cleaner route is safe
- [x] Separate internal-worker auth from `JWT_SECRET` and harden public deployment defaults
- [ ] Add release packaging: `CHANGELOG`, version tags, support matrix, issue labels, and public-facing demo assets

## Current Focus

The next slice starts with item 10:

- add release packaging: `CHANGELOG`, version tags, support matrix, issue labels, and public-facing demo assets
- wrap the repo in enough public-facing release material to feel complete, not just functional

## Suggested Execution Order

1. item 3 Prisma migrations
2. item 4 GitHub Actions CI
3. item 5 happy-path end-to-end test
4. item 6 `LongAnswerService` LLM fallback upgrade
5. item 7 `automation_sessions` UX
6. item 1 governance files
7. item 2 README rewrite
8. item 9 internal auth hardening
9. item 8 Next.js build cleanup
10. item 10 release packaging
