# Test Report

This report documents actual runtime verification performed against a live, Dockerized instance of
this application — not just static code review. Every claim below reflects a real command that was
run and a real response that was observed.

## Build Verification

| Component | Result |
|---|---|
| Backend (`mvn clean package`, via Docker build) | ✅ `BUILD SUCCESS` — 82 source files compiled |
| Frontend (`npm` build, via Docker build) | ✅ Image built successfully |
| One real compile error was found and fixed during this process: `CandidateProfileUpdateRequest.java` used `@NotNull` without importing it. Confirmed by an actual `mvn` compile failure, not inspection. |

## Docker Verification

```
docker compose ps
NAME               STATUS
shivani-backend    Up (healthy startup, no errors in logs)
shivani-frontend   Up
shivani-mysql      Up (healthy)
```

- `docker compose up --build -d` — full stack builds and starts successfully.
- Backend startup logs reviewed line by line: no errors, no failed bean initialization, no
  connection-pool failures.
- `curl http://localhost:8080/api/jobs/search` → `200`
- `curl http://localhost:5173/` → `200`

## Smoke Test Results

Automated end-to-end test suite (`scripts/smoke-test.sh`), run against the live stack:

```
================================================
 SMOKE TEST SUMMARY
================================================
 Passed: 63
 Failed: 0
 All checks passed.
```

Coverage: reachability, candidate registration/OTP/login (including wrong-OTP and wrong-password
rejection), admin login, full lookup CRUD (categories/designations/locations/skills) with
authorization checks, job creation with validation (salary range, negative values), job editing
(admin and employer, with ownership enforcement and persistence verification via re-fetch), job
search across all filter dimensions, malformed-input handling (invalid UUID, malformed JSON),
candidate apply/duplicate-rejection, candidate profile read/update/validation, resume upload
(valid PDF accepted, non-PDF rejected) and download, candidate dashboard, employer registration
and gated job posting, admin company verification, employer job management with ownership checks,
employee creation and disabled-account enforcement (including that a **pre-existing JWT token
issued before disabling stops working**, not just future logins), admin dashboard stats, mail/SMS
endpoint responses, and delete-with-dependents conflict handling (job with an applicant, category
still in use by a job).

Two real bugs were found and fixed via this process, not by reading code:

1. **500 Internal Server Error on every candidate profile update.** Root cause:
   `CandidateProfileService` populated a Hibernate `@ElementCollection` field using Java's
   `Stream.toList()`, which returns an immutable list; Hibernate throws
   `UnsupportedOperationException` when it tries to manage an immutable collection internally.
   Fixed by using a real mutable `ArrayList`. Verified fixed by re-running the exact failing request
   and confirming `200` with the expected `profileCompletionPercentage` in the response.
2. **Broken "create first admin" SQL** in the documentation: `UUID()` produces a 36-character
   string, but the `id` column is `binary(16)`. Reproduced the exact failure
   (`Data too long for column 'id'`), fixed with `UUID_TO_BIN(UUID())`, and confirmed a real login
   succeeded afterward.

Three script-level bugs were also found and fixed (in the test tooling itself, not the application):
a missing function argument that crashed the script under `set -u`, a Git-Bash/MSYS path-mangling
issue that broke the resume-upload test's multipart request, and a test-ordering bug that tested
OTP rejection *after* the account was already verified (giving a false failure).

## Runtime Verification — All Four Roles

| Role | Verified live |
|---|---|
| **Administrator** | Login, lookup CRUD, job CRUD + edit, company verify/reject, employee create/disable, dashboard stats, mail/SMS send |
| **Employer** | Company registration, blocked-until-verified enforcement, job post/edit/close, ownership boundaries (can't touch another company's job) |
| **Employee** | Admin-created login works, disabled-account login rejected, disabled account's *existing* token rejected |
| **Candidate** | Registration, OTP verification (correct and incorrect code), login, profile read/update, resume upload/download, job search/apply, duplicate-application rejection, dashboard |

## Feature Verification

Every feature in the original specification was exercised with a real HTTP request and a real,
inspected response:

- Registration (candidate + company) ✅
- OTP generation and verification (correct + incorrect code) ✅
- Login (all four roles, including wrong-password and disabled-account rejection) ✅
- Job CRUD (create, read, update, delete) ✅
- Job editing — confirmed the edit **actually persists** by re-fetching the job after the edit and
  comparing the title, not just checking the HTTP status code ✅
- Job search (7 independent filter dimensions, individually verified) ✅
- Job application (apply, duplicate-prevention) ✅
- Resume upload (PDF accepted) and rejection (non-PDF rejected) ✅
- Resume download (byte stream retrieved successfully) ✅
- Candidate profile (full read/write cycle, including a real validation-rejection case) ✅
- Employer workflow (register → blocked → admin verifies → can post → can edit → can close) ✅
- Admin workflow (all lookup/job/company/employee/dashboard/notification endpoints) ✅
- Notifications (recipient listing, mail send, SMS send — delivery itself depends on configuring a
  real provider, which is a configuration step, not a code gap; the full pipeline executes and
  returns a correct attempted/sent/failed/skipped count) ✅

## Security Verification

- Disabled account's **pre-existing JWT** confirmed rejected (not just new login attempts) — this
  is a meaningful check, since many JWT implementations only block *new* logins and miss this case
- Role boundaries confirmed: a candidate token rejected (`403`) against admin-only endpoints
- Ownership boundaries confirmed: an employer token rejected (`403`) when attempting to edit/close a
  job belonging to a different company (or to admin)
- Error responses confirmed to never leak internal exception details (checked the actual JSON body
  of a 500, not just its status code)
- Referential-integrity protection confirmed: deleting a job with an existing applicant returns a
  clean `409` with an actionable message, not a raw database error; same for a category still in
  use by a job

Full static security review (dependency-level, config-level) is in `docs/SECURITY_CHECKLIST.md`.

## Database Persistence Verification

A **full container teardown and recreation** was performed (`docker compose down` followed by
`docker compose up -d` — not merely a restart):

| Metric | Before | After |
|---|---|---|
| Users | 15 | 15 |
| Jobs | 4 | 4 |
| Companies | 4 | 4 |
| Applications | 4 | 4 |
| Candidate profiles | 6 | 6 |

Admin login re-tested and confirmed working immediately after recreation. Two previously-uploaded
resume files were confirmed still present on disk inside the (fresh) backend container, proving the
named Docker volume — not just the container filesystem — is what's actually persisting the data.

## Manual Testing Summary

A structured manual QA checklist covering rendered UI, browser console errors, responsive layout
(mobile/tablet/desktop breakpoints), and file-picker-driven resume upload is maintained in
`docs/UAT_REPORT.md`. That checklist should be walked through once more, in an actual browser,
before final submission — it covers things (visual rendering, console warnings, layout at small
viewport widths) that an API-level test fundamentally cannot see.

## Known Limitations

- No real email/SMS provider connected (logs instead of delivering) — see
  `docs/ENVIRONMENT_VARIABLES.md`
- No automated unit/integration test suite (JUnit/Vitest) — verification here is comprehensive
  black-box/API-level plus manual QA, not unit-level code coverage
- No TLS/HTTPS, no rate limiting on auth endpoints — both documented in
  `docs/SECURITY_CHECKLIST.md` as pre-production items
- `JWT_SECRET` ships with a placeholder default that must be changed for any real deployment
