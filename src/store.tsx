import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext, useCallback, useContext, useEffect, useMemo, useRef, useState,
} from 'react';
import { emptyDay, initialState } from './defaults';
import {
  AppState, DayLog, Settings, Targets, TrainingLog,
} from './types';
import { fromKey, uid, weekdayIdx } from './util';

const KEY = 'badminton-tracker/v1';

interface Store {
  ready: boolean;
  state: AppState;
  settings: Settings;
  setState: (fn: (s: AppState) => AppState) => void;
  setSettings: (fn: (s: Settings) => Settings) => void;
  getDay: (key: string) => DayLog;
  setDay: (key: string, fn: (d: DayLog) => DayLog) => void;
  /** Tagesziele inkl. Wochentag-Overrides */
  targetsFor: (key: string) => Targets;
  /** Trainings des Tages – bei Bedarf virtuell aus dem Wochenplan */
  trainingsFor: (key: string) => TrainingLog[];
  setTrainings: (key: string, fn: (t: TrainingLog[]) => TrainingLog[]) => void;
  resetAll: () => void;
}

const Ctx = createContext<Store | null>(null);

/** Fehlende Felder aus alten/kaputten Daten auffüllen */
export function normalizeState(loaded: any): AppState {
  if (!loaded || typeof loaded !== 'object') return initialState;
  const s = loaded.settings ?? {};
  return {
    v: 1,
    settings: {
      profile: { ...initialState.settings.profile, ...(s.profile ?? {}) },
      targets: { ...initialState.settings.targets, ...(s.targets ?? {}) },
      weekdayTargets: Array.isArray(s.weekdayTargets) && s.weekdayTargets.length === 7
        ? s.weekdayTargets
        : initialState.settings.weekdayTargets,
      week: Array.isArray(s.week) && s.week.length === 7 ? s.week : initialState.settings.week,
      sessions: Array.isArray(s.sessions) ? s.sessions : initialState.settings.sessions,
      meals: Array.isArray(s.meals) && s.meals.length ? s.meals : initialState.settings.meals,
      foods: Array.isArray(s.foods) ? s.foods : initialState.settings.foods,
    },
    days: loaded.days && typeof loaded.days === 'object' ? loaded.days : {},
  };
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setRaw] = useState<AppState>(initialState);
  const [ready, setReady] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (!alive) return;
        if (raw) setRaw(normalizeState(JSON.parse(raw)));
      })
      .catch(() => undefined)
      .finally(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);

  // gedrosselt speichern
  useEffect(() => {
    if (!ready) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      AsyncStorage.setItem(KEY, JSON.stringify(state)).catch(() => undefined);
    }, 350);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [state, ready]);

  const setState = useCallback((fn: (s: AppState) => AppState) => setRaw(fn), []);

  const setSettings = useCallback(
    (fn: (s: Settings) => Settings) =>
      setRaw((s) => ({ ...s, settings: fn(s.settings) })),
    [],
  );

  const getDay = useCallback(
    (key: string): DayLog => ({ ...emptyDay(), ...(state.days[key] ?? {}) }),
    [state.days],
  );

  const setDay = useCallback(
    (key: string, fn: (d: DayLog) => DayLog) =>
      setRaw((s) => {
        const cur: DayLog = { ...emptyDay(), ...(s.days[key] ?? {}) };
        return { ...s, days: { ...s.days, [key]: fn(cur) } };
      }),
    [],
  );

  const targetsFor = useCallback(
    (key: string): Targets => {
      const wd = weekdayIdx(fromKey(key));
      const over = state.settings.weekdayTargets[wd] ?? {};
      return { ...state.settings.targets, ...over };
    },
    [state.settings.targets, state.settings.weekdayTargets],
  );

  /** Aus dem Wochenplan ein Trainings-Log bauen */
  const fromPlan = useCallback(
    (key: string, settings: Settings): TrainingLog[] => {
      const plan = settings.week[weekdayIdx(fromKey(key))];
      if (!plan || plan.kind === 'rest') return [];
      const session = settings.sessions.find((x) => x.id === plan.sessionId) ?? null;
      return [
        {
          id: 'plan-' + key,
          sessionId: session?.id ?? null,
          title: plan.title || session?.name || 'Training',
          emoji: session?.emoji ?? '🏃',
          status: 'open',
          durationMin: session?.durationMin ?? '',
          rpe: null,
          note: '',
          ex: {},
        },
      ];
    },
    [],
  );

  const trainingsFor = useCallback(
    (key: string): TrainingLog[] => {
      const d = state.days[key];
      if (d?.planMaterialized) return d.trainings ?? [];
      return fromPlan(key, state.settings);
    },
    [state.days, state.settings, fromPlan],
  );

  const setTrainings = useCallback(
    (key: string, fn: (t: TrainingLog[]) => TrainingLog[]) =>
      setRaw((s) => {
        const cur: DayLog = { ...emptyDay(), ...(s.days[key] ?? {}) };
        const base = cur.planMaterialized ? cur.trainings : fromPlan(key, s.settings);
        return {
          ...s,
          days: {
            ...s.days,
            [key]: { ...cur, planMaterialized: true, trainings: fn(base) },
          },
        };
      }),
    [fromPlan],
  );

  const resetAll = useCallback(() => setRaw({ ...initialState, days: {} }), []);

  const value = useMemo<Store>(
    () => ({
      ready,
      state,
      settings: state.settings,
      setState,
      setSettings,
      getDay,
      setDay,
      targetsFor,
      trainingsFor,
      setTrainings,
      resetAll,
    }),
    [ready, state, setState, setSettings, getDay, setDay, targetsFor, trainingsFor, setTrainings, resetAll],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useStore muss innerhalb von <StoreProvider> genutzt werden');
  return ctx;
}

export const newTraining = (title: string, emoji = '🏃'): TrainingLog => ({
  id: uid(),
  sessionId: null,
  title,
  emoji,
  status: 'open',
  durationMin: '',
  rpe: null,
  note: '',
  ex: {},
});
