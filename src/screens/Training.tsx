import React, { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { newTraining, useStore } from '../store';
import { KIND_COLOR, T } from '../theme';
import { ExerciseLog, Session, TrainingLog, TrainingStatus } from '../types';
import { Btn, Card, Chip, Field, NumField, Sheet } from '../ui';
import {
  addDays, dateKey, fromKey, shortDate, startOfWeek, todayKey, uid, WD_LONG, WD_SHORT, weekdayIdx,
} from '../util';

const STATUS_LABEL: Record<TrainingStatus, string> = {
  open: 'Geplant',
  done: 'Erledigt',
  skipped: 'Ausgelassen',
};

const statusColor = (s: TrainingStatus) => (s === 'done' ? T.ok : s === 'skipped' ? T.dim2 : T.dim);

export default function Training({
  focusKey, clearFocus,
}: {
  focusKey: string | null;
  clearFocus: () => void;
}) {
  const { settings, trainingsFor, setTrainings } = useStore();
  const [weekStart, setWeekStart] = useState<Date>(() => startOfWeek(new Date()));
  const [sheetDay, setSheetDay] = useState<string | null>(null);
  const [sheetTraining, setSheetTraining] = useState<string | null>(null);
  const [openEx, setOpenEx] = useState<string | null>(null);

  useEffect(() => {
    if (!focusKey) return;
    setWeekStart(startOfWeek(fromKey(focusKey)));
    setSheetDay(focusKey);
    setSheetTraining(null);
    clearFocus();
  }, [focusKey, clearFocus]);

  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const keys = days.map(dateKey);
  const weekEnd = days[6];

  const allTrainings = keys.map((k) => trainingsFor(k));
  const planned = allTrainings.flat().filter((t) => t.status !== 'skipped').length;
  const done = allTrainings.flat().filter((t) => t.status === 'done').length;

  const dayTrainings = sheetDay ? trainingsFor(sheetDay) : [];
  const current = dayTrainings.find((t) => t.id === sheetTraining) ?? null;
  const currentSession: Session | null = current
    ? settings.sessions.find((x) => x.id === current.sessionId) ?? null
    : null;

  const patch = (fn: (t: TrainingLog) => TrainingLog) => {
    if (!sheetDay || !current) return;
    setTrainings(sheetDay, (list) => list.map((t) => (t.id === current.id ? fn(t) : t)));
  };

  const exLog = (exId: string, defaultSets: number): ExerciseLog =>
    current?.ex[exId] ?? {
      done: false,
      sets: Array.from({ length: Math.max(1, defaultSets) }, () => ({ reps: '', weight: '' })),
    };

  const setExLog = (exId: string, fn: (e: ExerciseLog) => ExerciseLog, defaultSets: number) =>
    patch((t) => ({ ...t, ex: { ...t.ex, [exId]: fn(exLog(exId, defaultSets)) } }));

  const addFromSession = (sessionId: string | null) => {
    if (!sheetDay) return;
    const session = settings.sessions.find((x) => x.id === sessionId);
    const t: TrainingLog = {
      ...newTraining(session?.name ?? 'Eigene Einheit', session?.emoji ?? '🏃'),
      id: uid(),
      sessionId: session?.id ?? null,
      durationMin: session?.durationMin ?? '',
    };
    setTrainings(sheetDay, (list) => [...list, t]);
    setSheetTraining(t.id);
  };

  const closeSheet = () => {
    setOpenEx(null);
    if (current) setSheetTraining(null);
    else setSheetDay(null);
  };

  const removeTraining = () => {
    if (!sheetDay || !current) return;
    setTrainings(sheetDay, (list) => list.filter((t) => t.id !== current.id));
    setSheetTraining(null);
  };

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <View style={st.weekNav}>
        <Pressable onPress={() => setWeekStart(addDays(weekStart, -7))} hitSlop={10} style={st.navBtn}>
          <Text style={st.navArrow}>‹</Text>
        </Pressable>
        <View style={{ alignItems: 'center', flex: 1 }}>
          <Text style={st.weekLabel}>{shortDate(weekStart)} – {shortDate(weekEnd)}</Text>
          <Text style={st.weekSub}>{done} von {planned} Einheiten erledigt</Text>
        </View>
        <Pressable onPress={() => setWeekStart(addDays(weekStart, 7))} hitSlop={10} style={st.navBtn}>
          <Text style={st.navArrow}>›</Text>
        </Pressable>
      </View>
      {dateKey(weekStart) !== dateKey(startOfWeek(new Date())) && (
        <Pressable onPress={() => setWeekStart(startOfWeek(new Date()))}>
          <Text style={st.toThisWeek}>Zur aktuellen Woche</Text>
        </Pressable>
      )}

      <View style={{ gap: 10, marginTop: 16 }}>
        {days.map((d, i) => {
          const key = keys[i];
          const plan = settings.week[weekdayIdx(d)];
          const list = allTrainings[i];
          const isToday = key === todayKey();
          return (
            <Card key={key} onPress={() => { setSheetDay(key); setSheetTraining(null); }}>
              <View style={st.dayHead}>
                <View style={[st.dayBadge, isToday && { backgroundColor: T.accent }]}>
                  <Text style={[st.dayBadgeTxt, isToday && { color: T.accentInk }]}>{WD_SHORT[i]}</Text>
                </View>
                <Text style={st.dayDate}>{shortDate(d)}</Text>
                <View style={{ flex: 1 }} />
                {list.length > 0 && (
                  <View style={st.statusPill}>
                    <Text style={[st.statusTxt, { color: statusColor(list[0].status) }]}>
                      {list.length > 1
                        ? `${list.filter((t) => t.status === 'done').length}/${list.length} erledigt`
                        : STATUS_LABEL[list[0].status]}
                    </Text>
                  </View>
                )}
              </View>
              {list.length === 0 ? (
                <Text style={st.dayTitleDim}>
                  {plan?.kind === 'rest' ? `😌 ${plan.title}` : 'Nichts geplant'}
                </Text>
              ) : (
                list.map((t) => (
                  <Text key={t.id} style={st.dayTitle}>{t.emoji} {t.title}</Text>
                ))
              )}
              {!!plan && plan.kind !== 'rest' && (
                <View style={[st.kindTag, { backgroundColor: KIND_COLOR[plan.kind] + '22' }]}>
                  <Text style={[st.kindTxt, { color: KIND_COLOR[plan.kind] }]}>
                    {plan.kind === 'gym' ? 'Fitnessstudio' : 'Badminton'}
                  </Text>
                </View>
              )}
            </Card>
          );
        })}
      </View>

      <View style={{ height: 30 }} />

      <Sheet
        visible={!!sheetDay}
        onClose={closeSheet}
        title={
          current
            ? current.title
            : sheetDay
              ? `${WD_LONG[weekdayIdx(fromKey(sheetDay))]}, ${shortDate(fromKey(sheetDay))}`
              : ''
        }
        doneLabel={current ? 'Zurück' : 'Schließen'}
      >
        {/* Tagesansicht */}
        {!!sheetDay && !current && (
          <>
            {dayTrainings.length === 0 && (
              <Text style={st.emptyTxt}>Für diesen Tag ist keine Einheit hinterlegt.</Text>
            )}
            {dayTrainings.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setSheetTraining(t.id)}
                style={({ pressed }) => [st.trRow, pressed && { opacity: 0.6 }]}
              >
                <View style={{ flex: 1 }}>
                  <Text style={st.trTitle}>{t.emoji} {t.title}</Text>
                  <Text style={st.trSub}>
                    {STATUS_LABEL[t.status]}
                    {t.durationMin ? ` · ${t.durationMin} Min` : ''}
                    {t.rpe ? ` · RPE ${t.rpe}` : ''}
                  </Text>
                </View>
                <Text style={st.chevron}>›</Text>
              </Pressable>
            ))}

            <Text style={st.addLabel}>EINHEIT HINZUFÜGEN</Text>
            <View style={st.chipWrap}>
              {settings.sessions.map((sx) => (
                <Chip key={sx.id} label={`${sx.emoji} ${sx.name}`} onPress={() => addFromSession(sx.id)} />
              ))}
              <Chip label="+ Frei" onPress={() => addFromSession(null)} />
            </View>
          </>
        )}

        {/* Einheit bearbeiten */}
        {!!current && (
          <>
            <Field
              label="TITEL"
              value={current.title}
              onChangeText={(v) => patch((t) => ({ ...t, title: v }))}
            />

            <Text style={st.addLabel}>STATUS</Text>
            <View style={st.chipWrap}>
              {(['open', 'done', 'skipped'] as TrainingStatus[]).map((sv) => (
                <Chip
                  key={sv}
                  label={STATUS_LABEL[sv]}
                  active={current.status === sv}
                  color={statusColor(sv)}
                  onPress={() => patch((t) => ({ ...t, status: sv }))}
                />
              ))}
            </View>

            <View style={[st.duo, { marginTop: 18 }]}>
              <NumField
                label="DAUER"
                suffix="Min"
                value={current.durationMin}
                onChangeText={(v) => patch((t) => ({ ...t, durationMin: v }))}
                placeholder="0"
              />
              <View style={{ flex: 1 }} />
            </View>

            <Text style={st.addLabel}>ANSTRENGUNG (RPE 1–10)</Text>
            <View style={st.chipWrap}>
              {Array.from({ length: 10 }, (_, i) => i + 1).map((v) => (
                <Chip
                  key={v}
                  label={String(v)}
                  active={current.rpe === v}
                  onPress={() => patch((t) => ({ ...t, rpe: t.rpe === v ? null : v }))}
                />
              ))}
            </View>

            {!!currentSession?.exercises.length && (
              <>
                <Text style={st.addLabel}>ÜBUNGEN</Text>
                <View style={st.exBox}>
                  {currentSession.exercises.map((e, idx) => {
                    const log = exLog(e.id, parseInt(e.sets, 10) || 1);
                    const isOpen = openEx === e.id;
                    return (
                      <View key={e.id} style={[idx > 0 && st.exDivider]}>
                        <View style={st.exRow}>
                          <Pressable
                            onPress={() => setExLog(e.id, (x) => ({ ...x, done: !x.done }), parseInt(e.sets, 10) || 1)}
                            hitSlop={8}
                            style={[st.check, log.done && { backgroundColor: T.accent, borderColor: T.accent }]}
                          >
                            {log.done && <Text style={st.checkMark}>✓</Text>}
                          </Pressable>
                          <Pressable style={{ flex: 1 }} onPress={() => setOpenEx(isOpen ? null : e.id)}>
                            <Text style={[st.exName, log.done && { color: T.dim }]}>{e.name}</Text>
                            <Text style={st.exSub}>
                              {e.sets} × {e.reps}{e.note ? ` · ${e.note}` : ''}
                            </Text>
                          </Pressable>
                          <Pressable onPress={() => setOpenEx(isOpen ? null : e.id)} hitSlop={8}>
                            <Text style={st.chevron}>{isOpen ? '⌄' : '›'}</Text>
                          </Pressable>
                        </View>

                        {isOpen && (
                          <View style={st.setBox}>
                            {log.sets.map((sset, si) => (
                              <View key={si} style={st.setRow}>
                                <Text style={st.setIdx}>{si + 1}.</Text>
                                <NumField
                                  placeholder="Wdh."
                                  value={sset.reps}
                                  onChangeText={(v) =>
                                    setExLog(e.id, (x) => ({
                                      ...x,
                                      sets: x.sets.map((y, j) => (j === si ? { ...y, reps: v } : y)),
                                    }), parseInt(e.sets, 10) || 1)}
                                />
                                <NumField
                                  placeholder="kg"
                                  suffix="kg"
                                  value={sset.weight}
                                  onChangeText={(v) =>
                                    setExLog(e.id, (x) => ({
                                      ...x,
                                      sets: x.sets.map((y, j) => (j === si ? { ...y, weight: v } : y)),
                                    }), parseInt(e.sets, 10) || 1)}
                                />
                                <Pressable
                                  hitSlop={8}
                                  onPress={() =>
                                    setExLog(e.id, (x) => ({ ...x, sets: x.sets.filter((_, j) => j !== si) }), parseInt(e.sets, 10) || 1)}
                                >
                                  <Text style={st.removeX}>✕</Text>
                                </Pressable>
                              </View>
                            ))}
                            <Btn
                              small
                              variant="ghost"
                              label="+ Satz"
                              style={{ alignSelf: 'flex-start', marginTop: 6 }}
                              onPress={() =>
                                setExLog(e.id, (x) => ({ ...x, sets: [...x.sets, { reps: '', weight: '' }] }), parseInt(e.sets, 10) || 1)}
                            />
                          </View>
                        )}
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <View style={{ marginTop: 18 }}>
              <Field
                label="NOTIZ"
                value={current.note}
                onChangeText={(v) => patch((t) => ({ ...t, note: v }))}
                placeholder="Wie lief es? Schmerzen, Energie, Technik …"
                multiline
              />
            </View>

            <Btn
              variant="danger"
              label="Einheit von diesem Tag entfernen"
              style={{ marginTop: 20 }}
              onPress={removeTraining}
            />
          </>
        )}
      </Sheet>
    </ScrollView>
  );
}

const st = StyleSheet.create({
  page: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  weekNav: { flexDirection: 'row', alignItems: 'center' },
  navBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.card, alignItems: 'center', justifyContent: 'center' },
  navArrow: { color: T.text, fontSize: 24, lineHeight: 28, fontWeight: '600' },
  weekLabel: { color: T.text, fontSize: 17, fontWeight: '700' },
  weekSub: { color: T.dim, fontSize: 12, marginTop: 3 },
  toThisWeek: { color: T.accent, fontSize: 12, fontWeight: '600', textAlign: 'center', marginTop: 8 },

  dayHead: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  dayBadge: { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 8, backgroundColor: T.card2 },
  dayBadgeTxt: { color: T.text, fontSize: 12, fontWeight: '800' },
  dayDate: { color: T.dim2, fontSize: 12 },
  statusPill: { backgroundColor: T.card2, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  statusTxt: { fontSize: 11, fontWeight: '700' },
  dayTitle: { color: T.text, fontSize: 15, fontWeight: '600', marginTop: 2 },
  dayTitleDim: { color: T.dim2, fontSize: 14 },
  kindTag: { alignSelf: 'flex-start', marginTop: 10, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  kindTxt: { fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },

  emptyTxt: { color: T.dim2, fontSize: 13, fontStyle: 'italic' },
  trRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.line },
  trTitle: { color: T.text, fontSize: 16, fontWeight: '700' },
  trSub: { color: T.dim, fontSize: 12, marginTop: 3 },
  chevron: { color: T.dim2, fontSize: 20 },

  addLabel: { color: T.dim, fontSize: 12, fontWeight: '800', letterSpacing: 0.6, marginTop: 22, marginBottom: 10 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  duo: { flexDirection: 'row', gap: 12 },

  exBox: { backgroundColor: T.card, borderRadius: 16, paddingHorizontal: 14 },
  exDivider: { borderTopWidth: 1, borderTopColor: T.line },
  exRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 13 },
  check: {
    width: 24, height: 24, borderRadius: 7, borderWidth: 1.5, borderColor: T.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: T.accentInk, fontSize: 14, fontWeight: '900' },
  exName: { color: T.text, fontSize: 15, fontWeight: '600' },
  exSub: { color: T.dim, fontSize: 12, marginTop: 3, lineHeight: 17 },
  setBox: { paddingBottom: 14, paddingLeft: 36 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  setIdx: { color: T.dim2, fontSize: 13, width: 18 },
  removeX: { color: T.dim2, fontSize: 15, paddingHorizontal: 4 },
});
