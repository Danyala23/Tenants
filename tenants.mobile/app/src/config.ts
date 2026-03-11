import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL_KEY = 'serverUrl';

/** Default server URL used when none is configured. */
export const DEFAULT_SERVER_URL = 'https://tenants-app-fga3bpcbgtarf0d9.westcentralus-01.azurewebsites.net';

export async function getServerUrl(): Promise<string> {
  const url = await AsyncStorage.getItem(SERVER_URL_KEY);
  return url ?? DEFAULT_SERVER_URL;
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
