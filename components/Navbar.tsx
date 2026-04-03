'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function Navbar() {
  const { user, profile, loading, signOut } = useAuth();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push('/');
    setMenuOpen(false);
  }

  const isAdmin = profile?.role === 'admin';

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-ocean-100 bg-white/90 backdrop-blur-sm shadow-sm">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-lg font-bold tracking-tight text-gray-900 hover:text-gray-700 transition-colors shrink-0"
        >
          CCC Barber Academy
        </Link>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-6">
          <Link href="/book" className="text-sm font-medium text-gray-600 hover:text-ocean-600 transition-colors">
            Book
          </Link>
          <Link href="/appointments" className="text-sm font-medium text-gray-600 hover:text-ocean-600 transition-colors">
            My Appointments
          </Link>
          {isAdmin && (
            <Link href="/admin" className="text-sm font-medium text-ocean-600 hover:text-ocean-700 transition-colors">
              Admin
            </Link>
          )}
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

        {/* Mobile hamburger */}
        <button
          className="sm:hidden flex flex-col justify-center items-center w-10 h-10 gap-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <span className={`block h-0.5 w-6 bg-gray-700 transition-transform duration-200 ${menuOpen ? 'translate-y-2 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition-opacity duration-200 ${menuOpen ? 'opacity-0' : ''}`} />
          <span className={`block h-0.5 w-6 bg-gray-700 transition-transform duration-200 ${menuOpen ? '-translate-y-2 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden border-t border-gray-100 bg-white shadow-lg">
          <div className="flex flex-col px-4 py-3 gap-1">
            <Link
              href="/book"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Book
            </Link>
            <Link
              href="/appointments"
              onClick={() => setMenuOpen(false)}
              className="rounded-lg px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              My Appointments
            </Link>
            {isAdmin && (
              <Link
                href="/admin"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium text-ocean-600 hover:bg-gray-50 transition-colors"
              >
                Admin
              </Link>
            )}
            <div className="mt-2 pt-2 border-t border-gray-100">
              {loading ? (
                <span className="block h-10 animate-pulse rounded-lg bg-gray-100" />
              ) : user ? (
                <button
                  onClick={handleSignOut}
                  className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors text-left"
                >
                  Sign out
                </button>
              ) : (
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="block rounded-lg bg-brand-500 px-4 py-3 text-sm font-semibold text-white text-center hover:bg-brand-600 transition-colors"
                >
                  Sign in
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
