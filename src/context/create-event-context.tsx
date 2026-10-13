import React, { useCallback, useMemo, useSyncExternalStore } from 'react';

import { PRESET_COVERS } from '@/constants/covers';
import type { ExportDays, NewEventInput, RevealOption } from '@/lib/events';
import { DEFAULT_FILM_ID } from '@/lib/film/films';

/** Pass id used until the user picks a paid one; matches the `passes` table. */
export const FREE_PASS_ID = 'free';

export interface ShotOption {
  id: string;
  value: number | 'unlimited';
}

export const SHOT_OPTIONS: ShotOption[] = [
  { id: '5', value: 5 },
  { id: '10', value: 10 },
  { id: '16', value: 16 },
  { id: '24', value: 24 },
  { id: '36', value: 36 },
  { id: 'unlimited', value: 'unlimited' },
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
  passId: string;
  shotOptionId: string;
  everyoneCanSee: boolean;
  cameraId: string;
  exportDays: ExportDays;
  cover: CoverChoice;
}

const getInitialDate = (): FinishDate => {
  const d = new Date();
  return { year: d.getFullYear(), month: d.getMonth(), day: d.getDate() };
};

const defaultEventState: CreateEventState = {
  name: '',
  finishDate: getInitialDate(),
  finishTime: { hour: '11', minute: '59', period: 'PM' },
  revealOption: 'during',
  passId: FREE_PASS_ID,
  shotOptionId: '24',
  everyoneCanSee: true,
  cameraId: DEFAULT_FILM_ID,
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
  globalEventState = { ...defaultEventState, finishDate: getInitialDate() };
  notifyListeners();
}

export interface CreateEventContextType extends CreateEventState {
  setName: (name: string) => void;
  setFinishDate: (date: FinishDate) => void;
  setFinishTime: (time: FinishTime) => void;
  setRevealOption: (option: RevealOption) => void;
  setPassId: (id: string) => void;
  setShotOptionId: (id: string) => void;
  setEveryoneCanSee: (val: boolean) => void;
  setCameraId: (id: string) => void;
  setExportDays: (days: ExportDays) => void;
  setCover: (cover: CoverChoice) => void;

  // Derived values
  endsAt: Date;
  selectedShot: ShotOption;
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

  const setName = useCallback((name: string) => updateCreateEventState({ name }), []);
  const setFinishDate = useCallback(
    (finishDate: FinishDate) => updateCreateEventState({ finishDate }),
    []
  );
  const setFinishTime = useCallback(
    (finishTime: FinishTime) => updateCreateEventState({ finishTime }),
    []
  );
  const setRevealOption = useCallback(
    (revealOption: RevealOption) => updateCreateEventState({ revealOption }),
    []
  );
  const setPassId = useCallback((passId: string) => updateCreateEventState({ passId }), []);
  const setShotOptionId = useCallback(
    (shotOptionId: string) => updateCreateEventState({ shotOptionId }),
    []
  );
  const setEveryoneCanSee = useCallback(
    (everyoneCanSee: boolean) => updateCreateEventState({ everyoneCanSee }),
    []
  );
  const setCameraId = useCallback((cameraId: string) => updateCreateEventState({ cameraId }), []);
  const setExportDays = useCallback(
    (exportDays: ExportDays) => updateCreateEventState({ exportDays }),
    []
  );
  const setCover = useCallback((cover: CoverChoice) => updateCreateEventState({ cover }), []);
  const reset = useCallback(() => resetCreateEventState(), []);

  const endsAt = useMemo(() => {
    const hour12 = (parseInt(state.finishTime.hour, 10) || 12) % 12;
    const hour24 = state.finishTime.period === 'PM' ? hour12 + 12 : hour12;
    const minute = parseInt(state.finishTime.minute, 10) || 0;
    const { year, month, day } = state.finishDate;
    return new Date(year, month, day, hour24, minute);
  }, [state.finishDate, state.finishTime]);

  const selectedShot = useMemo(
    () => SHOT_OPTIONS.find((s) => s.id === state.shotOptionId) || SHOT_OPTIONS[3],
    [state.shotOptionId]
  );

  return {
    ...state,
    setName,
    setFinishDate,
    setFinishTime,
    setRevealOption,
    setPassId,
    setShotOptionId,
    setEveryoneCanSee,
    setCameraId,
    setExportDays,
    setCover,
    endsAt,
    selectedShot,
    reset,
  };
}

export function CreateEventProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
