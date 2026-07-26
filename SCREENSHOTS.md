# Screenshot Checklist

Capture these before final submission. Suggested folder: `docs/screenshots/`, named as listed so
they match the placeholder references already in `README.md`. Use the demo accounts from
`DEMO_GUIDE.md`. Browser window at a normal desktop width (~1440px) unless marked "mobile".

## Public / Unauthenticated
- [ ] **01-home.png** — Home page / job search, with the filter bar and a few job cards visible
- [ ] **02-login.png** — Login page
- [ ] **03-register-candidate.png** — Candidate registration form
- [ ] **04-register-company.png** — Company registration form
- [ ] **05-job-detail.png** — A job detail page, logged out (showing "Log in to apply")

## Candidate
- [ ] **06-otp-verify.png** — The "Verify your email" OTP screen
- [ ] **07-candidate-dashboard.png** — Candidate dashboard (welcome card, stats, recent applications, recommended jobs)
- [ ] **08-candidate-profile.png** — Candidate profile page, scrolled to show completion % bar and at least two sections
- [ ] **09-candidate-skills.png** — The Skills section specifically (chip toggles + custom skill add)
- [ ] **10-resume-upload.png** — Resume section showing "Currently on file" with the Download link
- [ ] **11-job-search-filters.png** — Job search with 2-3 filters actively applied and results showing
- [ ] **12-job-apply.png** — Job detail page, logged in as candidate, showing the Apply button (or "Application submitted" state)
- [ ] **13-my-applications.png** — My Applications page with at least one applied job and its status badge

## Employer
- [ ] **14-employer-dashboard.png** — Employer dashboard showing company status + posted jobs table
- [ ] **15-employer-post-job.png** — The "Post a job opening" form filled in
- [ ] **16-employer-edit-job.png** — The same form in "Edit job opening" mode, pre-filled
- [ ] **17-employer-pending.png** — Optional: a *different*, unverified company's dashboard showing the "awaiting verification" message

## Administrator
- [ ] **18-admin-dashboard.png** — Admin dashboard with all stat tiles visible
- [ ] **19-admin-companies.png** — Companies page showing at least one PENDING/ACTIVE company with Verify/Reject buttons
- [ ] **20-admin-jobs.png** — All Jobs page with the "Posted by admin" / "Posted by companies" filter visible
- [ ] **21-admin-lookups.png** — Categories & skills page showing all four sections
- [ ] **22-admin-employees.png** — Employees page with at least one employee and the enable/disable control
- [ ] **23-admin-notifications.png** — Mail & SMS page with the recipient picker open ("Choose recipients" mode)
- [ ] **24-admin-notifications-result.png** — The same page after sending, showing the attempted/sent/failed/skipped summary

## Mobile / Responsive
- [ ] **25-mobile-nav.png** — Home page at ~375px width with the hamburger menu open
- [ ] **26-mobile-dashboard.png** — Candidate or admin dashboard at mobile width, showing it doesn't overflow

## Infrastructure
- [ ] **27-docker-running.png** — Terminal output of `docker compose ps` showing all three containers `Up`/`healthy`
- [ ] **28-database.png** — A terminal or GUI (MySQL Workbench/DBeaver) view of the database tables, or the output of a `SELECT` showing seeded data
- [ ] **29-smoke-test-pass.png** — Terminal output of `scripts/smoke-test.sh` (or `.bat`) showing "63 Passed, 0 Failed" (or the current count)

## Notes on capturing these

- Use the seeded demo data (three companies, ten jobs, four candidates) so screenshots look
  populated and realistic rather than empty-state.
- For error/empty states you specifically want to show (e.g. "no results"), clear the filters or
  use a fresh, unverified company instead of editing the seeded data.
- Keep browser dev tools closed for the "clean" screenshots; open them deliberately only if you
  want to show a clean console (zero errors) as part of the QA evidence.
