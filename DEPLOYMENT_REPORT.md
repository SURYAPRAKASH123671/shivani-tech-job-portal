# Deployment Report

## Summary

| | |
|---|---|
| **GitHub Repository** | https://github.com/SURYAPRAKASH123671/shivani-tech-job-portal |
| **Live Frontend URL** | https://shivani-tech-job-portal.vercel.app (Vercel) |
| **Live Backend API URL** | https://shivani-tech-job-portal.onrender.com (Render, Docker) |
| **Database Provider** | TiDB Cloud Serverless (MySQL-wire-compatible) |
| **Deployment Date** | 2026-07-26 |
| **Status** | Live and functional. One backend fix (commit `7bf3b90`) is pushed and awaiting redeploy on Render — see **Outstanding Action** below before calling this fully closed out. |

## Demo Credentials

All four roles are seeded with real data on the production database.

| Role | Email | Password | Notes |
|---|---|---|---|
| Administrator | `admin@shivanitech.in` | `Admin@12345` | Full platform access |
| Employer | `employer@shivanitech.in` | `Employer@123` | Company: Nexora Technologies, status ACTIVE (admin-verified), 3 open jobs posted |
| Employee | `employee@shivanitech.in` | `Employee@123` | Rahul Mehta, HR Coordinator |
| Candidate | `candidate@shivanitech.in` | `Candidate@123` | Ananya Rao, profile 86% complete, 1 job application on file |

## Architecture

Three independently-hosted pieces, matching the original Docker-based architecture but split
across managed platforms instead of one docker-compose stack:

```
 Vercel (React/Vite SPA)  --->  Render (Spring Boot, Docker)  --->  TiDB Cloud (MySQL-compatible)
 shivani-tech-job-portal          shivani-tech-job-portal            Serverless cluster
      .vercel.app                    .onrender.com
```

- Frontend and backend communicate over HTTPS/JSON with a stateless JWT in the `Authorization`
  header; CORS is configured via the `CORS_ALLOWED_ORIGINS` environment variable on the backend.
- The backend connects to TiDB over TLS (`sslMode=VERIFY_IDENTITY` in the JDBC URL).
- No code changes were needed to make the existing Docker-based app deployable this way — every
  value that differs between local Docker Compose and this deployment (`DB_URL`, `CORS_ALLOWED_ORIGINS`,
  `JWT_SECRET`, port binding) was already environment-variable-driven in `application.yml`.

## Environment Variables in Use

**Render (backend):**

| Variable | Purpose |
|---|---|
| `DB_URL` | TiDB JDBC URL, TLS-enabled |
| `DB_USERNAME` / `DB_PASSWORD` | TiDB credentials |
| `JWT_SECRET` | Signs auth tokens |
| `CORS_ALLOWED_ORIGINS` | Currently `*` — see Outstanding Action below |
| `SHOW_SQL` | `false` |

**Vercel (frontend):**

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | `https://shivani-tech-job-portal.onrender.com` |

## What Was Verified

Every item below was checked against the actual live URLs during this audit — not inferred from
code review.

**Endpoints:**
- `/actuator/health` → `200 {"status":"UP"}`
- `/v3/api-docs` → `200`, real generated OpenAPI spec
- `/swagger-ui/index.html` → `200`
- `/` → `404` (correct — nothing mapped there)
- `/api/jobs/search` (public) → `200`
- `/api/admin/**`, `/api/candidate/**`, `/api/employer/**` without a token → `403`

**CORS:** preflight `OPTIONS` from the Vercel origin against the Render API returns the correct
`access-control-allow-origin` header and succeeds.

**Authentication & authorization, all four roles:**
- Admin, employer, employee, and candidate all log in successfully and land on their correct
  dashboard.
- Role-based access is enforced server-side: an employee token gets `403` on admin, candidate, and
  employer-only endpoints; a candidate token can't reach admin endpoints; etc.

**CRUD & workflow:**
- Admin created categories, designations, locations, and skills via the lookup APIs.
- Admin verified the employer's company (`PENDING` → `ACTIVE`).
- Employer posted 3 real job openings with categories, skills, salary, and experience ranges.
- Candidate registered (OTP-verified), applied to a job, and was correctly blocked from applying
  twice (`409 Conflict`).
- Candidate profile update (personal info, education, skills, custom skills) saves correctly and
  the completion percentage recalculates (43% → 86% as fields were filled in).
- Admin dashboard aggregate stats match reality exactly (1 candidate, 1 employee, 1 active company,
  3 open jobs, 3 company-posted / 0 admin-posted, 1 total application).
- Admin disable/enable on the employee account works via the API.

## Bug Found and Fixed During This Audit

**`GET /api/candidate/profile` returned `500` once a candidate had any skills assigned**, even
though the dashboard endpoint (which reuses the same underlying data) worked correctly. This meant
the candidate's own profile page rendered blank at 0% completion in production despite the data
being saved correctly — a real, user-facing bug caught only by exercising the live app, not by
reading the code.

- **Root cause:** `CandidateProfile.customSkills` is a lazy-loaded `@ElementCollection`.
  `CandidateProfileService.toResponse()` passed it straight through
  (`.customSkills(profile.getCustomSkills())`) instead of materializing it into a plain list while
  still inside the transactional method — unlike the `skills` field two lines above it, which
  correctly does `.stream()...toList()`. Once the transaction closed and Jackson tried to serialize
  the response, touching the still-lazy collection threw `LazyInitializationException`, surfaced as
  a `500`.
- **Reproduced locally** with the exact same data shape before writing the fix, confirmed via the
  real stack trace (`could not initialize proxy - no Session`), and confirmed the fix resolves it
  (4/4 consecutive `200 OK` responses).
- **Fixed, committed, and pushed** as commit `7bf3b90` on `main`.

## Outstanding Action

1. **Redeploy Render on commit `7bf3b90` or later** (containing the fix above) — the production
   backend was still running the previous commit at the time of this audit, so the candidate
   profile bug is live in production until this redeploy happens. Auto-Deploy should pick this up
   automatically if enabled; otherwise **Manual Deploy → Deploy latest commit**.
2. **Tighten `CORS_ALLOWED_ORIGINS`** on Render from `*` to the exact Vercel origin
   (`https://shivani-tech-job-portal.vercel.app`) now that the frontend URL is final. This is a
   one-line environment variable change, no code required.
3. Re-run the candidate profile check (`GET /api/candidate/profile` while logged in as
   `candidate@shivanitech.in`) after the redeploy to confirm the fix is live.

## Known Limitations (Hosting-Tier, Not Application Bugs)

- **Render free tier cold starts:** the backend spins down after 15 minutes of inactivity; the
  first request after a lull takes 30-50 seconds. Upgrading off the free tier removes this.
- **Ephemeral filesystem:** uploaded resume PDFs do not survive a Render redeploy. The "resume by
  URL" option in the candidate profile is unaffected and is the recommended path for anything that
  needs to persist. A production deployment intended for real, ongoing use should move resume
  storage to S3-compatible object storage.
- **No real email/SMS provider connected:** `MAIL_HOST`/`TWILIO_*` are unset, so OTP codes and
  notifications are logged server-side rather than delivered. The entire pipeline (OTP generation,
  templating, send/log fallback) is built and tested against this fallback — connecting a real
  provider is a configuration change, not a code change.
- **TLS/HTTPS:** both Vercel and Render provide this automatically for their default domains, so
  this is already covered without extra configuration.
