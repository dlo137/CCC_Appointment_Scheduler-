'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useAppointments } from '@/hooks/useAppointments';
import { fetchBarberByProfileId } from '@/lib/barbers';
import { Barber, AppointmentStatus } from '@/types';
import AppointmentCard from '@/components/dashboard/AppointmentCard';
import CalendarView from '@/components/dashboard/CalendarView';
import AvailabilityForm from '@/components/dashboard/AvailabilityForm';

type Tab = 'today' | 'week' | 'availability';

function isToday(iso: string) {
  const d = new Date(iso);
  const t = new Date();
  return (
    d.getFullYear() === t.getFullYear() &&
    d.getMonth()    === t.getMonth()    &&
    d.getDate()     === t.getDate()
  );
}

function isFutureOrToday(iso: string) {
  return new Date(iso) >= new Date(new Date().setHours(0, 0, 0, 0));
}

export default function DashboardContent() {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  const [barber,        setBarber]        = useState<Barber | null>(null);
  const [barberLoading, setBarberLoading] = useState(true);
  const [tab,           setTab]           = useState<Tab>('today');

  useEffect(() => {
    if (!user?.id) return;
    fetchBarberByProfileId(user.id).then((b) => {
      setBarber(b);
      setBarberLoading(false);
    });
  }, [user?.id]);

  const { appointments, loading: apptLoading, refresh } = useAppointments(barber?.id);

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  if (barberLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f8fbfd]">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-ocean-500 border-t-transparent" />
      </div>
    );
  }

  if (!barber) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-[#f8fbfd] px-4">
        <p className="text-gray-500 text-sm">
          No barber profile found for this account. Contact an admin.
        </p>
      </div>
    );
  }

  const todayAppts = appointments
    .filter((a) => isToday(a.start_time) && a.status !== AppointmentStatus.Cancelled)
    .sort((a, b) => a.start_time.localeCompare(b.start_time));

  const upcomingAppts = appointments.filter((a) => isFutureOrToday(a.start_time));

  const pendingCount = todayAppts.filter(
    (a) => a.status === AppointmentStatus.Pending,
  ).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbfd]">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-ocean-600 mb-1">
              Barber Dashboard
            </p>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
              {profile?.full_name ?? 'Welcome'}
            </h1>
            {pendingCount > 0 && (
              <p className="mt-1 text-sm text-amber-600">
                {pendingCount} appointment{pendingCount > 1 ? 's' : ''} pending confirmation today
              </p>
            )}
          </div>

          <button
            onClick={handleSignOut}
            className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-600 transition hover:border-gray-300 hover:text-gray-900"
          >
            Sign out
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 w-fit shadow-sm">
          {(
            [
              { key: 'today',        label: "Today's appointments" },
              { key: 'week',         label: 'This week' },
              { key: 'availability', label: 'Hours' },
            ] as { key: Tab; label: string }[]
          ).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-ocean-600 text-white shadow'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* today */}
        {tab === 'today' && (
          <section>
            {apptLoading ? (
              <LoadingSpinner />
            ) : todayAppts.length === 0 ? (
              <EmptyState message="No appointments scheduled for today." />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {todayAppts.map((appt) => (
                  <AppointmentCard key={appt.id} appointment={appt} onUpdated={refresh} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* week calendar */}
        {tab === 'week' && (
          <section>
            <div className="mb-4">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400">
                Current week
              </h2>
            </div>
            {apptLoading ? (
              <LoadingSpinner />
            ) : (
              <CalendarView appointments={upcomingAppts} />
            )}
          </section>
        )}

        {/* availability */}
        {tab === 'availability' && (
          <section>
            <div className="mb-6">
              <h2 className="text-sm font-bold uppercase tracking-widest text-gray-400 mb-1">
                Available hours
              </h2>
              <p className="text-xs text-gray-400">
                Set the hours customers can book you. Leave days unchecked to mark them as off.
              </p>
            </div>
            <AvailabilityForm
              barber={barber}
              onSaved={() => {
                fetchBarberByProfileId(user!.id).then((b) => {
                  if (b) setBarber(b);
                });
              }}
            />
          </section>
        )}
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div className="flex items-center gap-2 text-gray-400 text-sm py-8">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-ocean-500 border-t-transparent" />
      Loading…
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-16 text-center shadow-sm">
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}
