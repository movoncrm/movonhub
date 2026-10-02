-- MOVONHUB reference seed (categories + featured products + settings)
-- Safe to run multiple times (idempotent). Contains NO credentials.
-- Run in Supabase SQL Editor AFTER 0001_init.sql and 0002_advisor_status_theme.sql.
-- The Nik advisor account is created separately via /admin (Add New SA).

insert into public.categories (id, slug, name, description, icon, sort_order) values
  ('cat_space',  'space',  'MOVON Space',  'Rent-to-own smart home appliances — laundry, cooling and security.', 'home',     1),
  ('cat_baby',   'baby',   'MOVON Baby',   'Quality, hygienic baby gear — strollers, car seats and essentials.', 'baby',     2),
  ('cat_expert', 'expert', 'MOVON Expert', 'Professional cleaning, maintenance and hygiene services.',            'sparkles', 3)
on conflict (id) do update set
  name = excluded.name, description = excluded.description, icon = excluded.icon, sort_order = excluded.sort_order;

insert into public.products
  (slug, name, category_id, series, model, image_url, short_description, full_description,
   features, specifications, rental_plans, outright_price, status, source_url, sort_order)
values
  ('movon-space-snowmate', 'MOVON SnowMate 1.0HP / 1.5HP', 'cat_space', 'V Series', 'SnowMate',
   'https://movon.com.my/wp-content/uploads/2025/05/Movon-aircon-feature-002-1200x800.png',
   'Smart air conditioner in 1.0HP and 1.5HP.',
   'The MOVON SnowMate (V Series) is a smart air conditioner available in 1.0HP and 1.5HP, designed for comfortable, connected cooling.',
   '["1.0HP / 1.5HP options","Smart control","Energy efficient"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/product/movon-space-snowmate/', 10),

  ('movon-chillmateplus-mseries', 'MOVON ChillMate+ 601L', 'cat_space', 'M Series', 'ChillMate+ 601L',
   'https://movon.com.my/wp-content/uploads/2026/01/ChillMate-plus-featureimg-1200x800.png',
   'Smart space refrigerator with independent temperature zones.',
   'The MOVON ChillMate+ 601L (M Series) is a smart space refrigerator offering large-capacity cooling with independent temperature zones for enhanced freshness control.',
   '["601L capacity","Independent temperature zones","Smart app connectivity"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/product/movon-chillmateplus-mseries/', 6),

  ('movon-duomateplus-mseries', 'MOVON DuoMate+ 10.7', 'cat_space', 'M Series', 'DuoMate+ 10.7',
   'https://movon.com.my/wp-content/uploads/2026/01/DuoMateplus-featureimg-1200x800.png',
   'Hyper Boost washer dryer with intelligent laundry care.',
   'The MOVON DuoMate+ 10.7 (M Series) is a hyper boost washer dryer combining smart laundry features such as automatic detergent dispensing and dedicated baby-care cycles.',
   '["Washer + dryer combo","Automatic detergent dispensing","Baby-care cycle","Smart app connectivity"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/product/movon-duomateplus-mseries/', 3),

  ('movon-space-lockmate', 'MOVON LockMate', 'cat_space', null, 'LockMate',
   'https://movon.com.my/wp-content/uploads/2025/06/Movon-smartlock-feature-landing.png',
   'Smart lock. Smarter security.',
   'The MOVON LockMate is a smart digital door lock that improves home security with convenient keyless entry and app control.',
   '["Keyless entry","App control","Home security"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/product/movon-space-lockmate/', 9),

  ('movon-stroller', 'MOVON Stroller', 'cat_baby', null, 'Stroller',
   'https://movon.com.my/wp-content/uploads/2025/12/Movon-Stroller-feature-122025A-1204x800.png',
   'Strollers for every occasion, ready with rent-to-own plans.',
   'MOVON baby strollers are built for comfort and safety, and are professionally cleaned and maintained so every journey is hygienic and reliable.',
   '["Safety tested","Professionally cleaned","Rent-to-own available"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/movon-baby-products/#stroller', 1),

  ('movon-car-seat', 'MOVON Car Seat', 'cat_baby', null, 'Car Seat',
   'https://movon.com.my/wp-content/uploads/2026/03/movon-car-seat-2026-1200x800.png',
   'Safety and comfort for every ride.',
   'MOVON baby car seats are rigorously tested to meet high safety standards, giving parents confidence on every journey.',
   '["Safety tested","Comfort focused","Rent-to-own available"]'::jsonb, '{}'::jsonb, '[]'::jsonb,
   null, 'active', 'https://movon.com.my/movon-baby-products/#carseat', 2)
on conflict (slug) do update set
  name = excluded.name, category_id = excluded.category_id, series = excluded.series, model = excluded.model,
  image_url = excluded.image_url, short_description = excluded.short_description, full_description = excluded.full_description,
  features = excluded.features, status = excluded.status, source_url = excluded.source_url, sort_order = excluded.sort_order,
  updated_at = now();

-- Mark Nik as the featured advisor (advisor row is created via /admin).
update public.settings
  set featured_advisor_slugs = '["nik"]'::jsonb
  where id = 'platform';
