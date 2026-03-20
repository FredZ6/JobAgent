# Open-Source Release Checklist

## Goal

Track the concrete steps needed to turn the current repo from a handoff/demo-quality MVP into a stronger public open-source project.

## Checklist

- [ ] Add repository governance files: `LICENSE`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, issue templates, and PR template
- [ ] Rewrite `README.md` for external users, including screenshots/GIFs, quickstart, architecture, known limitations, and roadmap
- [ ] Replace `prisma db push`-only setup with a proper Prisma migration workflow
- [x] Add GitHub Actions CI for install, typecheck, test, and build
- [ ] Add at least one happy-path end-to-end test covering the main product loop
- [ ] Upgrade `LongAnswerService` to `defaultAnswers -> LLM -> deterministic fallback`, while high-risk prompts still require saved defaults
- [ ] Build complete `automation_sessions` UX: list, detail, and comparison surfaces
- [ ] Reduce or remove the current Next.js build workarounds once a cleaner route is safe
- [ ] Separate internal-worker auth from `JWT_SECRET` and harden public deployment defaults
- [ ] Add release packaging: `CHANGELOG`, version tags, support matrix, issue labels, and public-facing demo assets

## Current Focus

The active slice starts with item 6:

- add a real `defaultAnswers` editor to the Profile page
- tighten high-risk long-answer handling so unmatched prompts require manual review
- use that as the first step toward the later LLM-backed answer-generation path

## Suggested Execution Order

1. item 6 current slice: default-answer editing and high-risk manual review
2. item 3 Prisma migrations
3. item 4 GitHub Actions CI
4. item 5 happy-path end-to-end test
5. item 7 `automation_sessions` UX
6. item 8 Next.js build cleanup
7. item 9 internal auth hardening
8. item 1 governance files
9. item 2 README rewrite
10. item 10 release packaging
