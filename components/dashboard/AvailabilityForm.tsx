'use client';

import { useEffect, useState } from 'react';
import { Barber } from '@/types';
import { updateAvailableHours } from '@/lib/barbers';

interface Props {
  barber: Barber;
  onSaved: () => void;
}

const DAYS = [
  { key: 'monday',    label: 'Monday' },
  { key: 'tuesday',   label: 'Tuesday' },
  { key: 'wednesday', label: 'Wednesday' },
  { key: 'thursday',  label: 'Thursday' },
  { key: 'friday',    label: 'Friday' },
  { key: 'saturday',  label: 'Saturday' },
  { key: 'sunday',    label: 'Sunday' },
] as const;

type DayKey = typeof DAYS[number]['key'];

interface DayState {
  enabled: boolean;
  open:  string;
  close: string;
}

function initFromHours(
  hours: Barber['available_hours'],
): Record<DayKey, DayState> {
  const result = {} as Record<DayKey, DayState>;
  for (const { key } of DAYS) {
    const h = hours[key];
    result[key] = h
      ? { enabled: true,  open: h[0], close: h[1] }
      : { enabled: false, open: '09:00', close: '17:00' };
  }
  return result;
}

export default function AvailabilityForm({ barber, onSaved }: Props) {
  const [days, setDays]     = useState<Record<DayKey, DayState>>(() =>
    initFromHours(barber.available_hours),
  );
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  useEffect(() => {
    setDays(initFromHours(barber.available_hours));
  }, [barber.id]); // eslint-disable-line react-hooks/exhaustive-deps

  function toggle(key: DayKey, enabled: boolean) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], enabled } }));
  }

  function setTime(key: DayKey, field: 'open' | 'close', value: string) {
    setDays((prev) => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const hours: Barber['available_hours'] = {};
      for (const { key } of DAYS) {
        hours[key] = days[key].enabled ? [days[key].open, days[key].close] : null;
      }
      await updateAvailableHours(barber.id, hours);
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <div className="space-y-2">
        {DAYS.map(({ key, label }) => {
          const day = days[key];
          return (
            <div
              key={key}
              className={`flex flex-wrap items-center gap-4 rounded-xl border px-5 py-4 transition-colors ${
                day.enabled
                  ? 'border-ocean-200 bg-ocean-50'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {/* day toggle */}
              <label className="flex items-center gap-3 cursor-pointer w-32">
                <input
                  type="checkbox"
                  checked={day.enabled}
                  onChange={(e) => toggle(key, e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 accent-ocean-600 cursor-pointer"
                />
                <span
                  className={`text-sm font-semibold ${
                    day.enabled ? 'text-gray-900' : 'text-gray-400'
                  }`}
                >
                  {label}
                </span>
              </label>

              {/* time inputs */}
              {day.enabled ? (
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="time"
                    value={day.open}
                    onChange={(e) => setTime(key, 'open', e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-ocean-500"
                  />
                  <span className="text-gray-400 text-sm">to</span>
                  <input
                    type="time"
                    value={day.close}
                    onChange={(e) => setTime(key, 'close', e.target.value)}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 outline-none focus:border-ocean-500"
                  />
                </div>
              ) : (
                <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
                  Day off
                </span>
              )}
            </div>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-6 flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-brand-500 px-6 py-2.5 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-brand-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {saving && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {saving ? 'Saving…' : 'Save hours'}
        </button>

        {saved && (
          <span className="text-sm text-green-600 font-medium">
            ✓ Saved
          </span>
        )}
      </div>
    </div>
  );
}
