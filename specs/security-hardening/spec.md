# Feature Specification: Security Hardening & Vulnerability Remediation

**Feature Slug**: `security-hardening`  
**Status**: Ready for Implementation  
**Created**: 2026-10-14  

---

## 1. Overview & Context

A security penetration audit identified 9 vulnerability vectors across the OrbitSaaS Cloudflare deployment. The user explicitly chose to retain the intentional hardcoded admin email allowlist (VULN-02). This specification covers the remediation of all remaining confirmed vulnerabilities (VULN-01, VULN-03 through VULN-09).

---

## 2. User Stories & Acceptance Criteria

### User Story 1: Fix Reflected XSS in SSR Route (VULN-01 - High)
- **Problem**: In `backend/functions/project/[[path]].ts`, user-controlled `slug` is placed into `${canonicalUrl}` and `${ogImageUrl}` without HTML escaping in `<link rel="canonical">` and `<meta>` tags.
- **Acceptance Criteria**:
  - `canonicalUrl` and `ogImageUrl` must be properly escaped using `escapeHtml()` or sanitized before HTML interpolation.
  - Payloads such as `"><script>alert(1)</script>` must render as `&quot;&gt;&lt;script&gt;alert(1)&lt;/script&gt;` inside attribute values and never break out of tags.

### User Story 2: Eliminate SSRF in Image Proxy (VULN-03 - Medium)
- **Problem**: `backend/functions/api/img-proxy.ts` allows `localhost` and `127.0.0.1`, allowing requests to local Worker ports or loopback services, and fails to validate content-type before returning.
- **Acceptance Criteria**:
  - `localhost` and `127.0.0.1` are removed from `ALLOWED_DOMAINS`.
  - Upstream URL protocol must be strictly `https:` (no plain HTTP, no loopback).
  - Proxy validates that upstream `Content-Type` is an allowed raster/vector image format (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`) and explicitly rejects `image/svg+xml`, `text/html`, or non-image MIME types.

### User Story 3: Prevent Stored XSS via SVG Upload in R2 (VULN-04 - Medium)
- **Problem**: `backend/functions/api/r2/upload.ts` allows any MIME starting with `image/`, which includes `image/svg+xml`. SVG files can embed JavaScript executing in the `orbitsaas.cloud` origin.
- **Acceptance Criteria**:
  - Explicitly reject SVG uploads (`image/svg+xml` or `.svg` extension) with a 400 Bad Request error.
  - Only safe image types (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`) are accepted.

### User Story 4: Secure AI Chat & Gist Endpoints (VULN-05 - Medium)
- **Problem**: `/api/ai?action=chat` accepts arbitrary system prompts and unlimited messages without origin validation, acting as an open LLM proxy. `/api/ai?action=context&refresh=true` triggers expensive completions unauthenticated.
- **Acceptance Criteria**:
  - `/api/ai?action=context&refresh=true` requires valid admin authorization (`isAuthorized`).
  - `/api/ai?action=chat` prepends a non-overridable system boundary enforcing OrbitSaaS scope.

### User Story 5: Tighten Cloudflare Pages CORS Wildcard (VULN-06 - Medium)
- **Problem**: `_lib/cors.ts` allows any origin ending in `*.pages.dev`, granting CORS permissions to untrusted Cloudflare Pages deployments.
- **Acceptance Criteria**:
  - The regex must restrict `pages.dev` to `orbitsaas` project prefixes only (e.g. `^https:\/\/([a-zA-Z0-9-]+\.)*orbitsaas(-[a-zA-Z0-9]+)?\.pages\.dev$`).

### User Story 6: Enforce Lockout on OTP Verification (VULN-07 - Medium)
- **Problem**: 6-digit OTPs in `admin.ts`, `finance-otp.ts`, and `otp.ts` can be brute-forced because there is no limit on failed attempts.
- **Acceptance Criteria**:
  - Add `attempts` counter to OTP tables.
  - Increment attempts on each invalid code submission.
  - Invalidate/delete the OTP and return 429/400 if attempts exceed 5.

### User Story 7: Upgrade Admin Password Hashing to PBKDF2 (VULN-08 - Low)
- **Problem**: `handleSeed` in `admin.ts` hashes passwords using single-iteration SHA-256.
- **Acceptance Criteria**:
  - Use PBKDF2 via Web Crypto (`crypto.subtle`) with at least 100,000 iterations to hash the seed password.

### User Story 8: Update Vulnerable Toolchain Packages (VULN-09 - Low)
- **Problem**: 38 vulnerabilities reported by npm audit in dev dependencies (`wrangler`, `undici`, `ws`).
- **Acceptance Criteria**:
  - Run `npm update wrangler` and safe dependency updates to minimize audit warnings without breaking builds.
