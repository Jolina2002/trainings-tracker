export const WD_SHORT = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
export const WD_LONG = [
  'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag', 'Sonntag',
];

let counter = 0;
export const uid = (): string =>
  Date.now().toString(36) + '-' + (counter++).toString(36) + Math.random().toString(36).slice(2, 6);

const pad = (n: number) => String(n).padStart(2, '0');

export const dateKey = (d: Date): string =>
  `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

export const fromKey = (key: string): Date => {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/** Montag = 0 ... Sonntag = 6 */
export const weekdayIdx = (d: Date): number => (d.getDay() + 6) % 7;

export const addDays = (d: Date, n: number): Date => {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
};

export const startOfWeek = (d: Date): Date => addDays(d, -weekdayIdx(d));

export const todayKey = (): string => dateKey(new Date());

export const shortDate = (d: Date): string => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.`;

/** "Heute", "Gestern", "Morgen" oder "Mi, 04.09." */
export const dayLabel = (key: string): string => {
  const d = fromKey(key);
  const diff = Math.round(
    (d.getTime() - fromKey(todayKey()).getTime()) / 86400000,
  );
  if (diff === 0) return 'Heute';
  if (diff === -1) return 'Gestern';
  if (diff === 1) return 'Morgen';
  return `${WD_SHORT[weekdayIdx(d)]}, ${shortDate(d)}`;
};

/** Text -> Zahl, akzeptiert Komma als Dezimaltrenner */
export const num = (v: string | number | null | undefined): number => {
  if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
  if (v == null) return 0;
  const parsed = parseFloat(String(v).replace(',', '.').replace(/[^0-9.\-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

export const r0 = (n: number): number => Math.round(n);
export const r1 = (n: number): number => Math.round(n * 10) / 10;

/** Zahl huebsch ausgeben: 12,5 statt 12.5 und 13 statt 13.0 */
export const fmt = (n: number, decimals = 0): string => {
  const v = decimals === 0 ? Math.round(n) : Math.round(n * 10 ** decimals) / 10 ** decimals;
  return String(v).replace('.', ',');
};

export const clamp = (n: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, n));

/** Mifflin-St Jeor */
export const bmr = (sex: 'f' | 'm', weightKg: number, heightCm: number, age: number): number =>
  10 * weightKg + 6.25 * heightCm - 5 * age + (sex === 'm' ? 5 : -161);

export const kcalFromMacros = (protein: number, carbs: number, fat: number): number =>
  protein * 4 + carbs * 4 + fat * 9;

/** 2150 -> "2.150" */
export const fmtInt = (n: number): string => {
  const v = Math.round(n);
  const sign = v < 0 ? '-' : '';
  return sign + Math.abs(v).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};
