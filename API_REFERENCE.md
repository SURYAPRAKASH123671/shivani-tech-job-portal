# API Reference

Base URL (local/Docker): `http://localhost:8080`

All authenticated endpoints require the header `Authorization: Bearer <jwt-token>`, obtained from
`/api/auth/login` or a registration endpoint. All request/response bodies are JSON unless noted.

---

## Authentication (`/api/auth`) — public, no token required

### `POST /api/auth/register/candidate`
Registers a new candidate and issues a JWT immediately (verification is informational, not
security-gating). Also emails a 6-digit OTP.

**Request:**
```json
{ "email": "jane@example.com", "password": "pass123", "fullName": "Jane Doe", "phone": "9876543210" }
```
**Response `201`:**
```json
{ "token": "eyJhbGciOi...", "email": "jane@example.com", "role": "CANDIDATE", "verified": false }
```

### `POST /api/auth/register/company`
Registers a new employer/company account. Status starts `PENDING` until an admin verifies it.

**Request:**
```json
{ "email": "hr@acme.com", "password": "pass123", "companyName": "Acme Corp", "contactEmail": "hr@acme.com", "contactPhone": "9876543210" }
```
**Response `201`:** same shape as candidate registration, `"role": "EMPLOYER"`.

### `POST /api/auth/login`
**Request:** `{ "email": "...", "password": "..." }`
**Response `200`:** `{ "token": "...", "email": "...", "role": "...", "verified": true|false }`
**`401`** on wrong credentials, **`403`** if the account is disabled.

### `POST /api/auth/verify-otp`
**Request:** `{ "email": "...", "otp": "123456" }`
**Response:** `204 No Content` on success. `400` if the code is wrong or expired.

### `POST /api/auth/resend-otp`
**Request:** `{ "email": "..." }`
**Response:** `204 No Content` (issues and emails a fresh code).

---

## Public Jobs (`/api/jobs`) — no token required

### `GET /api/jobs/search`
Query params (all optional): `categoryId`, `designationId`, `locationId`, `skillId`, `companyId`,
`minSalary`, `maxExperience`, `qualification`, plus `page`, `size`, `sort`. Returns only `OPEN` jobs.

**Response `200`** (Spring `Page` wrapper):
```json
{ "content": [ { "id": "...", "title": "Backend Engineer", "category": "Engineering", "...": "..." } ],
  "totalElements": 10, "totalPages": 1, "number": 0, "size": 20 }
```

### `GET /api/jobs/{id}`
**Response `200`:** full job detail (see `JobResponse` shape under Admin Jobs below). **`404`** if
not found. **`400`** if `{id}` isn't a valid UUID.

### `GET /api/jobs/companies`
**Response `200`:** `[{ "id": "uuid", "name": "Acme Corp" }]` — active (verified) companies only,
for populating the "Company" filter on the job search page. Deliberately excludes owner/contact
fields present on the admin-only company endpoints.

---

## Admin — Lookups (`/api/admin/categories|designations|locations|skills`) — `ROLE_ADMIN` for
write, public for read

| Method | Path | Auth |
|---|---|---|
| GET | `/api/admin/categories` (and `designations`, `locations`, `skills`) | Public |
| POST | same paths | `ROLE_ADMIN` |
| DELETE | `.../{id}` | `ROLE_ADMIN` |

**POST request:** `{ "name": "Engineering" }`
**Response `201`:** `{ "id": "...", "name": "Engineering" }`
**DELETE response:** `204`, or `409` if still referenced by a job/candidate preference.

---

## Admin — Jobs (`/api/admin/jobs`) — `ROLE_ADMIN`

### `POST /api/admin/jobs`
**Request:**
```json
{
  "title": "Backend Engineer", "description": "...",
  "categoryId": "uuid", "designationId": "uuid", "locationId": "uuid",
  "skillIds": ["uuid", "uuid"],
  "salaryMin": 800000, "salaryMax": 1400000,
  "experienceMin": 2, "experienceMax": 5,
  "qualification": "B.Tech"
}
```
**Response `201`:**
```json
{
  "id": "uuid", "title": "Backend Engineer", "description": "...",
  "companyName": null, "categoryId": "uuid", "category": "Engineering",
  "designationId": "uuid", "designation": "Software Engineer",
  "locationId": "uuid", "location": "Bengaluru",
  "skillIds": ["uuid"], "skills": ["Java"],
  "salaryMin": 800000, "salaryMax": 1400000, "experienceMin": 2, "experienceMax": 5,
  "qualification": "B.Tech", "status": "OPEN", "postedByAdmin": true, "createdAt": "2026-01-01T00:00:00"
}
```
Validation: `400` if `salaryMin > salaryMax`, `experienceMin > experienceMax`, or any salary/
experience value is negative.

### `PUT /api/admin/jobs/{id}` — full update, same body shape as create.
### `PATCH /api/admin/jobs/{id}/close` — marks `CLOSED`, no body.
### `DELETE /api/admin/jobs/{id}` — `204`, or `409` if the job already has applicants (close it
instead).
### `GET /api/admin/jobs?postedByAdmin=true|false` — list all jobs, optional filter by source.

---

## Admin — Companies (`/api/admin/companies`) — `ROLE_ADMIN`

### `POST /api/admin/companies` — admin creates a company directly (distinct from the public
self-registration flow) — activated immediately, no PENDING step.
**Request:**
```json
{ "email": "hr@acme.com", "password": "min-6-chars", "companyName": "Acme Corp",
  "contactEmail": "hr@acme.com", "contactPhone": "9000000000" }
```
**Response `201`:** same shape as the list response below, `"status": "ACTIVE"`. Sends an
email/SMS notification to the company's contact email/phone (or the login email if no contact
email was given). `409` if the email is already registered.

### `GET /api/admin/companies?status=PENDING|ACTIVE|REJECTED` (status optional)
**Response `200`:**
```json
[{ "id": "uuid", "name": "Acme Corp", "ownerEmail": "hr@acme.com", "contactEmail": "...",
   "contactPhone": "...", "status": "PENDING", "verifiedAt": null, "createdAt": "..." }]
```
### `PATCH /api/admin/companies/{id}/verify` — moves to `ACTIVE`. Returns the updated company.
Sends an email/SMS notification to the company.
### `PATCH /api/admin/companies/{id}/reject` — moves to `REJECTED`. Sends an email/SMS
notification to the company.

---

## Admin — Employees (`/api/admin/employees`) — `ROLE_ADMIN`

### `POST /api/admin/employees`
**Request:** `{ "email": "...", "password": "...", "fullName": "...", "designation": "..." }`
**Response `201`:** `{ "id": "uuid", "fullName": "...", "designation": "...", "email": "...", "enabled": true, "createdAt": "..." }`
### `GET /api/admin/employees` — list all.
### `PATCH /api/admin/employees/{id}/disable` / `/enable` — `204`, no body.

---

## Admin — Dashboard (`/api/admin/dashboard`) — `ROLE_ADMIN`

### `GET /api/admin/dashboard`
**Response `200`:**
```json
{ "totalCandidates": 4, "totalEmployees": 1, "pendingCompanies": 0, "activeCompanies": 3,
  "rejectedCompanies": 0, "openJobs": 10, "closedJobs": 0, "jobsPostedByAdmin": 1,
  "jobsPostedByCompanies": 9, "totalApplications": 5 }
```

---

## Admin — Notifications (`/api/admin/notifications`) — `ROLE_ADMIN`

### `GET /api/admin/notifications/recipients?audience=CANDIDATE|EMPLOYEE|COMPANY`
**Response `200`:** `[{ "id": "uuid", "name": "...", "email": "...", "phone": "..." }]`

### `POST /api/admin/notifications/mail`
**Request:** `{ "audience": "CANDIDATE", "recipientIds": ["uuid"], "subject": "...", "body": "..." }`
(`recipientIds` optional — omit to broadcast to everyone in that audience.)
**Response `200`:** `{ "attempted": 3, "sent": 0, "failed": 0, "skippedNoContact": 0 }`
(`sent` stays 0 until a real `MAIL_HOST` is configured — see `docs/ENVIRONMENT_VARIABLES.md`.)

### `POST /api/admin/notifications/sms`
Same shape, with `"message"` instead of `"subject"`/`"body"`.

---

## Candidate — Profile (`/api/candidate/profile`) — `ROLE_CANDIDATE`

### `GET /api/candidate/profile`
**Response `200`:** full profile (personal/education/professional/skills/career/resume fields) plus
`profileCompletionPercentage`.

### `PUT /api/candidate/profile`
**Request (all fields optional except fullName):**
```json
{
  "fullName": "Jane Doe", "phone": "9876543210", "dob": "1998-05-10", "gender": "Female",
  "address": "...", "city": "Bengaluru", "state": "Karnataka", "country": "India", "pincode": "560001",
  "qualification": "B.Tech", "college": "...", "university": "...", "graduationYear": 2020,
  "percentageOrCgpa": "8.4 CGPA", "experienceYears": 2, "currentCompany": "...",
  "currentDesignation": "...", "currentSalary": 700000, "expectedSalary": 1100000,
  "noticePeriod": "30 days", "skillIds": ["uuid"], "customSkills": ["REST APIs"],
  "preferredLocationId": "uuid", "preferredDesignationId": "uuid", "preferredCategoryId": "uuid",
  "resumeUrl": "https://..."
}
```
**Response `200`:** the updated profile. **`400`** with a `fieldErrors` map on validation failure.

### `POST /api/candidate/profile/resume` (multipart/form-data)
Field name: `file`. Must be `application/pdf` content-type **and** a `.pdf` filename. Max 5MB.
**Response `200`:** updated profile with `resumeFileName` set. **`400`** if not a real PDF upload.

### `GET /api/candidate/profile/resume/download`
Streams the candidate's own uploaded PDF. **`404`** if none uploaded.

---

## Candidate — Dashboard (`/api/candidate/dashboard`) — `ROLE_CANDIDATE`

### `GET /api/candidate/dashboard`
**Response `200`:**
```json
{
  "welcome": { "fullName": "...", "email": "...", "profileCompletionPercentage": 57 },
  "stats": { "totalApplications": 2, "jobsSaved": 0, "activeApplications": 2, "interviewsScheduled": 0 },
  "recentApplications": [ { "applicationId": "...", "jobId": "...", "jobTitle": "...", "companyName": "...", "status": "APPLIED", "appliedAt": "..." } ],
  "recommendedJobs": [ { "id": "...", "title": "...", "...": "..." } ]
}
```

---

## Candidate — Jobs & Applications

### `POST /api/candidate/jobs/{id}/apply` — `ROLE_CANDIDATE`
**Response `201`** on success. **`409`** if already applied. **`400`** if the job is closed.

### `GET /api/candidate/applications` — `ROLE_CANDIDATE`
**Response `200`:** `[{ "applicationId": "...", "jobId": "...", "jobTitle": "...", "companyName": "...", "status": "APPLIED", "appliedAt": "..." }]`

---

## Employer (`/api/employer`) — `ROLE_EMPLOYER`

### `GET /api/employer/company` — your own company's verification status.
### `POST /api/employer/jobs` — same body as admin job creation. **`403`** until your company is
`ACTIVE` (admin-verified).
### `PUT /api/employer/jobs/{id}` — edit your own job. **`403`** if you don't own it.
### `PATCH /api/employer/jobs/{id}/close` — close your own job. **`403`** if you don't own it.
### `GET /api/employer/jobs` — list your own jobs only.

---

## Error Response Shape

Every error (validation, not-found, conflict, forbidden, etc.) returns this consistent shape:
```json
{
  "timestamp": "2026-01-01T00:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "fieldErrors": { "fullName": "must not be blank" }
}
```
`fieldErrors` is `null` except on `400` validation failures.

## Status Code Summary

| Code | Meaning in this API |
|---|---|
| 200 | Success (GET/PUT/PATCH returning a body) |
| 201 | Created (POST that creates a resource) |
| 204 | Success, no body (PATCH/DELETE/OTP actions) |
| 400 | Validation failure, malformed JSON, malformed path parameter |
| 401 | Bad credentials |
| 403 | Wrong role, disabled account, or ownership violation |
| 404 | Resource not found |
| 409 | Conflict (duplicate application, delete blocked by a dependent record) |
| 500 | Unhandled server error (logged server-side; response never leaks internals) |
