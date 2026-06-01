import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, IconButton, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useThemeMode } from '../src/context/ThemeContext';
import { getServerUrl, setServerUrl, normalizeServerUrl } from '../src/config';
import { isSupabaseConfigured } from '../src/supabase';
import { Colors, Spacing, Radius } from '../src/theme';

export default function LoginScreen() {
  const [serverUrl, setServerUrlLocal] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerInput, setShowServerInput] = useState(false);
  const { login } = useAuth();
  const { theme: themeMode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const router = useRouter();
  const isDark = themeMode === 'dark';

  useEffect(() => {
    getServerUrl().then((url) => {
      setServerUrlLocal(url);
      setShowServerInput(!url);
    });
  }, []);

  async function handleSaveServerUrl() {
    const normalized = normalizeServerUrl(serverUrl);
    if (!normalized) {
      setError('Please enter a valid server URL');
      return;
    }
    await setServerUrl(normalized);
    setShowServerInput(false);
    setError('');
  }

  async function handleLogin() {
    setError('');
    setLoading(true);
    try {
      if (!isSupabaseConfigured()) {
        setError('Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to .env');
        setLoading(false);
        return;
      }
      const url = await getServerUrl();
      if (!url) {
        setShowServerInput(true);
        setError('Please configure the API server URL first');
        setLoading(false);
        return;
      }
      await login(email, password);
      router.replace('/(app)');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Invalid email or password';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <IconButton
            icon={isDark ? 'white-balance-sunny' : 'moon-waning-crescent'}
            onPress={toggleTheme}
            size={22}
            iconColor={theme.colors.onSurfaceVariant}
          />
        </View>

        <View style={styles.brandSection}>
          <View style={[styles.iconCircle, { backgroundColor: Colors.primarySurface }]}>
            <MaterialCommunityIcons
              name="home-city"
              size={40}
              color={Colors.primary}
            />
          </View>
          <Text
            variant="headlineMedium"
            style={[styles.brandTitle, { color: theme.colors.onBackground }]}
          >
            Property Manager
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.brandSubtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Manage your properties with ease
          </Text>
        </View>

        <View style={[styles.formCard, {
          backgroundColor: theme.colors.surface,
          borderColor: theme.colors.outlineVariant,
        }]}>
          {showServerInput ? (
            <>
              <Text
                variant="titleMedium"
                style={[styles.formTitle, { color: theme.colors.onSurface }]}
              >
                Server Configuration
              </Text>
              <TextInput
                label="Server URL"
                value={serverUrl}
                onChangeText={setServerUrlLocal}
                placeholder="https://your-app.vercel.app"
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="url"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
                left={<TextInput.Icon icon="server-network" />}
              />
              {error ? (
                <Text variant="bodySmall" style={styles.error}>{error}</Text>
              ) : null}
              <Button
                mode="contained"
                onPress={handleSaveServerUrl}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Save & Continue
              </Button>
            </>
          ) : (
            <>
              <Text
                variant="titleMedium"
                style={[styles.formTitle, { color: theme.colors.onSurface }]}
              >
                Welcome back
              </Text>
              <Button
                mode="text"
                compact
                onPress={() => setShowServerInput(true)}
                style={styles.serverLink}
                labelStyle={styles.serverLinkLabel}
                icon="server-network"
              >
                Change Server
              </Button>
              {error ? (
                <Text variant="bodySmall" style={styles.error}>{error}</Text>
              ) : null}
              <TextInput
                label="Email"
                value={email}
                onChangeText={setEmail}
                placeholder="Enter email"
                mode="outlined"
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                style={styles.input}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
                left={<TextInput.Icon icon="email-outline" />}
              />
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="Enter password"
                mode="outlined"
                secureTextEntry
                style={styles.input}
                outlineStyle={styles.inputOutline}
                contentStyle={styles.inputContent}
                left={<TextInput.Icon icon="lock-outline" />}
              />
              <Button
                mode="contained"
                onPress={handleLogin}
                loading={loading}
                disabled={loading}
                style={styles.button}
                contentStyle={styles.buttonContent}
                labelStyle={styles.buttonLabel}
              >
                Sign In
              </Button>
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.xxl,
  },
  header: {
    position: 'absolute',
    top: 48,
    right: 0,
    zIndex: 10,
  },
  brandSection: {
    alignItems: 'center',
    marginBottom: Spacing.xxxl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  brandTitle: {
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  brandSubtitle: {
    opacity: 0.8,
  },
  formCard: {
    borderRadius: Radius.lg,
    padding: Spacing.xxl,
    borderWidth: 1,
  },
  formTitle: {
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  input: {
    marginBottom: Spacing.md,
  },
  inputOutline: {
    borderRadius: Radius.sm,
  },
  inputContent: {
    paddingLeft: 12,
  },
  button: {
    marginTop: Spacing.sm,
    borderRadius: Radius.sm,
  },
  buttonContent: {
    height: 48,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  serverLink: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  serverLinkLabel: {
    fontSize: 12,
  },
  error: {
    color: Colors.error,
    marginBottom: Spacing.md,
    fontSize: 13,
  },
});
