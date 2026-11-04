import { createContext, useContext } from 'react';

import type { OrganizerStatus } from '@/lib/studio';

interface StudioContextValue {
  status: OrganizerStatus;
  /** Re-reads organizer status, e.g. right after an invite is redeemed. */
  reloadStatus: () => Promise<void>;
}

export const StudioContext = createContext<StudioContextValue | null>(null);

export function useStudio(): StudioContextValue {
  const value = useContext(StudioContext);
  if (!value) throw new Error('useStudio must be used inside the studio layout');
  return value;
}
