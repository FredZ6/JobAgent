# Importer Quality UI Implementation Plan

1. Extend shared job types with import quality summary and diagnostics schemas.
2. Add controller helpers that map the latest `job_imported` event payload into structured fields.
3. Add failing API tests for list/detail import quality mapping.
4. Add failing web tests for Job Detail import quality rendering and Jobs list quality pills.
5. Implement Job Detail import quality panel.
6. Implement Jobs list importer quality hint.
7. Run targeted API/web tests, then full `npm run test` and `npm run build`.
