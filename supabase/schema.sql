-- ============================================================
--  Cakes by Strictly Desserts — Supabase schema
--  Run this in the Supabase SQL Editor (Database -> SQL Editor -> New query).
--  Safe to re-run: uses IF NOT EXISTS / DROP POLICY guards.
-- ============================================================

-- Needed for gen_random_uuid()
create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- 1. updated_at helper trigger
-- ------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 2. admin_users  (links a Supabase Auth user to admin rights)
--    A row here means "this auth user is allowed in the dashboard".
-- ------------------------------------------------------------
create table if not exists public.admin_users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  full_name   text,
  created_at  timestamptz not null default now()
);

-- Helper: is the currently-authenticated user an admin?
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.id = auth.uid()
  );
$$;

-- ------------------------------------------------------------
-- 3. categories
-- ------------------------------------------------------------
create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null unique,
  description text default '',
  image_url   text default '',
  sort_order  int  not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists trg_categories_updated on public.categories;
create trigger trg_categories_updated
  before update on public.categories
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 4. products
-- ------------------------------------------------------------
create table if not exists public.products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  description  text default '',
  price        numeric(10,2) not null default 0,
  category_id  uuid references public.categories(id) on delete set null,
  image_url    text default '',
  occasions    text[] not null default '{}',     -- e.g. {Birthday,Wedding}
  is_eggless   boolean not null default false,
  badge        text default '',                  -- Bestseller / New / Premium ...
  rating       numeric(2,1) not null default 4.8,
  is_active    boolean not null default true,    -- enable / disable on storefront
  sort_order   int not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_active   on public.products(is_active);

drop trigger if exists trg_products_updated on public.products;
create trigger trg_products_updated
  before update on public.products
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- 5. enquiries  (contact + customise form submissions)
-- ------------------------------------------------------------
create table if not exists public.enquiries (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  contact     text default '',          -- email or phone
  message     text not null,
  category    text default '',
  source      text not null default 'contact',  -- 'contact' | 'customise'
  payload     jsonb default '{}'::jsonb,         -- full structured form for customise
  is_handled  boolean not null default false,
  created_at  timestamptz not null default now()
);

create index if not exists idx_enquiries_created on public.enquiries(created_at desc);

-- ============================================================
--  ROW LEVEL SECURITY
-- ============================================================
alter table public.categories  enable row level security;
alter table public.products    enable row level security;
alter table public.enquiries   enable row level security;
alter table public.admin_users enable row level security;

-- ---------- categories ----------
drop policy if exists "categories public read" on public.categories;
create policy "categories public read"
  on public.categories for select
  using (is_active = true or public.is_admin());

drop policy if exists "categories admin write" on public.categories;
create policy "categories admin write"
  on public.categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- products ----------
drop policy if exists "products public read" on public.products;
create policy "products public read"
  on public.products for select
  using (is_active = true or public.is_admin());

drop policy if exists "products admin write" on public.products;
create policy "products admin write"
  on public.products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ---------- enquiries ----------
-- Anyone may INSERT an enquiry (public contact form).
drop policy if exists "enquiries public insert" on public.enquiries;
create policy "enquiries public insert"
  on public.enquiries for insert
  with check (true);

-- Only admins may read / update / delete enquiries.
drop policy if exists "enquiries admin read" on public.enquiries;
create policy "enquiries admin read"
  on public.enquiries for select
  using (public.is_admin());

drop policy if exists "enquiries admin update" on public.enquiries;
create policy "enquiries admin update"
  on public.enquiries for update
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "enquiries admin delete" on public.enquiries;
create policy "enquiries admin delete"
  on public.enquiries for delete
  using (public.is_admin());

-- ---------- admin_users ----------
-- An admin can read the admin list (e.g. to show who has access).
drop policy if exists "admin_users self read" on public.admin_users;
create policy "admin_users self read"
  on public.admin_users for select
  using (public.is_admin() or id = auth.uid());

-- ============================================================
--  STORAGE  (product / category images)
-- ============================================================
-- Create a public bucket called "product-images".
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

-- Public read of objects in this bucket.
drop policy if exists "product images public read" on storage.objects;
create policy "product images public read"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Only admins may upload / update / delete images.
drop policy if exists "product images admin insert" on storage.objects;
create policy "product images admin insert"
  on storage.objects for insert
  with check (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin update" on storage.objects;
create policy "product images admin update"
  on storage.objects for update
  using (bucket_id = 'product-images' and public.is_admin());

drop policy if exists "product images admin delete" on storage.objects;
create policy "product images admin delete"
  on storage.objects for delete
  using (bucket_id = 'product-images' and public.is_admin());

-- ============================================================
--  DONE.  Next: run seed.sql (optional demo data), then add
--  yourself as an admin (see README "Configure authentication").
-- ============================================================
