-- MOVONHUB Phase 2 - security hardening, SA page settings, bilingual content,
-- audit trail and durable rate limiting.
--
-- Non-destructive and idempotent. Apply AFTER 0001_init.sql and 0002_advisor_status_theme.sql.
-- No existing columns or tables are dropped. No advisor data is reset.

-- Add the source of truth used by the migration runner when re-running.
create extension if not exists "pgcrypto";

-- ------------------------------------------------------- advisor page settings
alter table public.advisors
  add column if not exists default_locale text not null default 'en'
  check (default_locale in ('en', 'ms'));

alter table public.advisors
  add column if not exists allow_language_toggle boolean not null default true;

alter table public.advisors
  add column if not exists allow_theme_toggle boolean not null default true;

-- ----------------------------------------------------- editable website copy
create table if not exists public.site_content (
  id          uuid primary key default gen_random_uuid(),
  scope       text not null check (scope in ('site', 'sa_global', 'sa')),
  advisor_id  uuid references public.advisors(id) on delete cascade,
  content_key text not null,
  locale      text not null check (locale in ('en', 'ms')),
  value       text not null default '',
  status      text not null default 'draft' check (status in ('draft', 'published')),
  updated_by  text,
  updated_at  timestamptz not null default now(),
  constraint site_content_scope_advisor check (
    (scope in ('site', 'sa_global') and advisor_id is null)
    or (scope = 'sa' and advisor_id is not null)
  )
);

-- One row per scope + advisor (or the null advisor for site-wide scopes) +
-- key + locale. NULLS NOT DISTINCT is required because site/global rows use a
-- NULL advisor_id. PostgreSQL 15+ (Supabase default).
create unique index if not exists site_content_unique_idx
  on public.site_content (scope, advisor_id, content_key, locale) nulls not distinct;

create index if not exists site_content_scope_idx on public.site_content (scope, status);

-- -------------------------------------------------------------- audit trail
create table if not exists public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    text not null,
  actor_role  text not null,
  action      text not null,
  target_type text,
  target_id   text,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_logs_created_at_idx on public.audit_logs (created_at desc);
create index if not exists audit_logs_action_idx on public.audit_logs (action);

-- ---------------------------------------------------------- durable rate limit
create table if not exists public.rate_limits (
  key      text primary key,
  count    integer not null default 0,
  reset_at timestamptz not null
);

-- Atomic fixed-window limiter. Returns true when the caller is within the
-- limit, false when it has been exceeded. SECURITY DEFINER so the server can
-- call it without granting table access to other roles.
create or replace function public.consume_rate_limit(
  p_key text,
  p_limit integer,
  p_window_seconds integer
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_now timestamptz := now();
  v_reset timestamptz;
  v_count integer;
begin
  insert into public.rate_limits (key, count, reset_at)
  values (p_key, 0, v_now + make_interval(secs => p_window_seconds))
  on conflict (key) do nothing;

  select count, reset_at into v_count, v_reset
  from public.rate_limits
  where key = p_key
  for update;

  if v_reset < v_now then
    update public.rate_limits
      set count = 1, reset_at = v_now + make_interval(secs => p_window_seconds)
      where key = p_key;
    return true;
  end if;

  if v_count >= p_limit then
    return false;
  end if;

  update public.rate_limits set count = count + 1 where key = p_key;
  return true;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;

-- --------------------------------------------------------------------- RLS
alter table public.site_content enable row level security;
alter table public.audit_logs   enable row level security;
alter table public.rate_limits  enable row level security;

-- No public policies are created for these tables: only the server-side service
-- role (which bypasses RLS) reads or writes them.

-- FIX: the previous "public read active advisors" policy exposed every column,
-- including password_hash and private email, to anyone holding the anon key.
-- Remove direct table reads and expose only safe columns through a view.
revoke select on public.advisors from anon, authenticated;
drop policy if exists "public read active advisors" on public.advisors;

drop view if exists public.public_advisors;
create view public.public_advisors as
  select
    id, slug, name, title, phone, phone_display, photo_url, bio, location,
    whatsapp_name, greeting, accent, socials, featured, status, active,
    default_locale, allow_language_toggle, allow_theme_toggle,
    created_at, updated_at
  from public.advisors
  where active = true and status = 'published';

comment on view public.public_advisors is
  'Safe public projection of advisors. Intentionally excludes password_hash and email.';

grant select on public.public_advisors to anon, authenticated;

-- FIX: remove the wide-open public enquiry insert policy. Enquiries are
-- recorded server-side with the service role, so anonymous inserts are not
-- required and previously allowed unauthenticated spam with arbitrary status.
drop policy if exists "public insert enquiries" on public.enquiries;

-- Products and categories keep their existing public-read policies. Promotions
-- keep their date-bounded public-read policy. Settings remain public-read only
-- (no credentials are stored there).
