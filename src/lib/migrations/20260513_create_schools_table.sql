create extension if not exists pg_trgm;

create table if not exists public.schools (
  id text primary key,
  name text not null,
  city text,
  state text,
  source text not null default 'college_scorecard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists schools_name_trgm_idx
on public.schools
using gin (name gin_trgm_ops);

create index if not exists schools_state_idx
on public.schools (state);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists schools_set_updated_at on public.schools;

create trigger schools_set_updated_at
before update on public.schools
for each row
execute function public.set_updated_at();

alter table public.schools enable row level security;

drop policy if exists "Anyone can read schools" on public.schools;

create policy "Anyone can read schools"
on public.schools
for select
using (true);