import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
  type TextInputProps,
} from 'react-native';
import { colors, fonts } from './theme';

export function Title({ children, kicker }: { children: ReactNode; kicker?: string }) {
  return (
    <View style={styles.titleBlock}>
      {kicker && <Text style={styles.kicker}>{kicker}</Text>}
      <Text style={styles.title}>{children}</Text>
    </View>
  );
}

export function Button({
  label,
  onPress,
  busy,
  variant = 'gold',
}: {
  label: string;
  onPress: () => void;
  busy?: boolean;
  variant?: 'gold' | 'ghost';
}) {
  const ghost = variant === 'ghost';
  return (
    <Pressable
      onPress={onPress}
      disabled={busy}
      style={({ pressed }) => [
        styles.button,
        ghost ? styles.buttonGhost : styles.buttonGold,
        (pressed || busy) && { opacity: 0.75 },
      ]}
    >
      {busy ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <Text style={styles.buttonLabel}>{label}</Text>
      )}
    </Pressable>
  );
}

export function Field({
  label,
  hint,
  style,
  ...input
}: TextInputProps & { label: string; hint?: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor={colors.muted} style={[styles.input, style]} {...input} />
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
}

export function Notice({ children, tone = 'info' }: { children: ReactNode; tone?: 'info' | 'error' }) {
  return (
    <View style={[styles.notice, tone === 'error' && styles.noticeError]}>
      <Text style={[styles.noticeText, tone === 'error' && { color: colors.danger }]}>
        {children}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  titleBlock: { marginBottom: 16 },
  kicker: {
    fontFamily: fonts.bold,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: colors.leaf,
    marginBottom: 4,
  },
  title: { fontFamily: fonts.bold, fontSize: 26, color: colors.ink },
  button: {
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  buttonGold: { backgroundColor: colors.gold },
  buttonGhost: { backgroundColor: colors.paper, borderWidth: 1, borderColor: colors.line },
  buttonLabel: { fontFamily: fonts.bold, fontSize: 17, color: colors.ink },
  field: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: colors.ink, marginBottom: 6 },
  input: {
    backgroundColor: colors.paper,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.ink,
  },
  hint: { marginTop: 4, fontSize: 12, color: colors.muted },
  notice: {
    backgroundColor: colors.fog,
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  noticeError: { backgroundColor: '#fdecea' },
  noticeText: { fontSize: 13, lineHeight: 19, color: colors.muted },
});
