# Project Presentation — Shivani Technologies Job Portal

A structured explanation of this project suitable for presenting to HR, a hiring panel, or in an
interview setting.

## Project Overview

A full-stack, multi-role job portal built for Shivani Technologies. It covers the complete
recruitment lifecycle: companies register and post jobs (once verified by an admin), candidates
search and apply, administrators manage the whole platform (categories, jobs, companies, staff,
communications), and internal employees get scoped logins. Built with Spring Boot, React, and
MySQL, fully containerized with Docker.

## Objectives

1. Replace a manual, spreadsheet/email-based hiring process with a centralized system.
2. Support four distinct user roles with clearly separated permissions.
3. Make the platform self-service for employers (post their own jobs) while keeping admin oversight
   (verification gate before any company can post).
4. Build it to a standard where every claim about "it works" is backed by an actual runtime test
   against a live, running instance — not just code that compiles.

## Architecture

Three-tier, containerized:

```
React SPA (nginx, port 5173)
        │  JSON over HTTPS/HTTP
        ▼
Spring Boot REST API (port 8080)
        │  JDBC
        ▼
MySQL 8 (internal network only)
```

- **Stateless JWT authentication** — no server-side session, so the API scales horizontally without
  sticky sessions.
- **Centralized authorization** — every route's role requirement is declared once, in
  `SecurityConfig`, rather than scattered as annotations across every controller. This made it easy
  to audit: I could verify every single endpoint's access rule against one file.
- **Layered backend**: controller → service → repository → entity, standard Spring conventions, no
  business logic in controllers.
- **One React SPA** with role-aware routing — a single `ProtectedRoute` component gates access by
  role, and the nav bar itself only renders links a given role can actually use.

## Database Design

Core entities: `User` (email/password/role, one row per login regardless of role) with role-specific
profile tables (`CandidateProfile`, `Company`, `EmployeeProfile`) linked 1:1. `Job` references
lookup tables (`JobCategory`, `JobDesignation`, `JobLocation`) and a many-to-many `Skill` set.
`JobApplication` is the join between a candidate and a job, carrying its own status.

Design decisions worth calling out:
- **Single `users` table with a `role` enum**, not separate tables per role — simplifies
  authentication (one login path for everyone) while still letting each role have its own
  profile shape via the 1:1 side tables.
- **UUID primary keys**, stored as `binary(16)` (Hibernate 6's default) rather than auto-increment
  integers — avoids exposing sequential IDs and works cleanly across the eventual move to a
  distributed setup if ever needed. (This did produce one real gotcha during setup — documented
  under "Challenges" below.)
- **Lookup tables are admin-managed**, not free text on the job — keeps search/filtering consistent
  (no "Bangalore" vs "Bengaluru" typo fragmentation).

## Authentication

- Passwords hashed with BCrypt — never stored, logged, or returned in any API response.
- Login issues a signed JWT (HMAC-SHA512) carrying the user's email as subject and role as a claim.
- Every authenticated request is validated by a single filter (`JwtAuthFilter`): signature check,
  expiry check, and then — critically — a live lookup of the user's *current* enabled/role status
  from the database, not just trusting what's baked into the token. This means disabling an
  account takes effect immediately, even against a token issued before the disable happened.
- Candidate registration requires OTP email verification before certain flows are considered fully
  verified (the account can still log in immediately — verification status is informational and
  gates nothing security-critical, matching how many real signup flows behave).

## Security

- 100% JPA/Hibernate repository access — no raw SQL string concatenation anywhere, no SQL
  injection surface.
- React auto-escapes all rendered text — no `dangerouslySetInnerHTML` anywhere, no XSS surface from
  user-supplied content (job descriptions, profile fields, etc.).
- File upload (resume) restricted to PDF by content-type *and* filename extension, capped at 5MB,
  stored under a server-generated filename (the candidate's own profile UUID) — no path traversal
  risk from a malicious original filename.
- Ownership checks everywhere they matter: an employer can only edit/close their *own* company's
  jobs (enforced server-side, not just hidden in the UI); a candidate's profile/resume endpoints
  always resolve from their own JWT, never a path parameter.
- Centralized, sanitized error handling — no stack traces or raw exception messages ever reach the
  client; everything is logged server-side and a safe, generic message returned instead.
- Full checklist in `docs/SECURITY_CHECKLIST.md`, including what's still open (rate limiting, TLS,
  secrets rotation) — documented honestly rather than glossed over.

## Technology Stack

| Layer | Choice | Why |
|---|---|---|
| Backend | Java 17 + Spring Boot 3.2 | Mature, well-documented, strong typing catches errors at compile time |
| Security | Spring Security + JWT | Industry-standard stateless auth |
| ORM | Spring Data JPA / Hibernate 6 | Reduces boilerplate, but required understanding its UUID storage internals (see Challenges) |
| Database | MySQL 8 | Widely deployed, free, good tooling |
| Frontend | React 18 + Vite | Fast dev loop, component reuse across 4 roles' worth of UI |
| Styling | Tailwind CSS | Consistent design system without a heavy component library |
| Containerization | Docker + Compose | One-command reproducible environment, matches how it'd actually deploy |

## Challenges

1. **Hibernate stores UUIDs as `binary(16)`, not strings.** The natural first attempt at manually
   inserting a seed admin user (`INSERT ... VALUES (UUID(), ...)`) fails with `Data too long for
   column 'id'` — MySQL's `UUID()` returns a 36-character string, but the column expects 16 raw
   bytes. Fix: `UUID_TO_BIN(UUID())`. This only surfaced by actually running the insert against a
   live database, not from reading the entity code.
2. **A Java `Stream.toList()` gotcha caused a real 500 error.** Populating a candidate's custom
   skills list via `.stream()...toList()` returns an *immutable* list. Hibernate manages that field
   as a JPA `@ElementCollection`, and throws `UnsupportedOperationException` when it tries to
   internally track changes to an immutable collection. This was invisible in code review — it only
   failed when the profile-update endpoint was actually called with real data, producing a genuine
   runtime crash. Fixed by using a real mutable `ArrayList`.
3. **Windows/Git-Bash argument-mangling in the test tooling.** Building an automated test suite that
   works identically in bash and native Windows Command Prompt required understanding two separate
   sets of quoting/escaping rules (POSIX shell vs. `cmd.exe`'s token-by-token expansion), plus a
   Git-Bash-specific curl quirk where a POSIX-style temp file path combined with multipart-upload
   modifiers gets silently corrupted — fixed by converting to a Windows-style path first.
4. **Employer Zone's approval gate** needed careful ordering: a company must exist, be verified by
   an admin, *and* only then be allowed to post — with the server enforcing this regardless of what
   the UI shows, so a request replayed or crafted by hand still gets rejected correctly.

## Solutions

Each challenge above was fixed at the root cause, not worked around — the goal throughout was
"understand why this actually broke," not just make the specific test pass. Every fix was verified
by re-running the affected flow against a live instance afterward, not just by re-reading the diff.

## Key Features

- Four distinct roles, each with a purpose-built dashboard and permission boundary
- Full job lifecycle: create, edit, search/filter, apply, close, delete — with referential-integrity
  protection (can't delete a job that already has applicants; get a clear message instead)
- Employer self-service gated by admin verification
- Candidate profile system with resume upload/download and a live completion-percentage calculation
- Admin-driven, targeted or broadcast communications (email/SMS) with a real recipient picker
- OTP-based email verification on signup

## Deployment

Three Docker containers (MySQL, backend, frontend/nginx) orchestrated by one `docker-compose.yml`.
`docker compose up --build` builds and starts the entire stack from source. Verified end to end:
a full `docker compose down && docker compose up` (complete container teardown and recreation, not
just a restart) was performed during development, and all data — user accounts, jobs, companies,
even uploaded resume files — was confirmed intact afterward, proving the volume-backed persistence
actually works rather than just being configured and untested.

## Testing

- **Automated smoke test**: a from-scratch API test script (available in both bash and native
  Windows batch form) exercising all four roles, full CRUD, authentication/authorization edge cases,
  file upload validation, and referential-integrity error handling — **63 checks, run against the
  live application, all passing.**
- **Manual QA**: a structured checklist (`docs/UAT_REPORT.md`) covering rendered UI, browser
  console, responsive layout across mobile/tablet/desktop, and Docker-restart persistence — things
  an API-level test can't see.
- Full detail and results in `TEST_REPORT.md`.

## Lessons Learned

- **Static code review and runtime testing catch different classes of bugs.** Both real bugs in
  this project (the immutable-list crash, the UUID storage format) were invisible to careful
  reading and only surfaced by actually executing the code against a live database — reinforcing
  that "the code looks right" and "the code works" are different claims requiring different
  verification methods.
- **Centralizing cross-cutting concerns (auth rules, error handling) pays off during audits** — being
  able to check every route's permission in one file, and every error response's shape in one
  handler, made a full security pass tractable instead of a per-file scavenger hunt.
- **Environment quirks are real engineering problems**, not distractions — the Windows/Git-Bash
  path-mangling issue cost real debugging time and needed the same rigor as an application bug.

## Future Scope

- Connect a real transactional email provider (SendGrid/SES) and Twilio for SMS — code is fully
  built and tested against the logging fallback, just needs real credentials
- Automated unit/integration test suite (JUnit + Testcontainers, Vitest for the frontend)
- TLS termination and a rate limiter in front of authentication endpoints
- Resume viewing for employers/admins reviewing an application (currently candidate-only)
- Performance tuning (query fetch strategy) for job listings at larger scale
