import { supabase } from './supabaseClient';
import { Service, Appointment, UserProfile, AppointmentStatus } from '@/types';

// ── Services ──────────────────────────────────────────────────────────────────

export async function fetchAllServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('price', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id:               row.id,
    name:             row.name,
    description:      null,
    duration_minutes: row.duration_min,
    price:            Number(row.price),
    active:           row.active,
  }));
}

export async function createService(params: {
  name: string;
  durationMin: number;
  price: number;
}): Promise<Service> {
  const { data, error } = await supabase
    .from('services')
    .insert({ name: params.name, duration_min: params.durationMin, price: params.price, active: true })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return { id: data.id, name: data.name, description: null, duration_minutes: data.duration_min, price: Number(data.price), active: data.active };
}

export async function updateService(
  id: string,
  params: Partial<{ name: string; durationMin: number; price: number; active: boolean }>,
): Promise<void> {
  const patch: Record<string, unknown> = {};
  if (params.name       !== undefined) patch.name         = params.name;
  if (params.durationMin !== undefined) patch.duration_min = params.durationMin;
  if (params.price      !== undefined) patch.price        = params.price;
  if (params.active     !== undefined) patch.active       = params.active;

  const { error } = await supabase.from('services').update(patch).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function deleteService(id: string): Promise<void> {
  const { error } = await supabase.from('services').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

// ── Users / Barbers ───────────────────────────────────────────────────────────

export async function fetchAllProfiles(): Promise<UserProfile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []) as UserProfile[];
}

/** Promotes a customer to barber: updates role + creates a barbers row. */
export async function promoteToBarber(profileId: string, bio: string): Promise<void> {
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'barber' })
    .eq('id', profileId);
  if (roleError) throw new Error(roleError.message);

  const { error: barberError } = await supabase
    .from('barbers')
    .insert({ profile_id: profileId, bio: bio || null, available_hours: {}, active: true });
  if (barberError) throw new Error(barberError.message);
}

/** Demotes a barber back to customer and deactivates their barbers row. */
export async function demoteBarber(profileId: string): Promise<void> {
  const { error: roleError } = await supabase
    .from('profiles')
    .update({ role: 'customer' })
    .eq('id', profileId);
  if (roleError) throw new Error(roleError.message);

  const { error: barberError } = await supabase
    .from('barbers')
    .update({ active: false })
    .eq('profile_id', profileId);
  if (barberError) throw new Error(barberError.message);
}

/** Promotes a user to admin. */
export async function promoteToAdmin(profileId: string): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role: 'admin' })
    .eq('id', profileId);
  if (error) throw new Error(error.message);
}

// ── All Appointments ──────────────────────────────────────────────────────────

export async function fetchAllAppointments(): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select(`
      *,
      service:service_id (id, name, duration_min, price),
      customer:customer_id (id, full_name, phone),
      barber_profile:barber_id (
        id,
        profiles:profile_id (full_name)
      )
    `)
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
    // Flatten barber name for display
    _barberName: (row.barber_profile?.profiles as { full_name: string | null } | null)?.full_name ?? 'Barber',
  })) as (Appointment & { _barberName: string })[];
}

export async function adminUpdateAppointmentStatus(
  id: string,
  status: AppointmentStatus,
): Promise<void> {
  const { error } = await supabase.from('appointments').update({ status }).eq('id', id);
  if (error) throw new Error(error.message);
}
