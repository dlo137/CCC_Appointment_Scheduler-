import Link from 'next/link';
import Image from 'next/image';
import heroImg from './assets/hero_img.jpg';

export default function HomePage() {
  return (
    <div className="bg-[#f8fbfd]">
      <Hero />
      <LocationSection />
      <Footer />
    </div>
  );
}

// ── Hero ──────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section className="relative overflow-hidden text-white" style={{ minHeight: '560px' }}>
      {/* background image */}
      <Image
        src={heroImg}
        alt="Barber trimming a client's beard"
        fill
        priority
        className="object-cover object-center"
      />

      {/* dark gradient overlay — keeps text legible over the photo */}
      <div
        aria-hidden
        className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30"
      />

      {/* content — left-aligned so it sits over the darker side of the gradient */}
      <div className="relative mx-auto flex max-w-5xl flex-col justify-center px-8 py-32 sm:py-40">
        <span className="mb-4 inline-block w-fit rounded-full border border-white/20 bg-white/10 px-4 py-1 text-xs font-bold uppercase tracking-widest text-white/80 backdrop-blur-sm">
          Carteret Community College
        </span>
        <h1 className="max-w-xl text-5xl font-bold tracking-tight drop-shadow-lg sm:text-6xl">
          CCC Barber Academy
        </h1>
        <p className="mt-5 max-w-md text-lg text-white/75 drop-shadow">
          Professional cuts by student barbers under master supervision.
          Book your appointment in under a minute.
        </p>
        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            href="/book"
            className="w-fit rounded-xl bg-brand-500 px-8 py-3.5 text-sm font-bold uppercase tracking-widest text-white shadow-lg transition hover:bg-brand-400"
          >
            Book now
          </Link>
        </div>
      </div>
    </section>
  );
}

// ── Location ──────────────────────────────────────────────────────────────────

const HOURS: { day: string; time: string }[] = [
  { day: 'Monday',    time: '9:00 AM – 5:00 PM' },
  { day: 'Tuesday',   time: '9:00 AM – 5:00 PM' },
  { day: 'Wednesday', time: '9:00 AM – 5:00 PM' },
  { day: 'Thursday',  time: '9:00 AM – 5:00 PM' },
  { day: 'Friday',    time: '9:00 AM – 3:00 PM' },
  { day: 'Saturday',  time: 'Closed' },
  { day: 'Sunday',    time: 'Closed' },
];

function LocationSection() {
  return (
    <section id="location" className="border-t border-gray-200 py-24">
      <div className="mx-auto max-w-5xl px-4">
        <span className="text-xs font-bold uppercase tracking-widest text-ocean-600">Find us</span>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900">Location &amp; hours</h2>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {/* address + hours */}
          <div className="space-y-8">
            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Address</h3>
              <p className="text-sm font-semibold text-gray-900">CCC Barber Academy</p>
              <p className="mt-1 text-sm text-gray-500">3505 Arendell St</p>
              <p className="text-sm text-gray-500">Morehead City, NC 28557</p>
              <a
                href="https://maps.google.com/?q=3505+Arendell+St+Morehead+City+NC"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-block text-sm font-medium text-ocean-600 hover:text-ocean-700 transition"
              >
                Get directions →
              </a>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-400">Hours</h3>
              <div className="divide-y divide-gray-100">
                {HOURS.map(({ day, time }) => (
                  <div key={day} className="flex justify-between py-2.5">
                    <span className="text-sm text-gray-600">{day}</span>
                    <span className={`text-sm font-medium ${time === 'Closed' ? 'text-gray-400' : 'text-gray-900'}`}>
                      {time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* map embed */}
          <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-sm min-h-[400px]">
            <iframe
              title="CCC Barber Academy location"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3287.3!2d-76.7298!3d34.7231!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89a8dea6f4b5a2c5%3A0x1234!2s3505+Arendell+St%2C+Morehead+City%2C+NC+28557!5e0!3m2!1sen!2sus!4v1234567890"
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: '400px' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

// ── Footer ────────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-ocean-950 py-12 text-ocean-300">
      <div className="mx-auto max-w-5xl px-4">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <div>
            <p className="text-base font-bold text-white">CCC Barber Academy</p>
            <p className="mt-1 text-sm">Carteret Community College · Morehead City, NC</p>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link href="/book" className="hover:text-white transition">Book</Link>
            <Link href="/appointments" className="hover:text-white transition">My Appointments</Link>
            <Link href="/login" className="hover:text-white transition">Sign in</Link>
          </nav>
        </div>
        <p className="mt-8 text-center text-xs text-ocean-600">
          &copy; {new Date().getFullYear()} Carteret Community College. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

