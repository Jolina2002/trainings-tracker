import React, { useState } from 'react';
import {
  KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text,
  TextInput, TextInputProps, View, ViewStyle,
} from 'react-native';
import { T } from './theme';
import { clamp, dayLabel, fmt, num } from './util';

/* ---------------- Text ---------------- */

export const Title = ({ children }: { children: React.ReactNode }) => (
  <Text style={s.title}>{children}</Text>
);

export const SectionTitle = ({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) => (
  <View style={s.sectionRow}>
    <Text style={s.section}>{children}</Text>
    {right}
  </View>
);

export const Muted = ({ children, style }: { children: React.ReactNode; style?: any }) => (
  <Text style={[s.muted, style]}>{children}</Text>
);

/* ---------------- Container ---------------- */

export const Card = ({ children, style, onPress }: { children: React.ReactNode; style?: ViewStyle; onPress?: () => void }) => {
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [s.card, style, pressed && s.pressed]}>
        {children}
      </Pressable>
    );
  }
  return <View style={[s.card, style]}>{children}</View>;
};

export const Divider = () => <View style={s.divider} />;

/* ---------------- Buttons ---------------- */

export function Btn({
  label, onPress, variant = 'primary', style, small, disabled,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  style?: ViewStyle;
  small?: boolean;
  disabled?: boolean;
}) {
  const bg =
    variant === 'primary' ? T.accent : variant === 'danger' ? 'transparent' : T.card2;
  const fg =
    variant === 'primary' ? T.accentInk : variant === 'danger' ? T.danger : T.text;
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.btn,
        { backgroundColor: bg, opacity: disabled ? 0.4 : 1 },
        small && s.btnSmall,
        variant === 'danger' && { borderWidth: 1, borderColor: T.danger },
        pressed && s.pressed,
        style,
      ]}
    >
      <Text style={[s.btnText, { color: fg }, small && { fontSize: 14 }]}>{label}</Text>
    </Pressable>
  );
}

export function Chip({
  label, active, onPress, color,
}: {
  label: string;
  active?: boolean;
  onPress?: () => void;
  color?: string;
}) {
  const c = color ?? T.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        s.chip,
        active && { backgroundColor: c + '26', borderColor: c },
        pressed && s.pressed,
      ]}
    >
      <Text style={[s.chipText, active && { color: c, fontWeight: '700' }]}>{label}</Text>
    </Pressable>
  );
}

/* ---------------- Inputs ---------------- */

export function Field({
  label, hint, suffix, style, inputStyle, ...rest
}: TextInputProps & {
  label?: string; hint?: string; suffix?: string; style?: ViewStyle; inputStyle?: any;
}) {
  return (
    <View style={[{ flex: 1 }, style]}>
      {!!label && <Text style={s.label}>{label}</Text>}
      <View style={s.inputWrap}>
        <TextInput
          placeholderTextColor={T.dim2}
          {...rest}
          style={[s.input, inputStyle]}
        />
        {!!suffix && <Text style={s.suffix}>{suffix}</Text>}
      </View>
      {!!hint && <Text style={s.hint}>{hint}</Text>}
    </View>
  );
}

export const NumField = (p: TextInputProps & { label?: string; hint?: string; suffix?: string; style?: ViewStyle; inputStyle?: any }) => (
  <Field keyboardType="decimal-pad" selectTextOnFocus {...p} />
);

/* ---------------- Fortschritt ---------------- */

export function Bar({
  value, target, color, height = 8,
}: {
  value: number; target: number; color: string; height?: number;
}) {
  const pct = target > 0 ? clamp(value / target, 0, 1) : 0;
  const over = target > 0 && value > target;
  return (
    <View style={[s.barBg, { height, borderRadius: height / 2 }]}>
      <View
        style={{
          width: `${pct * 100}%`,
          height: '100%',
          borderRadius: height / 2,
          backgroundColor: over ? T.danger : color,
        }}
      />
    </View>
  );
}

export function MacroBar({
  label, value, target, unit, color,
}: {
  label: string; value: number; target: number; unit: string; color: string;
}) {
  return (
    <View style={{ flex: 1 }}>
      <View style={s.macroTop}>
        <Text style={[s.macroLabel, { color }]}>{label}</Text>
        <Text style={s.macroVal}>
          {fmt(value)}
          <Text style={s.macroTarget}> / {fmt(target)} {unit}</Text>
        </Text>
      </View>
      <Bar value={value} target={target} color={color} />
    </View>
  );
}

/* ---------------- Datums-Navigation ---------------- */

export function DateNav({
  label, onPrev, onNext, onToday, showToday,
}: {
  label: string; onPrev: () => void; onNext: () => void; onToday?: () => void; showToday?: boolean;
}) {
  return (
    <View style={s.nav}>
      <Pressable onPress={onPrev} style={({ pressed }) => [s.navBtn, pressed && s.pressed]} hitSlop={10}>
        <Text style={s.navArrow}>‹</Text>
      </Pressable>
      <Pressable onPress={onToday} disabled={!showToday} style={s.navMid}>
        <Text style={s.navLabel}>{label}</Text>
        {showToday && <Text style={s.navToday}>Zu heute springen</Text>}
      </Pressable>
      <Pressable onPress={onNext} style={({ pressed }) => [s.navBtn, pressed && s.pressed]} hitSlop={10}>
        <Text style={s.navArrow}>›</Text>
      </Pressable>
    </View>
  );
}

export const dateNavLabel = dayLabel;

/* ---------------- Modal ---------------- */

export function Sheet({
  visible, onClose, title, children, footer, doneLabel = 'Fertig',
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  doneLabel?: string;
}) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={s.sheetWrap}
        >
          <View style={s.sheet}>
            <View style={s.sheetHead}>
              <Text style={s.sheetTitle} numberOfLines={1}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={12}>
                <Text style={s.sheetDone}>{doneLabel}</Text>
              </Pressable>
            </View>
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={s.sheetBody}
              keyboardShouldPersistTaps="handled"
            >
              {children}
            </ScrollView>
            {!!footer && <View style={s.sheetFooter}>{footer}</View>}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

/* ---------------- Zeile ---------------- */

export function Row({
  title, subtitle, right, onPress, color,
}: {
  title: string; subtitle?: string; right?: React.ReactNode; onPress?: () => void; color?: string;
}) {
  const Wrap: any = onPress ? Pressable : View;
  return (
    <Wrap
      onPress={onPress}
      style={({ pressed }: any) => [s.row, pressed && s.pressed]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={[s.rowTitle, color ? { color } : null]}>{title}</Text>
        {!!subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      {right ?? (onPress ? <Text style={s.chevron}>›</Text> : null)}
    </Wrap>
  );
}

export const Empty = ({ text }: { text: string }) => (
  <Text style={s.empty}>{text}</Text>
);

const s = StyleSheet.create({
  title: { color: T.text, fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  sectionRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: 22, marginBottom: 8,
  },
  section: { color: T.dim, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  muted: { color: T.dim, fontSize: 13, lineHeight: 19 },

  card: { backgroundColor: T.card, borderRadius: T.radius, padding: 16 },
  pressed: { opacity: 0.65 },
  divider: { height: 1, backgroundColor: T.line, marginVertical: 12 },

  btn: {
    paddingVertical: 13, paddingHorizontal: 18, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
  },
  btnSmall: { paddingVertical: 9, paddingHorizontal: 13, borderRadius: 11 },
  btnText: { fontSize: 15, fontWeight: '700' },

  chip: {
    paddingVertical: 7, paddingHorizontal: 13, borderRadius: 999,
    borderWidth: 1, borderColor: T.line, backgroundColor: T.card2,
  },
  chipText: { color: T.dim, fontSize: 13, fontWeight: '600' },

  label: { color: T.dim, fontSize: 12, fontWeight: '700', marginBottom: 6, letterSpacing: 0.3 },
  inputWrap: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: T.card2,
    borderRadius: T.radiusSm, borderWidth: 1, borderColor: T.line, paddingHorizontal: 12,
  },
  input: { flex: 1, color: T.text, fontSize: 16, paddingVertical: 11 },
  suffix: { color: T.dim, fontSize: 13, marginLeft: 6 },
  hint: { color: T.dim2, fontSize: 11, marginTop: 5, lineHeight: 15 },

  barBg: { backgroundColor: T.card2, overflow: 'hidden', width: '100%' },
  macroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 6 },
  macroLabel: { fontSize: 12, fontWeight: '800', letterSpacing: 0.4 },
  macroVal: { color: T.text, fontSize: 13, fontWeight: '700' },
  macroTarget: { color: T.dim2, fontSize: 12, fontWeight: '500' },

  nav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 },
  navBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: T.card,
    alignItems: 'center', justifyContent: 'center',
  },
  navArrow: { color: T.text, fontSize: 24, lineHeight: 28, fontWeight: '600' },
  navMid: { flex: 1, alignItems: 'center' },
  navLabel: { color: T.text, fontSize: 17, fontWeight: '700' },
  navToday: { color: T.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },

  backdrop: { flex: 1, backgroundColor: '#000000AA', justifyContent: 'flex-end' },
  sheetWrap: { width: '100%', maxHeight: '92%' },
  sheet: {
    backgroundColor: T.bg, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    flexShrink: 1, paddingBottom: 24, overflow: 'hidden',
  },
  sheetHead: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 18, paddingBottom: 12,
    borderBottomWidth: 1, borderBottomColor: T.line,
  },
  sheetTitle: { color: T.text, fontSize: 18, fontWeight: '800', flex: 1, paddingRight: 12 },
  sheetDone: { color: T.accent, fontSize: 16, fontWeight: '700' },
  sheetBody: { padding: 20, paddingBottom: 8 },
  sheetFooter: { paddingHorizontal: 20, paddingTop: 8 },

  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 13 },
  rowTitle: { color: T.text, fontSize: 15, fontWeight: '600' },
  rowSub: { color: T.dim, fontSize: 12, marginTop: 3, lineHeight: 17 },
  chevron: { color: T.dim2, fontSize: 22, fontWeight: '400' },

  empty: { color: T.dim2, fontSize: 13, fontStyle: 'italic', paddingVertical: 10 },
});

export const ui = s;

/**
 * Zahlenfeld, das den eingetippten Text behält (damit "2," oder "2,5" tippbar bleibt)
 * und den geparsten Wert nach oben meldet. Leeres Feld meldet null.
 */
export function NumEdit({
  label, value, suffix, hint, placeholder, onCommit, style,
}: {
  label?: string;
  value: number | null | undefined;
  suffix?: string;
  hint?: string;
  placeholder?: string;
  onCommit: (v: number | null) => void;
  style?: ViewStyle;
}) {
  const [txt, setTxt] = useState(() => (value == null ? '' : String(value).replace('.', ',')));
  return (
    <NumField
      label={label}
      suffix={suffix}
      hint={hint}
      placeholder={placeholder}
      style={style}
      value={txt}
      onChangeText={(v) => {
        setTxt(v);
        onCommit(v.trim() === '' ? null : num(v));
      }}
    />
  );
}
