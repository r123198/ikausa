import React, { useCallback, useMemo, useSyncExternalStore } from 'react';

import { PRESET_COVERS } from '@/constants/covers';
import type { ExportDays, NewEventInput, RevealOption } from '@/lib/events';

export const USD_TO_PHP_RATE = 62;

export function formatPhpPrice(usd: number): string {
  if (usd === 0) return 'Free';
  const php = Math.ceil(usd * USD_TO_PHP_RATE) - 0.01;
  return `₱${php.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export interface ParticipantTier {
  id: string;
  count: number | 'unlimited';
  displayCount: string;
  title: string;
  usdPrice: number;
  priceFormatted: string;
  isFree: boolean;
}

export const PARTICIPANT_TIERS: ParticipantTier[] = [
  {
    id: '5',
    count: 5,
    displayCount: '5',
    title: 'Up to\n5 Participants',
    usdPrice: 0,
    priceFormatted: 'Free',
    isFree: true,
  },
  {
    id: '10',
    count: 10,
    displayCount: '10',
    title: 'Up to\n10 Participants',
    usdPrice: 1.99,
    priceFormatted: formatPhpPrice(1.99),
    isFree: false,
  },
  {
    id: '25',
    count: 25,
    displayCount: '25',
    title: 'Up to\n25 Participants',
    usdPrice: 4.99,
    priceFormatted: formatPhpPrice(4.99),
    isFree: false,
  },
  {
    id: '50',
    count: 50,
    displayCount: '50',
    title: 'Up to\n50 Participants',
    usdPrice: 14.99,
    priceFormatted: formatPhpPrice(14.99),
    isFree: false,
  },
  {
    id: '100',
    count: 100,
    displayCount: '100',
    title: 'Up to\n100 Participants',
    usdPrice: 29.99,
    priceFormatted: formatPhpPrice(29.99),
    isFree: false,
  },
  {
    id: '150',
    count: 150,
    displayCount: '150',
    title: 'Up to\n150 Participants',
    usdPrice: 49.99,
    priceFormatted: formatPhpPrice(49.99),
    isFree: false,
  },
  {
    id: '200',
    count: 200,
    displayCount: '200',
    title: 'Up to\n200 Participants',
    usdPrice: 69.99,
    priceFormatted: formatPhpPrice(69.99),
    isFree: false,
  },
  {
    id: 'unlimited',
    count: 'unlimited',
    displayCount: '∞',
    title: 'Unlimited\nParticipants',
    usdPrice: 99.99,
    priceFormatted: formatPhpPrice(99.99),
    isFree: false,
  },
];

export interface ShotOption {
  id: string;
  value: number | 'unlimited';
  label: string;
  usdPrice: number;
  priceFormatted: string;
  isFree: boolean;
}

export const SHOT_OPTIONS: ShotOption[] = [
  { id: '5', value: 5, label: '5', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '10', value: 10, label: '10', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '16', value: 16, label: '16', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '24', value: 24, label: '24', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  { id: '36', value: 36, label: '36', usdPrice: 0, priceFormatted: 'Free', isFree: true },
  {
    id: 'unlimited',
    value: 'unlimited',
    label: '∞',
    usdPrice: 9.99,
    priceFormatted: formatPhpPrice(9.99),
    isFree: false,
  },
];

export interface CameraOption {
  id: string;
  name: string;
  label: string;
  desc: string;
  shots: number;
  usdPrice: number;
  priceFormatted: string;
  image: any;
}

export const CAMERAS: CameraOption[] = [
  {
    id: 'disposable',
    name: 'Disposable',
    label: 'Classic',
    desc: 'Authentic grainy film look with flash',
    shots: 27,
    usdPrice: 0,
    priceFormatted: 'Free',
    image: require('@/assets/images/samples/trvl_1.jpg'),
  },
  {
    id: 'polaroid',
    name: 'Polaroid',
    label: 'Instant',
    desc: 'Square format with border and faded tones',
    shots: 10,
    usdPrice: 0,
    priceFormatted: 'Free',
    image: require('@/assets/images/samples/trvl_2.jpg'),
  },
  {
    id: 'pinhole',
    name: 'Pinhole',
    label: 'Artistic',
    desc: 'Dreamy vignette with long exposure look',
    shots: 12,
    usdPrice: 0,
    priceFormatted: 'Free',
    image: require('@/assets/images/samples/trvl_3.jpg'),
  },
];

export const MONTH_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export type { RevealOption };

export interface ExportOption {
  days: ExportDays;
  label: string;
  desc: string;
}

export const EXPORT_OPTIONS: ExportOption[] = [
  { days: 7, label: '7 days', desc: 'A quick week to save your favourites' },
  { days: 30, label: '30 days', desc: 'A month for everyone to download' },
  { days: 90, label: '90 days', desc: 'Plenty of time, great for big events' },
];

export type CoverChoice = NewEventInput['cover'];

export const REVEAL_LABELS: Record<RevealOption, string> = {
  during: 'During event',
  after: 'After event',
  delay: 'Additional delay',
};

export interface FinishDate {
  year: number;
  month: number;
  day: number;
}

export interface FinishTime {
  hour: string;
  minute: string;
  period: 'AM' | 'PM';
}

export interface CreateEventState {
  name: string;
  finishDate: FinishDate;
  finishTime: FinishTime;
  revealOption: RevealOption;
  participantTierId: string;
  shotOptionId: string;
  everyoneCanSee: boolean;
  cameraId: string;
  exportDays: ExportDays;
  cover: CoverChoice;
}

const getInitialDate = (): FinishDate => {
  const d = new Date();
  return {
    year: d.getFullYear(),
    month: d.getMonth(),
    day: d.getDate(),
  };
};

const defaultEventState: CreateEventState = {
  name: '',
  finishDate: getInitialDate(),
  finishTime: {
    hour: '11',
    minute: '59',
    period: 'PM',
  },
  revealOption: 'during',
  participantTierId: '5',
  shotOptionId: '24',
  everyoneCanSee: true,
  cameraId: 'disposable',
  exportDays: 30,
  cover: { kind: 'preset', id: PRESET_COVERS[0].id },
};

// Singleton in-memory store that survives navigation transitions and layout re-mounts
let globalEventState: CreateEventState = { ...defaultEventState };
const listeners = new Set<() => void>();

function notifyListeners() {
  listeners.forEach((listener) => {
    try {
      listener();
    } catch (e) {
      console.error('Error notifying event state listener:', e);
    }
  });
}

export function getCreateEventState(): CreateEventState {
  return globalEventState;
}

export function updateCreateEventState(partial: Partial<CreateEventState>) {
  globalEventState = { ...globalEventState, ...partial };
  notifyListeners();
}

export function resetCreateEventState() {
  globalEventState = {
    ...defaultEventState,
    finishDate: getInitialDate(),
  };
  notifyListeners();
}

export interface CreateEventContextType extends CreateEventState {
  setName: (name: string) => void;
  setFinishDate: (date: FinishDate) => void;
  setFinishTime: (time: FinishTime) => void;
  setRevealOption: (option: RevealOption) => void;
  setParticipantTierId: (id: string) => void;
  setShotOptionId: (id: string) => void;
  setEveryoneCanSee: (val: boolean) => void;
  setCameraId: (id: string) => void;
  setExportDays: (days: ExportDays) => void;
  setCover: (cover: CoverChoice) => void;

  // Derived values
  formattedName: string;
  formattedCloses: string;
  endsAt: Date;
  selectedExport: ExportOption;
  revealLabel: string;
  selectedCamera: CameraOption;
  selectedParticipant: ParticipantTier;
  selectedShot: ShotOption;
  totalUsd: number;
  totalPhpFormatted: string;
  isFree: boolean;
  reset: () => void;
}

export function useCreateEvent(): CreateEventContextType {
  const state = useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => {
        listeners.delete(callback);
      };
    },
    () => globalEventState,
    () => globalEventState
  );

  const setName = useCallback((name: string) => {
    updateCreateEventState({ name });
  }, []);

  const setFinishDate = useCallback((finishDate: FinishDate) => {
    updateCreateEventState({ finishDate });
  }, []);

  const setFinishTime = useCallback((finishTime: FinishTime) => {
    updateCreateEventState({ finishTime });
  }, []);

  const setRevealOption = useCallback((revealOption: RevealOption) => {
    updateCreateEventState({ revealOption });
  }, []);

  const setParticipantTierId = useCallback((participantTierId: string) => {
    updateCreateEventState({ participantTierId });
  }, []);

  const setShotOptionId = useCallback((shotOptionId: string) => {
    updateCreateEventState({ shotOptionId });
  }, []);

  const setEveryoneCanSee = useCallback((everyoneCanSee: boolean) => {
    updateCreateEventState({ everyoneCanSee });
  }, []);

  const setCameraId = useCallback((cameraId: string) => {
    updateCreateEventState({ cameraId });
  }, []);

  const setExportDays = useCallback((exportDays: ExportDays) => {
    updateCreateEventState({ exportDays });
  }, []);

  const setCover = useCallback((cover: CoverChoice) => {
    updateCreateEventState({ cover });
  }, []);

  const reset = useCallback(() => {
    resetCreateEventState();
  }, []);

  const formattedName = useMemo(() => {
    const trimmed = (state.name || '').trim();
    return trimmed.length > 0 ? trimmed : 'Your roll';
  }, [state.name]);

  const formattedCloses = useMemo(() => {
    const month = MONTH_SHORT[state.finishDate.month] || 'Jan';
    const h = parseInt(state.finishTime.hour, 10) || 12;
    const m = (parseInt(state.finishTime.minute, 10) || 0)
      .toString()
      .padStart(2, '0');
    return `${month} ${state.finishDate.day}, ${state.finishDate.year} · ${h}:${m} ${state.finishTime.period}`;
  }, [state.finishDate, state.finishTime]);

  const endsAt = useMemo(() => {
    const hour12 = (parseInt(state.finishTime.hour, 10) || 12) % 12;
    const hour24 = state.finishTime.period === 'PM' ? hour12 + 12 : hour12;
    const minute = parseInt(state.finishTime.minute, 10) || 0;
    const { year, month, day } = state.finishDate;
    return new Date(year, month, day, hour24, minute);
  }, [state.finishDate, state.finishTime]);

  const selectedExport = useMemo(() => {
    return EXPORT_OPTIONS.find((o) => o.days === state.exportDays) || EXPORT_OPTIONS[1];
  }, [state.exportDays]);

  const revealLabel = useMemo(() => {
    return REVEAL_LABELS[state.revealOption] || 'During event';
  }, [state.revealOption]);

  const selectedCamera = useMemo(() => {
    return CAMERAS.find((c) => c.id === state.cameraId) || CAMERAS[0];
  }, [state.cameraId]);

  const selectedParticipant = useMemo(() => {
    return (
      PARTICIPANT_TIERS.find((p) => p.id === state.participantTierId) ||
      PARTICIPANT_TIERS[0]
    );
  }, [state.participantTierId]);

  const selectedShot = useMemo(() => {
    return (
      SHOT_OPTIONS.find((s) => s.id === state.shotOptionId) ||
      SHOT_OPTIONS[3]
    );
  }, [state.shotOptionId]);

  const totalUsd = useMemo(() => {
    return (
      (selectedParticipant.usdPrice || 0) +
      (selectedShot.usdPrice || 0) +
      (selectedCamera.usdPrice || 0)
    );
  }, [selectedParticipant, selectedShot, selectedCamera]);

  const totalPhpFormatted = useMemo(() => {
    if (totalUsd === 0) return '₱0.00';
    return formatPhpPrice(totalUsd);
  }, [totalUsd]);

  const isFree = totalUsd === 0;

  return {
    ...state,
    setName,
    setFinishDate,
    setFinishTime,
    setRevealOption,
    setParticipantTierId,
    setShotOptionId,
    setEveryoneCanSee,
    setCameraId,
    setExportDays,
    setCover,
    formattedName,
    formattedCloses,
    endsAt,
    selectedExport,
    revealLabel,
    selectedCamera,
    selectedParticipant,
    selectedShot,
    totalUsd,
    totalPhpFormatted,
    isFree,
    reset,
  };
}

export function CreateEventProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
