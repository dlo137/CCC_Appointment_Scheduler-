'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { UserRole } from '@/types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** When provided, redirects to /unauthorized if the user's role doesn't match. */
  requiredRole?: UserRole;
}

export default function ProtectedRoute({
  children,
  requiredRole,
}: ProtectedRouteProps) {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/login');
      return;
    }

    if (requiredRole && profile?.role !== requiredRole) {
      // Admins can access any role-restricted page
      if (profile?.role !== 'admin') {
        router.replace('/unauthorized');
      }
    }
  }, [loading, user, profile, requiredRole, router]);

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center">
        <span className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
      </div>
    );
  }

  // Render nothing while redirect is in-flight
  if (!user) return null;
  if (requiredRole && profile?.role !== requiredRole && profile?.role !== 'admin') {
    return null;
  }

  return <>{children}</>;
}
