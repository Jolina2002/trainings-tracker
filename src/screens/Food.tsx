import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { entryMacros, sumFood } from '../calc';
import { useStore } from '../store';
import { T } from '../theme';
import { FoodEntry, FoodItem } from '../types';
import { Btn, Card, Chip, DateNav, Field, NumEdit, NumField, Sheet } from '../ui';
import { addDays, dateKey, dayLabel, fmt, fmtInt, fromKey, num, todayKey, uid } from '../util';

const emptyFree = { name: '', portion: '1 Portion', kcal: '', protein: '', carbs: '', fat: '' };

export default function Food({ dk, setDk }: { dk: string; setDk: (k: string) => void }) {
  const { getDay, setDay, targetsFor, settings, setSettings } = useStore();
  const day = getDay(dk);
  const target = targetsFor(dk);
  const total = useMemo(() => sumFood(day.food), [day.food]);

  const [addMeal, setAddMeal] = useState<string | null>(null);
  const [mode, setMode] = useState<'lib' | 'free'>('lib');
  const [query, setQuery] = useState('');
  const [picked, setPicked] = useState<FoodItem | null>(null);
  const [amount, setAmount] = useState('1');
  const [free, setFree] = useState({ ...emptyFree });
  const [saveToLib, setSaveToLib] = useState(false);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [editAmount, setEditAmount] = useState('1');

  const shift = (n: number) => setDk(dateKey(addDays(fromKey(dk), n)));

  const openAdd = (meal: string) => {
    setAddMeal(meal);
    setMode('lib');
    setQuery('');
    setPicked(null);
    setAmount('1');
    setFree({ ...emptyFree });
    setSaveToLib(false);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? settings.foods.filter((f) => f.name.toLowerCase().includes(q))
      : settings.foods;
    return list.slice(0, 40);
  }, [query, settings.foods]);

  const addEntry = (e: FoodEntry) =>
    setDay(dk, (d) => ({ ...d, food: [...d.food, e] }));

  const addFromLibrary = () => {
    if (!picked || !addMeal) return;
    addEntry({
      id: uid(),
      meal: addMeal,
      name: picked.name,
      portion: picked.portion,
      amount: Math.max(0, num(amount)) || 1,
      kcal: picked.kcal,
      protein: picked.protein,
      carbs: picked.carbs,
      fat: picked.fat,
    });
    setAddMeal(null);
  };

  const addFree = () => {
    if (!addMeal) return;
    const name = free.name.trim() || 'Eintrag';
    const item = {
      kcal: num(free.kcal),
      protein: num(free.protein),
      carbs: num(free.carbs),
      fat: num(free.fat),
    };
    addEntry({
      id: uid(),
      meal: addMeal,
      name,
      portion: free.portion.trim() || '1 Portion',
      amount: Math.max(0, num(amount)) || 1,
      ...item,
    });
    if (saveToLib) {
      setSettings((s) => ({
        ...s,
        foods: [...s.foods, { id: uid(), name, portion: free.portion.trim() || '1 Portion', ...item }],
      }));
    }
    setAddMeal(null);
  };

  const saveEdit = () => {
    if (!editing) return;
    const a = Math.max(0, num(editAmount));
    setDay(dk, (d) => ({
      ...d,
      food: d.food.map((f) => (f.id === editing.id ? { ...editing, amount: a } : f)),
    }));
    setEditing(null);
  };

  const removeEntry = (id: string) => {
    setDay(dk, (d) => ({ ...d, food: d.food.filter((f) => f.id !== id) }));
    setEditing(null);
  };

  const preview = picked
    ? {
      kcal: picked.kcal * (num(amount) || 0),
      protein: picked.protein * (num(amount) || 0),
      carbs: picked.carbs * (num(amount) || 0),
      fat: picked.fat * (num(amount) || 0),
    }
    : null;

  return (
    <ScrollView contentContainerStyle={st.page} keyboardShouldPersistTaps="handled">
      <DateNav
        label={dayLabel(dk)}
        onPrev={() => shift(-1)}
        onNext={() => shift(1)}
        onToday={() => setDk(todayKey())}
        showToday={dk !== todayKey()}
      />

      <Card style={{ marginTop: 14 }}>
        <View style={st.sumRow}>
          <SumCell label="kcal" value={fmtInt(total.kcal)} sub={`/ ${fmtInt(target.kcal)}`} color={T.accent} />
          <SumCell label="Protein" value={fmt(total.protein)} sub={`/ ${fmt(target.protein)} g`} color={T.protein} />
          <SumCell label="KH" value={fmt(total.carbs)} sub={`/ ${fmt(target.carbs)} g`} color={T.carbs} />
          <SumCell label="Fett" value={fmt(total.fat)} sub={`/ ${fmt(target.fat)} g`} color={T.fat} />
        </View>
      </Card>

      {settings.meals.map((meal) => {
        const entries = day.food.filter((f) => f.meal === meal);
        const mealSum = sumFood(entries);
        return (
          <View key={meal} style={{ marginTop: 22 }}>
            <View style={st.mealHead}>
              <Text style={st.mealName}>{meal}</Text>
              <Text style={st.mealKcal}>{fmtInt(mealSum.kcal)} kcal</Text>
            </View>
            <Card style={{ paddingVertical: 6 }}>
              {entries.length === 0 && (
                <Text style={st.emptyMeal}>Noch nichts eingetragen</Text>
              )}
              {entries.map((e, i) => {
                const m = entryMacros(e);
                return (
                  <Pressable
                    key={e.id}
                    onPress={() => { setEditing(e); setEditAmount(String(e.amount)); }}
                    style={({ pressed }) => [
                      st.entry,
                      i > 0 && { borderTopWidth: 1, borderTopColor: T.line },
                      pressed && { opacity: 0.6 },
                    ]}
                  >
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <Text style={st.entryName}>{e.name}</Text>
                      <Text style={st.entrySub}>
                        {fmt(e.amount, 2).replace(/,00$/, '')} × {e.portion} · P {fmt(m.protein, 1)} · KH {fmt(m.carbs, 1)} · F {fmt(m.fat, 1)}
                      </Text>
                    </View>
                    <Text style={st.entryKcal}>{fmtInt(m.kcal)}</Text>
                  </Pressable>
                );
              })}
              <Pressable
                onPress={() => openAdd(meal)}
                style={({ pressed }) => [st.addRow, pressed && { opacity: 0.6 }]}
              >
                <Text style={st.addTxt}>+  Hinzufügen</Text>
              </Pressable>
            </Card>
          </View>
        );
      })}

      <View style={{ height: 30 }} />

      {/* Hinzufügen */}
      <Sheet
        visible={addMeal !== null}
        onClose={() => setAddMeal(null)}
        title={addMeal ? `${addMeal}` : ''}
        doneLabel="Abbrechen"
      >
        <View style={st.chipRow}>
          <Chip label="Bibliothek" active={mode === 'lib'} onPress={() => setMode('lib')} />
          <Chip label="Frei eingeben" active={mode === 'free'} onPress={() => setMode('free')} />
        </View>

        {mode === 'lib' && !picked && (
          <>
            <Field
              placeholder="Lebensmittel suchen …"
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
            />
            <View style={{ marginTop: 10 }}>
              {results.map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => { setPicked(f); setAmount('1'); }}
                  style={({ pressed }) => [st.libRow, pressed && { opacity: 0.6 }]}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={st.entryName}>{f.name}</Text>
                    <Text style={st.entrySub}>{f.portion} · P {fmt(f.protein, 1)} · KH {fmt(f.carbs, 1)} · F {fmt(f.fat, 1)}</Text>
                  </View>
                  <Text style={st.entryKcal}>{fmtInt(f.kcal)}</Text>
                </Pressable>
              ))}
              {results.length === 0 && (
                <Text style={st.emptyMeal}>
                  Nichts gefunden – leg es unter „Frei eingeben“ an.
                </Text>
              )}
            </View>
          </>
        )}

        {mode === 'lib' && picked && (
          <>
            <Text style={st.pickedName}>{picked.name}</Text>
            <Text style={st.entrySub}>1 Portion = {picked.portion}</Text>
            <View style={{ marginTop: 16 }}>
              <NumField
                label="MENGE (PORTIONEN)"
                value={amount}
                onChangeText={setAmount}
                autoFocus
                hint={`z. B. 1,5 für anderthalb × ${picked.portion}`}
              />
            </View>
            {preview && (
              <View style={st.previewBox}>
                <Text style={st.previewKcal}>{fmtInt(preview.kcal)} kcal</Text>
                <Text style={st.entrySub}>
                  P {fmt(preview.protein, 1)} g · KH {fmt(preview.carbs, 1)} g · F {fmt(preview.fat, 1)} g
                </Text>
              </View>
            )}
            <View style={st.sheetBtns}>
              <Btn variant="ghost" label="Zurück" onPress={() => setPicked(null)} style={{ flex: 1 }} />
              <Btn label="Hinzufügen" onPress={addFromLibrary} style={{ flex: 2 }} />
            </View>
          </>
        )}

        {mode === 'free' && (
          <>
            <Field label="NAME" value={free.name} onChangeText={(v) => setFree({ ...free, name: v })} placeholder="z. B. Döner" />
            <View style={{ height: 12 }} />
            <Field label="PORTIONSGRÖSSE" value={free.portion} onChangeText={(v) => setFree({ ...free, portion: v })} placeholder="1 Portion" />
            <View style={{ height: 12 }} />
            <View style={st.duo}>
              <NumField label="KCAL" value={free.kcal} onChangeText={(v) => setFree({ ...free, kcal: v })} placeholder="0" />
              <NumField label="PROTEIN (G)" value={free.protein} onChangeText={(v) => setFree({ ...free, protein: v })} placeholder="0" />
            </View>
            <View style={{ height: 12 }} />
            <View style={st.duo}>
              <NumField label="KH (G)" value={free.carbs} onChangeText={(v) => setFree({ ...free, carbs: v })} placeholder="0" />
              <NumField label="FETT (G)" value={free.fat} onChangeText={(v) => setFree({ ...free, fat: v })} placeholder="0" />
            </View>
            <View style={{ height: 12 }} />
            <NumField label="MENGE (PORTIONEN)" value={amount} onChangeText={setAmount} />
            <Pressable onPress={() => setSaveToLib(!saveToLib)} style={st.checkRow}>
              <View style={[st.checkbox, saveToLib && { backgroundColor: T.accent, borderColor: T.accent }]}>
                {saveToLib && <Text style={st.checkMark}>✓</Text>}
              </View>
              <Text style={st.checkLabel}>In meine Lebensmittel-Bibliothek speichern</Text>
            </Pressable>
            <View style={st.sheetBtns}>
              <Btn label="Hinzufügen" onPress={addFree} style={{ flex: 1 }} />
            </View>
          </>
        )}
      </Sheet>

      {/* Bearbeiten */}
      <Sheet
        visible={!!editing}
        onClose={() => setEditing(null)}
        title={editing?.name ?? ''}
        doneLabel="Abbrechen"
      >
        {!!editing && (
          <>
            <Text style={st.entrySub}>1 Portion = {editing.portion}</Text>
            <View style={{ marginTop: 16 }}>
              <NumField label="MENGE (PORTIONEN)" value={editAmount} onChangeText={setEditAmount} autoFocus />
            </View>
            <View style={{ height: 14 }} />
            <View style={st.duo}>
              <NumEdit
                key={editing.id + 'k'}
                label="KCAL / PORTION"
                value={editing.kcal}
                onCommit={(v) => setEditing((e) => (e ? { ...e, kcal: v ?? 0 } : e))}
              />
              <NumEdit
                key={editing.id + 'p'}
                label="PROTEIN (G)"
                value={editing.protein}
                onCommit={(v) => setEditing((e) => (e ? { ...e, protein: v ?? 0 } : e))}
              />
            </View>
            <View style={{ height: 12 }} />
            <View style={st.duo}>
              <NumEdit
                key={editing.id + 'c'}
                label="KH (G)"
                value={editing.carbs}
                onCommit={(v) => setEditing((e) => (e ? { ...e, carbs: v ?? 0 } : e))}
              />
              <NumEdit
                key={editing.id + 'f'}
                label="FETT (G)"
                value={editing.fat}
                onCommit={(v) => setEditing((e) => (e ? { ...e, fat: v ?? 0 } : e))}
              />
            </View>
            <View style={st.sheetBtns}>
              <Btn variant="danger" label="Löschen" onPress={() => removeEntry(editing.id)} style={{ flex: 1 }} />
              <Btn label="Speichern" onPress={saveEdit} style={{ flex: 2 }} />
            </View>
          </>
        )}
      </Sheet>
    </ScrollView>
  );
}

const SumCell = ({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) => (
  <View style={{ flex: 1 }}>
    <Text style={[st.sumLabel, { color }]}>{label}</Text>
    <Text style={st.sumValue}>{value}</Text>
    <Text style={st.sumSub}>{sub}</Text>
  </View>
);

const st = StyleSheet.create({
  page: { padding: 20, paddingTop: 8, paddingBottom: 40 },
  sumRow: { flexDirection: 'row', gap: 8 },
  sumLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 0.6 },
  sumValue: { color: T.text, fontSize: 19, fontWeight: '800', marginTop: 4 },
  sumSub: { color: T.dim2, fontSize: 11, marginTop: 1 },

  mealHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8, paddingHorizontal: 2 },
  mealName: { color: T.text, fontSize: 16, fontWeight: '700' },
  mealKcal: { color: T.dim, fontSize: 13, fontWeight: '600' },

  entry: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  entryName: { color: T.text, fontSize: 15, fontWeight: '600' },
  entrySub: { color: T.dim, fontSize: 12, marginTop: 3, lineHeight: 17 },
  entryKcal: { color: T.text, fontSize: 15, fontWeight: '700' },
  emptyMeal: { color: T.dim2, fontSize: 13, fontStyle: 'italic', paddingVertical: 10 },
  addRow: { paddingVertical: 12, borderTopWidth: 1, borderTopColor: T.line },
  addTxt: { color: T.accent, fontSize: 14, fontWeight: '700' },

  chipRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  libRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: T.line },
  pickedName: { color: T.text, fontSize: 20, fontWeight: '800' },
  previewBox: { backgroundColor: T.card, borderRadius: 14, padding: 14, marginTop: 16 },
  previewKcal: { color: T.accent, fontSize: 22, fontWeight: '800' },
  sheetBtns: { flexDirection: 'row', gap: 10, marginTop: 20 },
  duo: { flexDirection: 'row', gap: 12 },

  checkRow: { flexDirection: 'row', alignItems: 'center', marginTop: 16, gap: 10 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 1.5, borderColor: T.line,
    alignItems: 'center', justifyContent: 'center',
  },
  checkMark: { color: T.accentInk, fontSize: 13, fontWeight: '900' },
  checkLabel: { color: T.dim, fontSize: 13, flex: 1 },
});
