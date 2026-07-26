# Demo Video Script

A complete narration script for a ~7-8 minute walkthrough video. Timings are approximate — pace
naturally rather than rushing to hit exact marks. Use the seeded demo accounts from
`DEMO_GUIDE.md`. Before recording, confirm `docker compose ps` shows all three containers healthy.

---

## 0:00 – 0:30 — Introduction

**[Screen: nothing yet, or a title slide with the project name]**

> "Hi, I'm going to walk you through a job portal I built for Shivani Technologies. It's a
> full-stack application — Spring Boot on the backend, React on the frontend, MySQL for storage,
> and it runs as three Docker containers. It supports four roles: Administrator, Employer,
> Employee, and Candidate. I'll show each one, and along the way point out a few things I tested
> and fixed to make sure this is genuinely working, not just a UI mockup."

**[Action: open http://localhost:5173 in the browser]**

---

## 0:30 – 1:30 — Home page and public job search

**[Screen: home page]**

> "This is the public homepage — no login needed. Anyone can search openings here, filtered by
> category, designation, location, skill, salary, or experience."

**[Action: type in a filter, e.g. select "Engineering" category, click Search]**

> "Here are the results updating live. Let's clear that."

**[Action: click "Clear filters"]**

> "And it correctly reloads the full list — this used to be a bug where clearing filters didn't
> actually re-run the search, which I found and fixed."

**[Action: click into one job]**

> "Clicking into a job shows the full detail — description, salary range, required skills,
> qualifications. Since I'm not logged in, it's prompting me to log in to apply."

---

## 1:30 – 3:00 — Candidate role

**[Action: click Log in, sign in as candidate@shivanitech.in]**

> "I'll log in as a candidate — Ananya Rao, one of our seeded demo accounts."

**[Screen: Candidate Dashboard]**

> "This is her dashboard — a welcome card with her profile completion percentage, stat tiles for
> total and active applications, her recent applications, and jobs recommended based on her actual
> skills — Java, Spring Boot, SQL."

**[Action: click "My profile"]**

> "Her full profile — personal info, education, professional details, skills, and career
> preferences. Skills come from an admin-managed list, but candidates can also add free-text custom
> skills for anything not on the list."

**[Action: scroll to Resume section]**

> "And here's resume handling — she can upload a PDF directly, or just paste a link. I validated
> both the accept and reject paths — the backend actually checks both the content-type and the file
> extension before accepting an upload."

**[Action: click Download next to "Currently on file"]**

> "And download works too — it's a real file round-trip, not just a UI placeholder."

**[Action: navigate to a job, click Apply if not already applied, then go to My Applications]**

> "Applying takes one click, and it shows up immediately in My Applications with its current
> status."

---

## 3:00 – 4:30 — Employer role

**[Action: log out, log in as employer@shivanitech.in]**

> "Now the employer side — this is Nexora Technologies, one of three companies I've seeded, already
> verified by an admin."

**[Screen: Employer Dashboard]**

> "Their dashboard shows company status and the jobs they've posted — three real openings here."

**[Action: click Edit on one job, change something, save]**

> "I can edit an existing job — and this actually persists. I specifically tested this by editing a
> job through the API and re-fetching it afterward to confirm the change stuck, not just trusting
> the success message."

**[Action: click Post a job opening, fill a quick example, submit]**

> "And posting a brand-new opening is just as simple."

> "One important thing: a company can't do any of this until an admin verifies them first — that's
> enforced on the server, not just hidden in the UI. If you tried to hit this API directly as an
> unverified company, you'd get a 403, which I confirmed."

---

## 4:30 – 6:00 — Administrator role

**[Action: log out, log in as admin@shivanitech.in]**

**[Screen: Admin Dashboard]**

> "The admin dashboard gives a live snapshot of the whole platform — candidates, companies by
> verification status, jobs by status and source, total applications. These numbers are real, not
> mocked."

**[Action: click Companies]**

> "This is where an admin verifies or rejects a newly-registered company — the step that unlocks
> job posting for them."

**[Action: click All jobs, toggle the "Posted by admin" / "Posted by companies" filter]**

> "Admins can see every job on the platform and filter by who posted it, and can post, edit, close,
> or delete jobs directly too."

**[Action: click Employees, show the list, point at enable/disable]**

> "Admins provision employee logins directly — there's no public sign-up for staff accounts. And
> this disable toggle does something important: if I disable someone here, it doesn't just block
> their next login — it invalidates any token they're already holding. I specifically tested that:
> disabled a test account mid-session and confirmed their existing login token stopped working
> immediately."

**[Action: click Mail & SMS, select an audience, show the recipient picker, send a test message]**

> "And this is targeted communication — admins can broadcast to everyone in an audience, or pick
> specific people. Since there's no live email provider connected in this demo environment, sends
> get logged instead of delivered — that's a configuration step away from working for real, the
> entire pipeline executes correctly end to end."

---

## 6:00 – 7:00 — Reliability and testing

**[Screen: terminal]**

> "Before wrapping up, I want to show how I actually verified this — not just by clicking around,
> but with an automated test suite I built that exercises every role and workflow against the live
> application."

**[Action: run `scripts/smoke-test.sh` or show a pre-captured terminal output]**

> "Sixty-three checks, covering registration, OTP, login, full job CRUD including editing, search,
> applications, resume upload and download, the employer verification gate, employee management,
> and security edge cases like disabled-account tokens — all passing against the real running
> application."

**[Action: run `docker compose down && docker compose up -d`, then `docker compose ps`]**

> "And I stress-tested persistence — a complete teardown and recreation of all three containers,
> and confirmed every account, job, and even uploaded resume file survived, because they live in
> Docker volumes, not inside the containers themselves."

---

## 7:00 – 7:30 — Closing

> "That's the full platform — four roles, a complete hiring workflow, and I've backed every feature
> claim with an actual runtime test rather than just a read-through of the code. The two things
> standing between this and a real production deployment are connecting a real email/SMS provider
> and putting a TLS certificate in front of it — both are configuration steps with the code already
> built and tested against the fallback path. Thanks for watching."

**[End]**

---

## Recording tips

- Do a dry run first — know which demo account has which data before recording, so you're not
  hunting for a job with applicants live on camera.
- If a step depends on OTP (candidate registration), either pre-verify that account beforehand or
  have the `docker compose logs backend | grep "EMAIL NOT SENT"` command ready in a second terminal
  to grab the code quickly.
- Keep browser zoom consistent so screen text is legible after video compression.
- If splitting into multiple takes, cut on the section breaks above (they're natural scene changes).
