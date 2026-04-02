import { Service } from '@/types';

interface Props {
  services: Service[];
  selected: Service | null;
  onSelect: (s: Service) => void;
  onNext: () => void;
  onCancel?: () => void;
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

// Best-effort icon mapping by service name keywords
function serviceIcon(name: string): string {
  const n = name.toLowerCase();
  if (n.includes('beard') && n.includes('hair')) return 'stars';
  if (n.includes('beard'))   return 'face';
  if (n.includes('special') || n.includes('design') || n.includes('custom')) return 'magic_button';
  return 'content_cut';
}

export default function Step1Service({ services, selected, onSelect, onNext, onCancel }: Props) {
  return (
    <div className="flex flex-col flex-1 min-h-0">

      {/* Header */}
      <section className="text-center mb-6">
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tight text-on-surface mb-1">
          Step 1: Choose a service
        </h1>
        <p className="text-on-surface-variant font-medium text-sm">
          Select the treatment that best suits your style today.
        </p>
      </section>

      {/* Service Cards */}
      <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 flex-1 min-h-0">
        {services.map((svc) => {
          const isSelected = selected?.id === svc.id;
          return (
            <button
              key={svc.id}
              type="button"
              onClick={() => onSelect(svc)}
              className={`group flex flex-col items-start p-8 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden border-2 focus:outline-none ${
                isSelected
                  ? 'border-primary ring-1 ring-primary/20'
                  : 'border-transparent focus:border-primary'
              }`}
            >
              {/* Icon */}
              <div className={`mb-6 p-3 rounded-full ${
                isSelected ? 'bg-primary text-on-primary' : 'bg-secondary-container text-on-secondary-container'
              }`}>
                <span
                  className="material-symbols-outlined text-3xl"
                  style={isSelected ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  {serviceIcon(svc.name)}
                </span>
              </div>

              <h3 className="font-headline text-xl font-bold text-on-surface mb-1">{svc.name}</h3>

              <div className="mt-auto flex flex-col pt-4">
                <span className="text-primary font-bold text-2xl tracking-tight">
                  {formatPrice(svc.price)}
                </span>
                <span className="text-outline text-xs font-semibold uppercase tracking-tighter">
                  {formatDuration(svc.duration_minutes)}
                </span>
              </div>

              {/* Unselected hover hint */}
              {!isSelected && (
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="material-symbols-outlined text-primary">add_circle</span>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-4 right-4 p-1 bg-primary rounded-full text-white">
                  <span className="material-symbols-outlined text-sm">check</span>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Actions */}
      <div className="w-full flex justify-between items-center pt-4 pb-2 mt-auto">
        <button
          type="button"
          onClick={onCancel}
          className="text-on-surface-variant font-semibold flex items-center gap-2 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Cancel
        </button>
        <button
          type="button"
          disabled={!selected}
          onClick={onNext}
          className="group flex items-center gap-4 bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
        >
          Next Step
          <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>
      </div>

    </div>
  );
}
