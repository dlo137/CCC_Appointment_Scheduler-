import { Barber, Service, TimeSlot } from '@/types';
import { User } from '@supabase/supabase-js';

interface Props {
  service: Service;
  barber: Barber | null;
  slot: TimeSlot;
  notes: string;
  submitting: boolean;
  user: User | null;
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  onNotesChange: (v: string) => void;
  onGuestNameChange: (v: string) => void;
  onGuestPhoneChange: (v: string) => void;
  onGuestEmailChange: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatSlot(slot: TimeSlot) {
  const start = new Date(slot.startTime);
  return {
    date: start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    time: slot.label,
  };
}

function aptRef(slot: TimeSlot) {
  const ts = new Date(slot.startTime).getTime().toString(36).toUpperCase().slice(-6);
  return `#APT-${ts}`;
}

function todayLong() {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

export default function Step3Confirm({
  service,
  barber,
  slot,
  notes,
  submitting,
  user,
  guestName,
  guestPhone,
  guestEmail,
  onNotesChange,
  onGuestNameChange,
  onGuestPhoneChange,
  onGuestEmailChange,
  onBack,
  onSubmit,
}: Props) {
  const { date, time } = formatSlot(slot);
  const isGuest   = !user;
  const guestReady = !isGuest || (guestName.trim().length > 0 && guestPhone.trim().length > 0 && guestEmail.trim().length > 0);

  return (
    <div className="flex flex-col min-h-0">

      {/* Header */}
      <section className="text-center mb-6">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1">
          Step 3: Confirm booking
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">
          Review your appointment details and confirm below.
        </p>
      </section>

      {/* Main 2-column layout — stacks on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6 items-start">

        {/* ── Left: Invoice document (3/5) ── */}
        <div className="col-span-1 md:col-span-3 bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">

          {/* Invoice header */}
          <div className="bg-primary px-5 sm:px-8 py-6 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-on-primary text-2xl">content_cut</span>
                <span className="font-headline font-bold text-on-primary text-lg tracking-tight">
                  CCC Barber Academy
                </span>
              </div>
              <p className="text-on-primary/60 text-xs">Carteret Community College · Morehead City, NC</p>
            </div>
            <div className="text-right">
              <p className="text-on-primary/60 text-xs uppercase tracking-widest mb-0.5">Appointment</p>
              <p className="text-on-primary font-bold font-headline text-lg">{aptRef(slot)}</p>
            </div>
          </div>

          {/* Issued date + status row */}
          <div className="flex items-center justify-between px-8 py-4 border-b border-outline-variant bg-brand-500/15">
            <div>
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-0.5">Date Issued</p>
              <p className="text-sm font-semibold text-on-surface">{todayLong()}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary-fixed-dim bg-primary-fixed px-3 py-1 text-xs font-bold uppercase tracking-widest text-on-primary-fixed">
              <span className="h-1.5 w-1.5 rounded-full bg-primary-fixed-dim" />
              Pending confirmation
            </span>
          </div>

          {/* Appointment specifics */}
          <div className="px-8 py-6 border-b border-outline-variant space-y-0 divide-y divide-outline-variant/40">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant pb-3">
              Appointment info
            </p>
            <InvoiceRow icon="person"         label="Barber"   value={barber?.name ?? 'Any available barber'} />
            <InvoiceRow icon="calendar_today" label="Date"     value={date} />
            <InvoiceRow icon="schedule"       label="Time"     value={time} />
            <InvoiceRow icon="storefront"     label="Location" value="CCC Barber Academy, Morehead City NC" />
          </div>

          {/* Service line items */}
          <div className="px-8 pt-6 pb-2">
            <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-4">
              Service details
            </p>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-outline-variant">
                  <th className="text-left pb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Description</th>
                  <th className="text-right pb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Duration</th>
                  <th className="text-right pb-2 text-xs font-bold uppercase tracking-widest text-on-surface-variant">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/40">
                <tr>
                  <td className="py-4 font-semibold text-on-surface">{service.name}</td>
                  <td className="py-4 text-right text-on-surface-variant">{service.duration_minutes} min</td>
                  <td className="py-4 text-right font-bold text-on-surface">{formatPrice(service.price)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Total */}
          <div className="px-8 py-5 flex justify-end border-t border-outline-variant">
            <div className="text-right">
              <p className="text-xs text-on-surface-variant uppercase tracking-widest mb-1">Total due</p>
              <p className="text-3xl font-extrabold font-headline text-primary">{formatPrice(service.price)}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Payable at appointment</p>
            </div>
          </div>

          {/* Footer note */}
          <div className="px-8 py-5 bg-brand-500/15 border-t border-outline-variant">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              This is a booking request. Your appointment will be confirmed by the academy.
              Please arrive 5 minutes early. Cancellations must be made at least 24 hours in advance.
            </p>
          </div>
        </div>

        {/* ── Right: Contact + Actions (2/5) ── */}
        <div className="col-span-1 md:col-span-2 flex flex-col gap-4">

          {/* Contact info — guests only */}
          {isGuest && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
              <div className="px-6 py-4 border-b border-outline-variant bg-brand-500/15">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface">Your contact info</p>
                <p className="text-xs text-on-surface-variant mt-0.5">Required to confirm your appointment</p>
              </div>
              <div className="px-6 py-5 space-y-4">
                <Field
                  label="Full name"
                  type="text"
                  value={guestName}
                  onChange={onGuestNameChange}
                  placeholder="John Smith"
                  autoComplete="name"
                  required
                />
                <Field
                  label="Phone number"
                  type="tel"
                  value={guestPhone}
                  onChange={onGuestPhoneChange}
                  placeholder="(555) 000-0000"
                  autoComplete="tel"
                  required
                />
                <Field
                  label="Email"
                  type="email"
                  value={guestEmail}
                  onChange={onGuestEmailChange}
                  placeholder="john@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-outline-variant bg-brand-500/15">
              <p className="text-xs font-bold uppercase tracking-widest text-on-surface">Special requests</p>
              <p className="text-xs text-on-surface-variant mt-0.5">Optional — anything we should know?</p>
            </div>
            <div className="px-6 py-5">
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
                placeholder="e.g. fade on the sides, keep length on top…"
                className="w-full rounded-xl border-2 border-outline-variant bg-white px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition resize-none focus:border-primary focus:ring-2 focus:ring-primary/10"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={onSubmit}
              disabled={submitting || !guestReady}
              className="group w-full flex items-center justify-center gap-3 bg-gradient-to-r from-primary to-primary-container text-on-primary px-8 py-4 rounded-full font-bold text-base shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {submitting
                ? <><span className="h-4 w-4 animate-spin rounded-full border-2 border-on-primary/40 border-t-on-primary" /> Booking…</>
                : <><span className="material-symbols-outlined text-lg">check_circle</span> Confirm appointment</>
              }
            </button>
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className="w-full text-on-surface-variant font-semibold flex items-center justify-center gap-2 py-3 hover:text-on-surface transition-colors disabled:opacity-40"
            >
              <span className="material-symbols-outlined text-base">chevron_left</span>
              Back
            </button>
          </div>

        </div>
      </div>

    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

function InvoiceRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3 py-3">
      <span className="material-symbols-outlined text-on-surface-variant text-base shrink-0">{icon}</span>
      <span className="text-sm text-on-surface-variant w-20 shrink-0">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  );
}

function Field({
  label, type, value, onChange, placeholder, autoComplete, required,
}: {
  label: string; type: string; value: string;
  onChange: (v: string) => void; placeholder: string;
  autoComplete?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
        {label} {required && <span className="text-error">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="w-full rounded-xl border-2 border-outline-variant bg-white px-4 py-3 text-sm text-on-surface placeholder-on-surface-variant/50 outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10"
      />
    </div>
  );
}
