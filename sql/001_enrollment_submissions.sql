create extension if not exists pgcrypto;

create table if not exists public.enrollment_submissions (
  id uuid primary key default gen_random_uuid(),
  first_names text not null check (char_length(trim(first_names)) between 1 and 120),
  last_names text not null check (char_length(trim(last_names)) between 1 and 120),
  dni text not null check (char_length(trim(dni)) between 1 and 20),
  dni_normalized text not null unique check (dni_normalized ~ '^[0-9]{7,10}$'),
  gender text not null check (gender in ('Femenino', 'Masculino', 'No binario', 'Otro')),
  email text not null check (char_length(email) <= 160 and email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  phone text not null check (char_length(phone) between 6 and 40),
  academic_unit text not null check (academic_unit in (
    'Rectorado',
    'Facultad de Ciencias Exactas',
    'Facultad de Ciencias Humanas',
    'Facultad de Ciencias Sociales',
    'Facultad de Ingeniería',
    'Otra unidad académica'
  )),
  place_of_belonging text not null check (char_length(trim(place_of_belonging)) between 1 and 160),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists enrollment_submissions_dni_normalized_idx
  on public.enrollment_submissions (dni_normalized);

create index if not exists enrollment_submissions_created_at_idx
  on public.enrollment_submissions (created_at desc);

alter table public.enrollment_submissions enable row level security;
alter table public.enrollment_submissions force row level security;

revoke all on public.enrollment_submissions from anon, authenticated;

-- This first slice writes through the Vercel server-side endpoint using the
-- Supabase service role key. No public read/update/delete policy is created.
-- If browser-side writes are introduced later, add a narrow insert-only policy
-- deliberately and keep select/update/delete closed for public roles.
