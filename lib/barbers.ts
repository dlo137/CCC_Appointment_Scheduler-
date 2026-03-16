import { supabase } from './supabaseClient';
import { Barber } from '@/types';

export async function fetchBarberByProfileId(
  profileId: string,
): Promise<Barber | null> {
  const { data, error } = await supabase
    .from('barbers')
    .select('id, profile_id, bio, available_hours, active, profiles(full_name)')
    .eq('profile_id', profileId)
    .single();

  if (error) return null;

  const profile = data.profiles as { full_name: string | null } | null;
  return {
    id:              data.id,
    profile_id:      data.profile_id,
    name:            profile?.full_name ?? 'Barber',
    bio:             data.bio ?? null,
    avatar_url:      null,
    available_hours: (data.available_hours as Barber['available_hours']) ?? {},
    active:          data.active,
  };
}

export async function updateAvailableHours(
  barberId: string,
  availableHours: Barber['available_hours'],
): Promise<void> {
  const { error } = await supabase
    .from('barbers')
    .update({ available_hours: availableHours })
    .eq('id', barberId);

  if (error) throw new Error(error.message);
}
