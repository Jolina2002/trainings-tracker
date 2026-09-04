import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { confirm, notify } from '../dialog';
import { describeImport, parseHealthText } from '../health';
import { normalizeState, useStore } from '../store';
import { KIND_LABEL, T } from '../theme';
import { DayKind, Exercise, FoodItem, Session, Targets } from '../types';
import { Btn, Card, Chip, Field, NumEdit, Row, Sheet } from '../ui';
import { bmr, dayLabel, fmt, fmtInt, kcalFromMacros, todayKey, uid, WD_LONG } from '../util';

type Panel =
  | { k: 'profile' }
  | { k: 'targets' }
  | { k: 'weekdays' }
  | { k: 'weekday'; i: number }
  | { k: 'week' }
  | { k: 'weekplan'; i: number }
  | { k: 'sessions' }
  | { k: 'session'; id: string }
  | { k: 'meals' }
  | { k: 'foods' }
  | { k: 'food'; id: string }
  | { k: 'data' }
  | { k: 'health' };

const ACTIVITY = [
  { v: 1.2, label: 'Kaum aktiv' },
  { v: 1.375, label: 'Leicht aktiv' },
  { v: 1.55, label: 'Mäßig aktiv' },
  { v: 1.725, label: 'Sehr aktiv' },
  { v: 1.9, label: 'Extrem aktiv' },
];

const TARGET_FIELDS: { key: keyof Targets; label: string; suffix: string }[] = [
  { key: 'kcal', label: 'KALORIEN', suffix: 'kcal' },
  { key: 'protein', label: 'PROTEIN', suffix: 'g' },
  { key: 'carbs', label: 'KOHLENHYDRATE', suffix: 'g' },
  { key: 'fat', label: 'FETT', suffix: 'g' },
  { key: 'water', label: 'TRINKMENGE', suffix: 'ml' },
  { key: 'steps', label: 'SCHRITTE', suffix: 'Schritte' },
];

export default function SettingsScreen() {
  const { settings, setSettings, resetAll, state, setState, setDay } = useStore();
  const [stack, setStack] = useState<Panel[]>([]);
  const [foodQuery, setFoodQuery] = useState('');
  const [importText, setImportText] = useState('');
  const [healthText, setHealthText] = useState('');
  const [proteinPerKg, setProteinPerKg] = useState(1.7);
  const [fatPerKg, setFatPerKg] = useState(0.8);

  const top = stack[stack.length - 1] ?? null;
  const push = (p: Panel) => setStack((s) => [...s, p]);
  const pop = () => setStack((s) => s.slice(0, -1));

  const p = settings.profile;
  const base = bmr(p.sex, p.weightKg, p.heightCm, p.age);
  const tdee = base * p.activity;
  const goalKcal = Math.max(1200, tdee - p.deficitKcal);
  const calcProtein = p.weightKg * proteinPerKg;
  const calcFat = p.weightKg * fatPerKg;
  const calcCarbs = Math.max(0, (goalKcal - calcProtein * 4 - calcFat * 9) / 4);

  const applyCalc = () => {
    setSettings((s) => ({
      ...s,
      targets: {
        ...s.targets,
        kcal: Math.round(goalKcal),
        protein: Math.round(calcProtein),
        fat: Math.round(calcFat),
        carbs: Math.round(calcCarbs),
        water: Math.round((p.weightKg * 33) / 50) * 50,
      },
    }));
    notify('Übernommen', 'Deine Tagesziele wurden aktualisiert.');
  };

  const setTarget = (key: keyof Targets, v: number | null) =>
    setSettings((s) => ({ ...s, targets: { ...s.targets, [key]: v ?? 0 } }));

  const setWeekdayTarget = (i: number, key: keyof Targets, v: number | null) =>
    setSettings((s) => {
      const arr = s.weekdayTargets.map((x) => ({ ...x }));
      if (v == null) delete arr[i][key];
      else arr[i][key] = v;
      return { ...s, weekdayTargets: arr };
    });

  const updateSession = (id: string, fn: (x: Session) => Session) =>
    setSettings((s) => ({ ...s, sessions: s.sessions.map((x) => (x.id === id ? fn(x) : x)) }));

  const updateFood = (id: string, fn: (x: FoodItem) => FoodItem) =>
    setSettings((s) => ({ ...s, foods: s.foods.map((x) => (x.id === id ? fn(x) : x)) }));

  const title = (): string => {
    if (!top) return '';
    switch (top.k) {
      case 'profile': return 'Profil & Bedarf';
      case 'targets': return 'Tagesziele';
      case 'weekdays': return 'Ziele je Wochentag';
      case 'weekday': return WD_LONG[top.i];
      case 'week': return 'Wochenplan';
      case 'weekplan': return WD_LONG[top.i];
      case 'sessions': return 'Trainingseinheiten';
      case 'session': return settings.sessions.find((x) => x.id === top.id)?.name ?? 'Einheit';
      case 'meals': return 'Mahlzeiten';
      case 'foods': return 'Lebensmittel';
      case 'food': return settings.foods.find((x) => x.id === top.id)?.name ?? 'Lebensmittel';
      case 'data': return 'Daten sichern';
      case 'health': return 'Health-Import';
    }
  };

  const macroKcal = kcalFromMacros(settings.targets.protein, settings.targets.carbs, settings.targets.fat);

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <Text style={st.h1}>Einstellungen</Text>
      <Text style={st.sub}>
        Alle Werte sind Startwerte aus deinem Plan – pass sie an, sobald sich etwas ändert.
      </Text>

      <Card style={{ marginTop: 20, paddingVertical: 4 }}>
        <Row title="Profil & Bedarfsrechner" subtitle={`${fmt(p.weightKg, 1)} kg · ${p.heightCm} cm · ${p.age} J.`} onPress={() => push({ k: 'profile' })} />
        <View style={st.sep} />
        <Row title="Tagesziele" subtitle={`${fmtInt(settings.targets.kcal)} kcal · ${fmt(settings.targets.protein)} P / ${fmt(settings.targets.carbs)} KH / ${fmt(settings.targets.fat)} F`} onPress={() => push({ k: 'targets' })} />
        <View style={st.sep} />
        <Row title="Ziele je Wochentag" subtitle="Kohlenhydrate & Trinkmenge nach Belastung verschieben" onPress={() => push({ k: 'weekdays' })} />
      </Card>

      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <Row title="Wochenplan" subtitle="Welche Einheit an welchem Tag" onPress={() => push({ k: 'week' })} />
        <View style={st.sep} />
        <Row title="Trainingseinheiten" subtitle={`${settings.sessions.length} Einheiten mit Übungen`} onPress={() => push({ k: 'sessions' })} />
      </Card>

      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <Row title="Mahlzeiten" subtitle={settings.meals.join(' · ')} onPress={() => push({ k: 'meals' })} />
        <View style={st.sep} />
        <Row title="Lebensmittel" subtitle={`${settings.foods.length} Einträge in der Bibliothek`} onPress={() => push({ k: 'foods' })} />
      </Card>

      <Card style={{ marginTop: 14, paddingVertical: 4 }}>
        <Row
          title="Daten sichern"
          subtitle={`${Object.keys(state.days).length} erfasste Tage · exportieren oder wiederherstellen`}
          onPress={() => { setImportText(''); push({ k: 'data' }); }}
        />
        <View style={st.sep} />
        <Row
          title="Health-Import"
          subtitle="Schritte und Gewicht per Kurzbefehl aus Apple Health übernehmen"
          onPress={() => { setHealthText(''); push({ k: 'health' }); }}
        />
      </Card>

      <Card style={{ marginTop: 14 }}>
        <Text style={st.dangerTitle}>Zurücksetzen</Text>
        <Text style={st.dangerSub}>
          Setzt alle Einstellungen auf die Werte aus deinem Trainingsplan zurück und löscht alle erfassten Tage.
        </Text>
        <Btn
          variant="danger"
          label="Alles zurücksetzen"
          style={{ marginTop: 14 }}
          onPress={() =>
            confirm(
              'Wirklich zurücksetzen?',
              'Alle Einträge und Anpassungen gehen verloren.',
              resetAll,
              'Zurücksetzen',
              true,
            )}
        />
      </Card>

      <View style={{ height: 30 }} />

      <Sheet visible={!!top} onClose={pop} title={title()} doneLabel={stack.length > 1 ? 'Zurück' : 'Fertig'}>
        {/* ---- Profil ---- */}
        {top?.k === 'profile' && (
          <>
            <Text style={st.label}>GESCHLECHT</Text>
            <View style={st.chipWrap}>
              <Chip label="weiblich" active={p.sex === 'f'} onPress={() => setSettings((s) => ({ ...s, profile: { ...s.profile, sex: 'f' } }))} />
              <Chip label="männlich" active={p.sex === 'm'} onPress={() => setSettings((s) => ({ ...s, profile: { ...s.profile, sex: 'm' } }))} />
            </View>

            <View style={[st.duo, { marginTop: 18 }]}>
              <NumEdit label="ALTER" suffix="J." value={p.age} onCommit={(v) => setSettings((s) => ({ ...s, profile: { ...s.profile, age: v ?? 0 } }))} />
              <NumEdit label="GRÖSSE" suffix="cm" value={p.heightCm} onCommit={(v) => setSettings((s) => ({ ...s, profile: { ...s.profile, heightCm: v ?? 0 } }))} />
            </View>
            <View style={{ height: 12 }} />
            <NumEdit label="GEWICHT" suffix="kg" value={p.weightKg} onCommit={(v) => setSettings((s) => ({ ...s, profile: { ...s.profile, weightKg: v ?? 0 } }))} />

            <Text style={st.label}>AKTIVITÄT</Text>
            <View style={st.chipWrap}>
              {ACTIVITY.map((a) => (
                <Chip
                  key={a.v}
                  label={a.label}
                  active={Math.abs(p.activity - a.v) < 0.001}
                  onPress={() => setSettings((s) => ({ ...s, profile: { ...s.profile, activity: a.v } }))}
                />
              ))}
            </View>

            <View style={{ marginTop: 18 }}>
              <NumEdit
                label="TÄGLICHES DEFIZIT"
                suffix="kcal"
                value={p.deficitKcal}
                hint="450 kcal/Tag ≈ 0,4–0,5 kg pro Woche. Größere Defizite kosten bei deinem Pensum Leistung."
                onCommit={(v) => setSettings((s) => ({ ...s, profile: { ...s.profile, deficitKcal: v ?? 0 } }))}
              />
            </View>

            <View style={[st.duo, { marginTop: 18 }]}>
              <NumEdit label="PROTEIN" suffix="g/kg" value={proteinPerKg} onCommit={(v) => setProteinPerKg(v ?? 0)} />
              <NumEdit label="FETT" suffix="g/kg" value={fatPerKg} onCommit={(v) => setFatPerKg(v ?? 0)} />
            </View>

            <View style={st.calcBox}>
              <CalcRow label="Grundumsatz (BMR)" value={`${fmtInt(base)} kcal`} />
              <CalcRow label="Gesamtumsatz (TDEE)" value={`${fmtInt(tdee)} kcal`} />
              <CalcRow label="Zielkalorien" value={`${fmtInt(goalKcal)} kcal`} strong />
              <View style={st.calcDiv} />
              <CalcRow label="Protein" value={`${fmt(calcProtein)} g`} />
              <CalcRow label="Fett" value={`${fmt(calcFat)} g`} />
              <CalcRow label="Kohlenhydrate" value={`${fmt(calcCarbs)} g`} />
            </View>
            <Btn label="Als Tagesziele übernehmen" style={{ marginTop: 16 }} onPress={applyCalc} />
            <Text style={st.note}>
              Formel: Mifflin-St Jeor. Ein Rechenwert bleibt eine Schätzung – nach 2–3 Wochen
              anhand von Gewicht und Energie nachjustieren.
            </Text>
          </>
        )}

        {/* ---- Tagesziele ---- */}
        {top?.k === 'targets' && (
          <>
            {TARGET_FIELDS.map((f, i) => (
              <View key={f.key} style={{ marginTop: i === 0 ? 0 : 14 }}>
                <NumEdit
                  label={f.label}
                  suffix={f.suffix}
                  value={settings.targets[f.key]}
                  onCommit={(v) => setTarget(f.key, v)}
                />
              </View>
            ))}
            <View style={st.calcBox}>
              <CalcRow label="Makros ergeben" value={`${fmtInt(macroKcal)} kcal`} />
              <CalcRow label="Kalorienziel" value={`${fmtInt(settings.targets.kcal)} kcal`} />
              <CalcRow
                label="Differenz"
                value={`${macroKcal - settings.targets.kcal > 0 ? '+' : ''}${fmtInt(macroKcal - settings.targets.kcal)} kcal`}
                strong
              />
            </View>
            <Text style={st.note}>
              Protein 4 kcal/g, Kohlenhydrate 4 kcal/g, Fett 9 kcal/g. Kleine Abweichungen sind unkritisch.
            </Text>
          </>
        )}

        {/* ---- Wochentag-Ziele: Liste ---- */}
        {top?.k === 'weekdays' && (
          <>
            <Text style={st.note}>
              Leere Felder bedeuten: Standardziel. Aus deinem Plan sind Kohlenhydrate an intensiven
              Tagen höher und am Ruhetag niedriger hinterlegt – Fett gleicht die Kalorien aus.
            </Text>
            <View style={{ marginTop: 10 }}>
              {WD_LONG.map((w, i) => {
                const o = settings.weekdayTargets[i] ?? {};
                const keys = Object.keys(o) as (keyof Targets)[];
                return (
                  <View key={w}>
                    {i > 0 && <View style={st.sep} />}
                    <Row
                      title={w}
                      subtitle={keys.length
                        ? keys.map((k) => `${labelOf(k)} ${fmtInt(o[k] as number)}`).join(' · ')
                        : 'Standardziele'}
                      onPress={() => push({ k: 'weekday', i })}
                    />
                  </View>
                );
              })}
            </View>
          </>
        )}

        {/* ---- Wochentag-Ziele: Detail ---- */}
        {top?.k === 'weekday' && (
          <>
            {TARGET_FIELDS.map((f, idx) => (
              <View key={f.key} style={{ marginTop: idx === 0 ? 0 : 14 }}>
                <NumEdit
                  key={`${top.i}-${f.key}`}
                  label={f.label}
                  suffix={f.suffix}
                  value={(settings.weekdayTargets[top.i] ?? {})[f.key] ?? null}
                  placeholder={`Standard: ${fmtInt(settings.targets[f.key])}`}
                  onCommit={(v) => setWeekdayTarget(top.i, f.key, v)}
                />
              </View>
            ))}
            <Btn
              variant="ghost"
              label="Auf Standard zurücksetzen"
              style={{ marginTop: 20 }}
              onPress={() => {
                setSettings((s) => ({
                  ...s,
                  weekdayTargets: s.weekdayTargets.map((x, j) => (j === (top as any).i ? {} : x)),
                }));
                pop();
              }}
            />
          </>
        )}

        {/* ---- Wochenplan: Liste ---- */}
        {top?.k === 'week' && (
          <View>
            {settings.week.map((d, i) => (
              <View key={i}>
                {i > 0 && <View style={st.sep} />}
                <Row
                  title={`${WD_LONG[i]}`}
                  subtitle={`${d.title || '—'} · ${KIND_LABEL[d.kind]}`}
                  onPress={() => push({ k: 'weekplan', i })}
                />
              </View>
            ))}
          </View>
        )}

        {/* ---- Wochenplan: Detail ---- */}
        {top?.k === 'weekplan' && (
          <>
            <Field
              label="BESCHRIFTUNG"
              value={settings.week[top.i].title}
              onChangeText={(v) =>
                setSettings((s) => ({
                  ...s,
                  week: s.week.map((d, j) => (j === (top as any).i ? { ...d, title: v } : d)),
                }))}
            />
            <Text style={st.label}>ART</Text>
            <View style={st.chipWrap}>
              {(['rest', 'gym', 'sport'] as DayKind[]).map((k) => (
                <Chip
                  key={k}
                  label={KIND_LABEL[k]}
                  active={settings.week[top.i].kind === k}
                  onPress={() =>
                    setSettings((s) => ({
                      ...s,
                      week: s.week.map((d, j) => (j === (top as any).i ? { ...d, kind: k } : d)),
                    }))}
                />
              ))}
            </View>
            <Text style={st.label}>EINHEIT</Text>
            <View style={st.chipWrap}>
              <Chip
                label="Keine"
                active={settings.week[top.i].sessionId === null}
                onPress={() =>
                  setSettings((s) => ({
                    ...s,
                    week: s.week.map((d, j) => (j === (top as any).i ? { ...d, sessionId: null } : d)),
                  }))}
              />
              {settings.sessions.map((sx) => (
                <Chip
                  key={sx.id}
                  label={`${sx.emoji} ${sx.name}`}
                  active={settings.week[top.i].sessionId === sx.id}
                  onPress={() =>
                    setSettings((s) => ({
                      ...s,
                      week: s.week.map((d, j) => (j === (top as any).i ? { ...d, sessionId: sx.id } : d)),
                    }))}
                />
              ))}
            </View>
            <Text style={st.note}>
              Der Wochenplan gilt ab jetzt. Bereits erfasste Tage bleiben so, wie du sie protokolliert hast.
            </Text>
          </>
        )}

        {/* ---- Einheiten: Liste ---- */}
        {top?.k === 'sessions' && (
          <>
            <View>
              {settings.sessions.map((sx, i) => (
                <View key={sx.id}>
                  {i > 0 && <View style={st.sep} />}
                  <Row
                    title={`${sx.emoji} ${sx.name}`}
                    subtitle={`${sx.exercises.length} Übungen · ${sx.durationMin || '?'} Min`}
                    onPress={() => push({ k: 'session', id: sx.id })}
                  />
                </View>
              ))}
            </View>
            <Btn
              label="+ Neue Einheit"
              style={{ marginTop: 20 }}
              onPress={() => {
                const id = uid();
                setSettings((s) => ({
                  ...s,
                  sessions: [...s.sessions, { id, name: 'Neue Einheit', emoji: '💪', durationMin: '45', exercises: [] }],
                }));
                push({ k: 'session', id });
              }}
            />
          </>
        )}

        {/* ---- Einheit: Detail ---- */}
        {top?.k === 'session' && (() => {
          const sx = settings.sessions.find((x) => x.id === top.id);
          if (!sx) return null;
          const move = (idx: number, dir: -1 | 1) =>
            updateSession(sx.id, (o) => {
              const arr = [...o.exercises];
              const j = idx + dir;
              if (j < 0 || j >= arr.length) return o;
              [arr[idx], arr[j]] = [arr[j], arr[idx]];
              return { ...o, exercises: arr };
            });
          const setEx = (exId: string, fn: (e: Exercise) => Exercise) =>
            updateSession(sx.id, (o) => ({ ...o, exercises: o.exercises.map((e) => (e.id === exId ? fn(e) : e)) }));
          return (
            <>
              <View style={st.duo}>
                <Field label="ICON" value={sx.emoji} maxLength={2} style={{ flex: 0, width: 80 }} onChangeText={(v) => updateSession(sx.id, (o) => ({ ...o, emoji: v }))} />
                <Field label="NAME" value={sx.name} onChangeText={(v) => updateSession(sx.id, (o) => ({ ...o, name: v }))} />
              </View>
              <View style={{ height: 12 }} />
              <Field label="DAUER (MIN)" keyboardType="number-pad" value={sx.durationMin} onChangeText={(v) => updateSession(sx.id, (o) => ({ ...o, durationMin: v }))} />
              <View style={{ height: 12 }} />
              <Field label="ZIEL DER EINHEIT" value={sx.goal ?? ''} multiline onChangeText={(v) => updateSession(sx.id, (o) => ({ ...o, goal: v }))} />

              <Text style={st.label}>ÜBUNGEN</Text>
              {sx.exercises.map((e, i) => (
                <View key={e.id} style={st.exCard}>
                  <View style={st.exHead}>
                    <Text style={st.exNum}>{i + 1}</Text>
                    <View style={{ flex: 1 }} />
                    <Pressable hitSlop={8} onPress={() => move(i, -1)}><Text style={st.exBtn}>↑</Text></Pressable>
                    <Pressable hitSlop={8} onPress={() => move(i, 1)}><Text style={st.exBtn}>↓</Text></Pressable>
                    <Pressable
                      hitSlop={8}
                      onPress={() => updateSession(sx.id, (o) => ({ ...o, exercises: o.exercises.filter((x) => x.id !== e.id) }))}
                    >
                      <Text style={[st.exBtn, { color: T.danger }]}>✕</Text>
                    </Pressable>
                  </View>
                  <Field label="ÜBUNG" value={e.name} onChangeText={(v) => setEx(e.id, (o) => ({ ...o, name: v }))} />
                  <View style={{ height: 10 }} />
                  <View style={st.duo}>
                    <Field label="SÄTZE" value={e.sets} style={{ flex: 0, width: 90 }} onChangeText={(v) => setEx(e.id, (o) => ({ ...o, sets: v }))} />
                    <Field label="WIEDERHOLUNGEN / DAUER" value={e.reps} onChangeText={(v) => setEx(e.id, (o) => ({ ...o, reps: v }))} />
                  </View>
                  <View style={{ height: 10 }} />
                  <Field label="HINWEIS" value={e.note ?? ''} onChangeText={(v) => setEx(e.id, (o) => ({ ...o, note: v }))} />
                </View>
              ))}
              <Btn
                variant="ghost"
                label="+ Übung"
                style={{ marginTop: 12 }}
                onPress={() =>
                  updateSession(sx.id, (o) => ({
                    ...o,
                    exercises: [...o.exercises, { id: uid(), name: '', sets: '3', reps: '10' }],
                  }))}
              />
              <Btn
                variant="danger"
                label="Einheit löschen"
                style={{ marginTop: 24 }}
                onPress={() =>
                  confirm(
                    'Einheit löschen?',
                    sx.name,
                    () => {
                      setSettings((s) => ({
                        ...s,
                        sessions: s.sessions.filter((x) => x.id !== sx.id),
                        week: s.week.map((d) => (d.sessionId === sx.id ? { ...d, sessionId: null } : d)),
                      }));
                      pop();
                    },
                    'Löschen',
                    true,
                  )}
              />
            </>
          );
        })()}

        {/* ---- Mahlzeiten ---- */}
        {top?.k === 'meals' && (
          <>
            {settings.meals.map((m, i) => (
              <View key={i} style={[st.duo, { marginTop: i === 0 ? 0 : 10, alignItems: 'flex-end' }]}>
                <Field
                  value={m}
                  onChangeText={(v) => setSettings((s) => ({ ...s, meals: s.meals.map((x, j) => (j === i ? v : x)) }))}
                />
                <Pressable
                  hitSlop={8}
                  style={st.delBox}
                  onPress={() => setSettings((s) => ({ ...s, meals: s.meals.filter((_, j) => j !== i) }))}
                >
                  <Text style={{ color: T.danger, fontSize: 16 }}>✕</Text>
                </Pressable>
              </View>
            ))}
            <Btn
              variant="ghost"
              label="+ Mahlzeit"
              style={{ marginTop: 16 }}
              onPress={() => setSettings((s) => ({ ...s, meals: [...s.meals, 'Neue Mahlzeit'] }))}
            />
            <Text style={st.note}>
              Aus dem Plan: 3–4 Portionen à 30–40 g Protein über den Tag verteilen unterstützt den
              Muskelerhalt besser als zwei große Portionen.
            </Text>
          </>
        )}

        {/* ---- Lebensmittel: Liste ---- */}
        {top?.k === 'foods' && (
          <>
            <Field placeholder="Suchen …" value={foodQuery} onChangeText={setFoodQuery} autoCorrect={false} />
            <View style={{ marginTop: 6 }}>
              {settings.foods
                .filter((f) => f.name.toLowerCase().includes(foodQuery.trim().toLowerCase()))
                .map((f, i) => (
                  <View key={f.id}>
                    {i > 0 && <View style={st.sep} />}
                    <Row
                      title={f.name}
                      subtitle={`${f.portion} · ${fmtInt(f.kcal)} kcal · P ${fmt(f.protein, 1)} / KH ${fmt(f.carbs, 1)} / F ${fmt(f.fat, 1)}`}
                      onPress={() => push({ k: 'food', id: f.id })}
                    />
                  </View>
                ))}
            </View>
            <Btn
              label="+ Neues Lebensmittel"
              style={{ marginTop: 20 }}
              onPress={() => {
                const id = uid();
                setSettings((s) => ({
                  ...s,
                  foods: [...s.foods, { id, name: 'Neues Lebensmittel', portion: '100 g', kcal: 0, protein: 0, carbs: 0, fat: 0 }],
                }));
                push({ k: 'food', id });
              }}
            />
          </>
        )}

        {/* ---- Lebensmittel: Detail ---- */}
        {top?.k === 'food' && (() => {
          const f = settings.foods.find((x) => x.id === top.id);
          if (!f) return null;
          return (
            <>
              <Field label="NAME" value={f.name} onChangeText={(v) => updateFood(f.id, (o) => ({ ...o, name: v }))} />
              <View style={{ height: 12 }} />
              <Field label="PORTIONSGRÖSSE" value={f.portion} hint="z. B. „100 g“, „1 Scheibe (50 g)“ oder „1 EL“" onChangeText={(v) => updateFood(f.id, (o) => ({ ...o, portion: v }))} />
              <View style={{ height: 12 }} />
              <View style={st.duo}>
                <NumEdit key={f.id + 'k'} label="KCAL" value={f.kcal} onCommit={(v) => updateFood(f.id, (o) => ({ ...o, kcal: v ?? 0 }))} />
                <NumEdit key={f.id + 'p'} label="PROTEIN" suffix="g" value={f.protein} onCommit={(v) => updateFood(f.id, (o) => ({ ...o, protein: v ?? 0 }))} />
              </View>
              <View style={{ height: 12 }} />
              <View style={st.duo}>
                <NumEdit key={f.id + 'c'} label="KOHLENHYDRATE" suffix="g" value={f.carbs} onCommit={(v) => updateFood(f.id, (o) => ({ ...o, carbs: v ?? 0 }))} />
                <NumEdit key={f.id + 'f'} label="FETT" suffix="g" value={f.fat} onCommit={(v) => updateFood(f.id, (o) => ({ ...o, fat: v ?? 0 }))} />
              </View>
              <Btn
                variant="danger"
                label="Lebensmittel löschen"
                style={{ marginTop: 24 }}
                onPress={() => {
                  setSettings((s) => ({ ...s, foods: s.foods.filter((x) => x.id !== f.id) }));
                  pop();
                }}
              />
            </>
          );
        })()}

        {/* ---- Daten sichern ---- */}
        {top?.k === 'data' && (
          <>
            <Text style={st.note}>
              Deine Einträge liegen nur auf diesem Gerät. Kopier dir den Text unten ab und zu
              weg – dann kannst du alles wiederherstellen, wenn der Browser-Speicher gelöscht
              wird oder du das Gerät wechselst.
            </Text>

            <Text style={st.label}>EXPORT</Text>
            <Field
              value={JSON.stringify(state)}
              multiline
              editable={false}
              selectTextOnFocus
              hint="Antippen, gedrückt halten, „Alles auswählen“ → „Kopieren“."
              inputStyle={{ height: 110, textAlignVertical: 'top' }}
            />

            <Text style={st.label}>WIEDERHERSTELLEN</Text>
            <Field
              value={importText}
              onChangeText={setImportText}
              multiline
              placeholder="Gesicherten Text hier einfügen …"
              autoCorrect={false}
              autoCapitalize="none"
              inputStyle={{ height: 110, textAlignVertical: 'top' }}
            />
            <Btn
              label="Daten ersetzen"
              style={{ marginTop: 16 }}
              disabled={!importText.trim()}
              onPress={() => {
                let parsed: unknown;
                try {
                  parsed = JSON.parse(importText);
                } catch {
                  notify('Ungültig', 'Der Text ist kein gültiger Export.');
                  return;
                }
                const p = parsed as { settings?: unknown; days?: unknown };
                if (!p || typeof p !== 'object' || !p.settings || !p.days) {
                  notify('Ungültig', 'Im Text fehlen Einstellungen oder Tage.');
                  return;
                }
                confirm(
                  'Daten ersetzen?',
                  'Alles, was aktuell in der App steht, wird überschrieben.',
                  () => {
                    setState(() => normalizeState(parsed));
                    setImportText('');
                    pop();
                  },
                  'Ersetzen',
                  true,
                );
              }}
            />
          </>
        )}

        {/* ---- Health-Import ---- */}
        {top?.k === 'health' && (() => {
          const parsed = parseHealthText(healthText);
          const rows = describeImport(parsed);
          const target = parsed.date ?? todayKey();
          return (
            <>
              <Text style={st.note}>
                Apple Health lässt sich von einer Web-App nicht direkt auslesen. Ein Kurzbefehl
                darf es aber: Er holt die Tageswerte und legt sie in die Zwischenablage – hier
                fügst du sie ein.
              </Text>

              <Text style={st.label}>EINFÜGEN</Text>
              <Field
                value={healthText}
                onChangeText={setHealthText}
                multiline
                autoCorrect={false}
                autoCapitalize="none"
                placeholder={'schritte=8123\ngewicht=88,4'}
                inputStyle={{ height: 90, textAlignVertical: 'top' }}
              />

              {rows.length > 0 && (
                <View style={st.calcBox}>
                  <CalcRow label="Tag" value={dayLabel(target)} />
                  <View style={st.calcDiv} />
                  {rows.map((row) => (
                    <CalcRow key={row.label} label={row.label} value={row.value} strong />
                  ))}
                </View>
              )}
              {healthText.trim().length > 0 && rows.length === 0 && (
                <Text style={st.note}>
                  Daraus konnte ich nichts lesen. Erwartet werden Zeilen wie „schritte=8123“
                  oder „gewicht: 88,4“.
                </Text>
              )}

              <Btn
                label="Werte übernehmen"
                style={{ marginTop: 18 }}
                disabled={rows.length === 0}
                onPress={() => {
                  setDay(target, (d) => ({
                    ...d,
                    steps: parsed.steps != null ? Math.round(parsed.steps) : d.steps,
                    weight: parsed.weight != null ? Math.round(parsed.weight * 10) / 10 : d.weight,
                    water: parsed.water != null ? Math.round(parsed.water) : d.water,
                  }));
                  setHealthText('');
                  pop();
                  notify('Übernommen', `${dayLabel(target)}: ${rows.map((r) => `${r.label} ${r.value}`).join(', ')}`);
                }}
              />

              <Text style={st.label}>KURZBEFEHL ANLEGEN</Text>
              <Text style={st.note}>
                1. App „Kurzbefehle“ → neuer Kurzbefehl{'\n'}
                2. „Gesundheitsdaten abrufen“ (Find Health Samples) → Typ Schritte,
                sortiert nach Startdatum, Filter „Datum ist heute“{'\n'}
                3. „Statistik berechnen“ (Calculate Statistics) → Summe{'\n'}
                4. Nochmal „Gesundheitsdaten abrufen“ → Typ Gewicht, absteigend, Limit 1{'\n'}
                5. „Text“-Aktion mit den beiden Ergebnissen:{'\n'}
                {'    '}schritte=[Summe]{'\n'}
                {'    '}gewicht=[Gewicht]{'\n'}
                6. „In die Zwischenablage kopieren“{'\n'}
                {'\n'}
                Wasser und ein abweichendes Datum versteht der Import auch:
                „wasser=2,5 l“, „datum=03.09.2026“.
              </Text>
            </>
          );
        })()}
      </Sheet>
    </ScrollView>
  );
}

const labelOf = (k: keyof Targets): string =>
  ({ kcal: 'kcal', protein: 'P', carbs: 'KH', fat: 'F', water: 'Wasser', steps: 'Schritte' }[k]);

const CalcRow = ({ label, value, strong }: { label: string; value: string; strong?: boolean }) => (
  <View style={st.calcRow}>
    <Text style={[st.calcLabel, strong && { color: T.text, fontWeight: '700' }]}>{label}</Text>
    <Text style={[st.calcVal, strong && { color: T.accent }]}>{value}</Text>
  </View>
);

const st = StyleSheet.create({
  page: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  h1: { color: T.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.6 },
  sub: { color: T.dim, fontSize: 13, lineHeight: 19, marginTop: 6 },
  sep: { height: 1, backgroundColor: T.line },

  label: { color: T.dim, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  duo: { flexDirection: 'row', gap: 12 },
  note: { color: T.dim2, fontSize: 12, lineHeight: 18, marginTop: 16 },

  calcBox: { backgroundColor: T.card, borderRadius: 16, padding: 16, marginTop: 22 },
  calcRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 5 },
  calcLabel: { color: T.dim, fontSize: 13 },
  calcVal: { color: T.text, fontSize: 14, fontWeight: '700' },
  calcDiv: { height: 1, backgroundColor: T.line, marginVertical: 8 },

  exCard: { backgroundColor: T.card, borderRadius: 16, padding: 14, marginBottom: 12 },
  exHead: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 10 },
  exNum: { color: T.dim2, fontSize: 13, fontWeight: '800' },
  exBtn: { color: T.dim, fontSize: 17, fontWeight: '700' },

  delBox: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },

  dangerTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  dangerSub: { color: T.dim, fontSize: 13, lineHeight: 19, marginTop: 6 },
});
