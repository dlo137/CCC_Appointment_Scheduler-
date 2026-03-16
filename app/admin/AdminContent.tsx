'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import ServicesManager from '@/components/admin/ServicesManager';
import BarbersManager from '@/components/admin/BarbersManager';
import AllAppointments from '@/components/admin/AllAppointments';

type Tab = 'services' | 'barbers' | 'appointments';

const TABS: { key: Tab; label: string }[] = [
  { key: 'services',     label: 'Services' },
  { key: 'barbers',      label: 'Users & Barbers' },
  { key: 'appointments', label: 'All Appointments' },
];

export default function AdminContent() {
  const { profile, signOut } = useAuth();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('services');

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-zinc-950">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* header */}
        <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-purple-400 mb-1">
              Admin Panel
            </p>
            <h1 className="text-3xl font-bold text-white tracking-tight">
              Watson Booking
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Signed in as <span className="text-zinc-300">{profile?.full_name ?? 'Admin'}</span>
            </p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-xl border border-zinc-700 px-5 py-2.5 text-sm font-semibold text-zinc-300 transition hover:border-zinc-500 hover:text-white"
          >
            Sign out
          </button>
        </div>

        {/* tabs */}
        <div className="flex gap-1 bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-8 w-fit">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
                tab === key
                  ? 'bg-zinc-700 text-white shadow'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* panel */}
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-6 sm:p-8">
          {tab === 'services'     && <ServicesManager />}
          {tab === 'barbers'      && <BarbersManager />}
          {tab === 'appointments' && <AllAppointments />}
        </div>
      </div>
    </div>
  );
}
