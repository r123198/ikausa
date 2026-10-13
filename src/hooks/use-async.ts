import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

interface AsyncState<T> {
  data: T | undefined;
  error: string | null;
  isLoading: boolean;
  reload: () => void;
}

/**
 * Runs `load` whenever the screen gains focus (so data is fresh after
 * navigating back) and exposes loading / error state.
 */
export function useFocusedAsync<T>(load: () => Promise<T>, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const requestId = useRef(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(load, deps);

  const reload = useCallback(() => {
    const id = ++requestId.current;
    setIsLoading(true);
    run()
      .then((result) => {
        if (id !== requestId.current) return;
        setData(result);
        setError(null);
      })
      .catch((e: unknown) => {
        if (id !== requestId.current) return;
        console.error(e);
        setError(errorMessage(e));
      })
      .finally(() => {
        if (id === requestId.current) setIsLoading(false);
      });
  }, [run]);

  useFocusEffect(reload);

  return { data, error, isLoading, reload };
}

/** Supabase errors are plain objects with a message, not always Error instances. */
export function errorMessage(e: unknown): string {
  if (e && typeof e === 'object' && 'message' in e && typeof e.message === 'string') {
    return e.message;
  }
  return 'Something went wrong';
}
