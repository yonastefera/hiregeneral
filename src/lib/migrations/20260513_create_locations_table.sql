create extension if not exists pg_trgm;

create table if not exists public.locations (
  id bigserial primary key,
  city text not null,
  state text not null,
  zip_code text,
  country text not null default 'USA',
  popularity_rank integer not null default 100,
  created_at timestamptz not null default now()
);

create index if not exists locations_city_trgm_idx
on public.locations
using gin (city gin_trgm_ops);

create index if not exists locations_state_idx
on public.locations (state);

create index if not exists locations_zip_code_idx
on public.locations (zip_code);

create unique index if not exists locations_unique_city_state_zip_idx
on public.locations (lower(city), state, coalesce(zip_code, ''));

alter table public.locations enable row level security;

drop policy if exists "Anyone can read locations" on public.locations;

create policy "Anyone can read locations"
on public.locations
for select
using (true);