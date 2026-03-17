# Roadmap Form Gap Closure Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let roadmap users reach accurate TX and FL auto-fill flows from the Forms hub and make readiness reflect actual captured estate data instead of coarse hardcoded heuristics.

**Architecture:** Add a small shared auto-fill support map on the client, expose missing TX/FL API methods and dialogs, then replace the hardcoded readiness map with registry-driven readiness that ignores manual override fields but blocks on missing captured data and stage gates.

**Tech Stack:** TypeScript, React, Express, Prisma, Vitest

---

## Chunk 1: Red Tests For The New Gaps

### Task 1: Lock the auto-fill support contract in tests

**Files:**
- Create: `src/tests/forms/formAutoFillSupport.test.ts`
- Create: `src/lib/formAutoFillSupport.ts`

- [ ] **Step 1: Write a failing test that asserts TX and FL forms are recognized as dedicated auto-fill forms**
- [ ] **Step 2: Run the targeted test and verify it fails for missing support**
- [ ] **Step 3: Implement the shared support map with state-specific form sets**
- [ ] **Step 4: Re-run the targeted test and verify it passes**

### Task 2: Lock smarter readiness behavior in tests

**Files:**
- Create: `src/tests/server/formReadiness.test.ts`
- Create: `server/lib/formReadiness.ts`

- [ ] **Step 1: Write failing tests for readiness that distinguish captured-field blockers from manual override fields**
- [ ] **Step 2: Run the targeted test and verify it fails**
- [ ] **Step 3: Implement a registry-driven readiness helper with optional stage gating**
- [ ] **Step 4: Re-run the targeted test and verify it passes**

## Chunk 2: Client Gap Closure

### Task 3: Expose TX and FL form APIs

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add TX form schema / preview / generate client methods**
- [ ] **Step 2: Add FL form schema / preview / generate client methods**
- [ ] **Step 3: Run the relevant type-check command**

### Task 4: Wire the Forms hub to TX and FL auto-fill dialogs

**Files:**
- Modify: `src/pages/Forms.tsx`
- Create: `src/components/TXFormAutoFillDialog.tsx`
- Create: `src/components/FLFormAutoFillDialog.tsx`
- Modify: `src/lib/formAutoFillSupport.ts`

- [ ] **Step 1: Update the Forms page to use the shared auto-fill support map**
- [ ] **Step 2: Add TX and FL dialog components that mirror the existing NY/NJ behavior**
- [ ] **Step 3: Re-run the auto-fill support test and a type-aware verification command**

## Chunk 3: Server Readiness Upgrade

### Task 5: Replace coarse readiness with registry-driven readiness in `/forms/readiness`

**Files:**
- Modify: `server/routes/formRoutes.ts`
- Modify: `server/lib/formReadiness.ts`
- Test: `src/tests/server/formReadiness.test.ts`

- [ ] **Step 1: Route the readiness endpoint through the new helper**
- [ ] **Step 2: Preserve lifecycle gates for post-appointment / inventory-dependent forms**
- [ ] **Step 3: Ignore `override` and `computed` fields when determining missing captured data**
- [ ] **Step 4: Re-run the targeted readiness tests**

## Verification

- [ ] Run `npx vitest run src/tests/forms/formAutoFillSupport.test.ts src/tests/server/formReadiness.test.ts`
- [ ] Run `npx tsc -p tsconfig.server.json --noEmit`
- [ ] Run `npx tsc -p tsconfig.app.json --noEmit` and report unrelated pre-existing failures separately if they remain
