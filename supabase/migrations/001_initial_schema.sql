-- ============================================================
-- Watson Booking — Initial Schema
-- Migration: 001_initial_schema.sql
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor → New query)
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- Extensions
-- ────────────────────────────────────────────────────────────
create extension if not exists "uuid-ossp";


-- ============================================================
-- TABLES
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- profiles
-- One row per auth user. Created automatically via trigger.
-- ────────────────────────────────────────────────────────────
create table if not exists public.profiles (
  id          uuid        primary key references auth.users (id) on delete cascade,
  full_name   text,
  role        text        not null default 'customer'
                          check (role in ('customer', 'barber', 'admin')),
  phone       text,
  created_at  timestamptz not null default now()
);

comment on table public.profiles is
  'Public profile data for every auth user. Role determines access level.';


-- ────────────────────────────────────────────────────────────
-- barbers
-- Additional data for users whose profile.role = 'barber'.
-- available_hours shape: { "monday": ["09:00", "17:00"], ... }
-- ────────────────────────────────────────────────────────────
create table if not exists public.barbers (
  id              uuid        primary key default uuid_generate_v4(),
  profile_id      uuid        not null unique references public.profiles (id) on delete cascade,
  bio             text,
  available_hours jsonb       not null default '{}'::jsonb,
  active          boolean     not null default true
);

comment on column public.barbers.available_hours is
  'Weekly schedule stored as { "monday": ["09:00","17:00"], ... }. '
  'Null key = day off, array = [open_time, close_time].';


-- ────────────────────────────────────────────────────────────
-- services
-- Haircut / treatment catalogue.
-- ────────────────────────────────────────────────────────────
create table if not exists public.services (
  id            uuid      primary key default uuid_generate_v4(),
  name          text      not null,
  duration_min  integer   not null check (duration_min > 0),
  price         numeric(10, 2) not null check (price >= 0),
  active        boolean   not null default true
);


-- ────────────────────────────────────────────────────────────
-- appointments
-- Core booking record.
-- ────────────────────────────────────────────────────────────
create table if not exists public.appointments (
  id           uuid        primary key default uuid_generate_v4(),
  customer_id  uuid        not null references public.profiles (id) on delete restrict,
  barber_id    uuid        not null references public.barbers  (id) on delete restrict,
  service_id   uuid        not null references public.services (id) on delete restrict,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  status       text        not null default 'pending'
               check (status in ('pending', 'confirmed', 'cancelled')),
  notes        text,
  created_at   timestamptz not null default now(),

  constraint appointments_time_order check (end_time > start_time)
);

comment on table public.appointments is
  'A single booked slot. end_time should equal start_time + service.duration_min.';


-- ============================================================
-- INDEXES
-- ============================================================

-- Fast look-up of a barber's schedule (availability checks, calendar view)
create index if not exists idx_appointments_barber_start
  on public.appointments (barber_id, start_time);

-- Fast look-up of a customer's booking history
create index if not exists idx_appointments_customer
  on public.appointments (customer_id);

-- Partial index — only index active rows for service catalogue queries
create index if not exists idx_services_active
  on public.services (active)
  where active = true;

-- Partial index — only index active barbers
create index if not exists idx_barbers_active
  on public.barbers (active)
  where active = true;


-- ============================================================
-- TRIGGER — auto-create profile on new auth signup
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'customer')
  );
  return new;
end;
$$;

-- Drop before recreating to allow re-running this migration
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.profiles     enable row level security;
alter table public.barbers      enable row level security;
alter table public.services     enable row level security;
alter table public.appointments enable row level security;


-- ────────────────────────────────────────────────────────────
-- Helper: reusable role-check function
-- ────────────────────────────────────────────────────────────
create or replace function public.current_user_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;


-- ────────────────────────────────────────────────────────────
-- profiles policies
-- ────────────────────────────────────────────────────────────

-- Users can read their own profile; admins can read all
create policy "profiles: users read own, admins read all"
  on public.profiles for select
  using (
    auth.uid() = id
    or public.current_user_role() = 'admin'
  );

-- Users can update their own profile; admins can update any
create policy "profiles: users update own, admins update all"
  on public.profiles for update
  using (
    auth.uid() = id
    or public.current_user_role() = 'admin'
  );

-- Insert is handled by the trigger; admins may insert manually
create policy "profiles: admins insert"
  on public.profiles for insert
  with check (public.current_user_role() = 'admin');

-- Only admins can delete profiles
create policy "profiles: admins delete"
  on public.profiles for delete
  using (public.current_user_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- barbers policies
-- ────────────────────────────────────────────────────────────

-- Anyone authenticated can see active barbers (needed for booking flow)
create policy "barbers: authenticated can read active"
  on public.barbers for select
  using (
    active = true
    or public.current_user_role() in ('barber', 'admin')
  );

-- Barbers can update their own record; admins can update any
create policy "barbers: barber updates own, admin updates all"
  on public.barbers for update
  using (
    profile_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- Only admins can insert/delete barber records
create policy "barbers: admins insert"
  on public.barbers for insert
  with check (public.current_user_role() = 'admin');

create policy "barbers: admins delete"
  on public.barbers for delete
  using (public.current_user_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- services policies
-- ────────────────────────────────────────────────────────────

-- All authenticated users can read active services
create policy "services: authenticated read active"
  on public.services for select
  using (
    active = true
    or public.current_user_role() = 'admin'
  );

-- Only admins manage the service catalogue
create policy "services: admins insert"
  on public.services for insert
  with check (public.current_user_role() = 'admin');

create policy "services: admins update"
  on public.services for update
  using (public.current_user_role() = 'admin');

create policy "services: admins delete"
  on public.services for delete
  using (public.current_user_role() = 'admin');


-- ────────────────────────────────────────────────────────────
-- appointments policies
-- ────────────────────────────────────────────────────────────

-- Customers see only their own appointments
-- Barbers see every appointment assigned to them
-- Admins see everything
create policy "appointments: scoped read"
  on public.appointments for select
  using (
    customer_id = auth.uid()
    or barber_id in (select id from public.barbers where profile_id = auth.uid())
    or public.current_user_role() = 'admin'
  );

-- Customers can create their own appointments
create policy "appointments: customers insert"
  on public.appointments for insert
  with check (
    customer_id = auth.uid()
    or public.current_user_role() = 'admin'
  );

-- Customers can update (e.g. cancel) their own pending/confirmed appointments
-- Barbers can update appointments assigned to them (e.g. confirm)
-- Admins can update any
create policy "appointments: scoped update"
  on public.appointments for update
  using (
    customer_id = auth.uid()
    or barber_id in (select id from public.barbers where profile_id = auth.uid())
    or public.current_user_role() = 'admin'
  );

-- Only admins can hard-delete; customers/barbers should use status='cancelled'
create policy "appointments: admins delete"
  on public.appointments for delete
  using (public.current_user_role() = 'admin');


-- ============================================================
-- DONE
-- ============================================================
-- Tables  : profiles, barbers, services, appointments
-- Indexes : barber+start_time, customer_id, active services, active barbers
-- Trigger : auto-create profile on auth.users insert
-- RLS     : customers → own rows | barbers → their rows | admins → all rows
-- ============================================================
