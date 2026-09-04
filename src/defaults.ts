import { AppState, DayLog, Exercise, FoodItem, Session, Settings } from './types';

let n = 0;
const ex = (name: string, sets: string, reps: string, note?: string): Exercise => ({
  id: 'ex' + ++n,
  name,
  sets,
  reps,
  note,
});

export const defaultSessions: Session[] = [
  {
    id: 's_kraft',
    name: 'Ganzkörper-Kraft',
    emoji: '🏋️',
    durationMin: '50',
    goal: 'Grundkraft für Ausfallschritt, Sprung und Schlag',
    exercises: [
      ex('Warm-up: Mobility + leichtes Cardio', '1', '5–10 Min'),
      ex('Kniebeugen', '3', '10–12', 'Bein- & Sprungkraft'),
      ex('Ausfallschritte', '3', '10 pro Bein', 'Zentrale Bewegung im Badminton'),
      ex('Rudern (Kabelzug/Kurzhantel)', '3', '10–12', 'Rückenstabilität für die Schlagtechnik'),
      ex('Schulterdrücken oder Liegestütze', '3', '8–12', 'Kraft für Überkopfschläge/Smash'),
      ex('Plank', '3', '30–45 Sek.'),
      ex('Russian Twists', '3', '15', 'Rotationskraft = Schlagkraft'),
      ex('Cool-down: Dehnen', '1', '5 Min'),
    ],
  },
  {
    id: 's_explo',
    name: 'Explosivität & Agility',
    emoji: '⚡',
    durationMin: '50',
    goal: 'Sprünge, Richtungswechsel, Reaktion – was Badminton entscheidet',
    exercises: [
      ex('Warm-up: Einlaufen / Radfahren', '1', '3–5 Min'),
      ex('Beinschwingen vor/zurück & seitlich', '1', '10 pro Seite'),
      ex('Walking Lunges', '1', '10 pro Seite'),
      ex('Hohe Kniehebe + Anfersen', '1', 'je 20 m'),
      ex('Ankle Hops', '2', '15 Sek.', 'Aktiviert die Sehnen, Knie fast gestreckt'),
      ex('Strecksprünge (Squat Jumps)', '3', '6', 'Vertikale Sprungkraft für Smash'),
      ex('Split Squat Jumps', '3', '6 pro Seite', 'Kraft aus der Ausfallschritt-Position'),
      ex('Seitliche Sprünge (Lateral Bounds)', '3', '6 pro Seite', 'Nach der Landung 1–2 Sek. stabil stehen'),
      ex('Sprint & Stopp', '6', '10–15 m', 'Kontrolliert in die Ausfallschritt-Position abbremsen'),
      ex('Schattenbadminton mit Ansage', '4–6', '20–30 Sek.', 'Aus der Mitte in die angesagte Ecke und zurück'),
      ex('4-Ecken-Touch', '3–4', '20 Sek.'),
      ex('Cool-down: Dehnen (Waden, Oberschenkel, Hüftbeuger)', '1', '5 Min'),
    ],
  },
  {
    id: 's_ausdauer',
    name: 'Ausdauer-Intervalle + Core',
    emoji: '🔥',
    durationMin: '40',
    goal: 'Grundlagenausdauer + Kalorienverbrauch, ähnlich einem Ballwechsel',
    exercises: [
      ex('HIIT (Rad/Rudergerät/Laufband)', '8–10', '30 Sek. hart / 90 Sek. locker'),
      ex('Plank-Variationen', '3', '30–45 Sek.'),
      ex('Beinheben', '3', '12–15'),
      ex('Cool-down', '1', '5 Min'),
    ],
  },
  {
    id: 's_bad_frei',
    name: 'Badminton – freies Spiel',
    emoji: '🏸',
    durationMin: '90',
    goal: 'Spielpraxis, Technik im Match anwenden',
    exercises: [
      ex('Warm-up + Einschlagen', '1', '10 Min'),
      ex('Freies Spiel', '1', '60–75 Min'),
      ex('Cool-down / Dehnen', '1', '5 Min'),
    ],
  },
  {
    id: 's_bad_leistung',
    name: 'Badminton – Leistungstraining',
    emoji: '🏆',
    durationMin: '100',
    goal: 'Höchste Intensität der Woche',
    exercises: [
      ex('Warm-up + Lauf-ABC', '1', '10–15 Min'),
      ex('Technik-/Drillblock', '1', '30 Min'),
      ex('Spielformen / Matches', '1', '45 Min'),
      ex('Cool-down / Dehnen', '1', '10 Min'),
    ],
  },
];

export const defaultFoods: FoodItem[] = [
  { id: 'f1', name: 'Haferflocken', portion: '50 g', kcal: 180, protein: 6.5, carbs: 30, fat: 3.5 },
  { id: 'f2', name: 'Magerquark', portion: '250 g', kcal: 172, protein: 33, carbs: 10, fat: 0.5 },
  { id: 'f3', name: 'Skyr natur', portion: '150 g', kcal: 96, protein: 17, carbs: 6, fat: 0.3 },
  { id: 'f4', name: 'Naturjoghurt 3,5 %', portion: '150 g', kcal: 110, protein: 5, carbs: 7, fat: 5.3 },
  { id: 'f5', name: 'Heidelbeeren', portion: '100 g', kcal: 42, protein: 0.5, carbs: 7, fat: 0.3 },
  { id: 'f6', name: 'Banane', portion: '1 Stück (120 g)', kcal: 107, protein: 1.3, carbs: 24, fat: 0.2 },
  { id: 'f7', name: 'Walnüsse', portion: '30 g', kcal: 196, protein: 4.6, carbs: 2, fat: 19 },
  { id: 'f8', name: 'Hähnchenbrust (gegart)', portion: '150 g', kcal: 248, protein: 46, carbs: 0, fat: 6 },
  { id: 'f9', name: 'Tofu natur', portion: '150 g', kcal: 190, protein: 20, carbs: 3, fat: 11 },
  { id: 'f10', name: 'Lachsfilet', portion: '150 g', kcal: 310, protein: 30, carbs: 0, fat: 21 },
  { id: 'f11', name: 'Ei', portion: '1 Stück (60 g)', kcal: 84, protein: 7.5, carbs: 0.4, fat: 6 },
  { id: 'f12', name: 'Vollkornreis (gekocht)', portion: '200 g', kcal: 220, protein: 5, carbs: 45, fat: 1.8 },
  { id: 'f13', name: 'Süßkartoffel (gekocht)', portion: '200 g', kcal: 172, protein: 3.2, carbs: 36, fat: 0.2 },
  { id: 'f14', name: 'Vollkornbrot', portion: '1 Scheibe (50 g)', kcal: 110, protein: 4.5, carbs: 19, fat: 1 },
  { id: 'f15', name: 'Gemüse gemischt', portion: '200 g', kcal: 60, protein: 3, carbs: 8, fat: 0.5 },
  { id: 'f16', name: 'Blattsalat', portion: '100 g', kcal: 15, protein: 1.2, carbs: 1.5, fat: 0.2 },
  { id: 'f17', name: 'Olivenöl', portion: '1 EL (10 g)', kcal: 88, protein: 0, carbs: 0, fat: 10 },
  { id: 'f18', name: 'Whey Protein', portion: '30 g', kcal: 115, protein: 24, carbs: 2, fat: 1.5 },
];

export const defaultSettings: Settings = {
  // Neutrale Startwerte – in der App unter „Plan -> Profil & Bedarfsrechner" anpassen.
  profile: {
    sex: 'f',
    age: 30,
    heightCm: 175,
    weightKg: 75,
    activity: 1.55,
    deficitKcal: 450,
  },
  targets: {
    kcal: 2150,
    protein: 155,
    carbs: 225,
    fat: 70,
    water: 2900,
    steps: 9000,
  },
  // Kohlenhydrate verschieben statt starr verteilen (Fett gleicht die kcal aus)
  weekdayTargets: [
    { carbs: 190, fat: 86 },                 // Mo – Ruhetag
    { water: 3650 },                         // Di – Badminton
    { carbs: 260, fat: 54, water: 3650 },    // Mi – Kraft
    { water: 3650 },                         // Do – Badminton
    { carbs: 260, fat: 54, water: 3650 },    // Fr – Explosivität
    { carbs: 260, fat: 54, water: 3650 },    // Sa – Ausdauer
    { carbs: 260, fat: 54, water: 3650 },    // So – Leistungstraining
  ],
  week: [
    { title: 'Ruhetag / aktive Erholung', kind: 'rest', sessionId: null },
    { title: 'Badminton – freies Spiel', kind: 'sport', sessionId: 's_bad_frei' },
    { title: 'Ganzkörper-Kraft', kind: 'gym', sessionId: 's_kraft' },
    { title: 'Badminton – freies Spiel', kind: 'sport', sessionId: 's_bad_frei' },
    { title: 'Explosivität & Agility', kind: 'gym', sessionId: 's_explo' },
    { title: 'Ausdauer-Intervalle + Core (optional)', kind: 'gym', sessionId: 's_ausdauer' },
    { title: 'Badminton – Leistungstraining', kind: 'sport', sessionId: 's_bad_leistung' },
  ],
  sessions: defaultSessions,
  meals: ['Frühstück', 'Mittag', 'Snack', 'Abend', 'Post-Workout'],
  foods: defaultFoods,
};

export const initialState: AppState = {
  v: 1,
  settings: defaultSettings,
  days: {},
};

export const emptyDay = (): DayLog => ({
  food: [],
  water: 0,
  steps: 0,
  weight: null,
  trainings: [],
});
