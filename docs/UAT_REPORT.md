# User Acceptance Testing Report — Shivani Technologies Job Portal

**How to use this document:** run `bash scripts/smoke-test.sh` first (see that file's header for
prerequisites) — it covers every API endpoint automatically and will catch most backend issues in
under a minute. This document is the *manual* pass, for everything a script can't see: rendered UI,
browser console/network tabs, responsive layout, and file-picker uploads.

Fill in **Result** (PASS/FAIL) and **Notes** as you go. For any FAIL, note the exact error text,
a screenshot if possible, and paste any red console output.

Tested by: _______________  Date: _______________  Build/commit: _______________

---

## 1. Candidate role

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 1.1 | Register | `/register/candidate`, fill form, submit | Redirected to Verify your email screen | | |
| 1.2 | OTP verify (correct code) | Get code via `docker compose logs backend \| findstr "EMAIL NOT SENT"`, enter it | Redirected to login, no console errors | | |
| 1.3 | OTP verify (wrong code) | Enter `000000` | Inline error "That code doesn't match", page does not navigate | | |
| 1.4 | Resend OTP | Click "Resend it" | New code appears in logs, old code no longer works | | |
| 1.5 | Login | Correct credentials | Redirected to `/candidate/dashboard` | | |
| 1.6 | Login (wrong password) | Wrong password | Inline "Invalid email or password", page does NOT reload/redirect | | |
| 1.7 | Dashboard renders | View `/candidate/dashboard` | Welcome card, 4 stat tiles, recent applications, recommended jobs all render; no blank sections | | |
| 1.8 | Job search | `/`, try each filter (category/designation/location/skill/salary/experience/qualification) alone and combined | Results update, "Clear filters" resets | | |
| 1.9 | Job detail (valid) | Click into a job | All fields render, Apply button visible | | |
| 1.10 | Job detail (invalid ID) | Navigate to `/jobs/00000000-0000-0000-0000-000000000000` | Clean "could not be found" message, NOT an infinite spinner | | |
| 1.11 | Apply to job | Click Apply | "Application submitted" message | | |
| 1.12 | Duplicate apply | Apply to the same job again | Clear error, not a crash | | |
| 1.13 | My Applications | `/applications` | Newly applied job appears with correct status badge | | |
| 1.14 | Profile — load | `/candidate/profile` | All sections render (Personal/Education/Professional/Skills/Career/Resume), completion % bar shows | | |
| 1.15 | Profile — save valid | Fill a few fields, Save | Green toast appears bottom-right, completion % increases | | |
| 1.16 | Profile — save invalid | Clear full name, or enter letters in phone, Save | Inline field error, red toast, nothing saved | | |
| 1.17 | Profile — skills | Toggle a few skill chips, add a custom skill, Save, reload page | Selections persist after reload | | |
| 1.18 | Resume — upload PDF | Choose a real PDF via file picker | "Resume uploaded" toast, filename shown under "Currently on file" | | |
| 1.19 | Resume — reject non-PDF | Choose a .docx or .png | Inline rejection before upload attempt, or clean 400 toast | | |
| 1.20 | Resume — URL option | Paste a URL instead of uploading, Save | Link renders and is clickable | | |
| 1.21 | Logout | Click Log out | Redirected to home, nav reverts to logged-out state | | |
| 1.22 | Session expiry (optional, needs manual token edit) | In devtools, corrupt `localStorage.shivani_token`, then click any nav link that hits the API | Redirected to `/login`, not stuck on stale "logged in" navbar | | |

## 2. Employer role

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 2.1 | Register company | `/register/company` | Account created, status implied PENDING | | |
| 2.2 | Blocked from posting while pending | Log in as that employer, go to `/employer/dashboard` | Message says awaiting verification, no post-job form shown | | |
| 2.3 | Admin verifies | As admin, `/admin/companies`, click Verify | Status flips to ACTIVE in the table | | |
| 2.4 | Post job | As employer (re-login or refresh), fill job form, submit | Job appears in "Your job openings" below the form | | |
| 2.5 | Job appears in public search | Log out, search on `/` | The employer-posted job is findable | | |
| 2.6 | Close job | Click Close on an open job | Status badge flips to CLOSED, Apply button disabled on public view | | |
| 2.7 | Cannot touch another company's job | (Needs 2 employer accounts) try closing a job you don't own via API/devtools | 403, not silently succeeding | | |

## 3. Administrator role

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 3.1 | Dashboard | `/admin/dashboard` | All stat tiles show real numbers, tiles link to the right pages | | |
| 3.2 | Categories/skills CRUD | `/admin/lookups`, add + delete an item in each of the 4 sections | Add/delete both work, list updates without reload | | |
| 3.3 | Delete lookup in use | Try deleting a category that's used by an existing job | Clean error message, not a blank crash page | | |
| 3.4 | Jobs — post | `/admin/jobs`, "Post a job" | New job appears in the table | | |
| 3.5 | Jobs — filter | Toggle "Posted by admin" / "Posted by companies" | List filters correctly | | |
| 3.6 | Jobs — close/delete | Close an open job; try deleting a job with an applicant | Close works; delete-with-applicant shows a clear "close it instead" message, not a crash | | |
| 3.7 | Companies — verify/reject | `/admin/companies` | Verify and Reject buttons both work and update the status badge | | |
| 3.8 | Employees — create | `/admin/employees`, create one | Appears in list as Active | | |
| 3.9 | Employees — disable | Click Disable | Status flips to Disabled; that employee can no longer log in | | |
| 3.10 | Mail & SMS | `/admin/notifications`, send to "Candidates" audience | Result summary shows attempted/sent/failed/skipped counts | | |

## 4. Employee role

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 4.1 | Login | Use credentials an admin created | Logs in successfully | | |
| 4.2 | Scope of access | Try navigating to any `/admin/**` or `/employer/**` page | Redirected away (ProtectedRoute), no employee-specific dashboard exists yet — confirm this is expected, not a bug | | |

*(Note: the Employee role currently has no dedicated dashboard/UI beyond being able to log in —*
*this matches the original spec, which only calls for admin-created employee logins, not a full*
*employee-facing feature set. Flag to product owner if that's no longer the intent.)*

## 5. Cross-cutting checks

| # | Test | Steps | Expected | Result | Notes |
|---|---|---|---|---|---|
| 5.1 | Browser console | Open DevTools console on every page in sections 1-3 | Zero red errors (warnings are OK) | | |
| 5.2 | Network tab | Watch Network tab while navigating | No unexpected 4xx/5xx on page load; failed requests show a user-facing message | | |
| 5.3 | Responsive — mobile | Resize to ~375px width (or DevTools device mode) on: homepage, job detail, login, candidate dashboard, candidate profile | Layout doesn't overflow horizontally, nav is usable | | |
| 5.4 | Responsive — tablet | Resize to ~768px width, same pages | Layout adapts cleanly | | |
| 5.5 | Responsive — desktop | Full width | No excessive whitespace/broken grid | | |
| 5.6 | Docker restart persistence | `docker compose restart`, log back in | Data (jobs, applications, profile) all still present | | |
| 5.7 | Resume persistence across restart | Upload a resume, `docker compose down && docker compose up -d`, check profile | Resume still shows "Currently on file" (requires the `backend_uploads` volume from the latest docker-compose.yml) | | |
| 5.8 | MySQL persistence | Same restart test | All jobs/companies/candidates still queryable | | |

---

## Summary

- Total checks: ____ / ____
- Blocking issues (must fix before launch): 
- Non-blocking issues (can ship, track separately):
