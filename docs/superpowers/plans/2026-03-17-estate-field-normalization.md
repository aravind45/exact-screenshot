# Estate Field Normalization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Normalize cross-form estate fields so legacy and registry-backed forms read a consistent estate shape.

**Architecture:** Add one server-side normalization helper that converts raw estate rows into a canonical form-friendly shape and accepts alias inputs on update. Wire that helper into estate reads and legacy CA generators, then close the first high-value gaps in client typing and persistence.

**Tech Stack:** TypeScript, Express, Prisma, Vitest

---

## Chunk 1: Normalization Helper And Tests

### Task 1: Add canonical estate form normalization helper

**Files:**
- Create: `server/lib/estateFormNormalization.ts`
- Create: `src/tests/server/estateFormNormalization.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Implement canonical normalization for `codicilDates` -> `hasCodicil` / `codicilDate`, `isSpouse` aliasing, and petitioner email fallback**
- [ ] **Step 4: Run the test to verify it passes**

### Task 2: Add update-payload normalization helper

**Files:**
- Modify: `server/lib/estateFormNormalization.ts`
- Modify: `src/tests/server/estateFormNormalization.test.ts`

- [ ] **Step 1: Write the failing test**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Implement input normalization for `hasCodicil` / `codicilDate` into canonical `codicilDates[]`**
- [ ] **Step 4: Run the test to verify it passes**

## Chunk 2: Estate API Wiring

### Task 3: Normalize estate payloads on read and write

**Files:**
- Modify: `server/routes/estateRoutes.ts`
- Test: `src/tests/server/estateFormNormalization.test.ts`

- [ ] **Step 1: Write the failing test covering route-adjacent normalization behavior**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Wire normalization into `GET /my` payload shaping and `PUT /my` update shaping**
- [ ] **Step 4: Run the targeted tests to verify they pass**

### Task 4: Expose normalized fields in client estate typing

**Files:**
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Add `administrationType` and canonical normalized estate fields to the client `Estate` interface**
- [ ] **Step 2: Run type-aware tests/build command that covers this file**

## Chunk 3: Legacy Generator Fallbacks

### Task 5: Make legacy CA generators consume canonical normalized fields

**Files:**
- Modify: `server/services/DocumentService.ts`
- Test: `src/tests/server/estateFormNormalization.test.ts`

- [ ] **Step 1: Write the failing test for normalized DE-111 / DE-221 input expectations**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Update legacy generator logic to use normalized spouse, codicil, and petitioner email fallbacks**
- [ ] **Step 4: Run the targeted tests to verify they pass**

## Chunk 4: Publication Newspaper Persistence

### Task 6: Add `publicationNewspaper` to the persisted estate model

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260317153000_add_publication_newspaper/migration.sql`
- Modify: `server/routes/estateRoutes.ts`
- Modify: `src/lib/api.ts`

- [ ] **Step 1: Write the failing test for normalization/payload support of `publicationNewspaper`**
- [ ] **Step 2: Run the test to verify it fails**
- [ ] **Step 3: Add Prisma field, migration, route acceptance, and client typing**
- [ ] **Step 4: Run the targeted tests/build verification**

## Verification

- [ ] Run targeted Vitest command for new normalization tests
- [ ] Run build or type-check command covering edited files
- [ ] Re-read `docs/FORM_FIELD_CAPTURE_MATRIX.md` and confirm the first-slice gaps are reduced

