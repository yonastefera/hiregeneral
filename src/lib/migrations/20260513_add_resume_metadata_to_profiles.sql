alter table public.profiles
add column if not exists resume_file_name text,
add column if not exists resume_file_size integer,
add column if not exists resume_uploaded_at timestamptz,
add column if not exists resume_scan_status text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'profiles_resume_scan_status_check'
  ) then
    alter table public.profiles
    add constraint profiles_resume_scan_status_check
    check (
      resume_scan_status is null
      or resume_scan_status in ('pending_scan', 'available', 'rejected')
    );
  end if;
end $$;