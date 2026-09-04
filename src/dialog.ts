import { Alert, Platform } from 'react-native';

/**
 * react-native-web implementiert Alert als leere Funktion – Dialoge würden
 * dort also wortlos verpuffen. Deshalb auf Web die Browser-Dialoge nutzen.
 */

const web = () => Platform.OS === 'web';
const g = globalThis as any;

export function notify(title: string, message?: string): void {
  if (web()) {
    g.alert?.(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirm(
  title: string,
  message: string,
  onConfirm: () => void,
  confirmLabel = 'OK',
  destructive = false,
): void {
  if (web()) {
    if (g.confirm?.(`${title}\n\n${message}`)) onConfirm();
    return;
  }
  Alert.alert(title, message, [
    { text: 'Abbrechen', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
}
