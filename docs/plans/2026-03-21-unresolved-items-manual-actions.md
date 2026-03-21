# Unresolved Items Manual Actions Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Turn unresolved automation items into an actionable queue by adding manual resolve/ignore actions in both review pages with audited backend updates.

**Architecture:** Extend the existing unresolved-item model with a small mutation endpoint and event type, then wire both review pages through a shared web API client and an enhanced shared list component. Keep the first version narrow: no inline answer persistence and no rerun orchestration.

**Tech Stack:** NestJS, Prisma, Zod shared types, React, Vitest, Playwright-free web component/page tests

---

### Task 1: Document the new request and event types

**Files:**
- Modify: `packages/shared-types/src/application.ts`
- Test: `packages/shared-types/src/application.test.ts`

**Step 1: Write the failing test**

Add assertions for:
- `updateUnresolvedAutomationItemRequestSchema` accepting `resolved` and `ignored`
- `applicationEventTypeSchema` accepting `unresolved_item_updated`

**Step 2: Run test to verify it fails**

Run: `npm run test --workspace @rolecraft/shared-types -- src/application.test.ts`
Expected: FAIL because the new schema/event type does not exist yet.

**Step 3: Write minimal implementation**

Add:
- `updateUnresolvedAutomationItemRequestSchema`
- `UpdateUnresolvedAutomationItemRequest` type
- `unresolved_item_updated` to `applicationEventTypeSchema`

**Step 4: Run test to verify it passes**

Run: `npm run test --workspace @rolecraft/shared-types -- src/application.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add packages/shared-types/src/application.ts packages/shared-types/src/application.test.ts
git commit -m "Add unresolved item update shared types"
```

### Task 2: Add backend mutation tests

**Files:**
- Modify: `apps/api/src/applications/applications.controller.test.ts`
- Modify: `apps/api/src/applications/applications.service.test.ts`

**Step 1: Write the failing tests**

Add tests for:
- resolving an unresolved item
- ignoring an unresolved item
- rejecting updates for already handled items
- recording an `unresolved_item_updated` event

**Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @rolecraft/api -- src/applications/applications.controller.test.ts`
Expected: FAIL because the endpoint and service method do not exist yet.

**Step 3: Write minimal implementation**

Add:
- controller endpoint
- service mutation method
- event payload write

**Step 4: Run tests to verify they pass**

Run: `npm run test --workspace @rolecraft/api -- src/applications/applications.controller.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/applications/applications.controller.ts apps/api/src/applications/applications.controller.test.ts apps/api/src/applications/applications.service.ts apps/api/src/applications/applications.service.test.ts
git commit -m "Add unresolved item update endpoint"
```

### Task 3: Add the shared web API client and component tests

**Files:**
- Modify: `apps/web/src/lib/api.ts`
- Modify: `apps/web/src/components/unresolved-automation-items.tsx`
- Test: `apps/web/src/components/unresolved-automation-items.test.tsx`

**Step 1: Write the failing tests**

Add tests for:
- unresolved rows showing `Mark resolved` and `Ignore`
- handled rows hiding action buttons
- item-level pending state
- callback payload including optional note

**Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @rolecraft/web -- src/components/unresolved-automation-items.test.tsx`
Expected: FAIL because the component is still read-only.

**Step 3: Write minimal implementation**

Add:
- `updateUnresolvedAutomationItem(...)` in the web API client
- action-capable `UnresolvedAutomationItems` props and local row state

**Step 4: Run tests to verify they pass**

Run: `npm run test --workspace @rolecraft/web -- src/components/unresolved-automation-items.test.tsx`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/lib/api.ts apps/web/src/components/unresolved-automation-items.tsx apps/web/src/components/unresolved-automation-items.test.tsx
git commit -m "Add unresolved item action UI"
```

### Task 4: Wire Application Review and Submission Review

**Files:**
- Modify: `apps/web/src/app/applications/[id]/page-client.tsx`
- Modify: `apps/web/src/app/applications/[id]/page-client.test.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page-client.tsx`
- Modify: `apps/web/src/app/applications/[id]/submission-review/page-client.test.tsx`

**Step 1: Write the failing tests**

Add page-level tests showing:
- `Application Review` updates a single unresolved item after a successful action
- `Submission Review` updates a single unresolved item after a successful action

**Step 2: Run tests to verify they fail**

Run: `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
Run: `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/submission-review/page-client.test.tsx'`
Expected: FAIL because the pages do not supply action handlers/state updates yet.

**Step 3: Write minimal implementation**

Teach both page clients to:
- own unresolved-item local state
- call `updateUnresolvedAutomationItem`
- patch the matching row after success

**Step 4: Run tests to verify they pass**

Run the two page test commands again.
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/app/applications/[id]/page-client.tsx apps/web/src/app/applications/[id]/page-client.test.tsx apps/web/src/app/applications/[id]/submission-review/page-client.tsx apps/web/src/app/applications/[id]/submission-review/page-client.test.tsx
git commit -m "Wire unresolved item actions into review pages"
```

### Task 5: Full verification

**Files:**
- Modify: none expected

**Step 1: Run targeted backend tests**

Run:
- `npm run test --workspace @rolecraft/shared-types -- src/application.test.ts`
- `npm run test --workspace @rolecraft/api -- src/applications/applications.controller.test.ts`

Expected: PASS

**Step 2: Run targeted web tests**

Run:
- `npm run test --workspace @rolecraft/web -- src/components/unresolved-automation-items.test.tsx`
- `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/page-client.test.tsx'`
- `npm run test --workspace @rolecraft/web -- 'src/app/applications/[id]/submission-review/page-client.test.tsx'`

Expected: PASS

**Step 3: Run full verification**

Run:
- `npm run test`
- `npm run build`

Expected: PASS

**Step 4: Commit**

```bash
git add .
git commit -m "Finish unresolved item manual handling loop"
```
