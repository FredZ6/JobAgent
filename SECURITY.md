# Security Policy

## Reporting a Vulnerability

Please do **not** report security vulnerabilities through public GitHub issues.

Instead, report them privately to the project maintainer through GitHub:
[github.com/FredZ6](https://github.com/FredZ6)

When possible, include:

- a clear description of the issue
- the affected area or file path
- reproduction steps or proof of concept
- impact assessment
- any suggested mitigation

We will review reports on a best-effort basis and aim to acknowledge valid
reports promptly.

## Supported Versions

This project is currently pre-1.0 and evolving quickly. Security fixes are
best-effort and are most likely to land on the latest code in the default
branch.

Older local setups, stale Docker volumes, and unmaintained forks may not
receive backported fixes.

## Scope Notes

Rolecraft is designed as a local-first, single-user MVP. Even so,
please report vulnerabilities involving:

- credential or secret handling
- internal worker/API trust boundaries
- unintended exposure of local files or screenshots
- unsafe automation behavior
- dependency-level security issues that materially affect local deployment

If you are unsure whether something is security-sensitive, err on the side of
reporting it privately first.
