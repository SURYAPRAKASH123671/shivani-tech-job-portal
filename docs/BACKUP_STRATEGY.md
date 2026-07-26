# Backup Strategy

There is currently **no automated backup** configured anywhere in this project — this document is
both the plan and the checklist for setting one up. Everything here is additive (new scripts/cron
jobs), nothing here requires changing application code.

## What needs backing up

| Data | Where it lives | Loss impact if not backed up |
|---|---|---|
| MySQL database (all jobs, users, applications, companies, profiles) | `mysql_data` Docker volume | Total data loss — every account, job, and application gone |
| Uploaded candidate resumes (PDF) | `backend_uploads` Docker volume (added this audit pass) | Candidates lose their uploaded resume (URL-based resumes are unaffected — that's just a string in the DB) |
| `.env` file / secrets | Wherever you keep it (not in the repo) | You'd need to regenerate `JWT_SECRET` (invalidates all logged-in sessions) and re-enter mail/SMS credentials — annoying, not data-destructive |

## MySQL backup

**Logical backup (recommended starting point — simple, portable, human-restorable):**

```bash
# Daily dump, keep as a cron job or scheduled task
docker exec shivani-mysql mysqldump -uroot -p"$DB_PASSWORD" --single-transaction \
  shivani_job_portal > "backup_$(date +%Y%m%d_%H%M%S).sql"
```

- `--single-transaction` gives a consistent snapshot without locking tables (safe for InnoDB, which
  is MySQL 8's default engine)
- Store the resulting `.sql` file somewhere off the host (S3, another server, etc.) — a backup that
  lives next to the thing it backs up isn't a backup
- Compress it: `gzip backup_*.sql` before shipping off-host to save space/bandwidth

**Restore:**

```bash
docker exec -i shivani-mysql mysql -uroot -p"$DB_PASSWORD" shivani_job_portal < backup_20260101_020000.sql
```

**Volume-level backup (faster for large databases, less portable):**

```bash
docker run --rm -v shivani-tech_mysql_data:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/mysql_data_backup.tar.gz -C /data .
```

Restoring this requires stopping the mysql container first and extracting into a fresh volume —
more disruptive than a logical restore, so prefer `mysqldump` unless the database grows large
enough that dump/restore time becomes a real problem.

## Resume uploads backup

```bash
docker run --rm -v shivani-tech_backend_uploads:/data -v "$(pwd)":/backup alpine \
  tar czf /backup/uploads_backup.tar.gz -C /data .
```

Run this on the same schedule as the MySQL backup — a resume upload and its corresponding
`candidate_profiles.resume_file_name` DB row need to stay in sync, so back both up together, not
on staggered schedules.

## Suggested schedule

| Environment | Frequency | Retention |
|---|---|---|
| Production | Daily full dump + uploads archive, retained 30 days; consider hourly binlog-based
  point-in-time recovery once this handles real user data | 30 days rolling, plus 1 monthly snapshot kept for a year |
| Staging/demo | Weekly, or before any risky change | 2 most recent |

## Automating it

Simplest path: a cron job (Linux host) or Windows Task Scheduler entry running a small script that
does both backups above and uploads the results to off-host storage (S3, Backblaze, etc.). This
project doesn't include that script yet — worth adding once you've picked a hosting provider and
target storage, since the upload step is provider-specific.

## Recovery testing

A backup you've never restored is a backup you don't actually have. At minimum:

1. Before your real launch, do one full restore into a throwaway environment and confirm the app
   works against the restored data
2. Repeat this test at least quarterly once in production — providers/tools change, silently
   broken backups are common

## What's NOT covered here

- `JWT_SECRET` and mail/SMS credentials aren't "backed up" in the traditional sense — losing them
  just means regenerating/re-entering them, not data loss. Still, keep a copy in a password
  manager or secrets vault, not only in the `.env` file on the server
- This document doesn't cover disaster recovery for the *hosting infrastructure* itself (losing the
  whole VPS, region outage, etc.) — that's a separate, larger conversation once you've picked where
  this actually runs (see `docs/DEPLOYMENT_CHECKLIST.md`)
