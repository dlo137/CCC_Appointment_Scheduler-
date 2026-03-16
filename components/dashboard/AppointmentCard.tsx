'use client';

import { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import { updateAppointmentStatus } from '@/lib/appointments';

interface Props {
  appointment: Appointment;
  onUpdated: () => void;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  [AppointmentStatus.Confirmed]: 'bg-green-500/10 text-green-400 border-green-500/30',
  [AppointmentStatus.Cancelled]: 'bg-zinc-700/40 text-zinc-500 border-zinc-700',
};

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit', hour12: true,
  });
}

export default function AppointmentCard({ appointment: appt, onUpdated }: Props) {
  const [busy, setBusy] = useState(false);

  async function act(status: AppointmentStatus) {
    setBusy(true);
    try {
      await updateAppointmentStatus(appt.id, status);
      onUpdated();
    } finally {
      setBusy(false);
    }
  }

  const isCancelled  = appt.status === AppointmentStatus.Cancelled;
  const isConfirmed  = appt.status === AppointmentStatus.Confirmed;
  const customerName = appt.customer?.full_name ?? 'Customer';
  const serviceName  = appt.service?.name ?? '—';

  return (
    <div className={`rounded-xl border bg-zinc-900 p-5 transition-opacity ${isCancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        {/* left: info */}
        <div className="min-w-0">
          <p className="text-base font-semibold text-white truncate">{customerName}</p>
          <p className="text-sm text-zinc-400 mt-0.5">{serviceName}</p>
          <p className="text-sm font-medium text-zinc-300 mt-2">
            {formatTime(appt.start_time)}
            <span className="text-zinc-600 mx-1">→</span>
            {formatTime(appt.end_time)}
          </p>
        </div>

        {/* right: status badge */}
        <span
          className={`shrink-0 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${
            STATUS_STYLES[appt.status]
          }`}
        >
          {appt.status}
        </span>
      </div>

      {/* actions */}
      {!isCancelled && (
        <div className="mt-4 flex gap-2 border-t border-zinc-800 pt-4">
          {!isConfirmed && (
            <button
              disabled={busy}
              onClick={() => act(AppointmentStatus.Confirmed)}
              className="flex-1 rounded-lg bg-green-600/10 border border-green-600/30 px-3 py-2 text-xs font-bold uppercase tracking-wider text-green-400 transition hover:bg-green-600/20 disabled:opacity-40"
            >
              Confirm
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => act(AppointmentStatus.Cancelled)}
            className="flex-1 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2 text-xs font-bold uppercase tracking-wider text-zinc-400 transition hover:bg-zinc-700 hover:text-zinc-200 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      )}

      {appt.notes && (
        <p className="mt-3 text-xs text-zinc-600 italic border-t border-zinc-800 pt-3">
          "{appt.notes}"
        </p>
      )}
    </div>
  );
}
