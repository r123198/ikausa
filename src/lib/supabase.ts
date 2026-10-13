import '@/lib/install-storage';

import { createClient } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Static web rendering runs in Node, where there is no localStorage to persist into.
const isServer = Platform.OS === 'web' && typeof window === 'undefined';

export const supabase = createClient(
  supabaseUrl ?? 'http://localhost',
  supabaseKey ?? 'missing-key',
  {
    auth: {
      storage: isServer ? undefined : localStorage,
      autoRefreshToken: true,
      persistSession: !isServer,
      detectSessionInUrl: false,
    },
  }
);

// Only refresh tokens while the app is in the foreground.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
