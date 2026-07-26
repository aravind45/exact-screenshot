# Security Issues Evaluation

Date: 2026-02-12  
Scope reviewed: API/authentication, startup behavior, admin controls, credential handling.

## Executive Summary

I identified **7 security issues** worth addressing. The most critical are:

1. **Insecure default JWT secret fallback** (critical)
2. **JWT accepted from URL query string** (high)
3. **Weak, brute-forceable password reset tokens and user enumeration** (high)
4. **Potentially destructive `prisma db push --accept-data-loss` on server startup** (high)

---

## Findings

## 1) Default JWT secret fallback enables token forgery (Critical)
- **Evidence:** `JWT_SECRET` falls back to a known hardcoded value (`"your-secret-key-change-this"`) when env var is missing.  
- **Why this matters:** If deployment is misconfigured, attackers can forge valid JWTs and fully compromise authenticated endpoints.
- **Source:** `server/services/authService.ts` line with fallback secret.
- **Recommended fix:** Fail fast on boot if `JWT_SECRET` is missing/weak; remove insecure fallback entirely.

## 2) JWT accepted via query parameter (High)
- **Evidence:** Authentication middleware accepts token from `req.query.token` in addition to Authorization header.
- **Why this matters:** Query tokens leak into browser history, logs, referrers, proxies, and analytics systems.
- **Source:** `server/index.ts` auth middleware token extraction.
- **Recommended fix:** Only accept `Authorization: Bearer <token>`.

## 3) Sensitive secret metadata logged at startup (Medium)
- **Evidence:** Boot logging prints JWT secret length and first two characters.
- **Why this matters:** Even partial secret disclosure reduces entropy and increases risk if logs are exposed.
- **Source:** `api/index.ts` startup secret status logging.
- **Recommended fix:** Log only whether secret is configured, never content-derived details.

## 4) Weak password reset design allows brute force and account discovery (High)
- **Evidence:** Password reset uses 6-digit numeric token generated with `Math.random`, stores token plaintext, and returns explicit error `"No user found with this email"`.
- **Why this matters:** 6-digit tokens are brute-forceable; plaintext DB tokens are dangerous if DB leaks; explicit message enables email enumeration.
- **Source:** `server/services/authService.ts` forgot/reset password logic.
- **Recommended fix:** Use long cryptographically random token (`crypto.randomBytes`), store hash only, and return generic response for existing/non-existing emails.

## 5) Destructive schema sync command on server startup (High)
- **Evidence:** On app listen, code runs `npx prisma db push --accept-data-loss`.
- **Why this matters:** In production this can cause data loss and schema drift outside migration controls; also startup command execution expands operational risk.
- **Source:** `server/index.ts` startup background initialization.
- **Recommended fix:** Remove this from runtime startup; use controlled CI/CD migrations (`prisma migrate deploy`) instead.

## 6) Hardcoded admin authorization by email list (Medium)
- **Evidence:** `AUTHORIZED_ADMINS` is hardcoded to one email and checked directly.
- **Why this matters:** Privilege model is brittle and not auditable/rotatable at runtime; compromised email account gives full admin access.
- **Source:** `server/routes/adminRoutes.ts` `AUTHORIZED_ADMINS` + `isAdmin` middleware.
- **Recommended fix:** Use role/permission claims from DB with MFA-protected admin accounts and audit trails.

## 7) Auth tokens stored in localStorage (Medium)
- **Evidence:** Frontend auth context reads/writes token from `localStorage`.
- **Why this matters:** Any XSS can exfiltrate bearer tokens from localStorage.
- **Source:** `src/contexts/AuthContext.tsx` token storage logic.
- **Recommended fix:** Move to secure, HttpOnly, SameSite cookies and tighten CSP.

---

## Prioritized Remediation Plan

### Immediate (24-48h)
1. Remove JWT fallback; require strong `JWT_SECRET` at boot.
2. Stop accepting `req.query.token`.
3. Replace reset token flow with cryptographically strong, hashed, single-use tokens.
4. Remove `db push --accept-data-loss` from app startup.

### Short term (1-2 weeks)
1. Replace hardcoded email admin gating with DB-backed RBAC + least privilege.
2. Remove secret-derived startup logs.
3. Add endpoint-specific rate limits for `/auth/login`, `/auth/forgot-password`, `/auth/reset-password`.

### Mid term
1. Migrate auth from localStorage bearer token to HttpOnly cookie sessions/JWT cookie.
2. Add security regression tests (auth bypass attempts, brute-force thresholds, reset token expiry/use-once behavior).

---

## Overall Risk

Current risk profile is **elevated** due to auth/session handling and startup controls. Addressing findings 1-5 should materially reduce exploitability.
