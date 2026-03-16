'use client';

import { useEffect, useState } from 'react';
import { Barber, Service, TimeSlot } from '@/types';
import { fetchBarberSlots, fetchAnyBarberSlots } from '@/lib/availability';

interface Props {
  barbers: Barber[];
  service: Service;
  selectedBarber: Barber | null;   // null = "any"
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onBarberChange: (b: Barber | null) => void;
  onDateChange: (d: string) => void;
  onSlotChange: (s: TimeSlot) => void;
  onBack: () => void;
  onNext: () => void;
}

// Today in YYYY-MM-DD (local time)
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function groupSlots(slots: TimeSlot[]) {
  const am: TimeSlot[] = [];
  const pm: TimeSlot[] = [];
  for (const slot of slots) {
    const h = new Date(slot.startTime).getHours();
    (h < 12 ? am : pm).push(slot);
  }
  return { am, pm };
}

export default function Step2Schedule({
  barbers,
  service,
  selectedBarber,
  selectedDate,
  selectedSlot,
  onBarberChange,
  onDateChange,
  onSlotChange,
  onBack,
  onNext,
}: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError] = useState<string | null>(null);

  // Re-fetch slots when barber or date changes
  useEffect(() => {
    if (!selectedDate) return;

    setSlots([]);
    setSlotError(null);
    setLoadingSlots(true);

    const run = async () => {
      try {
        const result =
          selectedBarber === null
            ? await fetchAnyBarberSlots(barbers, selectedDate, service.duration_minutes)
            : await fetchBarberSlots(selectedBarber, selectedDate, service.duration_minutes);
        setSlots(result);
      } catch (e) {
        setSlotError(e instanceof Error ? e.message : 'Failed to load slots.');
      } finally {
        setLoadingSlots(false);
      }
    };
    run();
  }, [selectedBarber, selectedDate, barbers, service.duration_minutes]);

  const { am, pm } = groupSlots(slots);
  const canProceed = !!selectedDate && !!selectedSlot;

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Pick a time</h2>
      <p className="text-zinc-400 text-sm mb-8">Choose your barber and an available slot.</p>

      {/* ── Barber picker ── */}
      <section className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
          Barber
        </h3>
        <div className="flex flex-wrap gap-3">
          {/* Any available card */}
          <BarberCard
            name="Any Available"
            bio="First available barber"
            initials="?"
            selected={selectedBarber === null}
            onClick={() => { onBarberChange(null); onSlotChange && void 0; }}
          />
          {barbers.map((barber) => (
            <BarberCard
              key={barber.id}
              name={barber.name}
              bio={barber.bio}
              initials={barber.name.slice(0, 2).toUpperCase()}
              selected={selectedBarber?.id === barber.id}
              onClick={() => { onBarberChange(barber); }}
            />
          ))}
        </div>
      </section>

      {/* ── Date picker ── */}
      <section className="mb-8">
        <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
          Date
        </h3>
        <input
          type="date"
          min={todayStr()}
          value={selectedDate}
          onChange={(e) => onDateChange(e.target.value)}
          className="rounded-xl border-2 border-zinc-700 bg-zinc-800 px-4 py-3 text-sm font-medium text-white outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 [color-scheme:dark]"
        />
      </section>

      {/* ── Time slots ── */}
      {selectedDate && (
        <section className="mb-8">
          <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">
            Available times
          </h3>

          {loadingSlots && (
            <div className="flex items-center gap-2 text-zinc-500 text-sm">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
              Loading…
            </div>
          )}

          {slotError && (
            <p className="text-sm text-red-400">{slotError}</p>
          )}

          {!loadingSlots && !slotError && slots.length === 0 && (
            <p className="text-sm text-zinc-500">
              No available slots for this day. Try a different date or barber.
            </p>
          )}

          {!loadingSlots && slots.length > 0 && (
            <div className="space-y-5">
              {am.length > 0 && (
                <SlotGroup label="Morning" slots={am} selected={selectedSlot} onSelect={onSlotChange} />
              )}
              {pm.length > 0 && (
                <SlotGroup label="Afternoon" slots={pm} selected={selectedSlot} onSelect={onSlotChange} />
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Navigation ── */}
      <div className="flex justify-between mt-8">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-bold uppercase tracking-widest text-zinc-300 transition hover:border-zinc-500 hover:text-white"
        >
          Back
        </button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Review
        </button>
      </div>
    </div>
  );
}

// ─── sub-components ─────────────────────────────────────────────────────────

function BarberCard({
  name,
  bio,
  initials,
  selected,
  onClick,
}: {
  name: string;
  bio: string | null;
  initials: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-200 ${
        selected
          ? 'border-brand-500 bg-brand-950/40'
          : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
      }`}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-sm font-bold text-zinc-300">
        {initials}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{name}</p>
        {bio && <p className="text-xs text-zinc-500 line-clamp-1">{bio}</p>}
      </div>
    </button>
  );
}

function SlotGroup({
  label,
  slots,
  selected,
  onSelect,
}: {
  label: string;
  slots: TimeSlot[];
  selected: TimeSlot | null;
  onSelect: (s: TimeSlot) => void;
}) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-600 mb-2">{label}</p>
      <div className="flex flex-wrap gap-2">
        {slots.map((slot) => {
          const isSelected = selected?.startTime === slot.startTime;
          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-150 ${
                isSelected
                  ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/20'
                  : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white'
              }`}
            >
              {slot.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
