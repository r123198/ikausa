import { useEffect, useState } from 'react';

const DEFAULT_TICK_MS = 30_000;

/** Current time, re-rendering every `tickMs` so time-based state (e.g. a roll ending) updates. */
export function useNow(tickMs: number = DEFAULT_TICK_MS): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(timer);
  }, [tickMs]);
  return now;
}
