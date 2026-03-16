import { Barber, Service, TimeSlot } from '@/types';

interface Props {
  service: Service;
  barber: Barber | null;
  slot: TimeSlot;
  notes: string;
  submitting: boolean;
  onNotesChange: (v: string) => void;
  onBack: () => void;
  onSubmit: () => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatSlot(slot: TimeSlot) {
  const start = new Date(slot.startTime);
  return {
    date: start.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    time: slot.label,
  };
}

export default function Step3Confirm({
  service,
  barber,
  slot,
  notes,
  submitting,
  onNotesChange,
  onBack,
  onSubmit,
}: Props) {
  const { date, time } = formatSlot(slot);

  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Confirm booking</h2>
      <p className="text-zinc-400 text-sm mb-8">Review your details before confirming.</p>

      {/* Summary card */}
      <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden mb-6">
        <div className="bg-zinc-800/60 px-6 py-4">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-500">Booking summary</p>
        </div>

        <div className="divide-y divide-zinc-800">
          <Row label="Service" value={service.name} />
          <Row
            label="Duration"
            value={`${service.duration_minutes} min`}
            sub={formatPrice(service.price)}
          />
          <Row
            label="Barber"
            value={barber?.name ?? 'Any available'}
          />
          <Row label="Date" value={date} />
          <Row label="Time" value={time} />
        </div>
      </div>

      {/* Notes */}
      <div className="mb-8">
        <label className="block text-xs font-bold uppercase tracking-widest text-zinc-500 mb-2">
          Notes (optional)
        </label>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Any special requests or preferences…"
          className="w-full rounded-xl border-2 border-zinc-700 bg-zinc-800 px-4 py-3 text-sm text-white placeholder-zinc-600 outline-none transition resize-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20"
        />
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="rounded-xl border border-zinc-700 px-6 py-3 text-sm font-bold uppercase tracking-widest text-zinc-300 transition hover:border-zinc-500 hover:text-white disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-60 flex items-center gap-2"
        >
          {submitting && (
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          )}
          {submitting ? 'Booking…' : 'Confirm booking'}
        </button>
      </div>
    </div>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-sm text-zinc-400">{label}</span>
      <div className="text-right">
        <span className="text-sm font-semibold text-white">{value}</span>
        {sub && <span className="block text-xs text-brand-400 font-medium">{sub}</span>}
      </div>
    </div>
  );
}
