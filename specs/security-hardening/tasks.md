# Tasks: Security Hardening & Vulnerability Remediation

**Feature**: `security-hardening`  
**Status**: In Progress  

---

## Task List

- [x] **Task 1: Patch Reflected XSS in SSR Route** [US1]
  - File: `backend/functions/project/[[path]].ts`
  - Wrapped `${canonicalUrl}` and `${ogImageUrl}` with `escapeHtml()` in HTML string template.
  - Verified that `<script>` tags in `slug` cannot break out into execution.

- [x] **Task 2: Eliminate SSRF in Image Proxy** [US2]
  - File: `backend/functions/api/img-proxy.ts`
  - Removed `localhost` and `127.0.0.1` from `ALLOWED_DOMAINS`.
  - Enforced `https:` protocol check.
  - Verified upstream `content-type` is in allowed list (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/gif`) and rejected `image/svg+xml`.

- [x] **Task 3: Block SVG Uploads in R2** [US3]
  - File: `backend/functions/api/r2/upload.ts`
  - Added explicit rejection for `image/svg+xml` and `.svg` extensions.
  - Returns clear 400 Bad Request if SVG is attempted.

- [x] **Task 4: Secure AI Chat & Context Endpoints** [US4]
  - File: `backend/functions/api/ai.ts`
  - Requires `isAuthorized(request, env.JWT_SECRET)` when `forceRefresh === true`.
  - Added server-side system boundary enforcing assistant context in `handleChat`.

- [x] **Task 5: Restrict CORS Wildcard** [US5]
  - File: `backend/functions/_lib/cors.ts`
  - Restricted `pages.dev` regex to match `^https:\/\/([a-zA-Z0-9-]+\.)*orbitsaas(-[a-zA-Z0-9]+)?\.pages\.dev$`.

- [x] **Task 6: Enforce OTP Attempt Limits & Lockout** [US6]
  - Files:
    - `backend/functions/api/admin.ts`
    - `backend/functions/api/finance-otp.ts`
    - `backend/functions/api/otp.ts`
  - Added `attempts` column tracking failed verification attempts.
  - Deletes OTP and returns 429/400 if failed attempts exceed 5.

- [x] **Task 7: Upgrade Seed Password Hash to PBKDF2** [US7]
  - File: `backend/functions/api/admin.ts`
  - Updated `handleSeed` to use PBKDF2 derivation with 100,000 iterations instead of single-round SHA-256.

- [x] **Task 8: Update Vulnerable Toolchain Packages** [US8]
  - Ran `npm update wrangler` and checked audit output.
