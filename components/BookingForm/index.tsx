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

function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function BookingForm() {
  const { user } = useAuth();

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

  const [step,    setStep]    = useState<1 | 2 | 3>(1);
  const [service, setService] = useState<Service | null>(null);
  const [barber,  setBarber]  = useState<Barber | null>(null);
  const [date,    setDate]    = useState<string>(todayStr());
  const [slot,    setSlot]    = useState<TimeSlot | null>(null);
  const [notes,   setNotes]   = useState('');

  function handleBarberChange(b: Barber | null) {
    setBarber(b);
    setSlot(null);
  }
  function handleDateChange(d: string) {
    setDate(d);
    setSlot(null);
  }

  const [guestName,  setGuestName]  = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [guestEmail, setGuestEmail] = useState('');

  const [submitting,   setSubmitting]   = useState(false);
  const [submitError,  setSubmitError]  = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<Appointment | null>(null);

  async function handleSubmit() {
    if (!service || !slot) return;

    const effectiveBarberId = slot.assignedBarberId ?? barber?.id;
    if (!effectiveBarberId) return;

    // Guest bookings require name, phone, and email
    if (!user && (!guestName.trim() || !guestPhone.trim() || !guestEmail.trim())) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const appt = await insertAppointment(
        user
          ? {
              customerId: user.id,
              barberId:   effectiveBarberId,
              serviceId:  service.id,
              startTime:  slot.startTime,
              endTime:    slot.endTime,
              notes:      notes.trim() || undefined,
            }
          : {
              guestName:  guestName.trim(),
              guestPhone: guestPhone.trim(),
              guestEmail: guestEmail.trim(),
              barberId:   effectiveBarberId,
              serviceId:  service.id,
              startTime:  slot.startTime,
              endTime:    slot.endTime,
              notes:      notes.trim() || undefined,
            },
      );
      setConfirmation(appt);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : 'Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (confirmation) {
    return <SuccessCard appointment={confirmation} service={service!} slot={slot!} barber={barber} onReset={() => {
      setConfirmation(null);
      setStep(1);
      setService(null);
      setBarber(null);
      setDate(todayStr());
      setSlot(null);
      setNotes('');
      setGuestName('');
      setGuestPhone('');
      setGuestEmail('');
    }} />;
  }

  if (dataError) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 px-6 py-5 text-sm text-red-700">
        {dataError}
      </div>
    );
  }

  if (dataLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-400 text-sm">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-ocean-500 border-t-transparent" />
        Loading…
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
        No services are available yet. Check back soon.
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col min-h-0">
      <StepIndicator currentStep={step} />

      {submitError && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {submitError}
        </div>
      )}

      {step === 1 && (
        <Step1Service
          services={services}
          selected={service}
          onSelect={setService}
          onNext={() => setStep(2)}
          onCancel={() => window.history.back()}
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
          user={user}
          guestName={guestName}
          guestPhone={guestPhone}
          guestEmail={guestEmail}
          onNotesChange={setNotes}
          onGuestNameChange={setGuestName}
          onGuestPhoneChange={setGuestPhone}
          onGuestEmailChange={setGuestEmail}
          onBack={() => setStep(2)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  );
}

// ── success card ──────────────────────────────────────────────────────────────

function SuccessCard({
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
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-ocean-50 border-2 border-ocean-400">
        <svg viewBox="0 0 24 24" fill="none" className="h-10 w-10 stroke-ocean-500 stroke-2">
          <polyline points="5,13 10,18 19,6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold text-gray-900 mb-1">You&apos;re booked!</h2>
      <p className="text-gray-500 text-sm mb-8">
        We&apos;ll see you on{' '}
        <span className="text-gray-800 font-medium">{dateLabel}</span> at{' '}
        <span className="text-gray-800 font-medium">{slot.label}</span>.
      </p>

      {/* details */}
      <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden text-left mb-8 shadow-sm">
        <div className="divide-y divide-gray-100">
          <DetailRow label="Service"  value={service.name} />
          <DetailRow label="Barber"   value={barber?.name ?? 'Assigned barber'} />
          <DetailRow label="Date"     value={dateLabel} />
          <DetailRow label="Time"     value={slot.label} />
          <DetailRow
            label="Status"
            value={
              <span className="rounded-full bg-amber-50 px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-amber-700 border border-amber-200">
                Pending
              </span>
            }
          />
        </div>
      </div>

      <button
        type="button"
        onClick={onReset}
        className="rounded-xl bg-brand-500 px-6 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-brand-600"
      >
        Book another
      </button>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-gray-500">{label}</span>
      {typeof value === 'string'
        ? <span className="text-sm font-semibold text-gray-900">{value}</span>
        : value}
    </div>
  );
}
