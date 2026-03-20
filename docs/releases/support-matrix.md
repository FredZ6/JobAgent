# Support Matrix

This matrix captures the current support expectations for the `v0.1.0-alpha` release.

The goal is to be honest about what has been exercised and what is still best-effort.

## Runtime Matrix

| Surface | Status | Notes |
| --- | --- | --- |
| Docker Compose local stack | Supported | Primary recommended path for running the full app locally. Includes web, API, Redis, Postgres, Playwright worker, and optional Temporal worker. |
| Local `npm` development commands | Supported for contributors | Useful for focused package work, but a full app runtime still expects local services such as Postgres and Redis. |
| Prisma migration workflow | Supported | Committed migrations are applied with `npm run prisma:migrate:deploy`; seed data is manual. |
| Seeded demo data | Optional | Available via `npm run prisma:seed` after the stack is running. |

## LLM Provider Matrix

| Provider | Status | Notes |
| --- | --- | --- |
| OpenAI | Supported | Structured analysis, resume generation, and eligible long-answer generation share the active global provider setting. |
| Gemini | Supported | Structured analysis, resume generation, and eligible long-answer generation share the active global provider setting. |
| Multiple active providers at once | Not supported | The app uses one active provider, model, and key at a time. |

## Feature-Flag / Mode Matrix

| Mode | Status | Notes |
| --- | --- | --- |
| `JOB_IMPORT_MODE=mock` | Supported | Recommended for deterministic local demos or when target job pages are unavailable. |
| `JOB_IMPORT_MODE=live` | Supported on a best-effort basis | Depends on reachable target pages and importer heuristics. |
| `JOB_ANALYSIS_MODE=mock` | Supported | Best for no-token demos and UI exploration. |
| `JOB_ANALYSIS_MODE=live` | Supported | Uses the active LLM provider. |
| `JOB_RESUME_MODE=mock` | Supported | Best for no-token demos and UI exploration. |
| `JOB_RESUME_MODE=live` | Supported | Uses the active LLM provider. |
| Long-answer LLM generation | Supported with safety boundaries | Saved defaults still win first; high-risk prompts still require manual review if no saved answer matches. |

## Workflow / Automation Matrix

| Surface | Status | Notes |
| --- | --- | --- |
| Direct analyze / resume / prefill paths | Supported | Default local-first behavior when Temporal is disabled. |
| `TEMPORAL_ENABLED=false` | Supported | Simplest local runtime mode. |
| `TEMPORAL_ENABLED=true` | Supported for starter slices | Current coverage is intentionally limited to starter workflow slices rather than a fully expanded orchestration layer. |
| Playwright prefill | Best-effort | Works for common fields and common upload/dropzone cases, but not every ATS or control. |
| Final submit automation | Not supported | Final submit remains manual by design. |

## Platform Expectations

| Environment | Status | Notes |
| --- | --- | --- |
| macOS with Docker Desktop | Actively exercised | This is the most directly exercised local workflow today. |
| Linux with Docker / Docker Compose | Expected to work | CI covers code-level checks on Linux runners, but full local runtime validation is still lighter than the macOS path. |
| Windows | Best-effort | Not a primary tested path for this alpha; WSL/Docker Desktop setups are more likely to work than a fully native setup. |

## Recommendation

For the smoothest first experience with `v0.1.0-alpha`:

1. use Docker Compose
2. start in `mock` analysis and resume modes
3. seed demo data only if you want a pre-filled walkthrough
4. treat prefill as evidence-producing automation, not silent autopilot
