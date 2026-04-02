'use client';

import { useState } from 'react';
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
  const { profile } = useAuth();
  const [tab, setTab] = useState<Tab>('services');

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#f8fbfd]">
      <div className="mx-auto max-w-5xl px-4 py-10">

        {/* header */}
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-widest text-ocean-600 mb-1">
            Admin Panel
          </p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            CCC Barber Academy
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Signed in as{' '}
            <span className="text-gray-700 font-medium">{profile?.full_name ?? 'Admin'}</span>
          </p>
        </div>

        {/* tabs */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 mb-8 w-fit shadow-sm">
          {TABS.map(({ key, label }) => (
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

        {/* panel */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 sm:p-8 shadow-sm">
          {tab === 'services'     && <ServicesManager />}
          {tab === 'barbers'      && <BarbersManager />}
          {tab === 'appointments' && <AllAppointments />}
        </div>
      </div>
    </div>
  );
}
