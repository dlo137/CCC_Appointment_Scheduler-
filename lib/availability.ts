import { supabase } from './supabaseClient';
import { Barber, TimeSlot } from '@/types';

const DAY_NAMES = [
  'sunday', 'monday', 'tuesday', 'wednesday',
  'thursday', 'friday', 'saturday',
] as const;

// ─── helpers ────────────────────────────────────────────────────────────────

function parseLocalTime(timeStr: string, dateStr: string): Date {
  const [h, m] = timeStr.split(':').map(Number);
  // Construct date in local time to avoid timezone shifting the date
  const d = new Date(`${dateStr}T00:00:00`);
  d.setHours(h, m, 0, 0);
  return d;
}

function toLabel(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function dayName(dateStr: string) {
  return DAY_NAMES[new Date(`${dateStr}T12:00:00`).getDay()];
}

type BookedInterval = { start: number; end: number };

function overlaps(slotStart: number, slotEnd: number, booked: BookedInterval[]) {
  return booked.some((b) => slotStart < b.end && slotEnd > b.start);
}

// Generates 30-minute-increment slots within [open, close - duration]
function generateCandidates(
  dateStr: string,
  openStr: string,
  closeStr: string,
  durationMs: number,
): Date[] {
  const open = parseLocalTime(openStr, dateStr).getTime();
  const close = parseLocalTime(closeStr, dateStr).getTime();
  const slots: Date[] = [];
  let cursor = open;
  while (cursor + durationMs <= close) {
    slots.push(new Date(cursor));
    cursor += 30 * 60_000; // 30-min increments
  }
  return slots;
}

// ─── public API ─────────────────────────────────────────────────────────────

export async function fetchBarbers(): Promise<Barber[]> {
  const { data, error } = await supabase
    .from('barbers')
    .select('id, profile_id, bio, available_hours, active, profiles(full_name)')
    .eq('active', true);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    // Supabase returns the joined row under the related table name
    const profile = row.profiles as { full_name: string | null } | null;
    return {
      id: row.id,
      profile_id: row.profile_id,
      name: profile?.full_name ?? 'Barber',
      bio: row.bio ?? null,
      avatar_url: null,
      available_hours: (row.available_hours as Barber['available_hours']) ?? {},
      active: row.active,
    };
  });
}

/** Returns available slots for a specific barber on a given date. */
export async function fetchBarberSlots(
  barber: Barber,
  dateStr: string,
  durationMin: number,
): Promise<TimeSlot[]> {
  const hours = barber.available_hours[dayName(dateStr)];
  if (!hours) return [];

  const durationMs = durationMin * 60_000;
  const candidates = generateCandidates(dateStr, hours[0], hours[1], durationMs);

  const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
  const dayEnd   = new Date(`${dateStr}T23:59:59`).toISOString();

  const { data: booked, error } = await supabase
    .from('appointments')
    .select('start_time, end_time')
    .eq('barber_id', barber.id)
    .neq('status', 'cancelled')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);

  if (error) throw new Error(error.message);

  const bookedIntervals: BookedInterval[] = (booked ?? []).map((b) => ({
    start: new Date(b.start_time).getTime(),
    end:   new Date(b.end_time).getTime(),
  }));

  return candidates
    .filter((start) => !overlaps(start.getTime(), start.getTime() + durationMs, bookedIntervals))
    .map((start) => {
      const end = new Date(start.getTime() + durationMs);
      return { startTime: start.toISOString(), endTime: end.toISOString(), label: toLabel(start) };
    });
}

/**
 * Returns merged available slots across all barbers.
 * Each slot carries `assignedBarberId` — the first barber who is free at that time.
 */
export async function fetchAnyBarberSlots(
  barbers: Barber[],
  dateStr: string,
  durationMin: number,
): Promise<TimeSlot[]> {
  if (barbers.length === 0) return [];

  const durationMs = durationMin * 60_000;
  const dayStart = new Date(`${dateStr}T00:00:00`).toISOString();
  const dayEnd   = new Date(`${dateStr}T23:59:59`).toISOString();

  const { data: booked, error } = await supabase
    .from('appointments')
    .select('barber_id, start_time, end_time')
    .in('barber_id', barbers.map((b) => b.id))
    .neq('status', 'cancelled')
    .gte('start_time', dayStart)
    .lte('start_time', dayEnd);

  if (error) throw new Error(error.message);

  // Group booked intervals by barber
  const bookedByBarber = new Map<string, BookedInterval[]>();
  for (const appt of booked ?? []) {
    const list = bookedByBarber.get(appt.barber_id) ?? [];
    list.push({ start: new Date(appt.start_time).getTime(), end: new Date(appt.end_time).getTime() });
    bookedByBarber.set(appt.barber_id, list);
  }

  // Build a map: slot ISO string → first available barber id
  const slotMap = new Map<string, { slot: TimeSlot; barberId: string }>();

  for (const barber of barbers) {
    const hours = barber.available_hours[dayName(dateStr)];
    if (!hours) continue;

    const candidates = generateCandidates(dateStr, hours[0], hours[1], durationMs);
    const barberBooked = bookedByBarber.get(barber.id) ?? [];

    for (const start of candidates) {
      const key = start.toISOString();
      if (slotMap.has(key)) continue; // already claimed by an earlier barber

      if (!overlaps(start.getTime(), start.getTime() + durationMs, barberBooked)) {
        const end = new Date(start.getTime() + durationMs);
        slotMap.set(key, {
          barberId: barber.id,
          slot: {
            startTime: start.toISOString(),
            endTime:   end.toISOString(),
            label:     toLabel(start),
            assignedBarberId: barber.id,
          },
        });
      }
    }
  }

  return Array.from(slotMap.values())
    .sort((a, b) => a.slot.startTime.localeCompare(b.slot.startTime))
    .map((v) => v.slot);
}
