# Installation Guide

Complete setup instructions for running the Shivani Technologies Job Portal from scratch.

## 1. Install Docker

**Windows / Mac:** Download and install **Docker Desktop** from
https://www.docker.com/products/docker-desktop/ — this includes Docker Engine, Docker Compose, and
a GUI for managing containers.

**Linux:** Install Docker Engine + the Compose plugin per your distribution:
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # log out/in after this
```

Verify:
```bash
docker --version
docker compose version
```

## 2. Docker Desktop Setup (Windows/Mac)

1. Launch Docker Desktop after installing.
2. Wait for the whale icon in the system tray/menu bar to show "Docker Desktop is running" — first
   launch can take a minute or two while it initializes its backend (WSL2 on Windows, or a Linux VM
   on Mac).
3. No further configuration is needed for this project — default settings (memory, CPU) are fine.

## 3. Clone the Repository

```bash
git clone <this-repository-url>
cd shivani-tech
```

## 4. Environment Variables

Defaults are safe for local/demo use out of the box. To override anything, create a `.env` file
next to `docker-compose.yml`:

```env
DB_PASSWORD=some-password
JWT_SECRET=a-long-random-string
VITE_API_BASE_URL=http://localhost:8080
```

For real (non-demo) deployment, see `docs/ENVIRONMENT_VARIABLES.md` for the full list, including
`MAIL_*`/`TWILIO_*` for real email/SMS delivery and `CORS_ALLOWED_ORIGINS` for locking down access.

## 5. Build and Start Everything

```bash
docker compose up --build
```

(Add `-d` to run in the background: `docker compose up --build -d`.)

This builds the backend (Maven), builds the frontend (npm/Vite), and starts all three containers:
MySQL, the Spring Boot API, and the nginx-served React app.

- Frontend → http://localhost:5173
- Backend API → http://localhost:8080

First boot creates all database tables automatically — there's no seed data baked into the image.
This repository's submission already includes seeded demo accounts and sample data in its database
volume; if you're starting completely fresh, see "Create the first admin" below.

Confirm everything is healthy:
```bash
docker compose ps
```
All three should show `Up` (mysql should show `(healthy)`).

## 6. Create the First Admin (only needed on a truly fresh database)

There's no public admin-registration endpoint on purpose. Generate a bcrypt hash for your chosen
password (any of these work):
- https://bcrypt-generator.com (cost factor 10)
- Python: `pip install bcrypt && python -c "import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())"`
- A throwaway container: `docker run --rm python:3.11-alpine sh -c "pip install bcrypt -q && python3 -c \"import bcrypt; print(bcrypt.hashpw(b'yourpassword', bcrypt.gensalt()).decode())\""`

Then insert it:
```bash
docker exec -it shivani-mysql mysql -uroot -proot -e "INSERT INTO shivani_job_portal.users (id, email, password, role, is_verified, is_enabled, created_at) VALUES (UUID_TO_BIN(UUID()), 'admin@shivanitech.in', '<paste-hash-here>', 'ADMIN', true, true, NOW());"
```

**Important:** use `UUID_TO_BIN(UUID())`, not bare `UUID()` — the `id` column is `binary(16)`
(Hibernate's default UUID storage), and a plain string UUID is too long for it. This is a confirmed,
tested requirement, not a guess.

## 7. Running Manually (without Docker)

**Prerequisites:** JDK 17+, Maven 3.9+, Node 18+, a local MySQL 8 instance.

**Backend:**
```bash
cd backend
mvn spring-boot:run
```
Configure `DB_URL`/`DB_USERNAME`/`DB_PASSWORD` as environment variables if your local MySQL isn't
`root`/`root` on `localhost:3306`. Full list in `backend/README.md`.

**Frontend:**
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

## 8. Stopping Containers

```bash
docker compose down
```
This stops and removes the containers but **keeps your data** (MySQL data and uploaded resumes live
in named Docker volumes, not inside the containers). Confirmed by testing: a full `down` followed by
`up` preserves all accounts, jobs, and uploaded files.

To also wipe all data (start completely fresh):
```bash
docker compose down -v
```

## 9. Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `docker compose up` fails with a port-already-in-use error | Something else on your machine is using 8080, 5173, or 3306 | Stop the conflicting process, or change the host-side port in `docker-compose.yml` (e.g. `"8081:8080"`) |
| MySQL container won't become healthy | First boot can take 20-30 seconds; if it never becomes healthy, check `docker compose logs mysql` | Usually resolves itself; if not, `docker compose down -v` and try again |
| Backend container exits immediately | Compile error, or can't reach MySQL | `docker compose logs backend` — look for `ERROR` lines. If it's a DB connection error, confirm the mysql container is healthy first |
| "Data too long for column 'id'" when inserting an admin | Used bare `UUID()` instead of `UUID_TO_BIN(UUID())` | See step 6 above |
| Registered a candidate but never got an OTP email | No real `MAIL_HOST` configured (expected in a demo/local setup) | Read the code from the backend log instead: `docker compose logs backend \| grep "EMAIL NOT SENT"` (or `findstr` on Windows cmd) |
| `scripts/smoke-test.sh` fails at the very first check | Backend/frontend not actually up yet | Run `docker compose ps` and `curl http://localhost:8080/api/jobs/search` first to confirm reachability |
| Windows Command Prompt, no WSL/Git Bash | Use `scripts\smoke-test.bat` instead of the `.sh` version — see the file's own header comment for exact usage |
| Docker Desktop stuck "starting" for a long time | First-run initialization (WSL2/Hyper-V backend) can genuinely take a few minutes | Wait it out; if it never completes, restart the machine and try again |
