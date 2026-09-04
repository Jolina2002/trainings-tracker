import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import Food from './src/screens/Food';
import SettingsScreen from './src/screens/Settings';
import Today from './src/screens/Today';
import Training from './src/screens/Training';
import { StoreProvider, useStore } from './src/store';
import { T } from './src/theme';
import { todayKey } from './src/util';

type Tab = 'today' | 'food' | 'training' | 'settings';

const TABS: { id: Tab; icon: string; label: string }[] = [
  { id: 'today', icon: '◎', label: 'Heute' },
  { id: 'food', icon: '🍽', label: 'Essen' },
  { id: 'training', icon: '🏸', label: 'Training' },
  { id: 'settings', icon: '⚙', label: 'Plan' },
];

function Shell() {
  const { ready } = useStore();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>('today');
  const [dk, setDk] = useState<string>(todayKey());
  const [trainingFocus, setTrainingFocus] = useState<string | null>(null);

  const clearFocus = useCallback(() => setTrainingFocus(null), []);

  const openTraining = (key: string) => {
    setTrainingFocus(key);
    setTab('training');
  };

  if (!ready) {
    return (
      <View style={[s.root, s.center]}>
        <ActivityIndicator color={T.accent} />
      </View>
    );
  }

  return (
    <View style={[s.root, { paddingTop: insets.top + 6 }]}>
      <View style={{ flex: 1 }}>
        {tab === 'today' && <Today dk={dk} setDk={setDk} onOpenTraining={openTraining} />}
        {tab === 'food' && <Food dk={dk} setDk={setDk} />}
        {tab === 'training' && <Training focusKey={trainingFocus} clearFocus={clearFocus} />}
        {tab === 'settings' && <SettingsScreen />}
      </View>

      <View style={[s.tabbar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        {TABS.map((t) => {
          const active = tab === t.id;
          return (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={({ pressed }) => [s.tab, pressed && { opacity: 0.6 }]}
            >
              <Text style={[s.tabIcon, active && { color: T.accent }]}>{t.icon}</Text>
              <Text style={[s.tabLabel, active && { color: T.accent, fontWeight: '800' }]}>{t.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StoreProvider>
        <StatusBar style="light" />
        <Shell />
      </StoreProvider>
    </SafeAreaProvider>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: T.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  tabbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: T.line,
    backgroundColor: T.card,
    paddingTop: 10,
  },
  tab: { flex: 1, alignItems: 'center', gap: 3 },
  tabIcon: { fontSize: 19, color: T.dim2 },
  tabLabel: { fontSize: 11, color: T.dim2, fontWeight: '600' },
});
