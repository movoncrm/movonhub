-- MOVONHUB — advisor publish status + preferred microsite theme
-- Apply after 0001_init.sql. Non-destructive.

alter table public.advisors
  add column if not exists status text not null default 'published'
  check (status in ('draft', 'published', 'suspended'));

alter table public.advisors
  add column if not exists preferred_theme text not null default 'light'
  check (preferred_theme in ('light', 'dark'));

-- Public pages may only read published + active advisors.
drop policy if exists "public read active advisors" on public.advisors;
create policy "public read active advisors" on public.advisors
  for select using (active = true and status = 'published');

create index if not exists advisors_slug_idx on public.advisors(slug);
