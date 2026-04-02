-- ============================================================
-- Watson Booking — Claim Guest Appointments on Sign-Up
-- Migration: 004_claim_guest_appointments.sql
-- When a new user registers, find any guest appointments
-- booked under their email and transfer ownership to their account.
-- ============================================================

CREATE OR REPLACE FUNCTION public.claim_guest_appointments()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed_count integer;
BEGIN
  UPDATE public.appointments
  SET customer_id = NEW.id
  WHERE customer_id IS NULL
    AND lower(guest_email) = lower(NEW.email)
    AND start_time > NOW();

  GET DIAGNOSTICS claimed_count = ROW_COUNT;

  -- Expose count via app.claimed_appointments so the app can read it
  PERFORM set_config('app.claimed_appointments', claimed_count::text, true);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_claim_appointments ON auth.users;

CREATE TRIGGER on_auth_user_created_claim_appointments
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.claim_guest_appointments();
