-- Use this only if you already created the older table version.
-- If there is no real data yet, the cleanest path is to drop the table and run 001 again.

alter table public.enrollment_submissions
  add column if not exists other_academic_unit text null;

-- Copy the normalized DNI into dni when the old dni_normalized column exists.
do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'enrollment_submissions'
      and column_name = 'dni_normalized'
  ) then
    update public.enrollment_submissions
    set dni = dni_normalized
    where dni_normalized is not null;

    alter table public.enrollment_submissions
      drop column dni_normalized;
  end if;
end $$;

alter table public.enrollment_submissions
  drop constraint if exists enrollment_submissions_dni_normalized_check;

alter table public.enrollment_submissions
  drop constraint if exists enrollment_submissions_dni_normalized_key;

drop index if exists public.enrollment_submissions_dni_normalized_idx;

alter table public.enrollment_submissions
  alter column dni set not null;

create unique index if not exists enrollment_submissions_dni_key
  on public.enrollment_submissions (dni);

alter table public.enrollment_submissions
  add constraint enrollment_submissions_dni_format_check
  check (dni ~ '^[0-9]{7,8}$') not valid;

alter table public.enrollment_submissions
  validate constraint enrollment_submissions_dni_format_check;

alter table public.enrollment_submissions
  add constraint enrollment_submissions_other_academic_unit_check
  check (other_academic_unit is null or char_length(trim(other_academic_unit)) between 1 and 180) not valid;

alter table public.enrollment_submissions
  validate constraint enrollment_submissions_other_academic_unit_check;
