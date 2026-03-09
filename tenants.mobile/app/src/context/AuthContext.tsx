import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { getToken, setToken } from '../authStorage';
import { api } from '../api';

const USERNAME_KEY = 'username';

interface AuthContextValue {
  isAuthenticated: boolean;
  username: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      const token = await getToken();
      if (!token) {
        setUsername(null);
        return;
      }
      await api.properties.list();
      const stored = await AsyncStorage.getItem(USERNAME_KEY);
      setUsername(stored);
    } catch {
      await setToken(null);
      await AsyncStorage.removeItem(USERNAME_KEY);
      setUsername(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const token = await getToken();
        if (!token) {
          if (!cancelled) setUsername(null);
          return;
        }
        await api.properties.list();
        const stored = await AsyncStorage.getItem(USERNAME_KEY);
        if (!cancelled) setUsername(stored);
      } catch {
        await setToken(null);
        await AsyncStorage.removeItem(USERNAME_KEY);
        if (!cancelled) setUsername(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(
    async (user: string, password: string) => {
      const res = await api.auth.login(user, password);
      if (res.success && res.token) {
        await setToken(res.token);
        await AsyncStorage.setItem(USERNAME_KEY, res.username);
        setUsername(res.username);
      } else {
        throw new Error('Login failed');
      }
    },
    []
  );

  const logout = useCallback(async () => {
    await setToken(null);
    await AsyncStorage.removeItem(USERNAME_KEY);
    setUsername(null);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated: !!username,
    username,
    isLoading,
    login,
    logout,
    refreshAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
