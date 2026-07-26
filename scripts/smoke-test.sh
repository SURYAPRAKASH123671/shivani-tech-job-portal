#!/usr/bin/env bash
# End-to-end smoke test for the Shivani Technologies job portal API.
# Run this yourself (Git Bash / WSL / Linux) from the project root, with the
# stack already up: docker compose up -d
#
# It exercises every role and the core CRUD/auth/OTP/upload/search flows
# directly against the backend API, and prints a PASS/FAIL line per check
# plus a final summary. It does NOT touch the frontend UI, browser console,
# or responsive layout - see docs/UAT_REPORT.md for the manual checklist
# that covers those.
#
# Prerequisites:
#   - docker compose up -d (all three containers healthy)
#   - An admin user already created (see backend/README.md "Roles" section)
#     Set ADMIN_EMAIL / ADMIN_PASSWORD below or via env vars before running.
#
# Usage:
#   ADMIN_EMAIL=admin@shivanitech.in ADMIN_PASSWORD=admin123 bash scripts/smoke-test.sh

set -u

BASE_URL="${BASE_URL:-http://localhost:8080}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@shivanitech.in}"
ADMIN_PASSWORD="${ADMIN_PASSWORD:-admin123}"
STAMP=$(date +%s)
CANDIDATE_EMAIL="smoketest.candidate.${STAMP}@example.com"
COMPANY_EMAIL="smoketest.company.${STAMP}@example.com"
EMPLOYEE_EMAIL="smoketest.employee.${STAMP}@example.com"

PASS_COUNT=0
FAIL_COUNT=0
FAILED_TESTS=()

json_field() {
  # Extracts a top-level string/number/bool field from a flat JSON blob.
  echo "$1" | sed -n "s/.*\"$2\":\"\{0,1\}\([^,\"}]*\)\"\{0,1\}.*/\1/p"
}

pass() {
  PASS_COUNT=$((PASS_COUNT + 1))
  echo "  PASS - $1"
}

fail() {
  FAIL_COUNT=$((FAIL_COUNT + 1))
  FAILED_TESTS+=("$1 -- $2")
  echo "  FAIL - $1"
  echo "         $2"
}

section() {
  echo
  echo "=== $1 ==="
}

# expect_status CODE ACTUAL_CODE LABEL [BODY]
expect_status() {
  local expected="$1" actual="$2" label="$3" body="${4:-}"
  if [ "$actual" = "$expected" ]; then
    pass "$label (HTTP $actual)"
  else
    fail "$label (expected HTTP $expected, got $actual)" "$body"
  fi
}

# --- 0. Reachability ---
section "0. Reachability"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/search")
expect_status "200" "$CODE" "Backend responds to public search endpoint" ""

# --- 1. Candidate registration + OTP + verify + login ---
section "1. Candidate: register -> OTP -> verify -> login"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register/candidate" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CANDIDATE_EMAIL\",\"password\":\"pass123\",\"fullName\":\"Smoke Test Candidate\",\"phone\":\"9876500000\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Register candidate" "$BODY"
CANDIDATE_TOKEN=$(json_field "$BODY" "token")
VERIFIED=$(json_field "$BODY" "verified")
if [ "$VERIFIED" = "false" ]; then
  pass "New candidate starts unverified"
else
  fail "New candidate should start unverified" "got verified=$VERIFIED"
fi

sleep 1
OTP=$(docker compose logs backend 2>/dev/null | grep "EMAIL NOT SENT" | grep "$CANDIDATE_EMAIL" | tail -1 \
  | sed -n 's/.*verification code is \([0-9]\{6\}\).*/\1/p')
if [ -n "$OTP" ]; then
  pass "Extracted OTP from backend logs ($OTP)"
else
  fail "Could not find OTP in backend logs for $CANDIDATE_EMAIL" "Is MAIL_HOST actually configured and really sending? Check docker compose logs backend manually."
fi

# Wrong code MUST be tested before the correct one - once verified, the
# endpoint is idempotent (any code, even a wrong one, just no-ops with 204
# rather than re-validating), so testing this after success would exercise
# the wrong code path and give a false failure.
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CANDIDATE_EMAIL\",\"otp\":\"000000\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "400" "$CODE" "Verify OTP with wrong code is rejected" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/verify-otp" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CANDIDATE_EMAIL\",\"otp\":\"$OTP\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "204" "$CODE" "Verify OTP with correct code" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CANDIDATE_EMAIL\",\"password\":\"pass123\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "Candidate login after verification" "$BODY"
CANDIDATE_TOKEN=$(json_field "$BODY" "token")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$CANDIDATE_EMAIL\",\"password\":\"wrong-password\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "401" "$CODE" "Wrong password is rejected cleanly" "$(echo "$RESP" | sed '$d')"

# --- 2. Admin login ---
section "2. Admin login"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")
CODE=$(echo "$RESP" | tail -1)
BODY=$(echo "$RESP" | sed '$d')
if [ "$CODE" = "200" ]; then
  pass "Admin login (HTTP 200)"
  ADMIN_TOKEN=$(json_field "$BODY" "token")
else
  fail "Admin login failed - create one first (see backend/README.md)" "$BODY"
  echo
  echo "Cannot continue without an admin token. Aborting remaining tests."
  echo "$FAIL_COUNT failed, $PASS_COUNT passed so far."
  exit 1
fi

# --- 3. Admin: lookups CRUD ---
section "3. Admin: categories / designations / locations / skills CRUD"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/categories" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Smoke Category $STAMP\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Create category" "$BODY"
CATEGORY_ID=$(json_field "$BODY" "id")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/designations" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Smoke Designation $STAMP\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Create designation" "$BODY"
DESIGNATION_ID=$(json_field "$BODY" "id")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/locations" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Smoke Location $STAMP\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Create location" "$BODY"
LOCATION_ID=$(json_field "$BODY" "id")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/skills" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"name\":\"Smoke Skill $STAMP\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Create skill" "$BODY"
SKILL_ID=$(json_field "$BODY" "id")

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/categories")
expect_status "200" "$CODE" "List categories is public (GET)" ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/categories" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"No auth category\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "403" "$CODE" "Create category without a token is rejected" "$(echo "$RESP" | sed '$d')"

# --- 4. Admin: job CRUD + validation ---
section "4. Admin: job CRUD + validation"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/jobs" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Smoke Test Job\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\",\"skillIds\":[\"$SKILL_ID\"],\"salaryMin\":40000,\"salaryMax\":80000}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Admin creates a job" "$BODY"
JOB_ID=$(json_field "$BODY" "id")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/jobs" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Bad Salary Job\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\",\"salaryMin\":90000,\"salaryMax\":10000}")
CODE=$(echo "$RESP" | tail -1)
expect_status "400" "$CODE" "salaryMin > salaryMax is rejected" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/jobs" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Negative Salary Job\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\",\"salaryMin\":-500}")
CODE=$(echo "$RESP" | tail -1)
expect_status "400" "$CODE" "Negative salary is rejected" "$(echo "$RESP" | sed '$d')"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/$JOB_ID")
expect_status "200" "$CODE" "Public job detail view" ""

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/admin/jobs/$JOB_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"title\":\"Smoke Test Job (edited)\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\",\"salaryMin\":50000,\"salaryMax\":90000}")
CODE=$(echo "$RESP" | tail -1)
expect_status "200" "$CODE" "Admin edits a job" "$(echo "$RESP" | sed '$d')"

EDITED_BODY=$(curl -s "$BASE_URL/api/jobs/$JOB_ID")
EDITED_TITLE=$(json_field "$EDITED_BODY" "title")
if [ "$EDITED_TITLE" = "Smoke Test Job (edited)" ]; then
  pass "Job edit actually persisted (re-fetched title matches)"
else
  fail "Job edit did not persist" "got title='$EDITED_TITLE'"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/search?categoryId=$CATEGORY_ID"); expect_status "200" "$CODE" "Search filtered by category" ""
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/search?locationId=$LOCATION_ID"); expect_status "200" "$CODE" "Search filtered by location" ""
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/search?skillId=$SKILL_ID"); expect_status "200" "$CODE" "Search filtered by skill" ""
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/search?minSalary=40000&maxExperience=5"); expect_status "200" "$CODE" "Search filtered by salary+experience" ""

RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/jobs/00000000-0000-0000-0000-000000000000")
CODE=$(echo "$RESP" | tail -1)
expect_status "404" "$CODE" "Nonexistent job returns 404" "$(echo "$RESP" | sed '$d')"

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/jobs/not-a-uuid")
expect_status "400" "$CODE" "Malformed UUID path param returns 400 (not 500)" ""

# --- 5. Candidate: apply, duplicate apply, applications, profile, resume, dashboard ---
section "5. Candidate: apply / profile / resume / dashboard"
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/candidate/jobs/$JOB_ID/apply" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "201" "$CODE" "Candidate applies to job" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/candidate/jobs/$JOB_ID/apply" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "409" "$CODE" "Duplicate application is rejected" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/candidate/applications" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "200" "$CODE" "Candidate lists own applications" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/candidate/profile" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "200" "$CODE" "Candidate reads own profile" ""

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/candidate/profile" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -d '{"fullName":"Smoke Test Candidate Updated","phone":"9876500001","experienceYears":2,"skillIds":[],"customSkills":["Bash Scripting"]}')
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "Candidate updates profile" "$BODY"
COMPLETION=$(json_field "$BODY" "profileCompletionPercentage")
echo "         profileCompletionPercentage after update: $COMPLETION"

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/candidate/profile" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $CANDIDATE_TOKEN" \
  -d '{"fullName":"","phone":"not-a-phone","graduationYear":1800}')
CODE=$(echo "$RESP" | tail -1)
expect_status "400" "$CODE" "Invalid profile update (blank name/bad phone/bad year) is rejected" "$(echo "$RESP" | sed '$d')"

# The backend only checks content-type/filename for the resume upload (see
# CandidateProfileService.uploadResume), not actual file bytes, so a plain
# text file named .pdf with the right content-type is sufficient - no need
# for python3 or real PDF structure (that dependency was unreliable in
# practice - some systems have a "python3" that's just a Windows Store
# install-redirect shim, which "succeeds" at command -v but does nothing).
TMP_PDF="${TMPDIR:-/tmp}/smoketest_resume_$$.pdf"
echo "This is a smoke-test placeholder resume." > "$TMP_PDF"
echo "not a pdf" > "${TMP_PDF}.txt"

# On Git-Bash/MSYS, curl's `@path;modifier=value` form (needed to set the
# upload's content-type/filename) gets mangled when path is POSIX-style
# (e.g. /tmp/...) - confirmed by hitting curl error 26 "Failed to open/read
# local data" against a real run. Converting to a Windows-style path first
# sidesteps it; on real Linux/WSL there's no cygpath and no mangling, so the
# POSIX path is used unchanged.
if command -v cygpath >/dev/null 2>&1; then
  CURL_PDF_PATH=$(cygpath -w "$TMP_PDF")
  CURL_TXT_PATH=$(cygpath -w "${TMP_PDF}.txt")
else
  CURL_PDF_PATH="$TMP_PDF"
  CURL_TXT_PATH="${TMP_PDF}.txt"
fi

if [ -s "$TMP_PDF" ]; then
  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/candidate/profile/resume" \
    -H "Authorization: Bearer $CANDIDATE_TOKEN" \
    -F "file=@${CURL_PDF_PATH};type=application/pdf;filename=resume.pdf")
  CODE=$(echo "$RESP" | tail -1)
  expect_status "200" "$CODE" "Resume PDF upload" "$(echo "$RESP" | sed '$d')"

  RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/candidate/profile/resume" \
    -H "Authorization: Bearer $CANDIDATE_TOKEN" \
    -F "file=@${CURL_TXT_PATH};type=text/plain;filename=resume.txt")
  CODE=$(echo "$RESP" | tail -1)
  expect_status "400" "$CODE" "Non-PDF resume upload is rejected" "$(echo "$RESP" | sed '$d')"

  CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/candidate/profile/resume/download" \
    -H "Authorization: Bearer $CANDIDATE_TOKEN")
  expect_status "200" "$CODE" "Resume download" ""
  rm -f "$TMP_PDF" "${TMP_PDF}.txt"
else
  echo "  SKIP - resume upload tests (could not create a temp file)"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/candidate/dashboard" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "200" "$CODE" "Candidate dashboard loads" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/jobs" \
  -H "Authorization: Bearer $CANDIDATE_TOKEN")
expect_status "403" "$CODE" "Candidate token cannot hit admin endpoints" ""

# --- 6. Employer Zone: register, gated posting, admin verify, post, close ---
section "6. Employer Zone"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/register/company" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$COMPANY_EMAIL\",\"password\":\"pass123\",\"companyName\":\"Smoke Test Co $STAMP\",\"contactEmail\":\"$COMPANY_EMAIL\",\"contactPhone\":\"9876500002\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Register company" "$BODY"
EMPLOYER_TOKEN=$(json_field "$BODY" "token")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/employer/jobs" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"title\":\"Should be blocked\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "403" "$CODE" "Unverified company cannot post a job" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/admin/companies?status=PENDING" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "Admin lists pending companies" "$BODY"
COMPANY_ID=$(echo "$BODY" | grep -o "\"id\":\"[^\"]*\",\"name\":\"Smoke Test Co $STAMP\"" | sed -n 's/"id":"\([^"]*\)".*/\1/p')

if [ -n "$COMPANY_ID" ]; then
  CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/admin/companies/$COMPANY_ID/verify" \
    -H "Authorization: Bearer $ADMIN_TOKEN")
  expect_status "200" "$CODE" "Admin verifies the company" ""
else
  fail "Could not locate the newly-registered company in the pending list" "$BODY"
fi

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/employer/jobs" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"title\":\"Employer Posted Job\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Verified company can post a job" "$BODY"
EMPLOYER_JOB_ID=$(json_field "$BODY" "id")

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/employer/jobs" -H "Authorization: Bearer $EMPLOYER_TOKEN")
expect_status "200" "$CODE" "Employer lists own jobs" ""

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/employer/jobs/$EMPLOYER_JOB_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"title\":\"Employer Posted Job (edited)\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "200" "$CODE" "Employer edits their own job" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X PUT "$BASE_URL/api/employer/jobs/$JOB_ID" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $EMPLOYER_TOKEN" \
  -d "{\"title\":\"Should be blocked\",\"categoryId\":\"$CATEGORY_ID\",\"designationId\":\"$DESIGNATION_ID\",\"locationId\":\"$LOCATION_ID\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "403" "$CODE" "Employer cannot edit a job they don't own (admin's job)" "$(echo "$RESP" | sed '$d')"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/employer/jobs/$JOB_ID/close" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")
expect_status "403" "$CODE" "Employer cannot close a job they don't own (admin's job)" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/employer/jobs/$EMPLOYER_JOB_ID/close" \
  -H "Authorization: Bearer $EMPLOYER_TOKEN")
expect_status "200" "$CODE" "Employer closes their own job" ""

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/jobs?postedByAdmin=false" -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "200" "$CODE" "Admin filters jobs by postedByAdmin=false" ""

# --- 7. Admin: employee creation, disable, and disabled-token rejection ---
section "7. Admin: employees + disabled-account enforcement"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/employees" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"pass123\",\"fullName\":\"Smoke Test Employee\",\"designation\":\"Recruiter\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "201" "$CODE" "Admin creates employee" "$BODY"
EMPLOYEE_ID=$(json_field "$BODY" "id")

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"pass123\"}")
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "New employee can log in" "$BODY"
EMPLOYEE_TOKEN=$(json_field "$BODY" "token")

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/admin/employees/$EMPLOYEE_ID/disable" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "204" "$CODE" "Admin disables the employee" ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMPLOYEE_EMAIL\",\"password\":\"pass123\"}")
CODE=$(echo "$RESP" | tail -1)
expect_status "403" "$CODE" "Disabled employee cannot log in again" "$(echo "$RESP" | sed '$d')"

# This is the specific security fix from the last audit pass: the OLD token,
# issued before the account was disabled, must now be rejected too.
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/employees" -H "Authorization: Bearer $EMPLOYEE_TOKEN")
if [ "$CODE" = "403" ] || [ "$CODE" = "401" ]; then
  pass "Disabled employee's pre-existing token is now rejected (HTTP $CODE)"
else
  fail "Disabled employee's pre-existing token still works (security regression)" "got HTTP $CODE, expected 401/403"
fi

CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/employees" -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "200" "$CODE" "Admin lists employees" ""

# --- 8. Admin dashboard + notifications (email/SMS fallback) ---
section "8. Admin dashboard + mail/SMS fallback"
CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/admin/dashboard" -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "200" "$CODE" "Admin dashboard stats load" ""

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/notifications/mail" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"audience":"CANDIDATE","subject":"Smoke test","body":"This is a smoke test broadcast."}')
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "Bulk mail endpoint responds (delivery itself depends on MAIL_HOST)" "$BODY"

RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/admin/notifications/sms" \
  -H "Content-Type: application/json" -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{"audience":"CANDIDATE","message":"Smoke test SMS"}')
CODE=$(echo "$RESP" | tail -1); BODY=$(echo "$RESP" | sed '$d')
expect_status "200" "$CODE" "Bulk SMS endpoint responds (delivery itself depends on TWILIO_*)" "$BODY"

# --- 9. Delete-with-dependents conflict handling ---
section "9. Delete-with-dependents now returns clean 409s (not raw 500s)"
RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/admin/jobs/$JOB_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
CODE=$(echo "$RESP" | tail -1)
expect_status "409" "$CODE" "Deleting a job with an existing applicant is blocked cleanly" "$(echo "$RESP" | sed '$d')"

RESP=$(curl -s -w "\n%{http_code}" -X DELETE "$BASE_URL/api/admin/categories/$CATEGORY_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
CODE=$(echo "$RESP" | tail -1)
expect_status "409" "$CODE" "Deleting a category still used by a job is blocked cleanly" "$(echo "$RESP" | sed '$d')"

CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PATCH "$BASE_URL/api/admin/jobs/$JOB_ID/close" -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "200" "$CODE" "Closing (instead of deleting) the job works" ""
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X DELETE "$BASE_URL/api/admin/jobs/$EMPLOYER_JOB_ID" -H "Authorization: Bearer $ADMIN_TOKEN")
expect_status "204" "$CODE" "Deleting a job with no applicants succeeds"

# --- 10. Malformed request bodies ---
section "10. Malformed / missing request bodies"
RESP=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{not valid json')
CODE=$(echo "$RESP" | tail -1)
expect_status "400" "$CODE" "Malformed JSON body returns 400 (not 500)" "$(echo "$RESP" | sed '$d')"

# --- Summary ---
echo
echo "================================================"
echo " SMOKE TEST SUMMARY"
echo "================================================"
echo " Passed: $PASS_COUNT"
echo " Failed: $FAIL_COUNT"
if [ "$FAIL_COUNT" -gt 0 ]; then
  echo
  echo " Failed tests:"
  for t in "${FAILED_TESTS[@]}"; do
    echo "  - $t"
  done
  exit 1
fi
echo " All checks passed."
exit 0
