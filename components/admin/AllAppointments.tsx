'use client';

import { useEffect, useState } from 'react';
import { Appointment, AppointmentStatus } from '@/types';
import { fetchAllAppointments, adminUpdateAppointmentStatus } from '@/lib/admin';

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  [AppointmentStatus.Pending]:   'bg-amber-500/10 text-amber-400 border-amber-500/30',
  [AppointmentStatus.Confirmed]: 'bg-green-500/10 text-green-400 border-green-500/30',
  [AppointmentStatus.Cancelled]: 'bg-zinc-700/40 text-zinc-500 border-zinc-700',
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
        <h2 className="text-lg font-bold text-white">All Appointments</h2>
        <p className="text-xs text-zinc-500 mt-0.5">
          Full booking history across all customers and barbers.
        </p>
      </div>

      {error && (
        <p className="mb-4 rounded-lg border border-red-900 bg-red-950/40 px-4 py-2 text-sm text-red-400">
          {error}
        </p>
      )}

      {/* filter pills */}
      <div className="flex gap-2 flex-wrap mb-5">
        {(
          [
            { key: 'all',       label: `All (${counts.all})` },
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
                ? 'border-brand-500 bg-brand-500/10 text-brand-400'
                : 'border-zinc-700 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-600">Loading…</div>
      ) : shown.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 py-12 text-center text-sm text-zinc-600">
          No appointments found.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/60">
                {['Customer', 'Barber', 'Service', 'Time', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-zinc-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800 bg-zinc-900">
              {shown.map((appt) => (
                <tr key={appt.id} className="transition hover:bg-zinc-800/40">
                  <td className="px-4 py-3 font-medium text-white">
                    {appt.customer?.full_name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {(appt as Appointment & { _barberName?: string })._barberName ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400">
                    {appt.service?.name ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
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
                          className="rounded border border-green-800 px-2 py-0.5 text-xs text-green-400 hover:bg-green-950/40 disabled:opacity-40 transition"
                        >
                          Confirm
                        </button>
                      )}
                      {appt.status !== AppointmentStatus.Cancelled && (
                        <button
                          disabled={busyId === appt.id}
                          onClick={() => handleStatus(appt.id, AppointmentStatus.Cancelled)}
                          className="rounded border border-zinc-700 px-2 py-0.5 text-xs text-zinc-400 hover:text-white disabled:opacity-40 transition"
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
