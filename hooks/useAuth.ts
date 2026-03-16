'use client';

import { useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { UserProfile, UserRole } from '@/types';

interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
}

interface SignUpOptions {
  email: string;
  password: string;
  fullName: string;
  /** Defaults to 'customer' — barbers/admins are promoted manually */
  role?: UserRole;
}

interface SignInOptions {
  email: string;
  password: string;
}

/** Fetches the profile row for a given user id. Returns null on error. */
async function fetchProfile(userId: string): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('[useAuth] fetchProfile error:', error.message);
    return null;
  }
  return data as UserProfile;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    loading: true,
  });

  useEffect(() => {
    // Hydrate from the current session on mount
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await fetchProfile(session.user.id);
        setState({ user: session.user, profile, loading: false });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    // Keep in sync with auth state changes (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          const profile = await fetchProfile(session.user.id);
          setState({ user: session.user, profile, loading: false });
        } else {
          setState({ user: null, profile: null, loading: false });
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async ({ email, password }: SignInOptions) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;

    const profile = data.user ? await fetchProfile(data.user.id) : null;
    return { user: data.user, profile };
  }, []);

  /**
   * Returns { user, profile, emailConfirmationRequired }.
   * emailConfirmationRequired is true when Supabase is configured to require
   * email verification before the session is established.
   */
  const signUp = useCallback(
    async ({ email, password, fullName, role = 'customer' }: SignUpOptions) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName, role },
        },
      });
      if (error) throw error;

      const emailConfirmationRequired = !!data.user && !data.session;
      const profile =
        data.user && data.session ? await fetchProfile(data.user.id) : null;

      return { user: data.user, profile, emailConfirmationRequired };
    },
    []
  );

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  return {
    user: state.user,
    profile: state.profile,
    loading: state.loading,
    signIn,
    signUp,
    signOut,
  };
}
