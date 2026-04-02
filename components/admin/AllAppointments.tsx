'use client';

import { useEffect, useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import { fetchAllAppointments, adminUpdateAppointmentStatus } from '@/lib/admin';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-50 text-amber-700 border-amber-200',
  [AppointmentStatus.Confirmed]: 'bg-green-50 text-green-700 border-green-200',
  [AppointmentStatus.Cancelled]: 'bg-gray-100 text-gray-400 border-gray-200',
};

type Filter = 'all' | AppointmentStatus;

function fmt(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
    ' · ' +
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

export default function AllAppointments() {
  const [appointments, setAppointments] = useState<(Appointment & { _barberName?: string })[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState<string | null>(null);
  const [filter, setFilter]             = useState<Filter>('all');
  const [busyId, setBusyId]             = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try { setAppointments(await fetchAllAppointments() as (Appointment & { _barberName?: string })[]); }
    catch (e) { setError(e instanceof Error ? e.message : 'Load failed'); }
    finally { setLoading(false); }
  }

  useEffect(() => { load(); }, []);

  async function handleStatus(id: string, status: AppointmentStatus) {
    setBusyId(id);
    try {
      await adminUpdateAppointmentStatus(id, status);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status } : a)),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setBusyId(null);
    }
  }

  const shown = filter === 'all'
    ? appointments
    : appointments.filter((a) => a.status === filter);

  const counts = {
    all:       appointments.length,
    pending:   appointments.filter((a) => a.status === AppointmentStatus.Pending).length,
    confirmed: appointments.filter((a) => a.status === AppointmentStatus.Confirmed).length,
    cancelled: appointments.filter((a) => a.status === AppointmentStatus.Cancelled).length,
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="text-lg font-bold text-gray-900">All Appointments</h2>
        <p className="text-xs text-gray-400 mt-0.5">
          Full booking history across all customers and barbers.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {/* filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(
          [
            { key: 'all',                         label: `All (${counts.all})` },
            { key: AppointmentStatus.Pending,   label: `Pending (${counts.pending})` },
            { key: AppointmentStatus.Confirmed, label: `Confirmed (${counts.confirmed})` },
            { key: AppointmentStatus.Cancelled, label: `Cancelled (${counts.cancelled})` },
          ] as { key: Filter; label: string }[]
        ).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`rounded-full border px-4 py-1.5 text-xs font-bold transition ${
              filter === key
                ? 'border-ocean-400 bg-ocean-50 text-ocean-600'
                : 'border-gray-200 text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-gray-400">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 py-12 text-center text-sm text-gray-400">
          No appointments found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                {['Customer', 'Barber', 'Service', 'Time', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-gray-400">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
              {shown.map((appt) => (
                <tr key={appt.id} className="transition hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {appt.customer?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {(appt as Appointment & { _barberName?: string })._barberName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {appt.service?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                    {fmt(appt.start_time)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${STATUS_STYLES[appt.status]}`}>
                      {appt.status}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1.5">
                      {appt.status !== AppointmentStatus.Confirmed && appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          disabled={busyId === appt.id}
                          onClick={() => handleStatus(appt.id, AppointmentStatus.Confirmed)}
                          className="rounded border border-green-200 px-2 py-0.5 text-xs text-green-700 hover:bg-green-50 disabled:opacity-40 transition"
                        >
                          Confirm
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          disabled={busyId === appt.id}
                          onClick={() => handleStatus(appt.id, AppointmentStatus.Cancelled)}
                          className="rounded border border-gray-200 px-2 py-0.5 text-xs text-gray-600 hover:text-gray-900 disabled:opacity-40 transition"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
