create extension if not exists pgcrypto;

create table if not exists public.enrollment_submissions (
  id uuid primary key default gen_random_uuid(),
  first_names text not null check (char_length(trim(first_names)) between 1 and 120),
  last_names text not null check (char_length(trim(last_names)) between 1 and 120),
  dni text not null unique check (dni ~ '^[0-9]{7,8}$'),
  gender text not null check (gender in ('Femenino', 'Masculino', 'No binario', 'Otro')),
  email text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (char_length(phone) between 6 and 40),
  academic_unit_id text not null check (char_length(trim(academic_unit_id)) between 1 and 120),
  academic_unit text not null check (char_length(trim(academic_unit)) between 1 and 180),
  other_academic_unit text null check (other_academic_unit is null or char_length(trim(other_academic_unit)) between 1 and 180),
  place_of_belonging text not null check (char_length(trim(place_of_belonging)) between 1 and 160),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_submissions_created_at_idx
  on public.enrollment_submissions (created_at desc);

create index if not exists enrollment_submissions_academic_unit_id_idx
  on public.enrollment_submissions (academic_unit_id);

alter table public.enrollment_submissions enable row level security;
alter table public.enrollment_submissions force row level security;

revoke all on public.enrollment_submissions from anon, authenticated;

-- Writes go through the Vercel server-side endpoint using the Supabase service
-- role key. Academic-unit validation and the closing date are centralized in
-- JavaScript and enforced again by api/submit.js before inserting.
