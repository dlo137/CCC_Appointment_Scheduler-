import { supabase } from './supabaseClient';
import { Service } from '@/types';

export async function fetchServices(): Promise<Service[]> {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, duration_min, price, active')
    .eq('active', true)
    .order('price', { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    description: null,
    duration_minutes: row.duration_min,
    price: Number(row.price),
    active: row.active,
  }));
}
