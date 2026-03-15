export default function HomePage() {
  return (
    <section className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900">
        Watson <span className="text-brand-500">Booking</span>
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-500">
        Book your next haircut in seconds. Choose your barber, pick a time, and
        you&apos;re done.
      </p>
      <a
        href="/book"
        className="mt-8 inline-block rounded-xl bg-brand-500 px-8 py-3 text-base font-semibold text-white shadow-sm hover:bg-brand-600 transition-colors"
      >
        Book Now
      </a>
    </section>
  );
}
