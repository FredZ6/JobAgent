# GitHub Release Template

Use this template when drafting a GitHub Release for Rolecraft.

For the first public alpha, the tag should be:

```text
v0.1.0-alpha
```

## Template

````md
## Summary

<!-- One short paragraph describing what this release is and who it is for. -->

## Highlights

- 
- 
- 

## What's Included

- 
- 
- 

## Known Limitations

- 
- 
- 

## Setup Notes

```bash
cp .env.example .env
docker compose up --build
```

Optional demo data:

```bash
docker compose exec api npm run prisma:seed
```

## Feedback Welcome

<!-- Point contributors toward issues/discussions and mention mock/live/provider context if reporting problems. -->
````

## Notes

- Keep the tone honest and alpha-level.
- Mention manual final submit and best-effort prefill when relevant.
- Link to:
  - `CHANGELOG.md`
  - `docs/releases/support-matrix.md`
  - `docs/releases/demo-assets/README.md` when demo assets are still incomplete
