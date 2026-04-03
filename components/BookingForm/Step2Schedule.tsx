'use client';

import { useEffect, useState } from 'react';
import { Barber, Service, TimeSlot } from '@/types';
import { fetchBarberSlots, fetchAnyBarberSlots } from '@/lib/availability';

interface Props {
  barbers: Barber[];
  service: Service;
  selectedBarber: Barber | null;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onBarberChange: (b: Barber | null) => void;
  onDateChange: (d: string) => void;
  onSlotChange: (s: TimeSlot) => void;
  onBack: () => void;
  onNext: () => void;
}

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function buildDateOptions(count = 21): { value: string; day: string; weekday: string; isToday: boolean }[] {
  const options = [];
  const base = new Date();
  base.setHours(0, 0, 0, 0);
  for (let i = 0; i < count; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    options.push({
      value,
      day: String(d.getDate()),
      weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
      isToday: i === 0,
    });
  }
  return options;
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
  const [slots, setSlots]               = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [slotError, setSlotError]       = useState<string | null>(null);

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
  const canProceed  = !!selectedDate && !!selectedSlot;
  const dateOptions = buildDateOptions(21);

  return (
    <div className="flex flex-col sm:flex-1 sm:min-h-0">

      {/* Header */}
      <section className="text-center mb-6">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1">
          Step 2: Pick a time
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">
          Choose your barber, date, and an available slot.
        </p>
      </section>

      {/* 3-column grid — stacks on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:flex-1 sm:min-h-0">

        {/* ── Column 1: Barber ── */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden sm:overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Barber</p>
          </div>
          <div className="sm:flex-1 sm:overflow-y-auto p-3 space-y-2">
            {/* Any available */}
            <BarberRow
              name="Any Available"
              bio="First available barber"
              initials="?"
              selected={selectedBarber === null}
              onClick={() => onBarberChange(null)}
            />
            {barbers.map((b) => (
              <BarberRow
                key={b.id}
                name={b.name}
                bio={b.bio}
                initials={b.name.slice(0, 2).toUpperCase()}
                selected={selectedBarber?.id === b.id}
                onClick={() => onBarberChange(b)}
              />
            ))}
          </div>
        </div>

        {/* ── Column 2: Date ── */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Date</p>
          </div>
          <div className="sm:flex-1 sm:overflow-y-auto p-3">
            <div className="grid grid-cols-3 gap-2">
              {dateOptions.map((d) => {
                const isSelected = selectedDate === d.value;
                return (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => onDateChange(d.value)}
                    className={`flex flex-col items-center justify-center rounded-xl py-3 px-2 border-2 transition-all duration-150 ${
                      isSelected
                        ? 'bg-primary border-primary text-on-primary'
                        : 'bg-white border-transparent hover:border-outline-variant text-on-surface'
                    }`}
                  >
                    <span className={`text-xs font-semibold uppercase ${isSelected ? 'text-on-primary/70' : 'text-on-surface-variant'}`}>
                      {d.isToday ? 'Today' : d.weekday}
                    </span>
                    <span className="text-xl font-bold leading-tight">{d.day}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Column 3: Time Slots ── */}
        <div className="flex flex-col bg-surface-container-lowest rounded-xl border border-outline-variant overflow-hidden">
          <div className="px-5 py-4 border-b border-outline-variant shrink-0">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">Available times</p>
          </div>
          <div className="sm:flex-1 sm:overflow-y-auto p-4">
            {loadingSlots && (
              <div className="flex items-center gap-2 text-on-surface-variant text-sm">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                Loading…
              </div>
            )}
            {slotError && <p className="text-sm text-error">{slotError}</p>}
            {!loadingSlots && !slotError && slots.length === 0 && (
              <p className="text-sm text-on-surface-variant">
                No slots available for this day. Try a different date or barber.
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
          </div>
        </div>

      </div>

      {/* Actions */}
      <div className="w-full flex justify-between items-center pt-4 pb-2 mt-auto">
        <button
          type="button"
          onClick={onBack}
          className="text-on-surface-variant font-semibold flex items-center gap-2 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Back
        </button>
        <button
          type="button"
          disabled={!canProceed}
          onClick={onNext}
          className="group flex items-center gap-4 bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Review booking
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

    </div>
  );
}

// ── sub-components ─────────────────────────────────────────────────────────────

function BarberRow({
  name, bio, initials, selected, onClick,
}: {
  name: string; bio: string | null; initials: string; selected: boolean; onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left transition-all duration-150 ${
        selected
          ? 'border-primary bg-primary/5'
          : 'border-outline-variant bg-white hover:border-primary/40'
      }`}
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
        selected ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
      }`}>
        {initials}
      </div>
      <div className="min-w-0">
        <p className={`text-sm font-semibold truncate ${selected ? 'text-primary' : 'text-on-surface'}`}>{name}</p>
        {bio && <p className="text-xs text-on-surface-variant truncate">{bio}</p>}
      </div>
      {selected && (
        <span className="material-symbols-outlined text-primary ml-auto shrink-0 text-base">check_circle</span>
      )}
    </button>
  );
}

function SlotGroup({
  label, slots, selected, onSelect,
}: {
  label: string; slots: TimeSlot[]; selected: TimeSlot | null; onSelect: (s: TimeSlot) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">{label}</p>
      <div className="grid grid-cols-2 gap-2">
        {slots.map((slot) => {
          const isSelected = selected?.startTime === slot.startTime;
          return (
            <button
              key={slot.startTime}
              type="button"
              onClick={() => onSelect(slot)}
              className={`rounded-xl px-3 py-2.5 text-sm font-semibold border-2 transition-all duration-150 ${
                isSelected
                  ? 'bg-primary border-primary text-on-primary'
                  : 'bg-white border-outline-variant text-on-surface hover:border-primary/40'
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
