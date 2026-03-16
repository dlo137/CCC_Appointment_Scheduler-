interface Props {
  currentStep: 1 | 2 | 3;
}

const STEPS = [
  { n: 1, label: 'Service' },
  { n: 2, label: 'Schedule' },
  { n: 3, label: 'Confirm' },
] as const;

export default function StepIndicator({ currentStep }: Props) {
  return (
    <div className="flex items-center justify-center gap-0 mb-10">
      {STEPS.map(({ n, label }, i) => {
        const done   = currentStep > n;
        const active = currentStep === n;

        return (
          <div key={n} className="flex items-center">
            {/* connector line */}
            {i > 0 && (
              <div
                className={`h-px w-12 sm:w-20 transition-colors duration-300 ${
                  done || active ? 'bg-brand-500' : 'bg-zinc-700'
                }`}
              />
            )}

            <div className="flex flex-col items-center gap-1.5">
              {/* circle */}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                  done
                    ? 'border-brand-500 bg-brand-500 text-white'
                    : active
                    ? 'border-brand-500 bg-brand-950 text-brand-400'
                    : 'border-zinc-700 bg-zinc-900 text-zinc-600'
                }`}
              >
                {done ? (
                  <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4 stroke-white stroke-2">
                    <polyline points="3,8 6.5,12 13,4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  n
                )}
              </div>
              {/* label */}
              <span
                className={`text-xs font-semibold uppercase tracking-widest transition-colors ${
                  active ? 'text-brand-400' : done ? 'text-brand-600' : 'text-zinc-600'
                }`}
              >
                {label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
