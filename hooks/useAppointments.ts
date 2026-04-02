'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { Appointment } from '@/types';

function mapRow(row: Record<string, unknown>): Appointment {
  return {
    ...(row as unknown as Appointment),
    service: row.service
      ? {
          id:               (row.service as Record<string, unknown>).id as string,
          name:             (row.service as Record<string, unknown>).name as string,
          description:      null,
          duration_minutes: (row.service as Record<string, unknown>).duration_min as number,
          price:            Number((row.service as Record<string, unknown>).price),
          active:           true,
        }
      : undefined,
  } as Appointment;
}

export function useAppointments(barberId: string | undefined) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const channelRef                      = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const load = useCallback(async () => {
    if (!barberId) return;
    setLoading(true);
    setError(null);

    const { data, error: fetchError } = await supabase
      .from('appointments')
      .select(`
        *,
        service:service_id (id, name, duration_min, price),
        customer:customer_id (id, full_name, phone)
      `)
      .eq('barber_id', barberId)
      .order('start_time', { ascending: true });

    if (fetchError) {
      setError(fetchError.message);
    } else {
      setAppointments((data ?? []).map(mapRow));
    }
    setLoading(false);
  }, [barberId]);

  useEffect(() => {
    load();
  }, [load]);

  // Real-time subscription — re-fetch on any change to this barber's appointments
  useEffect(() => {
    if (!barberId) return;

    const channel = supabase
      .channel(`appointments:barber:${barberId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'appointments',
          filter: `barber_id=eq.${barberId}`,
        },
        () => { load(); },
      )
      .subscribe();

    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [barberId, load]);

  return { appointments, loading, error, refresh: load };
}
