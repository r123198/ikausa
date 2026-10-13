import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

import { resetCreateEventState } from '@/context/create-event-context';
import { syncPurchasesUser } from '@/lib/purchases';
import { supabase } from '@/lib/supabase';

interface AuthContextValue {
  session: Session | null;
  /** False until the stored session has been restored on launch. */
  isReady: boolean;
}

const AuthContext = createContext<AuthContextValue>({ session: null, isReady: false });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }) => setSession(data.session))
      .catch((error: unknown) => console.error('Failed to restore session', error))
      .finally(() => setIsReady(true));

    const { data } = supabase.auth.onAuthStateChange((event, next) => {
      // Don't leak one user's half-finished roll draft to the next.
      if (event === 'SIGNED_OUT') resetCreateEventState();
      setSession(next);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const userId = session?.user.id ?? null;
  useEffect(() => {
    // Purchases are attributed to this id in RevenueCat webhooks.
    syncPurchasesUser(userId);
  }, [userId]);

  return <AuthContext.Provider value={{ session, isReady }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

/** Signed-in user id. Only call from screens behind the auth guard. */
export function useUserId(): string {
  const { session } = useAuth();
  if (!session) throw new Error('useUserId called without a session');
  return session.user.id;
}
