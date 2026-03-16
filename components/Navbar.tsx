'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const customerLinks = [
  { href: '/book', label: 'Book' },
  { href: '/appointments', label: 'My Appointments' },
];

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();

  const isStaff = profile?.role === 'barber' || profile?.role === 'admin';

  async function handleSignOut() {
    await signOut();
    router.push('/');
  }

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
        <Link
          href="/"
          className="text-xl font-bold tracking-tight text-gray-900 hover:text-brand-500 transition-colors"
        >
          Watson <span className="text-brand-500">Booking</span>
        </Link>

        <div className="flex items-center gap-6">
          {/* Customer nav links — always visible */}
          {customerLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              {label}
            </Link>
          ))}

          {/* Barber dashboard link */}
          {!loading && isStaff && (
            <Link
              href="/dashboard"
              className="text-sm font-medium text-gray-600 hover:text-brand-500 transition-colors"
            >
              Dashboard
            </Link>
          )}

          {/* Admin panel link */}
          {!loading && profile?.role === 'admin' && (
            <Link
              href="/admin"
              className="text-sm font-medium text-purple-600 hover:text-purple-500 transition-colors"
            >
              Admin
            </Link>
          )}

          {/* Auth CTA */}
          {loading ? (
            <span className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : user ? (
            <button
              onClick={handleSignOut}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:text-gray-900"
            >
              Sign out
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-brand-500 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 transition-colors"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
