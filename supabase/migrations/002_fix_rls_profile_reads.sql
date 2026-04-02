-- ============================================================
-- Migration: 002_fix_rls_profile_reads.sql
-- Allow cross-user profile reads needed for appointment views.
-- ============================================================

-- Barbers need to read the profiles of customers who have
-- appointments with them (so AppointmentCard shows real names).
create policy "profiles: barbers read customers with their appointments"
  on public.profiles for select
  using (
    id in (
      select customer_id
      from   public.appointments
      where  barber_id in (
        select id from public.barbers where profile_id = auth.uid()
      )
    )
  );

-- Any authenticated user needs to read barber profiles
-- (displayed in customer appointments page + booking confirmation).
create policy "profiles: authenticated read barber profiles"
  on public.profiles for select
  using (
    id in (select profile_id from public.barbers)
  );
