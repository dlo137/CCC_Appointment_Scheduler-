import { supabase } from './supabaseClient';
import { Appointment, AppointmentStatus } from '@/types';

export interface InsertAppointmentParams {
  customerId?: string;   // undefined for guest bookings
  guestName?: string;
  guestPhone?: string;
  guestEmail?: string;
  barberId: string;
  serviceId: string;
  startTime: string; // ISO 8601
  endTime: string;   // ISO 8601
  notes?: string;
}

export async function insertAppointment(
  params: InsertAppointmentParams,
): Promise<Appointment> {
  const { data, error } = await supabase
    .from('appointments')
    .insert({
      customer_id:  params.customerId  ?? null,
      guest_name:   params.guestName   ?? null,
      guest_phone:  params.guestPhone  ?? null,
      guest_email:  params.guestEmail  ?? null,
      barber_id:    params.barberId,
      service_id:   params.serviceId,
      start_time:   params.startTime,
      end_time:     params.endTime,
      notes:        params.notes ?? null,
      status:       'pending',
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data as Appointment;
}

export async function updateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

export async function updateAppointmentNotes(
  id: string,
  notes: string,
): Promise<void> {
  const { error } = await supabase
    .from('appointments')
    .update({ notes: notes.trim() || null })
    .eq('id', id);

  if (error) throw new Error(error.message);
}

/** Returns the count of upcoming appointments for a user that were originally guest bookings. */
export async function fetchClaimedGuestCount(customerId: string): Promise<number> {
  const { count, error } = await supabase
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .not('guest_email', 'is', null)
    .gt('start_time', new Date().toISOString());

  if (error) return 0;
  return count ?? 0;
}

export async function fetchCustomerAppointments(
  customerId: string,
): Promise<(Appointment & { _barberName: string })[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      service:service_id (id, name, duration_min, price),
      barber_rel:barber_id (id, profiles:profile_id (full_name))
    `)
    .eq('customer_id', customerId)
    .order('start_time', { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    service: row.service
      ? {
          id:               row.service.id,
          name:             row.service.name,
          description:      null,
          duration_minutes: row.service.duration_min,
          price:            Number(row.service.price),
          active:           true,
        }
      : undefined,
    _barberName:
      (row.barber_rel?.profiles as unknown as { full_name: string | null } | null)
        ?.full_name ?? 'Barber',
  })) as (Appointment & { _barberName: string })[];
}

export async function fetchAppointmentsForBarber(
  barberId: string,
): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      service:service_id (id, name, duration_min, price),
      customer:customer_id (id, full_name, phone)
    `)
    .eq('barber_id', barberId)
    .order('start_time', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    ...row,
    service: row.service
      ? {
          id:               row.service.id,
          name:             row.service.name,
          description:      null,
          duration_minutes: row.service.duration_min,
          price:            Number(row.service.price),
          active:           true,
        }
      : undefined,
  })) as Appointment[];
}
