# Phase 5 — Migration 0004 Production Plan (G3)

> Prepared for G3 approval. **Not applied.** No production change has been made.

## 1. Exact migration file

`supabase/migrations/0004_leads.sql` (58 lines, idempotent, additive).

Contents:

1. `create extension if not exists "pgcrypto";` (no-op if present).
2. `create table if not exists public.leads (...)` with constrained enums
   (`status`, `plan_type`, `category`, `promotion`), FKs to `advisors` and
   `products`, and `net_date` / `incentive_month`.
3. Four indexes on `leads` (`advisor_id`, `advisor_id+status`,
   `advisor_id+contact_normalized`, `advisor_id+incentive_month`).
4. `alter table public.leads enable row level security;`
5. `revoke all on public.leads from anon, authenticated;` (no policies created).
6. `comment on table public.leads ...`.
7. `alter table public.products add column if not exists source_ref text;`

## 2. Tables and policies affected

| Object | Change | RLS |
| --- | --- | --- |
| `public.leads` | **New table** | Enabled; **no policies** → only `service_role` (server) can access |
| `public.products` | Add nullable column `source_ref text` | Unchanged (existing policies untouched) |
| `anon`, `authenticated` | `ALL` on `leads` **revoked** | They cannot read/write leads even with a leaked anon key |

No existing table, column, policy or row is modified except the additive
`products.source_ref` column. No existing policy is dropped.

## 3. Why RLS with no policies is correct here

MOVONHUB authenticates SAs with its own signed HTTP-only cookie session
(`src/lib/auth/session.ts`), not Supabase Auth. Therefore `auth.uid()` is not
available to write owner-scoped policies. Per-advisor isolation is enforced in
the server layer (`listLeads({ advisorId })` from the session; every action
reloads the row and checks `lead.advisorId === session.advisorId`). The
database adds defence-in-depth by denying all `anon`/`authenticated` access;
only the server-side `service_role` (which bypasses RLS) reaches the table.

## 4. Pre-migration backup / recovery preparation

1. Take a Supabase **database backup** (Dashboard → Database → Backups) or a
   `pg_dump` immediately before applying.
2. Confirm the latest daily backup restore point.
3. Record the current schema version (`0003` is the latest applied).
4. Note: production is currently reported as migrations `0001`, `0002` and
   possibly `0003` applied. Verify before applying.

## 5. Apply procedure (after approval)

Via Supabase SQL editor (or `supabase db push` in a linked project):

```sql
-- paste and run the contents of supabase/migrations/0004_leads.sql
```

## 6. Post-apply verification queries

```sql
-- Table + columns present
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'leads'
order by ordinal_position;

-- RLS enabled
select relname, relrowsecurity
from pg_class where relname = 'leads';

-- No policies exist for leads (expected: 0 rows)
select polname from pg_policy
where polrelid = 'public.leads'::regclass;

-- anon/authenticated have no privileges (expected: 0 rows)
select grantee, privilege_type from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'leads';

-- products column present
select column_name from information_schema.columns
where table_schema = 'public' and table_name = 'products' and column_name = 'source_ref';

-- Existing data intact (non-zero if advisors exist)
select count(*) as advisors from public.advisors;
select count(*) as products from public.products;
```

Expected: `leads` exists with RLS = true, zero policies, zero grants; `products`
has `source_ref`; `advisors`/`products` counts unchanged.

## 7. Rollback

Rollback SQL (only if required):

```sql
drop table if exists public.leads;
alter table public.products drop column if exists source_ref;
```

**Rollback limitations:**
- Dropping `leads` is **destructive**: any leads created after the migration
  (including SA test leads) would be permanently lost. Export first if needed.
- `products.source_ref` holds Phase 5 traceability for any products updated
  after the migration; dropping it loses that linkage (product data itself is
  unaffected).
- There is no down-migration tooling in this repo; rollback is manual.

## 8. Data-safety confirmation

- The migration does **not** delete, truncate or update any existing row.
- `create table if not exists`, `add column if not exists` and `revoke` are all
  safe to re-run.
- No production data will be seeded; no fake leads will be inserted.

## 9. Current status

- Branch: `launch`
- Migration file present locally; **not applied to production**.
- Application deployment: not performed.
