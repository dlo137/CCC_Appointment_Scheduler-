-- ============================================================
-- Watson Booking — Guest Bookings Support
-- Migration: 003_guest_bookings.sql
-- Allows unauthenticated guests to book appointments.
-- ============================================================

-- 1. Make customer_id nullable so guest rows have no auth user
alter table public.appointments
  alter column customer_id drop not null;

-- 2. Guest contact info (name + phone collected at confirm step)
alter table public.appointments
  add column if not exists guest_name  text,
  add column if not exists guest_phone text,
  add column if not exists guest_email text;

-- 3. Constraint: every row must have either a logged-in customer OR guest contact
alter table public.appointments
  add constraint appointments_customer_or_guest check (
    customer_id is not null
    or (guest_name is not null and guest_phone is not null and guest_email is not null)
  );


-- ── RLS updates ──────────────────────────────────────────────

-- Allow public (anon) read of profile names for active barbers
-- so the landing page can display barber names without auth.
create policy "profiles: public read active barber names"
  on public.profiles for select
  using (
    id in (select profile_id from public.barbers where active = true)
  );

-- Allow anyone (anon included) to read active services for the booking flow
drop policy if exists "services: authenticated read active" on public.services;
create policy "services: anyone read active"
  on public.services for select
  using (
    active = true
    or public.current_user_role() = 'admin'
  );

-- Allow anyone (anon included) to read active barbers for the booking flow
drop policy if exists "barbers: authenticated can read active" on public.barbers;
create policy "barbers: anyone read active"
  on public.barbers for select
  using (
    active = true
    or public.current_user_role() in ('barber', 'admin')
  );

-- Update insert policy: allow guest inserts (customer_id IS NULL) in addition to auth users
drop policy if exists "appointments: customers insert" on public.appointments;
create policy "appointments: customers insert"
  on public.appointments for insert
  with check (
    customer_id is null                   -- guest booking (no auth required)
    or customer_id = auth.uid()           -- authenticated customer booking own slot
    or public.current_user_role() = 'admin'
  );

-- Update read policy: admins can see guest rows; guests cannot read back (no auth.uid match)
drop policy if exists "appointments: scoped read" on public.appointments;
create policy "appointments: scoped read"
  on public.appointments for select
  using (
    customer_id = auth.uid()
    or barber_id in (select id from public.barbers where profile_id = auth.uid())
    or public.current_user_role() = 'admin'
  );
