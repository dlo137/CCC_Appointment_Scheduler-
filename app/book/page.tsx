import ProtectedRoute from '@/components/ProtectedRoute';
import BookingForm from '@/components/BookingForm';

export default function BookPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-[calc(100vh-4rem)] bg-zinc-950">
        <div className="mx-auto max-w-2xl px-4 py-14">
          {/* page header */}
          <div className="mb-10 text-center">
            <p className="text-xs font-bold uppercase tracking-widest text-brand-500 mb-2">
              Watson Barbershop
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white">
              Book an appointment
            </h1>
            <p className="mt-3 text-zinc-400">
              Three steps. Done in under a minute.
            </p>
          </div>

          {/* form card */}
          <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 sm:p-10">
            <BookingForm />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
