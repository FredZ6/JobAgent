# Recommended GitHub Labels

This file documents a lightweight label scheme for the public repository.

The goal is to make triage and release grouping consistent without needing a large maintenance process.

## Triage

| Label | Color | Use |
| --- | --- | --- |
| `needs-triage` | `#D4C5F9` | New issues that still need an initial pass. |
| `blocked` | `#B60205` | Work that cannot proceed because of an external or internal blocker. |
| `question` | `#5319E7` | Clarifications, usage questions, or issue threads that are not clearly bugs. |

## Type

| Label | Color | Use |
| --- | --- | --- |
| `bug` | `#D73A4A` | Something is broken or behaving incorrectly. |
| `feature` | `#0E8A16` | New capabilities or meaningful product enhancements. |
| `documentation` | `#0075CA` | README, docs, or onboarding work. |
| `maintenance` | `#FBCA04` | Refactors, CI, dependencies, build cleanup, or internal tooling work. |
| `security` | `#B60205` | Security-sensitive work. |

## Area

| Label | Color | Use |
| --- | --- | --- |
| `web` | `#1D76DB` | Next.js frontend issues and UI work. |
| `api` | `#0052CC` | Nest API work. |
| `worker-playwright` | `#5319E7` | Browser automation worker behavior. |
| `worker-temporal` | `#C5DEF5` | Temporal worker or orchestration slices. |
| `prefill` | `#F9D0C4` | Application prefill behavior and review evidence. |
| `workflow` | `#FBCA04` | Workflow runs, automation sessions, retries, and orchestration history. |
| `provider` | `#0E8A16` | OpenAI / Gemini provider behavior. |
| `prisma` | `#006B75` | Schema, migrations, or database setup. |

## Difficulty / Contribution Fit

| Label | Color | Use |
| --- | --- | --- |
| `good first issue` | `#7057FF` | Small, approachable issues for new contributors. |
| `help wanted` | `#008672` | Work where outside contributions are explicitly welcome. |

## Community / Release Hygiene

| Label | Color | Use |
| --- | --- | --- |
| `alpha-feedback` | `#C2E0C6` | Feedback specifically tied to the public alpha experience. |
| `release` | `#F4B400` | Release packaging, changelog, tags, or versioned docs. |
| `skip-changelog` | `#EDEDED` | Internal or low-signal changes that should not drive release summaries. |

## Suggested First Setup

If you want a simple initial label pass in GitHub, start with:

- `needs-triage`
- `bug`
- `feature`
- `documentation`
- `maintenance`
- `good first issue`
- `help wanted`
- `web`
- `api`
- `prefill`
- `workflow`
- `provider`
- `release`
