import { supabase } from './supabaseClient';
import { Appointment, AppointmentStatus } from '@/types';

export interface InsertAppointmentParams {
  customerId: string;
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
      customer_id: params.customerId,
      barber_id:   params.barberId,
      service_id:  params.serviceId,
      start_time:  params.startTime,
      end_time:    params.endTime,
      notes:       params.notes ?? null,
      status:      'pending',
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
