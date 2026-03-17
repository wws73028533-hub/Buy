create extension if not exists pgcrypto;

create or replace function public.set_current_timestamp_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  cover_image_url text,
  content_json jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tutorial_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  type text not null check (type in ('link', 'file')),
  url text,
  file_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tutorial_items_type_content_check check (
    (type = 'link' and url is not null and file_url is null)
    or (type = 'file' and file_url is not null and url is null)
  )
);

create table if not exists public.contact_items (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  value text not null,
  link_url text,
  qr_image_url text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_tutorial_items_updated_at on public.tutorial_items;
create trigger set_tutorial_items_updated_at
before update on public.tutorial_items
for each row execute function public.set_current_timestamp_updated_at();

drop trigger if exists set_contact_items_updated_at on public.contact_items;
create trigger set_contact_items_updated_at
before update on public.contact_items
for each row execute function public.set_current_timestamp_updated_at();
