# Environment Variable Checklist

Every variable the backend reads, whether it has a safe default, and what to actually set before
a real deployment. None of these need code changes — they're all already wired via
`application.yml` / `docker-compose.yml`.

## Must change before any real deployment

| Variable | Why it's mandatory | What to set it to |
|---|---|---|
| `JWT_SECRET` | Defaults to a placeholder string visible in this repo's history. Anyone who has ever seen this codebase can forge valid tokens if you don't change it. | A long random value, e.g. `openssl rand -base64 48` |
| `DB_PASSWORD` | Defaults to `root`. | A real generated password, stored in a secrets manager, not committed anywhere |
| `CORS_ALLOWED_ORIGINS` | Defaults to `*` (any origin). Fine for local dev, wrong for production. | Your real frontend domain(s), comma-separated, e.g. `https://shivanitech.in,https://www.shivanitech.in` |

## Should set for real email/SMS to work

| Variable | Default | Notes |
|---|---|---|
| `MAIL_HOST` | *(empty — logs instead of sending)* | e.g. `smtp.gmail.com` or `smtp.sendgrid.net` |
| `MAIL_PORT` | `587` | |
| `MAIL_USERNAME` | *(empty)* | For Gmail, your full Gmail address; for SendGrid, literally `apikey` |
| `MAIL_PASSWORD` | *(empty)* | For Gmail, a 16-character **app password** (not your account password — see below); for SendGrid, your API key |
| `MAIL_FROM` | `no-reply@shivanitech.in` | **For Gmail, this must be set to the same address as `MAIL_USERNAME`** — Gmail's SMTP servers reject or silently rewrite a `From` header that doesn't match the authenticated account. Only SendGrid/SES let you send from an arbitrary domain-verified address. |
| `TWILIO_ACCOUNT_SID` | *(empty)* | From the Twilio console |
| `TWILIO_AUTH_TOKEN` | *(empty)* | From the Twilio console — treat as a secret |
| `TWILIO_FROM_NUMBER` | *(empty)* | A Twilio number you've purchased/verified |

### Setting up Gmail SMTP (simplest option for OTP delivery)

1. The Gmail account must have **2-Step Verification** turned on (Google Account → Security). App
   passwords aren't available without it.
2. Go to <https://myaccount.google.com/apppasswords>, create an app password (name it something
   like "Shivani Job Portal"), and copy the 16-character value it generates.
3. Set:
   ```env
   MAIL_HOST=smtp.gmail.com
   MAIL_PORT=587
   MAIL_USERNAME=your-address@gmail.com
   MAIL_PASSWORD=<the 16-character app password, no spaces>
   MAIL_FROM=your-address@gmail.com
   ```
4. Gmail's free SMTP relay caps outgoing mail at roughly 500 messages/day per account — fine for
   OTP volume on a small deployment, not a scale-up option. Move to SendGrid/SES (same variables,
   different host/username) if you outgrow it.

## Safe to leave at defaults for most deployments

| Variable | Default | Notes |
|---|---|---|
| `SERVER_PORT` | `8080` | Change only if your infra requires a different port |
| `PORT` | *(falls back to `SERVER_PORT`, then `8080`)* | Most PaaS hosts (Render, Heroku, etc.) inject this automatically to tell the app which port to bind - takes priority over `SERVER_PORT` when both are present. No action needed for Docker Compose/local use. |
| `JWT_EXPIRATION_MS` | `86400000` (24h) | Shorten for higher-security environments (e.g. 3600000 = 1h), lengthen for convenience |
| `OTP_EXPIRY_MINUTES` | `10` | |
| `DB_URL` | Points at the `mysql` container by service name in docker-compose | Only change if using an external managed DB |
| `DB_USERNAME` | `root` | Consider a dedicated non-root DB user for production (see Security Checklist) |
| `UPLOADS_DIR` | `uploads` | Only change if you've customized the volume mount |
| `SHOW_SQL` | `false` | Set `true` temporarily for local debugging only — never in production (verbose, can leak data into logs) |
| `APP_LOG_LEVEL` | `INFO` | Set `DEBUG` temporarily for local debugging only |
| `VITE_API_BASE_URL` (frontend build arg) | `http://localhost:8080` | Must point at your real backend URL/domain in any non-local deployment — this is a **build-time** arg, so the frontend image must be rebuilt if this changes |

## How to set them

Create a `.env` file next to `docker-compose.yml` (already gitignored patterns should cover this —
verify `.env` is in `.gitignore` before committing anything):

```env
DB_PASSWORD=<generate-a-real-password>
JWT_SECRET=<generate-with-openssl-rand--base64-48>
CORS_ALLOWED_ORIGINS=https://shivanitech.in
MAIL_HOST=smtp.sendgrid.net
MAIL_USERNAME=apikey
MAIL_PASSWORD=<your-sendgrid-api-key>
MAIL_FROM=no-reply@shivanitech.in
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>
TWILIO_FROM_NUMBER=+1XXXXXXXXXX
VITE_API_BASE_URL=https://api.shivanitech.in
```

Then `docker compose up --build -d` — compose automatically loads `.env` from the same directory.
