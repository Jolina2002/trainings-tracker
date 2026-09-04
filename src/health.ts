import { fmt, fmtInt, num } from './util';

/** Was ein Kurzbefehl an die App übergeben kann. */
export interface HealthImport {
  date?: string;    // YYYY-MM-DD
  steps?: number;
  weight?: number;
  water?: number;   // ml
}

const KEYS: Record<string, keyof HealthImport> = {
  schritte: 'steps', schritt: 'steps', steps: 'steps', step: 'steps',
  gewicht: 'weight', weight: 'weight', kg: 'weight', koerpergewicht: 'weight',
  wasser: 'water', water: 'water', trinken: 'water', fluessigkeit: 'water',
  datum: 'date', date: 'date', tag: 'date',
};

const normalizeKey = (k: string): string =>
  k.trim().toLowerCase()
    .replace(/ä/g, 'a').replace(/ö/g, 'o').replace(/ü/g, 'u').replace(/ß/g, 'ss')
    .replace(/[^a-z]/g, '');

const pad = (s: string) => s.padStart(2, '0');

const parseDate = (v: string): string | undefined => {
  const iso = v.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (iso) return `${iso[1]}-${pad(iso[2])}-${pad(iso[3])}`;
  const de = v.match(/(\d{1,2})\.(\d{1,2})\.(\d{2,4})/);
  if (de) {
    const year = de[3].length === 2 ? `20${de[3]}` : de[3];
    return `${year}-${pad(de[2])}-${pad(de[1])}`;
  }
  return undefined;
};

/**
 * Liest den Text, den der Kurzbefehl in die Zwischenablage legt.
 * Tolerant gegenüber Trennzeichen, Reihenfolge, Groß-/Kleinschreibung
 * und deutschem Dezimalkomma:
 *
 *   schritte=8123
 *   gewicht: 88,4 kg
 *   wasser = 2,5 l ; datum=04.09.2026
 */
export function parseHealthText(input: string): HealthImport {
  const out: HealthImport = {};
  for (const line of input.split(/[\n;]+/)) {
    const match = line.match(/^\s*([^=:]+)[=:]\s*(.+?)\s*$/);
    if (!match) continue;

    const key = KEYS[normalizeKey(match[1])];
    if (!key) continue;
    const raw = match[2];

    if (key === 'date') {
      const date = parseDate(raw);
      if (date) out.date = date;
      continue;
    }

    let value = num(raw);
    if (!Number.isFinite(value) || value <= 0) continue;

    if (key === 'water') {
      // "2,5 l" -> ml. "2500 ml" bleibt, weil vor dem l ein m steht.
      if (/(^|[^m])l\b/i.test(raw)) value *= 1000;
      else if (value <= 20) value *= 1000;   // Liter ohne Einheit
    }
    out[key] = value;
  }
  return out;
}

export interface ImportRow {
  label: string;
  value: string;
}

/** Was übernommen würde – beschriftet, damit die Vorschau lesbar bleibt. */
export const describeImport = (p: HealthImport): ImportRow[] => {
  const rows: ImportRow[] = [];
  if (p.steps != null) rows.push({ label: 'Schritte', value: fmtInt(p.steps) });
  if (p.weight != null) rows.push({ label: 'Gewicht', value: `${fmt(p.weight, 1)} kg` });
  if (p.water != null) rows.push({ label: 'Trinkmenge', value: `${fmtInt(p.water)} ml` });
  return rows;
};
