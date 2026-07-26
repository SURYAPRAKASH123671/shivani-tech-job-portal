# Demo Guide

How to demonstrate the Shivani Technologies Job Portal to HR or an interviewer, end to end,
covering every role and feature. Pair this with `DEMO_VIDEO_SCRIPT.md` if recording a walkthrough.

## Introduction (what to say before you start)

> "This is a full-stack recruitment platform I built for Shivani Technologies — Spring Boot on the
> backend, React on the frontend, MySQL for storage, all containerized with Docker. It has four
> roles: Administrator, Employer, Employee, and Candidate. I'll walk through each one."

## Before you start

```bash
docker compose up -d
```

Confirm all three containers are healthy:
```bash
docker compose ps
```

Demo accounts (already seeded — see "Demo Accounts" below for the full list):

| Role | Email | Password |
|---|---|---|
| Administrator | admin@shivanitech.in | admin123 |
| Employer | employer@shivanitech.in | Employer@123 |
| Employee | employee@shivanitech.in | Employee@123 |
| Candidate | candidate@shivanitech.in | Candidate@123 |

## Administrator Demo

1. Go to http://localhost:5173/login, sign in as the admin account.
2. **Dashboard** — narrate: "This gives a live snapshot — total candidates, companies by
   verification status, jobs by status and source, total applications." Point out the numbers are
   real, from actual seeded data.
3. **Categories & skills** — show creating a new category/skill live (e.g. add a skill "Kubernetes"),
   then delete it, to show the CRUD works both ways.
4. **All jobs** — show the "Posted by admin" vs. "Posted by companies" filter. Click **Post a job**
   and create one live to show admin can post directly too.
5. **Companies** — show the three verified companies (Nexora Technologies, BrightPath Solutions,
   Northstar Analytics). Explain: "New company registrations start PENDING — an admin has to verify
   them by phone or email before they're allowed to post."
6. **Employees** — show the existing employee (Priya Sharma), and create a new one live. Point out
   the enable/disable toggle: "If I disable someone here, their session is invalidated immediately —
   even a token they already have stops working."
7. **Mail & SMS** — open it, select "Candidates" as the audience, show the "Everyone" vs. "Choose
   recipients" toggle (with the live recipient picker), write a test message, send it, and show the
   attempted/sent/failed/skipped result summary. Mention: "Sends are logged rather than delivered
   right now since no real email provider is connected — that's a config step, not a missing
   feature; the whole pipeline works."

## Employer Demo

1. Log out, log in as `employer@shivanitech.in` (Nexora Technologies — already verified).
2. **Employer dashboard** shows the company's status and its posted jobs (3 real jobs: Backend
   Engineer, Frontend Engineer, DevOps Engineer).
3. Click **Edit** on one job, change the title or salary, save — show it updates in the list.
4. Post a brand-new job live to show the full flow.
5. Close one of the jobs, show its status badge flip to CLOSED.
6. **Optional — show the gating**: register a *new* company account at `/register/company`, log in
   as it, and show the "awaiting verification" message with no post-job form visible. Then switch
   back to admin, verify it, and show the employer can now post.

## Candidate Demo

1. Log out, log in as `candidate@shivanitech.in` (Ananya Rao — profile is fully filled out).
2. **Dashboard** — welcome card with profile completion %, stat tiles, recent applications,
   recommended jobs (matched by her skills: Java, Spring Boot, SQL).
3. **Find jobs** (home page) — demonstrate the filter bar: filter by category "Engineering", by
   location "Bengaluru", by skill, by salary. Clear filters, show it resets and reloads.
4. Click into a job, show the detail page, click **Apply**. If already applied to that one, pick a
   different open job.
5. **My applications** — show the applied job with its status badge.
6. **My profile** — walk through each section (Personal, Education, Professional, Skills, Career
   preferences, Resume). Toggle a skill chip, add a custom skill, save — show the green toast and
   the completion % moving.
7. **Resume**: upload a PDF, show the "Currently on file" text with a Download link; click Download
   to prove it round-trips.

## Employee Demo

1. Log out, log in as `employee@shivanitech.in`.
2. Point out: "Employees get a scoped login an admin provisions — no self-registration. This role
   is intentionally minimal per the original spec: it's a login an admin controls, not a full
   employee-facing feature set."
3. Try navigating to an admin or employer page — show it redirects away, proving the role boundary
   is enforced.

## Feature-specific deep dives (if asked)

- **Resume Upload**: Candidate → My profile → Resume section → "Upload PDF". Backend validates both
  content-type and filename extension (try uploading a `.txt` file renamed to prove the rejection).
- **Resume Download**: same section, click "Download" next to "Currently on file".
- **Notifications**: Admin → Mail & SMS, described above.
- **Job Search**: Home page filter bar — 7 independent filters, combinable.
- **Job Apply**: Job detail page → Apply button (disabled/relabeled if the role isn't Candidate or
  the job is closed).
- **Job Edit**: Admin → All jobs → Edit, or Employer dashboard → Edit — both pre-fill the form with
  the job's current category/designation/location/skills (not just its display names) and persist
  changes.
- **Company Verification**: Admin → Companies → Verify/Reject buttons.
- **Dashboard**: every role that has one (Candidate, Employer implicitly via job list, Admin) shows
  live, real data — nothing is hardcoded or mocked.

## Docker Deployment

Show the three containers running:
```bash
docker compose ps
```
Show a full teardown-and-restart to prove data survives:
```bash
docker compose down
docker compose up -d
docker compose ps
```
Log back in as admin immediately after — same data, same accounts, nothing lost. This was actually
verified during development: row counts were checked before and after a full container recreation
and matched exactly, including that uploaded resume files survived (they're in a named Docker
volume, not inside the container).

## Suggested narration for HR

> "I built this as a complete, working recruitment platform — not just a UI mockup. Every button
> you're seeing is wired to a real API, a real database, with real validation and real security
> behind it. I ran a 63-check automated test suite against the live application and manually
> verified every workflow across all four roles, including things like: does closing a job actually
> stop candidates from applying, does disabling an employee actually invalidate their existing
> login token, does an edited job's category/location actually persist. I also found and fixed real
> bugs this way — for example, a Hibernate collection-handling bug that only showed up when I
> actually saved a candidate profile, not from reading the code. I'm confident presenting this as
> genuinely production-quality work, with the caveat that connecting a real email/SMS provider and
> a TLS certificate are the only things standing between this and a live deployment — both are
> configuration steps, not missing code."
