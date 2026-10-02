-- MOVONHUB initial schema
-- Apply with: supabase db push   (or paste into the Supabase SQL editor)
--
-- The application uses the service role key on the server for all writes, so RLS
-- below is primarily a defence-in-depth layer for any direct anon client access.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------- advisors
create table if not exists public.advisors (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'),
  name          text not null,
  title         text not null default 'MOVON Star Advisor',
  phone         text not null,
  phone_display text,
  email         text,
  photo_url     text,
  bio           text,
  location      text,
  whatsapp_name text,
  greeting      text,
  accent        text,
  socials       jsonb not null default '{}'::jsonb,
  password_hash text not null,
  active        boolean not null default true,
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- -------------------------------------------------------------- categories
create table if not exists public.categories (
  id          text primary key,
  slug        text not null unique,
  name        text not null,
  description text,
  icon        text,
  sort_order  integer not null default 0
);

-- ---------------------------------------------------------------- products
create table if not exists public.products (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  name              text not null,
  category_id       text not null references public.categories(id) on delete restrict,
  series            text,
  model             text,
  image_url         text,
  short_description text not null default '',
  full_description  text,
  features          jsonb not null default '[]'::jsonb,
  specifications    jsonb not null default '{}'::jsonb,
  rental_plans      jsonb not null default '[]'::jsonb,
  outright_price    numeric,
  warranty          text,
  installation      text,
  status            text not null default 'draft' check (status in ('active','draft','archived')),
  source_url        text,
  sort_order        integer not null default 0,
  updated_at        timestamptz not null default now()
);

-- -------------------------------------------------------------- promotions
create table if not exists public.promotions (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text not null default '',
  start_date   date,
  end_date     date,
  product_ids  jsonb not null default '[]'::jsonb,
  terms        text,
  active       boolean not null default false,
  source_url   text,
  created_at   timestamptz not null default now()
);

-- --------------------------------------------------------------- enquiries
create table if not exists public.enquiries (
  id               uuid primary key default gen_random_uuid(),
  advisor_id       uuid references public.advisors(id) on delete set null,
  advisor_slug     text,
  customer_name    text,
  customer_phone   text,
  product_interest text,
  source_page      text,
  channel          text not null default 'whatsapp',
  message          text,
  status           text not null default 'new' check (status in ('new','contacted','won','lost')),
  created_at       timestamptz not null default now()
);

create index if not exists enquiries_advisor_id_idx on public.enquiries(advisor_id);
create index if not exists enquiries_created_at_idx on public.enquiries(created_at desc);

-- ---------------------------------------------------------------- settings
create table if not exists public.settings (
  id                     text primary key,
  featured_advisor_slugs jsonb not null default '[]'::jsonb,
  tools                  jsonb not null default '[]'::jsonb
);

insert into public.settings (id, featured_advisor_slugs, tools)
values ('platform', '[]'::jsonb, '[]'::jsonb)
on conflict (id) do nothing;

-- --------------------------------------------------------------------- RLS
alter table public.advisors   enable row level security;
alter table public.categories enable row level security;
alter table public.products   enable row level security;
alter table public.promotions enable row level security;
alter table public.enquiries  enable row level security;
alter table public.settings   enable row level security;

-- Public read for active advisors (never expose password_hash to anon:
-- the app reads advisors server-side with the service role key).
drop policy if exists "public read active advisors" on public.advisors;
create policy "public read active advisors" on public.advisors
  for select using (active = true);

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories
  for select using (true);

drop policy if exists "public read active products" on public.products;
create policy "public read active products" on public.products
  for select using (status = 'active');

drop policy if exists "public read active promotions" on public.promotions;
create policy "public read active promotions" on public.promotions
  for select using (
    active = true
    and (start_date is null or start_date <= current_date)
    and (end_date is null or end_date >= current_date)
  );

-- Customers may submit enquiries, but not read them back.
drop policy if exists "public insert enquiries" on public.enquiries;
create policy "public insert enquiries" on public.enquiries
  for insert with check (true);

drop policy if exists "public read settings" on public.settings;
create policy "public read settings" on public.settings
  for select using (true);

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public)
values ('advisor-photos', 'advisor-photos', true)
on conflict (id) do nothing;

drop policy if exists "public read advisor photos" on storage.objects;
create policy "public read advisor photos" on storage.objects
  for select using (bucket_id = 'advisor-photos');
