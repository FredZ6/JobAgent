# Changelog

All notable changes to this project will be documented in this file.

This repository is currently pre-1.0 and uses release tags such as `v0.1.0-alpha` to mark public milestones.

## [v0.1.0-alpha] - 2026-03-20

### Added

- Local-first job-application workflow covering profile setup, job import, structured analysis, tailored resume generation, best-effort prefill, review, and manual submission recording
- Dual-provider LLM support for `OpenAI` and `Gemini`
- Resume PDF export with multiple templates and inline preview
- Automation-session history, detail, and comparison views for application prefills
- Governance files, GitHub issue templates, PR template, and baseline GitHub Actions CI
- Committed Prisma migration workflow and an opt-in happy-path API end-to-end test

### Changed

- Reworked the README and repository docs around public open-source onboarding instead of internal handoff framing
- Separated internal worker authentication from `JWT_SECRET` with a dedicated `INTERNAL_API_TOKEN` path for real deployments
- Reduced the most superficial Next.js `force-dynamic` wrappers while keeping the existing fallback stabilizers in place
- Improved long-answer generation to prioritize saved defaults, preserve high-risk manual review boundaries, and better focus responses on what the job is actually asking for

### Known Limitations

- Final application submit remains manual by design
- Prefill is still best-effort and will not handle every ATS or custom control
- The project remains effectively single-user and local-first
- Temporal support exists, but only for the current starter slices
- Demo screenshots and GIF assets are planned but not yet checked in
