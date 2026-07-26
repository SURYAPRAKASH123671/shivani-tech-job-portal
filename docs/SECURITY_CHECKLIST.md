# Security Checklist

Status reflects the codebase as of the latest audit pass. ✅ = already true, ⬜ = you need to do
this before/during a real deployment.

## Authentication & session

- ✅ Passwords hashed with BCrypt, never logged or returned in any API response
- ✅ JWT signature verified on every authenticated request; expired tokens rejected
- ✅ Disabled accounts are rejected even if they're holding a still-valid JWT (fixed this audit pass)
- ✅ Login failures return a generic "Invalid email or password" — doesn't reveal whether the
  account exists
- ⬜ No rate limiting on `/api/auth/login`, `/api/auth/verify-otp`, `/api/auth/resend-otp` —
  someone can brute-force a password or spam OTP attempts today. Add a rate limiter (e.g.
  Bucket4j, or throttle at a reverse proxy/API gateway) before real launch
- ⬜ JWT lifetime is 24h with no refresh-token/revocation-list mechanism — a stolen token is valid
  for up to 24h. Consider shortening `JWT_EXPIRATION_MS` for higher-security deployments
- ⬜ No password complexity requirement beyond 6-character minimum — consider raising this and/or
  checking against a breached-password list (e.g. HaveIBeenPwned k-anonymity API) if this ever
  handles real candidate PII at scale

## Authorization

- ✅ Every route's role requirement is enforced centrally in `SecurityConfig`, not scattered
  per-controller — verified every controller's base path matches a rule
- ✅ Ownership checks on employer job edit/close (can't touch another company's job) and
  candidate profile/resume (always resolved from the JWT's own email, never a path parameter)
- ✅ IDOR check: employer-supplied `companyId` in job create/update requests is always overwritten
  server-side with the authenticated employer's own company — verified in code

## Input validation & injection

- ✅ 100% JPA/Hibernate repositories and Criteria API — no raw SQL string concatenation anywhere,
  no SQL injection surface
- ✅ React auto-escapes all rendered text — no `dangerouslySetInnerHTML` anywhere in the codebase,
  so no reflected/stored XSS surface from user-supplied text (job descriptions, profile fields, etc.)
- ✅ Bean Validation (`@NotBlank`, `@Email`, `@Pattern`, `@PositiveOrZero`, etc.) on every request
  DTO, now including job salary/experience ranges (added this audit pass)
- ✅ Resume upload restricted to PDF by content-type + extension check, 5MB max, stored under a
  server-generated filename (the candidate's own profile UUID) — no path traversal from a
  malicious original filename
- ⬜ File content itself isn't scanned (no malware/AV scan on uploaded PDFs) — acceptable for an
  internal/small-scale tool, add a scanning step (e.g. ClamAV) if this becomes public-internet-facing
  at scale

## Transport & CORS

- ⬜ **No HTTPS/TLS configured anywhere in this repo** — `docker-compose.yml` serves plain HTTP.
  Any real deployment MUST sit behind a TLS terminator (nginx/Caddy/your cloud LB) — see
  `docs/DEPLOYMENT_CHECKLIST.md`
- ✅ CORS is now configurable (`CORS_ALLOWED_ORIGINS`), defaults to `*` for local dev
- ⬜ **You must set `CORS_ALLOWED_ORIGINS` to your real domain before going live** — the `*`
  default combined with `allowCredentials(true)` is fine for JWT-in-header auth (no cookies
  involved) but is still overly permissive for a production API
- ✅ CSRF disabled deliberately and correctly — this API is stateless (JWT in header, no
  cookie-based session), so CSRF protection doesn't apply the way it would to a cookie-auth app

## Secrets & configuration

- ⬜ **`JWT_SECRET` defaults to a placeholder value visible in this repo's history.** This is the
  single most important item on this checklist — generate a real secret
  (`openssl rand -base64 48`) and set it via env var before any deployment anyone but you can reach
- ⬜ `DB_PASSWORD` defaults to `root` — change it
- ✅ `.gitignore` now excludes `.env` and other secret-shaped files (added this audit pass — verify
  no `.env` was ever previously committed if you initialize git from existing history)
- ✅ Error responses no longer leak raw exception messages/stack traces to the client (fixed this
  audit pass — the generic handler now logs server-side and returns a safe message)

## Infrastructure

- ⬜ Containers currently run as root inside the container (default for the base images used) —
  add a non-root `USER` directive in both Dockerfiles for defense-in-depth. Needs testing since the
  backend writes to `/app/uploads` at runtime — the directory's ownership needs to match whatever
  non-root user you add
- ✅ MySQL is not exposed on any host port by default (removed during this troubleshooting
  session) — reduces attack surface if this ever runs on a shared host
- ⬜ No network segmentation beyond Docker's default bridge network — fine for a single-host
  deployment, revisit if this moves to a multi-host/Kubernetes setup
- ⬜ No secrets manager integration (Vault, AWS Secrets Manager, etc.) — env vars via `.env` are
  adequate for a small deployment, but rotate `JWT_SECRET` and DB credentials periodically and
  don't rely on `.env` files sitting on disk indefinitely for anything larger

## Dependency hygiene

- ⬜ No automated dependency vulnerability scanning configured (Dependabot, `mvn
  dependency-check`, `npm audit` in CI). Add at least a periodic manual `npm audit` and Maven
  OWASP dependency-check before each release
- ⬜ Zero automated tests in the repo — this isn't a security item per se, but untested code is
  where security regressions hide. See the recommendations in the last audit report

## Logging & monitoring

- ✅ Verbose SQL/DEBUG logging now off by default (`SHOW_SQL`, `APP_LOG_LEVEL` — added this audit
  pass), reducing the chance of sensitive data ending up in logs
- ⬜ No centralized/durable log shipping — container logs are ephemeral (lost on container
  removal). Add a log driver or shipping agent before relying on logs for incident response
- ⬜ No alerting on repeated auth failures, 5xx spikes, etc. — worth adding once this has real
  traffic
