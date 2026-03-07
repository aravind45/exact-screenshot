# Autofill + RAG Rollout Plan

## Goal
Ship reliable form autofill across tracks, states, counties, and authority rules without manual one-by-one testing.

## Phase 0: Stabilize Current Autofill (Now)
- Route all legacy autofill calls through one backend contract: `POST /api/documents/generate`.
- Maintain a canonical document alias map (UI aliases -> backend form IDs).
- Disable or hide buttons for forms that have no generator yet.
- Add a server-side `SUPPORTED_AUTOFILL_FORMS` registry and reject unknown forms with explicit error JSON (never HTML 404 pages).

Exit criteria:
- No autofill path calls dead endpoints.
- Unsupported forms fail fast with deterministic error messages.

## Phase 1: Modular Boundaries (Before RAG)
- Create `FormAutofillService` as the single entry point for form generation.
- Split responsibilities:
  - `JurisdictionRuleService`: state/county legal constraints.
  - `FormDataAssembler`: estate/asset/liability/party data shaping.
  - `DocumentGeneratorService`: form rendering only.
- Remove route-level orchestration; route handlers should call one service method.

Exit criteria:
- Routes do not directly orchestrate cross-domain data logic.
- Autofill logic is testable without HTTP.

## Phase 2: RAG Autofill Core
- Build a jurisdiction-scoped knowledge index:
  - state statutes
  - county local court rules
  - official court form instructions
- Retrieval key: `(state, county, formId, fieldKey, authorityType)`.
- Generate field suggestions as strict JSON:
  - `value`
  - `confidence`
  - `citations[]`
  - `reason`
- Apply hard validators after RAG (required fields, date/amount formats, threshold rules, authority gates).
- If confidence is low or validator fails, leave field blank and mark as `needs_user_input`.

Exit criteria:
- RAG never writes unchecked values directly to PDFs.
- Every RAG-filled field carries traceable evidence.

## Phase 3: Test Matrix at Scale
- Introduce a golden dataset matrix:
  - dimensions: state x county class x track x authority type x form family
- Snapshot tests on output field JSON (not binary PDFs) to reduce flakiness.
- Add contract tests:
  - alias mapping
  - required-field gating
  - unsupported-form behavior
  - county override precedence
- Run matrix in CI nightly and pre-release.

Exit criteria:
- Regression detection on roadmap/rules changes is automatic.
- Manual QA reduced to high-risk edge cases only.

## Phase 4: Progressive Rollout
- Feature flag by `formId + jurisdiction`.
- Start in shadow mode:
  - generate RAG suggestions
  - do not auto-apply
  - compare against current deterministic autofill
- Promote to active mode only after quality threshold (example: >= 98% validator pass, <= 2% manual correction rate).

Exit criteria:
- Controlled rollout with measurable quality, not all-or-nothing launch.

## Immediate Work Items (Next Sprint)
1. Add `SUPPORTED_AUTOFILL_FORMS` registry and centralized error contract.
2. Add telemetry events:
   - `autofill.requested`
   - `autofill.generated`
   - `autofill.validation_failed`
   - `autofill.user_corrected`
3. Build 20-case starter golden dataset across CA probate tracks.
4. Implement RAG field schema and validator pipeline behind a feature flag.
