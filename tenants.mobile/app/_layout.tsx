import '../src/setup/webCompat';
import { Stack, useRouter } from 'expo-router';
import { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { PaperProvider } from 'react-native-paper';
import { StatusBar } from 'expo-status-bar';
import { getAppConfigIssues, hasBlockingConfigIssues } from '../src/appConfig';
import { ConfigErrorScreen } from '../src/components/ConfigErrorScreen';
import { AuthProvider, useAuth } from '../src/context/AuthContext';
import { ThemeProvider, useThemeMode } from '../src/context/ThemeContext';
import { NotificationProvider } from '../src/context/NotificationContext';
import { LightTheme, DarkTheme, Colors } from '../src/theme';

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();
  const { theme } = useThemeMode();
  const router = useRouter();

  const paperTheme = theme === 'dark' ? DarkTheme : LightTheme;
  const isDark = theme === 'dark';

  useEffect(() => {
    if (isLoading) return;
    if (isAuthenticated) {
      router.replace('/(app)');
    } else {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <PaperProvider theme={paperTheme}>
        <View style={[styles.loading, { backgroundColor: isDark ? Colors.darkBackground : Colors.background }]}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <NotificationProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="(app)" />
        </Stack>
      </NotificationProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  if (hasBlockingConfigIssues()) {
    return (
      <ThemeProvider>
        <ConfigErrorScreen issues={getAppConfigIssues()} />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
