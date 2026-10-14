# OrbitSaaS Cloudflare — Project Constitution

## I. Platform Constraints (NON-NEGOTIABLE)

This project runs exclusively on **Cloudflare Pages + Workers**. Every line of code must be
compatible with the **Cloudflare Workers runtime** (V8 isolates, not Node.js):

- **No Node.js-only APIs**: No `fs`, `path`, `crypto` (use `crypto.subtle`), `jsonwebtoken`
  (use `jose`), or any npm package that requires Node internals.
- **Edge-first**: All backend logic lives in `backend/functions/api/` as Cloudflare Pages Functions.
- **Database**: Turso/LibSQL via `@libsql/client`. Raw SQL only — no ORMs.
- **Storage**: Cloudflare R2 via the `IMAGE_BUCKET` binding. No local disk writes.
- **Secrets**: All secrets (`JWT_SECRET`, `ADMIN_ACCESS_CODE`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`,
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ZONE_ID`) must come from Cloudflare environment bindings
  (`.dev.vars` locally, Cloudflare dashboard in production). **Never hardcode secrets.**

## II. Authentication & Authorization

- **Admin auth** uses OTP-over-email + signed JWT (`jose`, HS256, 7-day expiry).
- Every protected route **must** call `isAuthorized(request, env.JWT_SECRET)` and return 401 if
  it fails — no exceptions, no fallback open paths.
- The `handleCache GET` endpoint is the **only** admin endpoint intentionally public (cache status
  check). All other admin actions require a valid JWT.
- Finance routes use a separate `Finance-Token` header verified via `getFinanceIdentity()`.
  Finance mutations (`POST`, `PUT`, `DELETE`) must reject requests where the identity is `'unknown'`.
- The authorized admin email allowlist in `handleLoginOtpSend` **must not** be stored in source
  code long-term — move to `env.AUTHORIZED_ADMIN_EMAILS` as a comma-separated env var.

## III. CORS Policy

- CORS is controlled centrally in `backend/functions/_lib/cors.ts`.
- `*.pages.dev` is allowed for Cloudflare preview deployments — this is intentional.
- Private LAN origins (`192.168.x.x`, `10.x.x.x`, `172.16-31.x.x`) are allowed for local dev.
- **No wildcard `*` origin.** Any new API endpoint must use `getCorsHeaders(request)` —
  never craft its own CORS headers inline.

## IV. Security Standards

- **SQL**: All DB queries use parameterized args (`args: [...]`). No string interpolation into SQL.
- **Input validation**: Every POST/PUT handler must validate required fields and return 400 for
  missing data before touching the database.
- **OTP brute-force**: OTPs are 6-digit numeric. Rate limiting is not yet implemented — this is
  a known gap to address.
- **Secrets in logs**: `console.error` may log error objects — never log raw request bodies,
  JWT tokens, OTP codes, or env var values.
- **R2 uploads**: `backend/functions/api/r2/upload.ts` must enforce content-type and file-size
  limits. Uploads require authorization.
- **Admin email hardcoded** (line 101–106 of `admin.ts`): Must be refactored to env var before
  any public launch.

## V. Code Quality

- **TypeScript strict mode**: All files use TypeScript. Avoid `any` — use proper types from
  `backend/functions/_lib/types.ts`.
- **Audit trail**: Every mutating admin and finance action must call `logAudit()`. Read-only
  actions do not need audit entries.
- **Shared helpers**: Auth, CORS, DB, audit, and mail logic live in `_lib/`. New cross-cutting
  concerns go there — no copy-pasting across route files.
- **Error handling**: All `onRequest` handlers must have a top-level `try/catch` returning a
  500 JSON response. Never let an unhandled error bubble to a raw Cloudflare error page.
- **No frontend secrets**: The Vite/React frontend (`frontend/`) must never import or embed
  secrets. Backend URLs are via `import.meta.env.VITE_*` public vars only.

## VI. Testing & Deployment

- No automated test suite exists yet — this is a known gap. New features should include at
  minimum a manual test checklist in the spec.
- Deployment is via `wrangler pages deploy` (CI) or Cloudflare Git integration.
- The `/functions` root directory is auto-generated during build and is gitignored.
- `.agents/` is gitignored to prevent credential leakage.
- `.dev.vars` is gitignored — never commit it.

## VII. Governance

This constitution supersedes all ad-hoc implementation decisions. Amendments require:
1. A written justification in the relevant spec or PR description.
2. A migration plan if existing code is non-compliant.

**Version**: 1.0.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-14
