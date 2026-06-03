import AsyncStorage from '@react-native-async-storage/async-storage';

const SERVER_URL_KEY = 'serverUrl';

import { DEFAULT_API_URL } from './appConfig';

/** Default Next.js API base URL (tenants-web). Override in Settings or via EXPO_PUBLIC_API_URL. */
export const DEFAULT_SERVER_URL = DEFAULT_API_URL;

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
