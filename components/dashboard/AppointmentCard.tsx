'use client';

import { useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import { updateAppointmentStatus } from '@/lib/appointments';

interface Props {
  appointment: Appointment;
  onUpdated: () => void;
}

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-50 text-amber-700 border-amber-200',
  [AppointmentStatus.Confirmed]: 'bg-green-50 text-green-700 border-green-200',
  [AppointmentStatus.Cancelled]: 'bg-gray-100 text-gray-400 border-gray-200',
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
    <div className={`rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-opacity ${isCancelled ? 'opacity-50' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        {/* left: info */}
        <div className="min-w-0">
          <p className="text-base font-semibold text-gray-900 truncate">{customerName}</p>
          <p className="text-sm text-gray-500 mt-0.5">{serviceName}</p>
          <p className="text-sm font-medium text-gray-700 mt-2">
            {formatTime(appt.start_time)}
            <span className="text-gray-300 mx-1">→</span>
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
        <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
          {!isConfirmed && (
            <button
              disabled={busy}
              onClick={() => act(AppointmentStatus.Confirmed)}
              className="flex-1 rounded-lg bg-green-50 border border-green-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-green-700 transition hover:bg-green-100 disabled:opacity-40"
            >
              Confirm
            </button>
          )}
          <button
            disabled={busy}
            onClick={() => act(AppointmentStatus.Cancelled)}
            className="flex-1 rounded-lg bg-gray-50 border border-gray-200 px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      )}

      {appt.notes && (
        <p className="mt-3 text-xs text-gray-400 italic border-t border-gray-100 pt-3">
          &ldquo;{appt.notes}&rdquo;
        </p>
      )}
    </div>
  );
}
