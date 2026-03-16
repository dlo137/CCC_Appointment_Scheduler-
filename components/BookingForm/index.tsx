'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Barber, Service, TimeSlot, Appointment } from '@/types';
import { fetchServices } from '@/lib/services';
import { fetchBarbers } from '@/lib/availability';
import { insertAppointment } from '@/lib/appointments';
import StepIndicator from './StepIndicator';
import Step1Service from './Step1Service';
import Step2Schedule from './Step2Schedule';
import Step3Confirm from './Step3Confirm';

// Today in YYYY-MM-DD (local time)
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BookingForm() {
  const { user } = useAuth();

  // ── data ──────────────────────────────────────────────────
  const [services,    setServices]    = useState<Service[]>([]);
  const [barbers,     setBarbers]     = useState<Barber[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError,   setDataError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([fetchServices(), fetchBarbers()])
      .then(([svcs, bars]) => { setServices(svcs); setBarbers(bars); })
      .catch((e) => setDataError(e instanceof Error ? e.message : 'Failed to load.'))
      .finally(() => setDataLoading(false));
  }, []);

  // ── booking state ─────────────────────────────────────────
  const [step,    setStep]    = useState<1 | 2 | 3>(1);
  const [service, setService] = useState<Service | null>(null);
  const [barber,  setBarber]  = useState<Barber | null>(null); // null = any
  const [date,    setDate]    = useState<string>(todayStr());
  const [slot,    setSlot]    = useState<TimeSlot | null>(null);
  const [notes,   setNotes]   = useState('');

  // Clear downstream selections when barber or date changes in step 2
  function handleBarberChange(b: Barber | null) {
    setBarber(b);
    setSlot(null);
  }
  function handleDateChange(d: string) {
    setDate(d);
    setSlot(null);
  }

  // ── submission ────────────────────────────────────────────
  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  async function handleSubmit() {
    if (!user || !service || !slot) return;

    const effectiveBarberId = slot.assignedBarberId ?? barber?.id;
    if (!effectiveBarberId) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const appt = await insertAppointment({
        customerId: user.id,
        barberId:   effectiveBarberId,
        serviceId:  service.id,
        startTime:  slot.startTime,
        endTime:    slot.endTime,
        notes:      notes.trim() || undefined,
      });
      setConfirmation(appt);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  // ── success screen ────────────────────────────────────────
  if (confirmation) {
    return <SuccessCard appointment={confirmation} service={service!} slot={slot!} barber={barber} onReset={() => {
      setConfirmation(null);
      setStep(1);
      setService(null);
      setBarber(null);
      setDate(todayStr());
      setSlot(null);
      setNotes('');
    }} />;
  }

  // ── loading / error ───────────────────────────────────────
  if (dataError) {
    return (
      <div className="rounded-xl border border-red-900 bg-red-950/40 px-6 py-5 text-sm text-red-400">
        {dataError}
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-brand-500 border-t-transparent" />
        Loading…
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 py-12 text-center text-sm text-zinc-600">
        No services are available yet. Check back soon.
      </div>
    );
  }

  return (
    <div>
      <StepIndicator currentStep={step} />

      {submitError && (
        <div className="mb-6 rounded-xl border border-red-900 bg-red-950/40 px-4 py-3 text-sm text-red-400">
          {submitError}
        </div>
      )}

      {step === 1 && (
        <Step1Service
          services={services}
          selected={service}
          onSelect={setService}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && service && (
        <Step2Schedule
          barbers={barbers}
          service={service}
          selectedBarber={barber}
          selectedDate={date}
          selectedSlot={slot}
          onBarberChange={handleBarberChange}
          onDateChange={handleDateChange}
          onSlotChange={setSlot}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && service && slot && (
        <Step3Confirm
          service={service}
          barber={barber}
          slot={slot}
          notes={notes}
          submitting={submitting}
          onNotesChange={setNotes}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ─── success card ────────────────────────────────────────────────────────────

function SuccessCard({
  appointment,
  service,
  slot,
  barber,
  onReset,
}: {
  appointment: Appointment;
  service: Service;
  slot: TimeSlot;
  barber: Barber | null;
  onReset: () => void;
}) {
  const start = new Date(slot.startTime);
  const dateLabel = start.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric',
  });

  return (
    <div className="text-center">
      {/* checkmark */}
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-500/10 border-2 border-brand-500">
        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 stroke-brand-400 stroke-2">
          <polyline points="5,13 10,18 19,6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-white mb-1">You're booked!</h2>
      <p className="text-zinc-400 text-sm mb-8">
        We'll see you on{' '}
        <span className="text-zinc-200 font-medium">{dateLabel}</span> at{' '}
        <span className="text-zinc-200 font-medium">{slot.label}</span>.
      </p>

      {/* details */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden text-left mb-8">
        <div className="divide-y divide-zinc-800">
          <DetailRow label="Service"  value={service.name} />
          <DetailRow label="Barber"   value={barber?.name ?? 'Assigned barber'} />
          <DetailRow label="Date"     value={dateLabel} />
          <DetailRow label="Time"     value={slot.label} />
          <DetailRow
            label="Status"
            value={
              <span className="rounded-full bg-amber-500/10 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-400 border border-amber-500/30">
                Pending
              </span>
            }
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-bold uppercase tracking-widest text-zinc-300 transition hover:border-zinc-500 hover:text-white"
      >
        Book another
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-zinc-400">{label}</span>
      {typeof value === 'string'
        ? <span className="text-sm font-semibold text-white">{value}</span>
        : value}
    </div>
  );
}
