'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { Appointment, AppointmentStatus } from '@/types';
import {
  fetchCustomerAppointments,
  updateAppointmentStatus,
  updateAppointmentNotes,
} from '@/lib/appointments';

// ── helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    weekday: 'short',
    month:   'short',
    day:     'numeric',
    year:    'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour:   'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-50 text-amber-700 border-amber-200',
  [AppointmentStatus.Confirmed]: 'bg-green-50 text-green-700 border-green-200',
  [AppointmentStatus.Cancelled]: 'bg-red-50 text-red-600 border-red-200',
};

function resolveStatusLabel(appt: ApptWithBarber): { label: string; style: string } {
  if (appt.status === AppointmentStatus.Cancelled) {
    return { label: 'Cancelled', style: STATUS_STYLES[AppointmentStatus.Cancelled] };
  }
  if (new Date(appt.start_time) < new Date()) {
    return { label: 'Past', style: 'bg-gray-100 text-gray-500 border-gray-200' };
  }
  return { label: appt.status, style: STATUS_STYLES[appt.status] };
}

// ── card ─────────────────────────────────────────────────────────────────────

type ApptWithBarber = Appointment & { _barberName: string };

function AppointmentRow({
  appt,
  onCancel,
  onSaveNotes,
  busyId,
}: {
  appt: ApptWithBarber;
  onCancel: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  busyId: string | null;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft, setDraft]       = useState(appt.notes ?? '');
  const [saving, setSaving]     = useState(false);

  const canEdit =
    appt.status !== AppointmentStatus.Cancelled &&
    new Date(appt.start_time) > new Date();

  const canCancel = canEdit;

  async function handleSave() {
    setSaving(true);
    try {
      await onSaveNotes(appt.id, draft);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-opacity ${
        appt.status === AppointmentStatus.Cancelled ? 'opacity-50' : ''
      }`}
    >
      {/* top row: title + status badge */}
      {(() => {
        const { label, style } = resolveStatusLabel(appt);
        return (
          <div className="flex items-start justify-between gap-3">
            <p className="text-base font-semibold text-gray-900">
              {appt.service?.name ?? 'Service'}
            </p>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${style}`}>
              {label}
            </span>
          </div>
        );
      })()}

      {/* details */}
      <p className="text-sm text-gray-500 mt-0.5">with {appt._barberName}</p>
      <p className="text-sm font-medium text-gray-700 mt-2">
        {fmtDate(appt.start_time)}&nbsp;&middot;&nbsp;
        {fmtTime(appt.start_time)}
        <span className="text-gray-300 mx-1">→</span>
        {fmtTime(appt.end_time)}
      </p>
      {appt.service?.price !== undefined && (
        <p className="text-xs text-gray-400 mt-1">
          ${appt.service.price.toFixed(2)}
          {appt.service.duration_minutes ? ` · ${appt.service.duration_minutes} min` : ''}
        </p>
      )}
      {/* notes — inline edit or display */}
      {editing ? (
        <div className="mt-3 border-t border-gray-100 pt-3">
          <textarea
            rows={2}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Add a note or special request…"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none resize-none focus:border-ocean-400 focus:ring-2 focus:ring-ocean-400/20"
          />
          <div className="flex gap-2 mt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="rounded-lg bg-ocean-50 border border-ocean-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-ocean-700 transition hover:bg-ocean-100 disabled:opacity-40"
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
            <button
              onClick={() => { setEditing(false); setDraft(appt.notes ?? ''); }}
              className="rounded-lg border border-gray-200 px-4 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:bg-gray-50"
            >
              Discard
            </button>
          </div>
        </div>
      ) : (
        appt.notes && (
          <p className="text-xs text-gray-400 italic mt-2 border-t border-gray-100 pt-2">
            &ldquo;{appt.notes}&rdquo;
          </p>
        )
      )}

      {/* footer actions */}
      {(canEdit || canCancel) && !editing && (
        <div className="mt-4 border-t border-gray-100 pt-4 flex gap-2">
          {canEdit && (
            <button
              onClick={() => { setDraft(appt.notes ?? ''); setEditing(true); }}
              className="flex-1 rounded-lg bg-ocean-50 border border-ocean-200 py-2 text-xs font-bold uppercase tracking-wider text-ocean-700 transition hover:bg-ocean-100"
            >
              Edit
            </button>
          )}
          {canCancel && (
            <button
              disabled={busyId === appt.id}
              onClick={() => onCancel(appt.id)}
              className="flex-1 rounded-lg bg-red-50 border border-red-200 py-2 text-xs font-bold uppercase tracking-wider text-red-700 transition hover:bg-red-100 disabled:opacity-40"
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── section ───────────────────────────────────────────────────────────────────

function Section({
  title,
  appointments,
  onCancel,
  onSaveNotes,
  busyId,
}: {
  title: string;
  appointments: ApptWithBarber[];
  onCancel: (id: string) => void;
  onSaveNotes: (id: string, notes: string) => Promise<void>;
  busyId: string | null;
}) {
  return (
    <div className="mb-10">
      <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-4">
        {title}
      </h2>
      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 bg-white py-12 text-center text-sm text-gray-400 shadow-sm">
          No {title.toLowerCase()} appointments.
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {appointments.map((a) => (
            <AppointmentRow
              key={a.id}
              appt={a}
              onCancel={onCancel}
              onSaveNotes={onSaveNotes}
              busyId={busyId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── content ───────────────────────────────────────────────────────────────────

function AppointmentsContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const claimedCount = Number(searchParams.get('claimed') ?? 0);
  const [appointments, setAppointments] = useState<ApptWithBarber[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [busyId, setBusyId]             = useState<string | null>(null);

  async function handleSaveNotes(id: string, notes: string) {
    try {
      await updateAppointmentNotes(id, notes);
      setAppointments((prev) =>
        prev.map((a) => a.id === id ? { ...a, notes: notes.trim() || null } : a),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save notes');
    }
  }

  useEffect(() => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);
    fetchCustomerAppointments(user.id)
      .then(setAppointments)
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Failed to load appointments'),
      )
      .finally(() => setLoading(false));
  }, [user?.id]);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await updateAppointmentStatus(id, AppointmentStatus.Cancelled);
      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: AppointmentStatus.Cancelled } : a,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to cancel appointment');
    } finally {
      setBusyId(null);
    }
  }

  const now = new Date();
  const upcoming = appointments.filter(
    (a) =>
      new Date(a.start_time) >= now &&
      a.status !== AppointmentStatus.Cancelled,
  );
  const past = appointments.filter(
    (a) =>
      new Date(a.start_time) < now ||
      a.status === AppointmentStatus.Cancelled,
  );

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbfd]">
      <div className="mx-auto max-w-3xl px-4 py-10">
        {/* header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean-600 mb-1">
            My Appointments
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Booking history
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            View and manage your upcoming and past appointments.
          </p>
        </div>

        {claimedCount > 0 && (
          <div className="mb-6 rounded-xl border border-brand-200 bg-brand-50 px-5 py-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-brand-500 mt-0.5 shrink-0">check_circle</span>
            <div>
              <p className="text-sm font-semibold text-brand-700">
                {claimedCount === 1
                  ? '1 guest appointment linked to your account'
                  : `${claimedCount} guest appointments linked to your account`}
              </p>
              <p className="text-xs text-brand-600 mt-0.5">
                We matched your email to existing bookings. They're now fully managed under your profile.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm py-16 justify-center">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-ocean-500 border-t-transparent" />
            Loading your appointments…
          </div>
        ) : (
          <>
            <Section
              title="Upcoming"
              appointments={upcoming}
              onCancel={handleCancel}
              onSaveNotes={handleSaveNotes}
              busyId={busyId}
            />
            <Section
              title="Past &amp; Cancelled"
              appointments={past}
              onCancel={handleCancel}
              onSaveNotes={handleSaveNotes}
              busyId={busyId}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ── page ──────────────────────────────────────────────────────────────────────

export default function AppointmentsPage() {
  return (
    <ProtectedRoute>
      <AppointmentsContent />
    </ProtectedRoute>
  );
}
