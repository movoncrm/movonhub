# MOVONHUB Backup and Recovery

This document describes how to protect and restore production data before and
after schema changes. No backup is claimed to exist until it has been verified
with the checks below. Nothing in this repository creates a backup automatically.

## 1. What must be protected

- Supabase Postgres data: `advisors`, `categories`, `products`, `promotions`,
  `enquiries`, `settings`, `site_content`, `audit_logs`.
- Supabase Storage: the `advisor-photos` bucket.
- Cloudflare Worker secrets and vars (store them in a password manager, not here).
- The GitHub repository history.

`rate_limits` is transient and does not need backing up.

## 2. Verify whether backups already exist

Do this first. Do not assume.

1. Supabase dashboard -> Project -> Database -> Backups. Note whether daily
   backups and Point-in-Time Recovery (PITR) are enabled and the retention window.
   Free projects may have neither.
2. Record the result in the release checklist. If there are no automated backups,
   perform a manual export (section 3) before applying migrations.

## 3. Manual logical backup (works on any plan)

Run from a trusted machine. Use the direct database connection string from
Supabase (Project -> Settings -> Database -> Connection string). Do not paste it
into chat, tickets or this repository.

```powershell
# Set the connection string in the current shell only. Never commit it.
$env:SUPABASE_DB_URL = "<paste connection string here>"

# Full schema + data dump (custom format).
pg_dump "$env:SUPABASE_DB_URL" --no-owner --no-privileges --format=custom --file=movonhub-backup.dump

# Optional: plain SQL, easier to inspect.
pg_dump "$env:SUPABASE_DB_URL" --no-owner --no-privileges --format=plain --file=movonhub-backup.sql
```

Store the dump in at least two locations (for example encrypted cloud storage
and an offline copy). Restrict access.

### Targeted export via the SQL editor

For a quick snapshot of the newer tables:

```sql
-- Run in the Supabase SQL editor and download the result as CSV.
select * from public.advisors;
select * from public.site_content;
select * from public.audit_logs;
select * from public.enquiries;
```

## 4. Storage backup

Supabase Storage objects are not included in a database dump.

1. Supabase dashboard -> Storage -> `advisor-photos`.
2. Download the bucket, or use the Supabase CLI:
   - `supabase storage cp -r ss:///advisor-photos ./advisor-photos-backup` (check
     the CLI version's syntax, as it changes between releases).

## 5. Pre-migration checklist

Only apply migration `0003` after all of these:

1. Section 2 completed and the backup status recorded.
2. A manual dump from section 3 completed and verified readable.
3. `advisor-photos` backed up.
4. A named roll-forward plan (section 6) for every changed object.
5. A maintenance window communicated, because migration `0003` revokes the old
   advisor select policy. The server uses the service role, so pages keep working,
   but any external anon consumer of `advisors` would break. None are known.

## 6. Migration safety and roll-forward

Migration `0003` is additive and non-destructive:

- Adds columns with defaults to `advisors` (`default_locale`,
  `allow_language_toggle`, `allow_theme_toggle`). Existing rows keep their data.
- Creates `site_content`, `audit_logs` and `rate_limits`.
- Creates the `consume_rate_limit` function and the `public_advisors` view.
- Drops two RLS policies (`public read active advisors`, `public insert
  enquiries`) and replaces the advisor read path with the safe view.

It does not drop tables or columns and does not reset advisor data. To roll
forward rather than back (preferred in production):

- Re-create the removed policies from `0001_init.sql` if a legacy anon consumer is
  discovered, but keep the safe view.
- Drop the new columns and tables only if you are certain the application is
  rolled back to the previous build.

To rebuild the schema in a recovery environment:
`0001_init.sql`, `0002_advisor_status_theme.sql`, `0003_security_content_settings.sql`,
then `supabase/seed.sql`.

## 7. Restore procedure

1. Create or choose an empty target Supabase project (or database).
2. Restore the dump:
   - `pg_restore --no-owner --no-privileges --dbname "$env:TARGET_DB_URL" movonhub-backup.dump`
   - or run the plain `.sql` in the SQL editor.
3. Re-apply any migrations that post-date the dump, in order.
4. Re-upload the `advisor-photos` bucket.
5. Update the Worker secrets to point at the restored project if the URL or keys
   changed, then redeploy.
6. Verify: log in as `admin`, open `/admin` and `/admin/content`, load an advisor
   subdomain, submit a test enquiry, and confirm it appears in the dashboard.
7. Rotate credentials used during recovery, because the connection string and
   keys were handled manually.

## 8. Recovery drills

At least once before onboarding multiple advisors, restore the latest dump into a
throwaway project and run the section 7 verification. Record how long it takes.
An untested backup is not a backup.

## 9. What this phase did not do

- No backup was taken, moved or verified as part of writing this document.
- No Supabase setting was changed.
- No migration was applied to production.
- No credentials were printed, stored or committed.
