import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { sumFood } from '../calc';
import { useStore } from '../store';
import { KIND_COLOR, T } from '../theme';
import { TrainingStatus } from '../types';
import {
  Bar, Btn, Card, DateNav, MacroBar, NumField, SectionTitle, Sheet,
} from '../ui';
import { addDays, dateKey, dayLabel, fmt, fmtInt, fromKey, num, todayKey, weekdayIdx } from '../util';

interface NumEdit {
  title: string;
  suffix: string;
  value: string;
  onSave: (v: number) => void;
}

export default function Today({
  dk, setDk, onOpenTraining,
}: {
  dk: string;
  setDk: (k: string) => void;
  onOpenTraining: (key: string) => void;
}) {
  const { getDay, setDay, targetsFor, trainingsFor, setTrainings, settings } = useStore();
  const day = getDay(dk);
  const target = targetsFor(dk);
  const eaten = useMemo(() => sumFood(day.food), [day.food]);
  const trainings = trainingsFor(dk);
  const plan = settings.week[weekdayIdx(fromKey(dk))];

  const [edit, setEdit] = useState<NumEdit | null>(null);
  const [draft, setDraft] = useState('');

  const openEdit = (e: NumEdit) => {
    setDraft(e.value);
    setEdit(e);
  };
  const commit = () => {
    if (edit) edit.onSave(num(draft));
    setEdit(null);
  };

  const left = target.kcal - eaten.kcal;
  const shift = (n: number) => setDk(dateKey(addDays(fromKey(dk), n)));

  const cycleStatus = (id: string, cur: TrainingStatus) => {
    const next: TrainingStatus = cur === 'open' ? 'done' : cur === 'done' ? 'skipped' : 'open';
    setTrainings(dk, (list) => list.map((t) => (t.id === id ? { ...t, status: next } : t)));
  };

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <DateNav
        label={dayLabel(dk)}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => setDk(todayKey())}
        showToday={dk !== todayKey()}
      />

      {/* Kalorien */}
      <Card style={{ marginTop: 14 }}>
        <View style={st.kcalTop}>
          <View>
            <Text style={[st.kcalBig, left < 0 && { color: T.danger }]}>{fmtInt(Math.abs(left))}</Text>
            <Text style={st.kcalLabel}>{left < 0 ? 'kcal über dem Ziel' : 'kcal übrig'}</Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={st.kcalSide}>{fmtInt(eaten.kcal)} gegessen</Text>
            <Text style={st.kcalSideDim}>Ziel {fmtInt(target.kcal)} kcal</Text>
          </View>
        </View>
        <Bar value={eaten.kcal} target={target.kcal} color={T.accent} height={10} />
      </Card>

      {/* Makros */}
      <SectionTitle>Makros</SectionTitle>
      <Card>
        <View style={{ gap: 16 }}>
          <MacroBar label="PROTEIN" value={eaten.protein} target={target.protein} unit="g" color={T.protein} />
          <MacroBar label="KOHLENHYDRATE" value={eaten.carbs} target={target.carbs} unit="g" color={T.carbs} />
          <MacroBar label="FETT" value={eaten.fat} target={target.fat} unit="g" color={T.fat} />
        </View>
      </Card>

      {/* Wasser */}
      <SectionTitle>Trinken</SectionTitle>
      <Card>
        <View style={st.rowBetween}>
          <Text style={st.bigVal}>
            {fmt(day.water / 1000, 1)} <Text style={st.unit}>l</Text>
          </Text>
          <Text style={st.sideDim}>Ziel {fmt(target.water / 1000, 1)} l</Text>
        </View>
        <View style={{ marginTop: 10 }}>
          <Bar value={day.water} target={target.water} color={T.water} />
        </View>
        <View style={st.btnRow}>
          <Btn small variant="ghost" label="−250" onPress={() => setDay(dk, (d) => ({ ...d, water: Math.max(0, d.water - 250) }))} />
          <Btn small variant="ghost" label="+250" onPress={() => setDay(dk, (d) => ({ ...d, water: d.water + 250 }))} />
          <Btn small variant="ghost" label="+500" onPress={() => setDay(dk, (d) => ({ ...d, water: d.water + 500 }))} />
          <Btn
            small
            variant="ghost"
            label="Eigene"
            onPress={() => openEdit({
              title: 'Trinkmenge heute',
              suffix: 'ml',
              value: String(day.water),
              onSave: (v) => setDay(dk, (d) => ({ ...d, water: Math.max(0, v) })),
            })}
          />
        </View>
      </Card>

      {/* Schritte + Gewicht */}
      <SectionTitle>Alltag</SectionTitle>
      <View style={st.duo}>
        <Card
          style={{ flex: 1 }}
          onPress={() => openEdit({
            title: 'Schritte heute',
            suffix: 'Schritte',
            value: String(day.steps),
            onSave: (v) => setDay(dk, (d) => ({ ...d, steps: Math.max(0, v) })),
          })}
        >
          <Text style={st.miniLabel}>SCHRITTE</Text>
          <Text style={st.bigVal}>{fmtInt(day.steps)}</Text>
          <View style={{ marginTop: 10 }}>
            <Bar value={day.steps} target={target.steps} color={T.steps} height={6} />
          </View>
          <Text style={st.sideDim}>Ziel {fmtInt(target.steps)}</Text>
        </Card>
        <Card
          style={{ flex: 1 }}
          onPress={() => openEdit({
            title: 'Gewicht',
            suffix: 'kg',
            value: day.weight != null ? String(day.weight) : '',
            onSave: (v) => setDay(dk, (d) => ({ ...d, weight: v > 0 ? v : null })),
          })}
        >
          <Text style={st.miniLabel}>GEWICHT</Text>
          <Text style={st.bigVal}>
            {day.weight != null ? fmt(day.weight, 1) : '–'}
            {day.weight != null && <Text style={st.unit}> kg</Text>}
          </Text>
          <Text style={[st.sideDim, { marginTop: 14 }]}>
            {day.weight != null ? 'Tippen zum Ändern' : 'Tippen zum Eintragen'}
          </Text>
        </Card>
      </View>

      {/* Training */}
      <SectionTitle>Training</SectionTitle>
      {plan?.kind === 'rest' && trainings.length === 0 ? (
        <Card>
          <Text style={st.restTitle}>😌 {plan.title}</Text>
          <Text style={st.restSub}>
            Erholung ist Teil des Plans. Spaziergang, Mobility oder Dehnen zählen trotzdem.
          </Text>
          <Btn
            small
            variant="ghost"
            style={{ marginTop: 14, alignSelf: 'flex-start' }}
            label="Trotzdem etwas eintragen"
            onPress={() => onOpenTraining(dk)}
          />
        </Card>
      ) : trainings.length === 0 ? (
        <Card>
          <Text style={st.restSub}>Für heute ist nichts geplant.</Text>
          <Btn
            small
            variant="ghost"
            style={{ marginTop: 14, alignSelf: 'flex-start' }}
            label="Einheit hinzufügen"
            onPress={() => onOpenTraining(dk)}
          />
        </Card>
      ) : (
        <View style={{ gap: 10 }}>
          {trainings.map((t) => {
            const session = settings.sessions.find((x) => x.id === t.sessionId);
            const doneCount = Object.values(t.ex).filter((e) => e.done).length;
            const total = session?.exercises.length ?? 0;
            return (
              <Card key={t.id} onPress={() => onOpenTraining(dk)}>
                <View style={st.rowBetween}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={st.trTitle}>{t.emoji} {t.title}</Text>
                    <Text style={st.trSub}>
                      {[
                        total ? `${doneCount}/${total} Übungen` : null,
                        t.durationMin ? `${t.durationMin} Min` : null,
                        t.rpe ? `RPE ${t.rpe}` : null,
                      ].filter(Boolean).join(' · ') || 'Noch nichts erfasst'}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => cycleStatus(t.id, t.status)}
                    hitSlop={8}
                    style={[st.statusDot, statusStyle(t.status)]}
                  >
                    <Text style={[st.statusTxt, { color: statusColor(t.status) }]}>
                      {t.status === 'done' ? '✓' : t.status === 'skipped' ? '–' : '○'}
                    </Text>
                  </Pressable>
                </View>
                {!!plan && (
                  <View style={[st.kindTag, { backgroundColor: KIND_COLOR[plan.kind] + '22' }]}>
                    <Text style={[st.kindTxt, { color: KIND_COLOR[plan.kind] }]}>
                      {t.status === 'done' ? 'Erledigt' : t.status === 'skipped' ? 'Ausgelassen' : 'Geplant'}
                    </Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>
      )}

      <View style={{ height: 24 }} />

      <Sheet
        visible={!!edit}
        onClose={commit}
        title={edit?.title ?? ''}
        doneLabel="Speichern"
      >
        <NumField
          autoFocus
          value={draft}
          suffix={edit?.suffix}
          onChangeText={setDraft}
          placeholder="0"
          onSubmitEditing={commit}
        />
      </Sheet>
    </ScrollView>
  );
}

const statusColor = (s: TrainingStatus) =>
  s === 'done' ? T.ok : s === 'skipped' ? T.dim2 : T.dim;

const statusStyle = (s: TrainingStatus) => ({
  borderColor: statusColor(s),
  backgroundColor: s === 'done' ? T.ok + '1F' : 'transparent',
});

const st = StyleSheet.create({
  page: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  kcalTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  kcalBig: { color: T.accent, fontSize: 44, fontWeight: '800', letterSpacing: -1.5 },
  kcalLabel: { color: T.dim, fontSize: 13, fontWeight: '600', marginTop: -2 },
  kcalSide: { color: T.text, fontSize: 14, fontWeight: '700' },
  kcalSideDim: { color: T.dim2, fontSize: 12, marginTop: 3 },

  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  bigVal: { color: T.text, fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  unit: { color: T.dim, fontSize: 15, fontWeight: '600' },
  sideDim: { color: T.dim2, fontSize: 12, marginTop: 8 },
  miniLabel: { color: T.dim, fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  btnRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  duo: { flexDirection: 'row', gap: 12 },

  restTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  restSub: { color: T.dim, fontSize: 13, lineHeight: 19, marginTop: 6 },

  trTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  trSub: { color: T.dim, fontSize: 12, marginTop: 4 },
  statusDot: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  statusTxt: { fontSize: 16, fontWeight: '800' },
  kindTag: { alignSelf: 'flex-start', marginTop: 12, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  kindTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
});
