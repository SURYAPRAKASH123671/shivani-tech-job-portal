# Shivani Technologies — Job Portal Backend

Spring Boot backend covering the full build plan: JWT auth with OTP email verification, Admin
lookup/job/employee CRUD, Employer Zone (company verification + job posting), Candidate
search + apply, an admin stats dashboard, and bulk/single mail + SMS.

**One thing is genuinely not "done" yet: real email and SMS delivery.** The code paths all
exist and are wired up end to end, but until you set `MAIL_*` and `TWILIO_*` env vars to a real
provider's credentials (see below), sends are logged instead of delivered — nothing crashes,
nothing is faked as successful, it just doesn't leave the server. This affects: OTP codes on
candidate signup, and the admin mail/SMS broadcast page.

## Stack

Java 17 · Spring Boot 3.2.5 · Spring Security (JWT) · Spring Data JPA · MySQL · Lombok

## 1. Prerequisites

- JDK 17+
- Maven 3.9+ (or use your IDE's bundled Maven)
- MySQL 8+ running locally (or update `DB_URL` to point elsewhere)

## 2. Configure

All config is in `src/main/resources/application.yml`, overridable via environment variables.
Nothing is hardcoded except safe local defaults — **set these before deploying anywhere real**:

| Variable | Default | Notes |
|---|---|---|
| `DB_URL` | `jdbc:mysql://localhost:3306/shivani_job_portal?createDatabaseIfNotExist=true` | DB auto-creates on first run |
| `DB_USERNAME` | `root` | |
| `DB_PASSWORD` | `root` | |
| `JWT_SECRET` | placeholder string | **change this** — must be a long random value in any real deployment |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | |
| `SERVER_PORT` | `8080` | |
| `PORT` | falls back to `SERVER_PORT`, then `8080` | Takes priority over `SERVER_PORT` when set - most PaaS hosts (Render, Heroku, etc.) inject this automatically |
| `MAIL_HOST` | *(empty)* | SMTP host — e.g. `smtp.gmail.com`, or SendGrid's `smtp.sendgrid.net`. Leave unset and OTP/notification emails just get logged instead of sent |
| `MAIL_PORT` | `587` | |
| `MAIL_USERNAME` / `MAIL_PASSWORD` | *(empty)* | SMTP credentials — for Gmail use an app password, for SendGrid the username is literally `apikey` and the password is your API key |
| `MAIL_FROM` | `no-reply@shivanitech.in` | From address on outgoing mail |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | *(empty)* | From your Twilio console. Leave unset and SMS sends just get logged instead of sent |
| `OTP_EXPIRY_MINUTES` | `10` | How long a candidate signup OTP stays valid |
| `CORS_ALLOWED_ORIGINS` | `*` | Comma-separated list, e.g. `https://shivanitech.in,https://www.shivanitech.in`. **Lock this down before a real deployment** — the default allows any origin |
| `SHOW_SQL` | `false` | Set to `true` to log every SQL statement (dev debugging only) |
| `APP_LOG_LEVEL` | `INFO` | Set to `DEBUG` for more verbose application logs |
| `UPLOADS_DIR` | `uploads` | Where resume PDFs are written on disk - mount this as a volume in Docker so uploads survive container recreation |

`ddl-auto` is set to `update`, so tables are created automatically on first boot — no manual schema needed.

## 3. Run

From the `backend/` directory (where this file lives):

```bash
mvn spring-boot:run
```

App starts on `http://localhost:8080`. First boot creates all tables (empty — no seed data yet).

## 4. Roles

Every user has exactly one role, set at registration or by an admin: `ADMIN`, `CANDIDATE`, `EMPLOYER`, `EMPLOYEE`.
The JWT carries the role as a claim; Spring Security maps it to `ROLE_<name>` and enforces it per path prefix
(`/api/admin/**` → ADMIN, `/api/candidate/**` → CANDIDATE, `/api/employer/**` → EMPLOYER).

There's no public "register as admin" endpoint on purpose — insert the first admin directly into the
`users` table (with a BCrypt-hashed password) or add a one-off seed script when you get there.

## 5. Endpoints

### Auth — public

| Method | Path | Body |
|---|---|---|
| POST | `/api/auth/register/candidate` | `email, password, fullName, phone` — issues a JWT immediately, but also emails a 6-digit OTP; `verified: false` in the response until confirmed |
| POST | `/api/auth/register/company` | `email, password, companyName, contactEmail, contactPhone` |
| POST | `/api/auth/login` | `email, password` → returns JWT + `verified` flag |
| POST | `/api/auth/verify-otp` | `email, otp` → marks the candidate verified |
| POST | `/api/auth/resend-otp` | `email` → issues and emails a fresh code |

### Admin — lookup data (`ROLE_ADMIN`, prefix `/api/admin`)

| Method | Path |
|---|---|
| POST / GET | `/categories`, `/designations`, `/locations`, `/skills` |
| DELETE | `/categories/{id}`, `/designations/{id}`, `/locations/{id}`, `/skills/{id}` |

Body for POST on all four: `{ "name": "..." }`

### Admin — jobs (`ROLE_ADMIN`)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/admin/jobs` | create; see `JobRequest` fields |
| PUT | `/api/admin/jobs/{id}` | full update |
| PATCH | `/api/admin/jobs/{id}/close` | marks CLOSED, stops accepting applications |
| DELETE | `/api/admin/jobs/{id}` | |
| GET | `/api/admin/jobs` | list everything, any status |

### Public / candidate — browse

| Method | Path | Notes |
|---|---|---|
| GET | `/api/jobs/search` | query params: `categoryId, designationId, locationId, skillId, companyId, minSalary, maxExperience, qualification`, plus `page`, `size`, `sort` — all optional, only OPEN jobs returned |
| GET | `/api/jobs/{id}` | single job detail |

### Candidate — apply (`ROLE_CANDIDATE`)

| Method | Path |
|---|---|
| POST | `/api/candidate/jobs/{id}/apply` |

Rejects a second application to the same job (409) and applications to a CLOSED job (400).

### Admin — companies (`ROLE_ADMIN`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/companies` | optional `?status=PENDING\|ACTIVE\|REJECTED` |
| PATCH | `/api/admin/companies/{id}/verify` | moves a company to `ACTIVE` — required before it can post jobs |
| PATCH | `/api/admin/companies/{id}/reject` | |

### Admin — employees (`ROLE_ADMIN`)

| Method | Path | Body |
|---|---|---|
| POST | `/api/admin/employees` | `email, password, fullName, designation` — creates a `ROLE_EMPLOYEE` login |
| GET | `/api/admin/employees` | |
| PATCH | `/api/admin/employees/{id}/disable`, `/enable` | |

### Admin — dashboard (`ROLE_ADMIN`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/admin/dashboard` | counts: candidates, employees, companies by status, jobs by status/source, total applications |

### Admin — mail & SMS (`ROLE_ADMIN`)

| Method | Path | Body |
|---|---|---|
| POST | `/api/admin/notifications/mail` | `audience: CANDIDATE\|EMPLOYEE\|COMPANY, recipientIds?: [...], subject, body` |
| POST | `/api/admin/notifications/sms` | `audience, recipientIds?, message` |

Omit `recipientIds` to broadcast to everyone in that audience. Response reports `attempted`,
`sent`, `failed`, `skippedNoContact` (recipients with no email/phone on file). Sending is a no-op
(logged only) until `MAIL_*`/`TWILIO_*` are configured — see the config table above.

### Employer — company + jobs (`ROLE_EMPLOYER`)

| Method | Path | Notes |
|---|---|---|
| GET | `/api/employer/company` | your own company's verification status |
| POST | `/api/employer/jobs` | create a job under your company — 403 until an admin has verified you |
| PUT | `/api/employer/jobs/{id}` | update your own job |
| PATCH | `/api/employer/jobs/{id}/close` | |
| GET | `/api/employer/jobs` | your own jobs only |

## 6. Try it end to end

```bash
# 1. Register a candidate
curl -X POST localhost:8080/api/auth/register/candidate \
  -H "Content-Type: application/json" \
  -d '{"email":"anu@example.com","password":"pass123","fullName":"Anu Kumar","phone":"9876543210"}'
# -> { "token": "...", "email": "anu@example.com", "role": "CANDIDATE" }

# 2. Log in (or just reuse the token from step 1)
curl -X POST localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anu@example.com","password":"pass123"}'

# 3. Search open jobs (no auth needed)
curl "localhost:8080/api/jobs/search?minSalary=40000"

# 4. Apply (needs the candidate's token)
curl -X POST localhost:8080/api/candidate/jobs/<jobId>/apply \
  -H "Authorization: Bearer <token>"
```

To create jobs/categories, insert an admin row directly in MySQL first (see Roles above), log in as that
admin, then hit the `/api/admin/**` endpoints with that token.

## 7. What's next

Everything in the original build plan is implemented. The one open item is genuinely outside
what code alone can finish: **plug in a real email provider (SMTP) and a real SMS provider
(Twilio)** by setting the env vars in the config table above. Until then, OTP codes and admin
broadcasts are logged to the console instead of delivered — copy the code out of the backend
logs if you need to complete a candidate verification without a real mail provider set up yet.

## 8. Project layout

```
src/main/java/com/shivanitech/jobportal/
  config/        Spring Security config
  security/      JWT util, filter, UserDetailsService
  entity/        JPA entities + enums
  repository/    Spring Data repositories
  dto/           request/response DTOs (auth, job, lookup)
  service/       business logic
  controller/    REST endpoints
  exception/     custom exceptions + global handler
```
