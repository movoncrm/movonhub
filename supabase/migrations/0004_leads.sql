-- MOVONHUB Phase 5 - Leads Organizer.
--
-- Non-destructive and idempotent. Apply AFTER 0001, 0002 and 0003.
--
-- CONFIDENTIAL DATA: leads contain customer contact details. This table has NO
-- public policies; only the server-side service role (which bypasses RLS) may
-- read or write it. Direct anon/authenticated access is revoked so a leaked
-- anon key cannot enumerate customer data.

create extension if not exists "pgcrypto";

create table if not exists public.leads (
  id                 uuid primary key default gen_random_uuid(),
  advisor_id         uuid not null references public.advisors(id) on delete cascade,
  customer_name      text,
  contact_raw        text,
  contact_normalized text,
  whatsapp_link      text,
  status             text not null default 'NEW'
    check (status in ('NEW','CONTACTED','NO_REPLY','INTERESTED','FORM','QUALIFIED','NET','REJECTED','CANCELLED')),
  plan_type          text not null default 'outright'
    check (plan_type in ('outright','rental')),
  category           text not null default 'space'
    check (category in ('space','baby','choice','cuckoo','vacuum','other')),
  is_duo             boolean not null default false,
  promotion          text not null default 'none'
    check (promotion in ('none','rm12','samsung','joy_pack')),
  proxy_owner        text,
  location           text,
  product_interest   text,
  product_id         uuid references public.products(id) on delete set null,
  remarks            text,
  last_follow_up_at  timestamptz,
  net_date           date,
  incentive_month    text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

create index if not exists leads_advisor_id_idx on public.leads (advisor_id);
create index if not exists leads_advisor_status_idx on public.leads (advisor_id, status);
create index if not exists leads_advisor_contact_idx on public.leads (advisor_id, contact_normalized);
create index if not exists leads_incentive_month_idx on public.leads (advisor_id, incentive_month);

-- --------------------------------------------------------------------- RLS
alter table public.leads enable row level security;

-- No policies are created: RLS with no policy denies all non-service access.
revoke all on public.leads from anon, authenticated;

comment on table public.leads is
  'Per-advisor customer leads. Confidential (customer PII). Service-role access only; no public policies.';

-- ------------------------------------------------ product source traceability
-- Phase 5 records the source document (and page/section) for each product so
-- pricing/specifications remain auditable. Nullable; existing rows unaffected.
alter table public.products
  add column if not exists source_ref text;
