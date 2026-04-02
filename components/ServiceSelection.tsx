'use client';

export default function ServiceSelection() {
  return (
    <div className="flex flex-col items-center justify-center px-4 md:px-12 max-w-7xl mx-auto w-full">

      {/* ── Tide Progress Indicator ── */}
      <div className="w-full max-w-3xl mb-12">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm font-semibold text-primary uppercase tracking-widest">Service</span>
          <span className="text-sm font-medium text-outline">Schedule</span>
          <span className="text-sm font-medium text-outline">Confirm</span>
        </div>
        <div className="h-2 w-full bg-surface-container-high rounded-full overflow-hidden flex">
          <div className="h-full w-1/3 bg-gradient-to-r from-primary to-primary-container rounded-full shadow-sm" />
          <div className="h-full w-2/3 bg-transparent" />
        </div>
      </div>

      {/* ── Editorial Header ── */}
      <section className="text-center mb-10">
        <h1 className="font-headline text-4xl md:text-5xl font-extrabold tracking-tight text-on-surface mb-2">
          Step 1: Choose a service
        </h1>
        <p className="text-on-surface-variant font-medium">
          Select the treatment that best suits your style today.
        </p>
      </section>

      {/* ── Service Card Grid ── */}
      <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">

        {/* Card 1 — Standard Haircut */}
        <button
          onClick={() => {}}
          className="group flex flex-col items-start p-8 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none"
        >
          <div className="mb-6 p-3 bg-secondary-container rounded-full text-on-secondary-container">
            <span className="material-symbols-outlined text-3xl">content_cut</span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">Standard Haircut</h3>
          <p className="text-on-surface-variant text-sm mb-4">Precision cut &amp; style</p>
          <div className="mt-auto flex flex-col">
            <span className="text-primary font-bold text-2xl tracking-tight">$25.00</span>
            <span className="text-outline text-xs font-semibold uppercase tracking-tighter">30 MIN</span>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-primary">add_circle</span>
          </div>
        </button>

        {/* Card 2 — Beard */}
        <button
          onClick={() => {}}
          className="group flex flex-col items-start p-8 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none"
        >
          <div className="mb-6 p-3 bg-primary-fixed rounded-full text-on-primary-fixed">
            <span className="material-symbols-outlined text-3xl">face</span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">Beard</h3>
          <p className="text-on-surface-variant text-sm mb-4">Trimming &amp; sculpting</p>
          <div className="mt-auto flex flex-col">
            <span className="text-primary font-bold text-2xl tracking-tight">$15.00</span>
            <span className="text-outline text-xs font-semibold uppercase tracking-tighter">30 MIN</span>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-primary">add_circle</span>
          </div>
        </button>

        {/* Card 3 — Hair + Beard (selected state) */}
        <button
          onClick={() => {}}
          className="group flex flex-col items-start p-8 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden border-2 border-primary ring-1 ring-primary/20 focus:outline-none"
        >
          <div className="mb-6 p-3 bg-tertiary-fixed rounded-full text-on-tertiary-fixed">
            <span
              className="material-symbols-outlined text-3xl"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              stars
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">Hair + Beard</h3>
          <p className="text-on-surface-variant text-sm mb-4">The ultimate combo</p>
          <div className="mt-auto flex flex-col">
            <span className="text-primary font-bold text-2xl tracking-tight">$35.00</span>
            <span className="text-outline text-xs font-semibold uppercase tracking-tighter">30 MIN</span>
          </div>
          <div className="absolute top-4 right-4 p-1 bg-primary rounded-full text-white">
            <span className="material-symbols-outlined text-sm">check</span>
          </div>
        </button>

        {/* Card 4 — Special Request */}
        <button
          onClick={() => {}}
          className="group flex flex-col items-start p-8 bg-surface-container-lowest rounded-xl shadow-sm hover:shadow-md hover:scale-[1.02] transition-all duration-300 text-left relative overflow-hidden border-2 border-transparent focus:border-primary focus:outline-none"
        >
          <div className="mb-6 p-3 bg-surface-variant rounded-full text-on-surface-variant">
            <span className="material-symbols-outlined text-3xl">magic_button</span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">Special Request</h3>
          <p className="text-on-surface-variant text-sm mb-4">Artistic custom designs</p>
          <div className="mt-auto flex flex-col">
            <span className="text-primary font-bold text-2xl tracking-tight">$45.00</span>
            <span className="text-outline text-xs font-semibold uppercase tracking-tighter">30 MIN</span>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="material-symbols-outlined text-primary">add_circle</span>
          </div>
        </button>

      </div>

      {/* ── Actions ── */}
      <div className="w-full flex justify-between items-center mt-auto py-8">
        <button
          onClick={() => {}}
          className="text-on-surface-variant font-semibold flex items-center gap-2 hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined">chevron_left</span>
          Cancel
        </button>
        <button
          onClick={() => {}}
          className="group flex items-center gap-4 bg-gradient-to-r from-primary to-primary-container text-on-primary px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-primary/20 hover:scale-105 transition-transform"
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
