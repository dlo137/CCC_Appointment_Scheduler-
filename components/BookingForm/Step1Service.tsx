import { Service } from '@/types';

interface Props {
  services: Service[];
  selected: Service | null;
  onSelect: (s: Service) => void;
  onNext: () => void;
}

function formatPrice(price: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price);
}

function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export default function Step1Service({ services, selected, onSelect, onNext }: Props) {
  return (
    <div>
      <h2 className="text-2xl font-bold tracking-tight text-white mb-1">Choose a service</h2>
      <p className="text-zinc-400 text-sm mb-8">Select the service you'd like to book.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {services.map((svc) => {
          const isSelected = selected?.id === svc.id;
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc)}
              className={`group relative flex flex-col items-start gap-3 rounded-xl border-2 p-5 text-left transition-all duration-200 ${
                isSelected
                  ? 'border-brand-500 bg-brand-950/40'
                  : 'border-zinc-800 bg-zinc-900 hover:border-zinc-600'
              }`}
            >
              {isSelected && (
                <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand-500">
                  <svg viewBox="0 0 16 16" fill="none" className="h-3 w-3 stroke-white stroke-2">
                    <polyline points="3,8 6.5,12 13,4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              )}

              <p className="text-base font-semibold text-white pr-6">{svc.name}</p>

              <div className="flex items-center gap-3 mt-auto">
                <span className="rounded-md bg-zinc-800 px-2.5 py-1 text-xs font-medium text-zinc-300">
                  {formatDuration(svc.duration_minutes)}
                </span>
                <span className="text-lg font-bold text-brand-400">
                  {formatPrice(svc.price)}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          disabled={!selected}
          onClick={onNext}
          className="rounded-xl bg-brand-500 px-8 py-3 text-sm font-bold uppercase tracking-widest text-white transition hover:bg-brand-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}
