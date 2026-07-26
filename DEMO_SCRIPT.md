# Monday demo script

A basic, working walkthrough of all three roles. Run this once before the demo so nothing surprises
you live in front of HR.

## 0. Start everything

```bash
docker compose up --build
```

Frontend: http://localhost:5173 · Backend: http://localhost:8080

## 1. Create the first admin (one-time, do this before the demo)

No public admin sign-up on purpose — insert directly into MySQL:

```sql
INSERT INTO users (id, email, password, role, is_verified, is_enabled, created_at)
VALUES (UUID_TO_BIN(UUID()), 'admin@shivanitech.in', '<bcrypt-hash-of-your-password>', 'ADMIN', true, true, NOW());
```

(`id` is `binary(16)` — bare `UUID()` fails with "Data too long for column 'id'"; you need `UUID_TO_BIN(UUID())`.)

Get a bcrypt hash any of these ways:
- https://bcrypt-generator.com (paste your chosen password, cost 10)
- Python: `pip install bcrypt && python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"`

Log in at http://localhost:5173/login with `admin@shivanitech.in` / your chosen password.

## 2. Admin sets up the building blocks (do this before the demo too)

Nav → **Categories & skills** → add at least one of each:
- Category: e.g. "Engineering"
- Designation: e.g. "Software Engineer"
- Location: e.g. "Bengaluru"
- Skill: e.g. "Java"

## 3. Live demo flow (what to actually click through on Monday)

**A. Candidate side**
1. Log out, go to **Get started** → register a candidate account
2. You'll land on a **Verify your email** screen — a real OTP provider isn't configured, so pull
   the code from the backend logs instead:
   ```bash
   docker compose logs backend | grep "EMAIL NOT SENT" | tail -1
   ```
   The 6-digit code is right there in the logged message body. Enter it → you're verified → log in.
3. Land on **Find jobs** → show the filter bar (category/location/skill/salary/experience)
4. (If a job already exists from step B below) click into a job, **Apply**
5. Nav → **My applications** → show the applied job listed

**B. Employer side**
1. Log out, go to `/register/company` → register a company (e.g. "Acme Corp")
2. Point out: newly registered companies start **PENDING** and can't post yet
3. Log back in as admin → nav → **Companies** → find "Acme Corp" → click **Verify**
4. Log out, log back in as the Acme Corp employer account → nav → **Employer dashboard**
5. Fill out the job form (title, category, designation, location, skills, salary/experience) → **Post job**
6. Show the job appears in "Your job openings" below the form

**C. Admin oversight**
1. Log in as admin → nav → **All jobs**
2. Toggle **Posted by admin** vs **Posted by companies** to show the distinction
3. Optionally post one job directly as admin via the **Post a job** button on this page
4. Go back to **Find jobs** as a logged-out visitor (or the candidate) and search — show the
   company-posted job is discoverable there too

**D. Admin: employees + dashboard**
1. Nav → **Employees** → create one (e.g. name "Priya Sharma", designation "Recruiter") →
   show it appears in the list with an Active/Disable toggle
2. Nav → **Dashboard** → show the live counts (candidates, companies by status, jobs by status,
   applications) update as you've created things during the demo

**E. Admin: mail & SMS**
1. Nav → **Mail & SMS** → pick "Candidates" as the audience, write a subject/body, hit send
2. Show the result summary (attempted/sent/failed/skipped)
3. Be upfront that "sent" will show 0 here unless you've configured a real MAIL_HOST — that's
   expected, and the same log line you used for the OTP will show what *would* have gone out

## What to say if asked "what's not done yet"

Good news: functionally, everything in the original spec is built — auth with OTP verification,
job search/apply, employer verification and posting, admin oversight, employee accounts, an
aggregate dashboard, and bulk mail/SMS. The one honest gap: **no real email/SMS provider is
plugged in yet** — that needs a SendGrid/Gmail SMTP or Twilio account (a few minutes to set up,
just needs a decision on which provider). Framing: "the whole hiring loop works end-to-end,
including admin operations and OTP verification; the only thing between this and production
sending real emails/texts is picking a provider and dropping in an API key — the code is
already wired for it."
