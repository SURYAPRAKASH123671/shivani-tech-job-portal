@echo off
setlocal enabledelayedexpansion
REM ============================================================================
REM End-to-end smoke test for the Shivani Technologies job portal API.
REM Native Windows Command Prompt version of scripts/smoke-test.sh - no WSL,
REM no Git Bash, no Unix utilities. Requires: docker (with Compose v2), curl
REM (built into Windows 10/11 as curl.exe), findstr (built in).
REM
REM Prerequisites:
REM   - docker compose up -d (all three containers healthy)
REM   - An admin user already created (see backend\README.md "Roles" section)
REM   - Set ADMIN_EMAIL / ADMIN_PASSWORD env vars before running, or edit the
REM     defaults below.
REM
REM Usage:
REM   set ADMIN_EMAIL=admin@shivanitech.in
REM   set ADMIN_PASSWORD=admin123
REM   scripts\smoke-test.bat
REM
REM IMPORTANT LIMITATION (documented, not hidden): section 6's company-lookup
REM step grabs the FIRST company in the admin's PENDING list. If your admin
REM already has other pending companies sitting around from manual testing,
REM this may verify the wrong one. Batch has no JSON-array-aware parsing to
REM do better than that without a lot more machinery - see the note in that
REM section. Run against a clean-ish environment for a trustworthy result.
REM ============================================================================

set Q=^"

REM Q now holds exactly one literal double-quote character. This line must
REM NOT be wrapped in its own quotes - that's what makes the caret-escape
REM parse unambiguously. If Q ends up wrong, the whole script's JSON
REM extraction breaks; see the self-test in section 0 below.

set "BASE_URL=http://localhost:8080"
if not "%~1"=="" set "BASE_URL=%~1"

if "%ADMIN_EMAIL%"=="" set "ADMIN_EMAIL=admin@shivanitech.in"
if "%ADMIN_PASSWORD%"=="" set "ADMIN_PASSWORD=admin123"

set "STAMP=%RANDOM%%RANDOM%"
set "CANDIDATE_EMAIL=smoketest.candidate.%STAMP%@example.com"
set "COMPANY_EMAIL=smoketest.company.%STAMP%@example.com"
set "EMPLOYEE_EMAIL=smoketest.employee.%STAMP%@example.com"

set /a PASS=0
set /a FAIL=0

set "TMPFILE=%TEMP%\smoketest_body_%STAMP%.json"

goto :main

REM ----------------------------------------------------------------------
REM Subroutines
REM ----------------------------------------------------------------------

:jget
REM Extract a top-level JSON field's value from a variable's content.
REM %1 = name of variable holding JSON text, %2 = field name, %3 = output var
REM
REM IMPORTANT: every line below that needs to insert a literal quote
REM character (via %Q%, which uses NORMAL/immediate expansion so the
REM inserted quote can act as pattern text for the call-based substring
REM trick) is deliberately UNQUOTED. Wrapping such a line in "..." would let
REM the inserted quote corrupt cmd's own parsing of that same line - that
REM was the original bug. Lines with no %Q% on them are quote-wrapped as
REM normal, since there's nothing there that can corrupt the parse.
set jget_src=!%~1!
set jget_needle=%Q%%~2%Q%:
call set jget_rest=%%jget_src:*%jget_needle%=%%
if "!jget_rest!"=="!jget_src!" (
  set "%~3="
  goto :eof
)
REM Split on comma or closing brace: gives "value" (quotes included) for a
REM string field, or a bare value for a number/boolean field.
for /f "tokens=1 delims=,}" %%v in ("!jget_rest!") do set jget_val=%%v
REM Strip every quote character - there'll be exactly two (front+back) for
REM a string field, none for a number/boolean, so this handles both at once.
call set jget_val=%%jget_val:%Q%=%%
set "%~3=!jget_val!"
goto :eof

:pass
set /a PASS+=1
echo   PASS - %~1
goto :eof

:fail
set /a FAIL+=1
echo   FAIL - %~1
if not "!LAST_BODY!"=="" echo          !LAST_BODY!
goto :eof

:expect
REM %1 = expected status, %2 = actual status, %3 = label
if "%~2"=="%~1" (
  call :pass "%~3 (HTTP %~2)"
) else (
  call :fail "%~3 (expected HTTP %~1, got %~2)"
)
goto :eof

:section
echo.
echo === %~1 ===
goto :eof

REM ----------------------------------------------------------------------
REM Performs one HTTP call. Body goes to %TMPFILE%, status code into CODE,
REM body content into BODY. Exactly one real request per call - never call
REM this twice for something with side effects (POST/PUT/PATCH/DELETE).
REM %1 = curl method+url+headers+data as ALREADY-QUOTED extra args string
REM (called via: call :http "-X POST \"url\" -H \"...\" -d \"...\"")
REM ----------------------------------------------------------------------
:http
for /f "delims=" %%c in ('curl -s -o "%TMPFILE%" -w "%%{http_code}" %~1') do set "CODE=%%c"
set "BODY="
if exist "%TMPFILE%" (
  for /f "usebackq delims=" %%b in ("%TMPFILE%") do set "BODY=%%b"
)
set "LAST_BODY=!BODY!"
goto :eof

:main

REM ----------------------------------------------------------------------
REM 0. Self-test: confirm the JSON extractor actually works before trusting
REM    any result below. If this fails, everything after it is unreliable.
REM ----------------------------------------------------------------------
call :section "0. Self-test: JSON extractor + reachability"

REM Built with real quote characters (via %Q%), not backslash-escapes, to
REM accurately mirror what curl actually saves to the body file at runtime.
REM Deliberately unquoted - see the note in :jget for why a %Q%-bearing
REM line must never be wrapped in "...".
set SELFTEST_JSON={%Q%token%Q%:%Q%abc.def.ghi%Q%,%Q%email%Q%:%Q%x@y.com%Q%,%Q%role%Q%:%Q%CANDIDATE%Q%,%Q%verified%Q%:false}
call :jget SELFTEST_JSON token SELFTEST_TOKEN
call :jget SELFTEST_JSON email SELFTEST_EMAIL
call :jget SELFTEST_JSON verified SELFTEST_VERIFIED

if "!SELFTEST_TOKEN!"=="abc.def.ghi" (call :pass "JSON extractor: string field") else (call :fail "JSON extractor: string field (got '!SELFTEST_TOKEN!', expected 'abc.def.ghi' - STOP, do not trust results below until this is fixed)")
if "!SELFTEST_EMAIL!"=="x@y.com" (call :pass "JSON extractor: second string field") else (call :fail "JSON extractor: second string field (got '!SELFTEST_EMAIL!')")
if "!SELFTEST_VERIFIED!"=="false" (call :pass "JSON extractor: unquoted boolean field") else (call :fail "JSON extractor: unquoted boolean field (got '!SELFTEST_VERIFIED!')")

call :http "\"%BASE_URL%/api/jobs/search\""
call :expect 200 "!CODE!" "Backend responds to public search endpoint"

REM ----------------------------------------------------------------------
REM 1. Candidate: register -> OTP -> verify -> login
REM ----------------------------------------------------------------------
call :section "1. Candidate: register -> OTP -> verify -> login"

set "REG_BODY={\"email\":\"%CANDIDATE_EMAIL%\",\"password\":\"pass123\",\"fullName\":\"Smoke Test Candidate\",\"phone\":\"9876500000\"}"
call :http "-X POST \"%BASE_URL%/api/auth/register/candidate\" -H \"Content-Type: application/json\" -d \"%REG_BODY%\""
call :expect 201 "!CODE!" "Register candidate"
call :jget BODY verified REG_VERIFIED
if "!REG_VERIFIED!"=="false" (call :pass "New candidate starts unverified") else (call :fail "New candidate should start unverified (got '!REG_VERIFIED!')")

REM Give the backend a moment to finish writing its log line.
ping -n 2 127.0.0.1 >nul

set "OTP_LINE="
for /f "delims=" %%L in ('docker compose logs backend ^| findstr /C:"EMAIL NOT SENT" ^| findstr /C:"%CANDIDATE_EMAIL%"') do set "OTP_LINE=%%L"

set "OTP="
if defined OTP_LINE (
  set "otp_needle=verification code is "
  call set "otp_rest=%%OTP_LINE:*%otp_needle%=%%"
  set "OTP=!otp_rest:~0,6!"
)
if defined OTP (
  call :pass "Extracted OTP from backend logs (!OTP!)"
) else (
  call :fail "Could not find OTP in backend logs for %CANDIDATE_EMAIL% (is docker compose logs backend showing anything? Try it manually.)"
)

REM Wrong code must be tested BEFORE the correct one - once verified, the
REM endpoint is idempotent (any code just no-ops with 204), so testing this
REM after success would give a false failure.
set "BAD_VERIFY_BODY={\"email\":\"%CANDIDATE_EMAIL%\",\"otp\":\"000000\"}"
call :http "-X POST \"%BASE_URL%/api/auth/verify-otp\" -H \"Content-Type: application/json\" -d \"%BAD_VERIFY_BODY%\""
call :expect 400 "!CODE!" "Verify OTP with wrong code is rejected"

set "VERIFY_BODY={\"email\":\"%CANDIDATE_EMAIL%\",\"otp\":\"%OTP%\"}"
call :http "-X POST \"%BASE_URL%/api/auth/verify-otp\" -H \"Content-Type: application/json\" -d \"%VERIFY_BODY%\""
call :expect 204 "!CODE!" "Verify OTP with correct code"

set "LOGIN_BODY={\"email\":\"%CANDIDATE_EMAIL%\",\"password\":\"pass123\"}"
call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"%LOGIN_BODY%\""
call :expect 200 "!CODE!" "Candidate login after verification"
call :jget BODY token CANDIDATE_TOKEN

set "WRONG_LOGIN_BODY={\"email\":\"%CANDIDATE_EMAIL%\",\"password\":\"wrong-password\"}"
call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"%WRONG_LOGIN_BODY%\""
call :expect 401 "!CODE!" "Wrong password is rejected cleanly"

REM ----------------------------------------------------------------------
REM 2. Admin login
REM ----------------------------------------------------------------------
call :section "2. Admin login"

set "ADMIN_LOGIN_BODY={\"email\":\"%ADMIN_EMAIL%\",\"password\":\"%ADMIN_PASSWORD%\"}"
call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"%ADMIN_LOGIN_BODY%\""
if "!CODE!"=="200" (
  call :pass "Admin login (HTTP 200)"
  call :jget BODY token ADMIN_TOKEN
) else (
  call :fail "Admin login failed - create one first (see backend\README.md)"
  echo.
  echo Cannot continue without an admin token. Aborting remaining tests.
  echo !FAIL! failed, !PASS! passed so far.
  del /q "%TMPFILE%" >nul 2>&1
  exit /b 1
)

REM ----------------------------------------------------------------------
REM 3. Admin: lookups CRUD
REM ----------------------------------------------------------------------
call :section "3. Admin: categories / designations / locations / skills CRUD"

set "AUTHH=Authorization: Bearer !ADMIN_TOKEN!"

set "CAT_BODY={\"name\":\"Smoke Category %STAMP%\"}"
call :http "-X POST \"%BASE_URL%/api/admin/categories\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%CAT_BODY%\""
call :expect 201 "!CODE!" "Create category"
call :jget BODY id CATEGORY_ID

set "DESIG_BODY={\"name\":\"Smoke Designation %STAMP%\"}"
call :http "-X POST \"%BASE_URL%/api/admin/designations\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%DESIG_BODY%\""
call :expect 201 "!CODE!" "Create designation"
call :jget BODY id DESIGNATION_ID

set "LOC_BODY={\"name\":\"Smoke Location %STAMP%\"}"
call :http "-X POST \"%BASE_URL%/api/admin/locations\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%LOC_BODY%\""
call :expect 201 "!CODE!" "Create location"
call :jget BODY id LOCATION_ID

set "SKILL_BODY={\"name\":\"Smoke Skill %STAMP%\"}"
call :http "-X POST \"%BASE_URL%/api/admin/skills\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%SKILL_BODY%\""
call :expect 201 "!CODE!" "Create skill"
call :jget BODY id SKILL_ID

call :http "\"%BASE_URL%/api/admin/categories\""
call :expect 200 "!CODE!" "List categories is public (GET)"

set "NOAUTH_BODY={\"name\":\"No auth category\"}"
call :http "-X POST \"%BASE_URL%/api/admin/categories\" -H \"Content-Type: application/json\" -d \"%NOAUTH_BODY%\""
call :expect 403 "!CODE!" "Create category without a token is rejected"

REM ----------------------------------------------------------------------
REM 4. Admin: job CRUD + validation
REM ----------------------------------------------------------------------
call :section "4. Admin: job CRUD + validation"

set "JOB_BODY={\"title\":\"Smoke Test Job\",\"categoryId\":\"!CATEGORY_ID!\",\"designationId\":\"!DESIGNATION_ID!\",\"locationId\":\"!LOCATION_ID!\",\"skillIds\":[\"!SKILL_ID!\"],\"salaryMin\":40000,\"salaryMax\":80000}"
call :http "-X POST \"%BASE_URL%/api/admin/jobs\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%JOB_BODY%\""
call :expect 201 "!CODE!" "Admin creates a job"
call :jget BODY id JOB_ID

set "BADSAL_BODY={\"title\":\"Bad Salary Job\",\"categoryId\":\"!CATEGORY_ID!\",\"designationId\":\"!DESIGNATION_ID!\",\"locationId\":\"!LOCATION_ID!\",\"salaryMin\":90000,\"salaryMax\":10000}"
call :http "-X POST \"%BASE_URL%/api/admin/jobs\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%BADSAL_BODY%\""
call :expect 400 "!CODE!" "salaryMin > salaryMax is rejected"

set "NEGSAL_BODY={\"title\":\"Negative Salary Job\",\"categoryId\":\"!CATEGORY_ID!\",\"designationId\":\"!DESIGNATION_ID!\",\"locationId\":\"!LOCATION_ID!\",\"salaryMin\":-500}"
call :http "-X POST \"%BASE_URL%/api/admin/jobs\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%NEGSAL_BODY%\""
call :expect 400 "!CODE!" "Negative salary is rejected"

call :http "\"%BASE_URL%/api/jobs/!JOB_ID!\""
call :expect 200 "!CODE!" "Public job detail view"

call :http "\"%BASE_URL%/api/jobs/search?categoryId=!CATEGORY_ID!\""
call :expect 200 "!CODE!" "Search filtered by category"
call :http "\"%BASE_URL%/api/jobs/search?locationId=!LOCATION_ID!\""
call :expect 200 "!CODE!" "Search filtered by location"
call :http "\"%BASE_URL%/api/jobs/search?skillId=!SKILL_ID!\""
call :expect 200 "!CODE!" "Search filtered by skill"
call :http "\"%BASE_URL%/api/jobs/search?minSalary=40000\""
call :expect 200 "!CODE!" "Search filtered by minSalary"
call :http "\"%BASE_URL%/api/jobs/search?maxExperience=5\""
call :expect 200 "!CODE!" "Search filtered by maxExperience"

call :http "\"%BASE_URL%/api/jobs/00000000-0000-0000-0000-000000000000\""
call :expect 404 "!CODE!" "Nonexistent job returns 404"

call :http "\"%BASE_URL%/api/jobs/not-a-uuid\""
call :expect 400 "!CODE!" "Malformed UUID path param returns 400 (not 500)"

REM ----------------------------------------------------------------------
REM 5. Candidate: apply / profile / resume / dashboard
REM ----------------------------------------------------------------------
call :section "5. Candidate: apply / profile / resume / dashboard"

set "CANDAUTHH=Authorization: Bearer !CANDIDATE_TOKEN!"

call :http "-X POST \"%BASE_URL%/api/candidate/jobs/!JOB_ID!/apply\" -H \"%CANDAUTHH%\""
call :expect 201 "!CODE!" "Candidate applies to job"

call :http "-X POST \"%BASE_URL%/api/candidate/jobs/!JOB_ID!/apply\" -H \"%CANDAUTHH%\""
call :expect 409 "!CODE!" "Duplicate application is rejected"

call :http "\"%BASE_URL%/api/candidate/applications\" -H \"%CANDAUTHH%\""
call :expect 200 "!CODE!" "Candidate lists own applications"

call :http "\"%BASE_URL%/api/candidate/profile\" -H \"%CANDAUTHH%\""
call :expect 200 "!CODE!" "Candidate reads own profile"

set "PROFILE_BODY={\"fullName\":\"Smoke Test Candidate Updated\",\"phone\":\"9876500001\",\"experienceYears\":2,\"skillIds\":[],\"customSkills\":[\"Batch Scripting\"]}"
call :http "-X PUT \"%BASE_URL%/api/candidate/profile\" -H \"Content-Type: application/json\" -H \"%CANDAUTHH%\" -d \"%PROFILE_BODY%\""
call :expect 200 "!CODE!" "Candidate updates profile"
call :jget BODY profileCompletionPercentage COMPLETION
echo          profileCompletionPercentage after update: !COMPLETION!

set "BADPROFILE_BODY={\"fullName\":\"\",\"phone\":\"not-a-phone\",\"graduationYear\":1800}"
call :http "-X PUT \"%BASE_URL%/api/candidate/profile\" -H \"Content-Type: application/json\" -H \"%CANDAUTHH%\" -d \"%BADPROFILE_BODY%\""
call :expect 400 "!CODE!" "Invalid profile update (blank name/bad phone/bad year) is rejected"

REM The backend only checks content-type/filename for the resume upload (see
REM CandidateProfileService.uploadResume), not actual file bytes, so a plain
REM text file named .pdf with the right content-type is sufficient here.
set "RESUME_PDF=%TEMP%\smoketest_resume_%STAMP%.pdf"
set "RESUME_TXT=%TEMP%\smoketest_resume_%STAMP%.txt"
echo This is a smoke-test placeholder resume. > "%RESUME_PDF%"
echo not a pdf > "%RESUME_TXT%"

call :http "-X POST \"%BASE_URL%/api/candidate/profile/resume\" -H \"%CANDAUTHH%\" -F \"file=@%RESUME_PDF%;type=application/pdf;filename=resume.pdf\""
call :expect 200 "!CODE!" "Resume PDF upload"

call :http "-X POST \"%BASE_URL%/api/candidate/profile/resume\" -H \"%CANDAUTHH%\" -F \"file=@%RESUME_TXT%;type=text/plain;filename=resume.txt\""
call :expect 400 "!CODE!" "Non-PDF resume upload is rejected"

call :http "\"%BASE_URL%/api/candidate/profile/resume/download\" -H \"%CANDAUTHH%\""
call :expect 200 "!CODE!" "Resume download"

del /q "%RESUME_PDF%" >nul 2>&1
del /q "%RESUME_TXT%" >nul 2>&1

call :http "\"%BASE_URL%/api/candidate/dashboard\" -H \"%CANDAUTHH%\""
call :expect 200 "!CODE!" "Candidate dashboard loads"

call :http "\"%BASE_URL%/api/admin/jobs\" -H \"%CANDAUTHH%\""
call :expect 403 "!CODE!" "Candidate token cannot hit admin endpoints"

REM ----------------------------------------------------------------------
REM 6. Employer Zone
REM ----------------------------------------------------------------------
call :section "6. Employer Zone"

set "COMPANY_REG_BODY={\"email\":\"%COMPANY_EMAIL%\",\"password\":\"pass123\",\"companyName\":\"Smoke Test Co %STAMP%\",\"contactEmail\":\"%COMPANY_EMAIL%\",\"contactPhone\":\"9876500002\"}"
call :http "-X POST \"%BASE_URL%/api/auth/register/company\" -H \"Content-Type: application/json\" -d \"%COMPANY_REG_BODY%\""
call :expect 201 "!CODE!" "Register company"
call :jget BODY token EMPLOYER_TOKEN
set "EMPAUTHH=Authorization: Bearer !EMPLOYER_TOKEN!"

set "BLOCKED_JOB_BODY={\"title\":\"Should be blocked\",\"categoryId\":\"!CATEGORY_ID!\",\"designationId\":\"!DESIGNATION_ID!\",\"locationId\":\"!LOCATION_ID!\"}"
call :http "-X POST \"%BASE_URL%/api/employer/jobs\" -H \"Content-Type: application/json\" -H \"%EMPAUTHH%\" -d \"%BLOCKED_JOB_BODY%\""
call :expect 403 "!CODE!" "Unverified company cannot post a job"

REM KNOWN LIMITATION: grabs the FIRST id in the PENDING list, not
REM specifically the one we just registered. See header comment.
call :http "\"%BASE_URL%/api/admin/companies?status=PENDING\" -H \"%AUTHH%\""
call :expect 200 "!CODE!" "Admin lists pending companies"
call :jget BODY id COMPANY_ID
if defined COMPANY_ID (
  call :http "-X PATCH \"%BASE_URL%/api/admin/companies/!COMPANY_ID!/verify\" -H \"%AUTHH%\""
  call :expect 200 "!CODE!" "Admin verifies a pending company (see known limitation above re: which one)"
) else (
  call :fail "No pending company found to verify - is the list actually empty?"
)

set "EMP_JOB_BODY={\"title\":\"Employer Posted Job\",\"categoryId\":\"!CATEGORY_ID!\",\"designationId\":\"!DESIGNATION_ID!\",\"locationId\":\"!LOCATION_ID!\"}"
call :http "-X POST \"%BASE_URL%/api/employer/jobs\" -H \"Content-Type: application/json\" -H \"%EMPAUTHH%\" -d \"%EMP_JOB_BODY%\""
if "!CODE!"=="201" (
  call :pass "Verified company can post a job (HTTP 201)"
  call :jget BODY id EMPLOYER_JOB_ID
) else (
  call :fail "Verified company can post a job (expected HTTP 201, got !CODE! - if section 6's company lookup grabbed the wrong pending company, this is why)"
)

call :http "\"%BASE_URL%/api/employer/jobs\" -H \"%EMPAUTHH%\""
call :expect 200 "!CODE!" "Employer lists own jobs"

call :http "-X PATCH \"%BASE_URL%/api/employer/jobs/!JOB_ID!/close\" -H \"%EMPAUTHH%\""
call :expect 403 "!CODE!" "Employer cannot close a job they don't own (admin's job)"

if defined EMPLOYER_JOB_ID (
  call :http "-X PATCH \"%BASE_URL%/api/employer/jobs/!EMPLOYER_JOB_ID!/close\" -H \"%EMPAUTHH%\""
  call :expect 200 "!CODE!" "Employer closes their own job"
)

call :http "\"%BASE_URL%/api/admin/jobs?postedByAdmin=false\" -H \"%AUTHH%\""
call :expect 200 "!CODE!" "Admin filters jobs by postedByAdmin=false"

REM ----------------------------------------------------------------------
REM 7. Admin: employees + disabled-account enforcement
REM ----------------------------------------------------------------------
call :section "7. Admin: employees + disabled-account enforcement"

set "EMPLOYEE_BODY={\"email\":\"%EMPLOYEE_EMAIL%\",\"password\":\"pass123\",\"fullName\":\"Smoke Test Employee\",\"designation\":\"Recruiter\"}"
call :http "-X POST \"%BASE_URL%/api/admin/employees\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%EMPLOYEE_BODY%\""
call :expect 201 "!CODE!" "Admin creates employee"
call :jget BODY id EMPLOYEE_ID

set "EMPLOYEE_LOGIN_BODY={\"email\":\"%EMPLOYEE_EMAIL%\",\"password\":\"pass123\"}"
call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"%EMPLOYEE_LOGIN_BODY%\""
call :expect 200 "!CODE!" "New employee can log in"
call :jget BODY token EMPLOYEE_TOKEN

call :http "-X PATCH \"%BASE_URL%/api/admin/employees/!EMPLOYEE_ID!/disable\" -H \"%AUTHH%\""
call :expect 204 "!CODE!" "Admin disables the employee"

call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"%EMPLOYEE_LOGIN_BODY%\""
call :expect 403 "!CODE!" "Disabled employee cannot log in again"

call :http "\"%BASE_URL%/api/admin/employees\" -H \"Authorization: Bearer !EMPLOYEE_TOKEN!\""
if "!CODE!"=="403" (
  call :pass "Disabled employee's pre-existing token is now rejected (HTTP 403)"
) else if "!CODE!"=="401" (
  call :pass "Disabled employee's pre-existing token is now rejected (HTTP 401)"
) else (
  call :fail "Disabled employee's pre-existing token still works (security regression) - got HTTP !CODE!, expected 401/403"
)

call :http "\"%BASE_URL%/api/admin/employees\" -H \"%AUTHH%\""
call :expect 200 "!CODE!" "Admin lists employees"

REM ----------------------------------------------------------------------
REM 8. Admin dashboard + mail/SMS fallback
REM ----------------------------------------------------------------------
call :section "8. Admin dashboard + mail/SMS fallback"

call :http "\"%BASE_URL%/api/admin/dashboard\" -H \"%AUTHH%\""
call :expect 200 "!CODE!" "Admin dashboard stats load"

set "MAIL_BODY={\"audience\":\"CANDIDATE\",\"subject\":\"Smoke test\",\"body\":\"This is a smoke test broadcast.\"}"
call :http "-X POST \"%BASE_URL%/api/admin/notifications/mail\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%MAIL_BODY%\""
call :expect 200 "!CODE!" "Bulk mail endpoint responds (delivery itself depends on MAIL_HOST)"

set "SMS_BODY={\"audience\":\"CANDIDATE\",\"message\":\"Smoke test SMS\"}"
call :http "-X POST \"%BASE_URL%/api/admin/notifications/sms\" -H \"Content-Type: application/json\" -H \"%AUTHH%\" -d \"%SMS_BODY%\""
call :expect 200 "!CODE!" "Bulk SMS endpoint responds (delivery itself depends on TWILIO_*)"

REM ----------------------------------------------------------------------
REM 9. Delete-with-dependents conflict handling
REM ----------------------------------------------------------------------
call :section "9. Delete-with-dependents now returns clean 409s (not raw 500s)"

call :http "-X DELETE \"%BASE_URL%/api/admin/jobs/!JOB_ID!\" -H \"%AUTHH%\""
call :expect 409 "!CODE!" "Deleting a job with an existing applicant is blocked cleanly"

call :http "-X DELETE \"%BASE_URL%/api/admin/categories/!CATEGORY_ID!\" -H \"%AUTHH%\""
call :expect 409 "!CODE!" "Deleting a category still used by a job is blocked cleanly"

call :http "-X PATCH \"%BASE_URL%/api/admin/jobs/!JOB_ID!/close\" -H \"%AUTHH%\""
call :expect 200 "!CODE!" "Closing (instead of deleting) the job works"

if defined EMPLOYER_JOB_ID (
  call :http "-X DELETE \"%BASE_URL%/api/admin/jobs/!EMPLOYER_JOB_ID!\" -H \"%AUTHH%\""
  call :expect 204 "!CODE!" "Deleting a job with no applicants succeeds"
)

REM ----------------------------------------------------------------------
REM 10. Malformed / missing request bodies
REM ----------------------------------------------------------------------
call :section "10. Malformed / missing request bodies"

call :http "-X POST \"%BASE_URL%/api/auth/login\" -H \"Content-Type: application/json\" -d \"{not valid json\""
call :expect 400 "!CODE!" "Malformed JSON body returns 400 (not 500)"

REM ----------------------------------------------------------------------
REM Summary
REM ----------------------------------------------------------------------
del /q "%TMPFILE%" >nul 2>&1

echo.
echo ================================================
echo  SMOKE TEST SUMMARY
echo ================================================
echo  Passed: !PASS!
echo  Failed: !FAIL!
if !FAIL! GTR 0 (
  echo.
  echo  Scroll back up for the full text of each "FAIL -" line above.
  exit /b 1
)
echo  All checks passed.
exit /b 0
