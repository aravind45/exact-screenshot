# DE-111 Exact Form Preview Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current DE-111 fallback draft preview with an exact court-form preview and download flow on the original Judicial Council PDF.

**Architecture:** Keep DE-111 on the existing CA form pipeline, but make it overlay-first on the official PDF and require exact rendering for user-facing preview/download. Add calibrated DE-111 registry metadata, enforce explicit exact-render failure behavior in the server path, and update the Probate Petition UI to preview the exact court form instead of the structured fallback.

**Tech Stack:** TypeScript, React, Express, Prisma, pdf-lib, Vitest

---

## Implementation Map

- `server/services/caFormRegistry.ts`
  - Expand DE-111 field metadata to support calibrated exact-form placement.
  - Store DE-111 page/coordinate/text-fit rules in one place.

- `server/services/caFormService.ts`
  - Add an explicit exact-render contract for DE-111.
  - Keep overlay rendering on the original PDF as the happy path.
  - Stop silently returning the structured fallback when exact rendering is required.

- `server/routes/formRoutes.ts`
  - Pass DE-111 exact-render requirements into the CA generation path.
  - Return clear errors when DE-111 exact rendering cannot proceed.

- `server/routes/documentRoutes.ts`
  - Keep the legacy `/documents/generate` path aligned with the DE-111 exact-render policy.

- `src/pages/ProbatePetition.tsx`
  - Rename the CTA to `Preview Court Form`.
  - Use the exact CA form pipeline directly for preview/download.
  - Show clear error states and blank-form fallback options instead of silently showing the structured draft.

- `src/lib/api.ts`
  - Add or reuse a direct DE-111 exact preview/download helper only if the Probate Petition page cannot rely cleanly on `generateCAForm`.

- `server/scripts/preview-de111.ts`
  - Generate a local calibration preview PDF with sample data so coordinates can be tuned quickly.

- `src/tests/server/caDe111ExactRender.test.ts`
  - Lock the service-side exact-render contract and fallback policy.

- `src/tests/probate/de111CourtFormPreview.test.tsx`
  - Lock the Probate Petition UI copy and explicit error behavior.

---

## Chunk 1: Lock The Exact-Render Contract In Tests

### Task 1: Add server tests for DE-111 exact-render policy

**Files:**
- Create: `src/tests/server/caDe111ExactRender.test.ts`
- Modify: `server/services/caFormService.ts`

- [ ] **Step 1: Write a failing test for the happy path**

Test target:
- given a usable one-page PDF fixture and DE-111 field values
- when exact rendering is required
- then the service returns PDF bytes without using the structured fallback path

- [ ] **Step 2: Write a failing test for the failure policy**

Test target:
- given DE-111 exact rendering is required and the template cannot be used
- then the service throws a typed exact-render error instead of returning `buildFallbackDE111(...)`

- [ ] **Step 3: Run the targeted test to verify both cases fail initially**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- at least one failure for missing exact-render contract behavior

- [ ] **Step 4: Add the minimal `CAFormService` contract surface needed by the tests**

Implementation target:
- introduce an input flag such as `requireExactRender`
- introduce result metadata or typed errors so callers can distinguish exact render from structured fallback

- [ ] **Step 5: Re-run the targeted test and verify the contract is green**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- PASS

- [ ] **Step 6: Commit the chunk**

```bash
git add src/tests/server/caDe111ExactRender.test.ts server/services/caFormService.ts
git commit -m "test: lock DE-111 exact render contract"
```

### Task 2: Add a UI test for the professional preview contract

**Files:**
- Create: `src/tests/probate/de111CourtFormPreview.test.tsx`
- Modify: `src/pages/ProbatePetition.tsx`

- [ ] **Step 1: Write a failing UI test for CTA copy and error handling**

Test target:
- the primary preview button says `Preview Court Form`
- exact-render failures show an explicit message instead of embedding a fallback PDF preview
- a blank-form action is offered when rendering fails

- [ ] **Step 2: Run the targeted UI test and verify it fails**

Run:
```bash
npx vitest run src/tests/probate/de111CourtFormPreview.test.tsx
```

Expected:
- FAIL for old copy or old preview behavior

- [ ] **Step 3: Implement only the UI state needed to satisfy the red test later**

Implementation target:
- shape the component state to support `preview error`, `exact preview available`, and `blank form fallback`

- [ ] **Step 4: Leave the test red until the server/client wiring is complete**

Note:
- do not force the UI green yet by mocking behavior the real server path will not support

---

## Chunk 2: Build The DE-111 Exact Overlay Path

### Task 3: Extend DE-111 registry metadata for exact placement

**Files:**
- Modify: `server/services/caFormRegistry.ts`
- Test: `src/tests/server/caDe111ExactRender.test.ts`

- [ ] **Step 1: Add any missing field metadata needed for exact placement**

Implementation target:
- add optional width / shrink-to-fit / multiline-safe metadata only if DE-111 needs it
- keep the field definition shape narrow and reusable

- [ ] **Step 2: Replace placeholder DE-111 positions with calibrated coordinates**

Target fields:
- header and case identifiers
- petitioner information
- decedent information
- petition type checkboxes
- estate value fields
- bond and publication fields
- codicil and will-related fields needed in phase 1

- [ ] **Step 3: Re-run the targeted service test after each coordinate slice**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- PASS stays green while registry changes settle

- [ ] **Step 4: Commit the calibrated registry slice**

```bash
git add server/services/caFormRegistry.ts src/tests/server/caDe111ExactRender.test.ts
git commit -m "feat: calibrate DE-111 exact overlay registry"
```

### Task 4: Add a local DE-111 calibration preview script

**Files:**
- Create: `server/scripts/preview-de111.ts`
- Modify: `server/services/caFormService.ts`

- [ ] **Step 1: Create a focused preview script modeled after the existing form preview scripts**

Script behavior:
- load `server/templates/DE-111.pdf`
- pass a realistic sample estate payload plus overrides into the CA DE-111 generator
- write output to `server/templates/preview_DE-111_exact.pdf`

- [ ] **Step 2: Run the script and inspect the generated PDF locally**

Run:
```bash
npx tsx server/scripts/preview-de111.ts
```

Expected:
- output file is created at `server/templates/preview_DE-111_exact.pdf`

- [ ] **Step 3: Tune the registry and overlay behavior until the visible layout is court-form quality**

Focus:
- text alignment
- checkbox placement
- overflow handling
- no fallback draft layout

- [ ] **Step 4: Commit the calibration helper**

```bash
git add server/scripts/preview-de111.ts server/services/caFormService.ts server/templates/preview_DE-111_exact.pdf
git commit -m "chore: add DE-111 exact preview calibration helper"
```

---

## Chunk 3: Enforce Exact DE-111 Server Policy

### Task 5: Make `/forms/ca/generate` require exact DE-111 rendering

**Files:**
- Modify: `server/routes/formRoutes.ts`
- Modify: `server/services/caFormService.ts`
- Test: `src/tests/server/caDe111ExactRender.test.ts`

- [ ] **Step 1: Write a failing test for route-adjacent DE-111 policy**

Test target:
- DE-111 preview/download requests call the CA generator in exact-render mode
- exact-render failures do not degrade to a structured DE-111 PDF

- [ ] **Step 2: Thread `requireExactRender: true` through the DE-111 CA route**

Implementation target:
- only DE-111 needs this hard requirement in phase 1
- DE-160 and DE-310 keep current behavior for now

- [ ] **Step 3: Return a stable error shape for exact-render failures**

Suggested shape:
- machine-readable code such as `DE111_EXACT_RENDER_FAILED`
- user-readable message
- optional hint that the blank official form is still available

- [ ] **Step 4: Re-run the service/server targeted tests**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- PASS

- [ ] **Step 5: Commit the route policy**

```bash
git add server/routes/formRoutes.ts server/services/caFormService.ts src/tests/server/caDe111ExactRender.test.ts
git commit -m "feat: require exact DE-111 rendering in CA form route"
```

### Task 6: Keep the legacy `/documents/generate` path aligned

**Files:**
- Modify: `server/routes/documentRoutes.ts`
- Test: `src/tests/server/caDe111ExactRender.test.ts`

- [ ] **Step 1: Audit how DE-111 reaches `/documents/generate` today**

Check:
- alias handling
- CA registry branch
- legacy fallback branch

- [ ] **Step 2: Prevent legacy DE-111 preview from silently reintroducing the structured fallback**

Implementation target:
- DE-111 document generation should route through the same exact-render requirement as `/forms/ca/generate`

- [ ] **Step 3: Re-run the targeted test suite**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- PASS

- [ ] **Step 4: Commit the legacy path alignment**

```bash
git add server/routes/documentRoutes.ts src/tests/server/caDe111ExactRender.test.ts
git commit -m "fix: align legacy DE-111 generation with exact render policy"
```

---

## Chunk 4: Ship The New Probate Petition UX

### Task 7: Move Probate Petition preview/download onto the exact CA path

**Files:**
- Modify: `src/pages/ProbatePetition.tsx`
- Modify: `src/lib/api.ts`
- Modify: `src/lib/formAutofill.ts`
- Test: `src/tests/probate/de111CourtFormPreview.test.tsx`

- [ ] **Step 1: Replace the old `previewPetition` fallback chain for this page**

Implementation target:
- preview uses `api.generateCAForm("DE-111", true, overrides)` or an equivalent exact-only helper
- download uses the same CA path with `isPreview: false`

- [ ] **Step 2: Rename button copy and dialog copy to match the new contract**

Required copy updates:
- `Preview Draft` -> `Preview Court Form`
- preview messaging should refer to the official court form, not a generic draft

- [ ] **Step 3: Add explicit error handling and blank-form action**

Behavior:
- if exact render fails, do not open the embedded PDF modal
- show an actionable toast or inline state
- offer blank DE-111 opening/downloading from the official source or local template download

- [ ] **Step 4: Re-run the UI test and make it green**

Run:
```bash
npx vitest run src/tests/probate/de111CourtFormPreview.test.tsx
```

Expected:
- PASS

- [ ] **Step 5: Commit the Probate Petition UX changes**

```bash
git add src/pages/ProbatePetition.tsx src/lib/api.ts src/lib/formAutofill.ts src/tests/probate/de111CourtFormPreview.test.tsx
git commit -m "feat: show DE-111 exact court form preview"
```

### Task 8: Tighten DE-111 readiness and jurisdiction checks in the UI

**Files:**
- Modify: `src/pages/ProbatePetition.tsx`
- Test: `src/tests/probate/de111CourtFormPreview.test.tsx`

- [ ] **Step 1: Add failing assertions for invalid readiness**

Test target:
- preview/download are blocked for non-California state context
- missing county or core legal inputs show a useful blocker

- [ ] **Step 2: Implement UI blockers that match the exact-form standard**

At minimum block on:
- California state mismatch
- missing decedent name
- missing date of death
- missing probate county
- missing publication/codicil inputs where required

- [ ] **Step 3: Re-run the Probate Petition test**

Run:
```bash
npx vitest run src/tests/probate/de111CourtFormPreview.test.tsx
```

Expected:
- PASS

- [ ] **Step 4: Commit readiness hardening**

```bash
git add src/pages/ProbatePetition.tsx src/tests/probate/de111CourtFormPreview.test.tsx
git commit -m "fix: harden DE-111 exact preview readiness checks"
```

---

## Chunk 5: Final Verification And Handoff

### Task 9: Run targeted automated verification

**Files:**
- No code changes expected

- [ ] **Step 1: Run the server-side exact-render tests**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts
```

Expected:
- PASS

- [ ] **Step 2: Run the Probate Petition UI tests**

Run:
```bash
npx vitest run src/tests/probate/de111CourtFormPreview.test.tsx
```

Expected:
- PASS

- [ ] **Step 3: Run both together**

Run:
```bash
npx vitest run src/tests/server/caDe111ExactRender.test.ts src/tests/probate/de111CourtFormPreview.test.tsx
```

Expected:
- PASS

### Task 10: Run type/build verification and manual visual QA

**Files:**
- No code changes expected

- [ ] **Step 1: Run the server type check**

Run:
```bash
npx tsc -p tsconfig.server.json --noEmit
```

Expected:
- PASS

- [ ] **Step 2: Run the app type check**

Run:
```bash
npx tsc -p tsconfig.app.json --noEmit
```

Expected:
- PASS, or document unrelated pre-existing failures separately if they remain

- [ ] **Step 3: Generate a manual calibration sample**

Run:
```bash
npx tsx server/scripts/preview-de111.ts
```

Expected:
- `server/templates/preview_DE-111_exact.pdf` updates cleanly

- [ ] **Step 4: Do a manual browser smoke check**

Checklist:
- Probate Petition page shows `Preview Court Form`
- preview modal displays the official DE-111 layout, not the structured fallback draft
- exact-render failures show explicit error handling
- download matches the previewed PDF

## Final Notes

- Do not remove the structured fallback until exact DE-111 is proven, but do remove it from the normal user-facing preview path.
- Keep the DE-111 changes isolated so DE-160 and DE-310 can adopt the same pattern later without reworking this first slice.
- Prefer one small helper over spreading DE-111 exact-render policy across many routes or components.
