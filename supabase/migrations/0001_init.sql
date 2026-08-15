-- ============================================================================
-- RUCUSO Ministry of Loans and Sponsorship — Student Information Portal
-- Initial schema, security policies, and backend enforcement.
-- Run this in the Supabase SQL Editor (Project -> SQL Editor -> New query).
-- ============================================================================

-- Required for gen_random_uuid()
create extension if not exists pgcrypto;

-- ----------------------------------------------------------------------------
-- 1. app_config — single-row table of editable site settings
-- ----------------------------------------------------------------------------
create table if not exists app_config (
  id boolean primary key default true,
  deadline timestamptz not null default '2026-08-17T09:00:00Z', -- 12:00 PM Africa/Dar_es_Salaam (UTC+3)
  minister_name text not null default 'Paulo M. Gaitirya',
  minister_phone text not null default '0624847729',
  deputy_minister_name text not null default 'Anthony Ogessa',
  deputy_minister_phone text not null default '0622833881',
  secretary_name text not null default 'Debora Mgeni',
  secretary_phone text not null default '0761622539',
  contact_email text not null default 'systemsoftware.dev.ai@gmail.com',
  announcement_text text not null default 'WANAFUNZI WOTE AMBAO MNAOMBA MKOPO AU MSHAOMBA MKOPO KWA MWAKA HUU WA MASOMO 2026/2027 MNATAKIWA KUJAZA TAARIFA ZENU KWENYE LINK HII. Hata kama bado hujaomba mkopo lakini una mpango wa kuomba mkopo mwaka huu, unatakiwa kujaza taarifa zako. NB: NI WALE TU AMBAO HAWANA MKOPO. Pia, kama uliwasilisha taarifa zako ofisini hapo awali, unatakiwa kujaza tena kupitia mfumo huu. Tafadhali hakikisha taarifa zote unazojaza ni sahihi kabla ya kuwasilisha.',
  organization_name text not null default 'RUCU STUDENTS ORGANIZATION (RUCUSO)',
  logo_url text,
  constraint app_config_single_row check (id = true)
);

insert into app_config (id) values (true) on conflict (id) do nothing;

-- ----------------------------------------------------------------------------
-- 2. admins — allow-listed administrator emails
-- ----------------------------------------------------------------------------
create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz not null default now()
);

-- Seed your first administrator here (edit the email before running):
-- insert into admins (email) values ('your-admin-email@gmail.com');

-- ----------------------------------------------------------------------------
-- 3. student_submissions — one row per student, one submission per Google account
-- ----------------------------------------------------------------------------
create table if not exists student_submissions (
  id uuid primary key default gen_random_uuid(),
  google_user_id uuid not null unique references auth.users(id) on delete cascade,
  google_email text not null,
  full_name text not null,
  registration_number text not null,
  phone_number text not null,
  form_four_index_number text not null,
  declaration_accepted boolean not null default false,
  submitted_at timestamptz not null default now(),
  status text not null default 'submitted'
);

create index if not exists student_submissions_submitted_at_idx
  on student_submissions (submitted_at desc);

-- ----------------------------------------------------------------------------
-- 4. Helper functions (SECURITY DEFINER so they can check tables the caller
--    themselves has no direct read access to, e.g. the admins table).
-- ----------------------------------------------------------------------------

-- True while the submission window is still open. The frontend NEVER decides
-- this on its own — every insert is checked against this function server-side.
create or replace function is_before_deadline()
returns boolean
language sql
security definer
set search_path = public
as $$
  select now() < (select deadline from app_config where id = true);
$$;

-- True if the given auth uid belongs to an allow-listed admin email.
create or replace function is_admin(uid uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from admins a
    join auth.users u on u.email = a.email
    where u.id = uid
  );
$$;

-- ----------------------------------------------------------------------------
-- 5. Row Level Security
-- ----------------------------------------------------------------------------
alter table app_config enable row level security;
alter table admins enable row level security;
alter table student_submissions enable row level security;

-- app_config: any signed-in user can read (needed to render the announcement,
-- deadline, and contact details); only admins can update.
drop policy if exists "app_config readable by authenticated" on app_config;
create policy "app_config readable by authenticated"
  on app_config for select
  to authenticated
  using (true);

drop policy if exists "app_config updatable by admins" on app_config;
create policy "app_config updatable by admins"
  on app_config for update
  to authenticated
  using (is_admin(auth.uid()))
  with check (is_admin(auth.uid()));

-- admins: nobody reads this table directly from the client; is_admin() uses
-- SECURITY DEFINER to bypass RLS for its own internal check.
drop policy if exists "admins no direct access" on admins;
create policy "admins no direct access"
  on admins for select
  to authenticated
  using (false);

-- student_submissions:
--   - a student may INSERT only their own row, only while the deadline has
--     not passed, and only with the declaration accepted
--   - a student may SELECT only their own row (to detect "already submitted")
--   - admins may SELECT every row
--   - nobody may UPDATE or DELETE from the client (submissions are final)
drop policy if exists "students insert own submission before deadline" on student_submissions;
create policy "students insert own submission before deadline"
  on student_submissions for insert
  to authenticated
  with check (
    auth.uid() = google_user_id
    and declaration_accepted = true
    and is_before_deadline()
  );

drop policy if exists "students read own submission" on student_submissions;
create policy "students read own submission"
  on student_submissions for select
  to authenticated
  using (auth.uid() = google_user_id or is_admin(auth.uid()));

-- No update/delete policies are created, so the API rejects those operations
-- entirely (RLS defaults to deny when no policy grants the action).

-- ----------------------------------------------------------------------------
-- 6. Realtime is left disabled by default — enable in the Supabase dashboard
--    (Database -> Replication) only if you want the admin dashboard to update
--    live without a manual refresh.
-- ----------------------------------------------------------------------------
