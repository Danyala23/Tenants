import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL_KEY = 'serverUrl';

export async function getServerUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(SERVER_URL_KEY);
  return url ?? '';
}

export async function setServerUrl(url: string): Promise<void> {
  await AsyncStorage.setItem(SERVER_URL_KEY, url.trim());
}

export function normalizeServerUrl(url: string): string {
  let s = url.trim();
  if (!s) return '';
  if (!s.startsWith('http://') && !s.startsWith('https://')) {
    s = 'https://' + s;
  }
  return s.replace(/\/+$/, '');
}
