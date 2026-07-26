# Security Audit Remediation Report

**Date**: 2026-02-14
**Status**: Final Sweep Completed

## Summary of Remediated Vulnerabilities

### 1. JWT Exposure in URL Query Parameters (High Risk)
- **Issue**: Documents were downloaded via URLs containing the authentication token as a query parameter (e.g., `?token=...`). This exposed the token to browser history, server logs, and potential referrer headers.
- **Fix**: Replaced all direct `window.open` calls with an authenticated `fetch` flow.
    - Added `api.downloadEstateDocument` and `api.viewEstateDocument` in `api.ts`.
    - These methods fetch the document as a `Blob` using the `Authorization` header and then trigger a local download or view in a new tab via `URL.createObjectURL`.
- **Status**: [VERIFIED] All identified occurrences in `ProbatePetition.tsx`, `AssetDetail.tsx`, `CollapsiblePhaseChevron.tsx`, `DocumentVault.tsx`, and `PhaseTaskList.tsx` have been remediated.

### 2. Insecure JWT Storage in LocalStorage (Medium Risk)
- **Issue**: The authentication token was stored in `localStorage`, making it vulnerable to XSS-based theft.
- **Fix**: Centralized token retrieval into `getToken()` in `api.ts`. While a full migration to HTTP-only cookies requires backend changes to both the main API and the frontend's auth handler, we have minimized direct `localStorage` access across the codebase.
- **Status**: [IMPROVED] Direct `localStorage.getItem("auth_token")` calls have been replaced with `api.getToken()` or service methods.

### 3. Permissive CORS in Supabase Edge Functions (Medium Risk)
- **Issue**: The `process-document` edge function used `Access-Control-Allow-Origin: *`, allowing any domain to attempt requests.
- **Fix**: Updated `supabase/functions/process-document/index.ts` to restrict the CORS origin to the specific application domain.
- **Status**: [VERIFIED] origin restriction applied.

## Residual Risks and Recommendations
1. **HTTP-only Cookies**: The ultimate remediation for token theft is to move to HTTP-only cookies. This should be prioritized for the next infrastructure update.
2. **Token Expiration**: Ensure that the `auth_token` has a short expiration time and implement a refresh token flow if not already present.
3. **Third-party Scripts**: Audit third-party scripts to ensure no unauthorized access to the application state.

## Verification Log
- `grep -r "?token=" src/` -> No matches found in production code.
- `grep -r "localStorage.getItem('auth_token')" src/` -> Minimized to core auth logic.
- Manual verification of document viewing/downloading confirms authenticated flow is active.
