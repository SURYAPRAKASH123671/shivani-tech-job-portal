# Deployment Checklist

## Pre-deployment (do these once, before the first real deployment)

- [ ] Generate a real `JWT_SECRET` (`openssl rand -base64 48`) — see `docs/ENVIRONMENT_VARIABLES.md`
- [ ] Set a real `DB_PASSWORD` (not `root`)
- [ ] Set `CORS_ALLOWED_ORIGINS` to your real frontend domain(s)
- [ ] Decide on and configure a real mail provider (`MAIL_*`) — Gmail app password for a quick
  start, SendGrid/SES for anything beyond a demo
- [ ] Decide on and configure Twilio (`TWILIO_*`) if SMS is actually needed at launch — it's fine
  to launch without it (sends just get logged) if SMS isn't a day-one requirement
- [ ] Put `.env` somewhere it won't get committed (already gitignored — double-check before your
  first `git add`)
- [ ] Run `bash scripts/smoke-test.sh` against a fresh environment and confirm all checks pass
- [ ] Walk `docs/UAT_REPORT.md` manually at least once
- [ ] Decide on hosting: see "Hosting options" below
- [ ] Set up TLS/HTTPS in front of both frontend and backend (neither serves HTTPS directly) —
  Caddy is the least-effort option (auto-provisions Let's Encrypt certs), nginx if you want more
  control
- [ ] Point DNS at your chosen host once it's up
- [ ] Set up the backup cron job from `docs/BACKUP_STRATEGY.md`
- [ ] Do one full backup-and-restore test before declaring this launch-ready

## Hosting options (pick one)

**Cheapest / least ops overhead:**
| Piece | Where |
|---|---|
| Backend + MySQL | Railway or Render — connect the repo, point at `backend/Dockerfile`, add a managed MySQL add-on |
| Frontend | Vercel or Netlify — root directory `frontend/`, build command `npm run build`, output `dist/` |

**More control, more setup:**
- Any VPS with Docker installed can run `docker-compose.yml` as-is
- Point your domain's A record at the VPS IP
- `git clone` onto the VPS, set real `.env` values, `docker compose up --build -d`
- Put Caddy or nginx in front for HTTPS

## Deployment steps (every release, once infra exists)

- [ ] Run the smoke test against staging (if you have one) before promoting to production
- [ ] `docker compose down` (brief downtime) or use a rolling-update strategy if your host supports
  it (Railway/Render do this automatically; a bare VPS with plain `docker compose` does not — a
  redeploy will drop connections briefly)
- [ ] `docker compose up --build -d`
- [ ] Confirm all three containers report healthy: `docker compose ps`
- [ ] Confirm `is_verified`/schema changes applied cleanly — check `docker compose logs backend`
  for any Hibernate schema-update errors (there shouldn't be any; `ddl-auto: update` is
  additive-only and won't drop columns, but always worth a glance after a release that changed
  entities)
- [ ] Smoke-test the live URL: register a test account, log in as your existing admin, post/apply
  to a job
- [ ] Watch `docker compose logs -f backend` for a few minutes after deploy for unexpected errors

## Post-deployment

- [ ] Confirm the backup cron job actually ran on its first scheduled trigger, not just that you
  configured it
- [ ] Set up basic uptime monitoring (even a free service like UptimeRobot hitting
  `/api/jobs/search` every few minutes) — there's no built-in health-check endpoint beyond that
  right now
- [ ] Bookmark `docs/SECURITY_CHECKLIST.md` and revisit it before your next major feature push
- [ ] Rotate `JWT_SECRET` and `DB_PASSWORD` on a schedule that matches your organization's policy
  (rotating `JWT_SECRET` logs everyone out — plan for that)

## Rollback plan

- [ ] Keep the previous Docker image tag around (don't just overwrite `latest`) so you can
  `docker compose up` the prior version quickly if a release breaks something
- [ ] Since `ddl-auto: update` never drops columns automatically, rolling back application code
  after a schema-adding release is safe — the old code simply won't reference the new columns.
  Rolling back *past* a release that changed how existing data is interpreted (not just added new
  optional fields) would need a manual data migration plan — none of the changes in this project's
  history so far require that, but keep it in mind for future schema changes
