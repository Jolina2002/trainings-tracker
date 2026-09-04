export type ID = string;

export type Sex = 'f' | 'm';

export interface Profile {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activity: number;      // PAL-Faktor
  deficitKcal: number;   // taegliches Defizit
}

export interface Targets {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  water: number;   // ml
  steps: number;
}

export type TargetKey = keyof Targets;

export interface Exercise {
  id: ID;
  name: string;
  sets: string;
  reps: string;
  note?: string;
}

export interface Session {
  id: ID;
  name: string;
  emoji: string;
  durationMin: string;
  goal?: string;
  exercises: Exercise[];
}

export type DayKind = 'rest' | 'gym' | 'sport';

export interface DayPlan {
  title: string;
  kind: DayKind;
  sessionId: ID | null;
}

export interface FoodItem {
  id: ID;
  name: string;
  portion: string;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Settings {
  profile: Profile;
  targets: Targets;
  /** Overrides je Wochentag, Index 0 = Montag */
  weekdayTargets: Partial<Targets>[];
  /** Wochenplan, Index 0 = Montag */
  week: DayPlan[];
  sessions: Session[];
  meals: string[];
  foods: FoodItem[];
}

export interface FoodEntry {
  id: ID;
  meal: string;
  name: string;
  portion: string;
  amount: number;   // Anzahl Portionen
  kcal: number;     // Werte je 1 Portion
  protein: number;
  carbs: number;
  fat: number;
}

export interface SetLog {
  reps: string;
  weight: string;
}

export interface ExerciseLog {
  done: boolean;
  sets: SetLog[];
}

export type TrainingStatus = 'open' | 'done' | 'skipped';

export interface TrainingLog {
  id: ID;
  sessionId: ID | null;
  title: string;
  emoji: string;
  status: TrainingStatus;
  durationMin: string;
  rpe: number | null;
  note: string;
  ex: Record<ID, ExerciseLog>;
}

export interface DayLog {
  food: FoodEntry[];
  water: number;
  steps: number;
  weight: number | null;
  trainings: TrainingLog[];
  /** true, sobald der Nutzer die Trainings des Tages angefasst hat */
  planMaterialized?: boolean;
}

export interface AppState {
  v: number;
  settings: Settings;
  days: Record<string, DayLog>;
}
