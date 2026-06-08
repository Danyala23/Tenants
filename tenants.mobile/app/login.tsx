import { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { TextInput, Button, Text, IconButton, useTheme } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../src/context/AuthContext';
import { useThemeMode } from '../src/context/ThemeContext';
import { getServerUrl, setServerUrl, normalizeServerUrl } from '../src/config';
import { isSupabaseConfigured } from '../src/supabase';
import { Colors, Spacing, Radius, Gradients, FontFamily } from '../src/theme';

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

  const gradientBrand = isDark ? Gradients.brandDark : Gradients.brand;
  const gradientPrimary = isDark ? Gradients.primaryDark : Gradients.primary;
  const aurora = isDark ? Gradients.auroraDark : Gradients.auroraLight;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={aurora}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <KeyboardAvoidingView
        style={styles.container}
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
            <LinearGradient
              colors={gradientBrand}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.brandMark}
            >
              <MaterialCommunityIcons name="home-city" size={40} color="#FFFFFF" />
            </LinearGradient>
            <Text style={[styles.brandTitle, { color: theme.colors.onBackground }]}>
              Haven
            </Text>
            <Text style={[styles.brandSubtitle, { color: theme.colors.onSurfaceVariant }]}>
              Your properties, beautifully managed
            </Text>
          </View>

          <View
            style={[
              styles.formCard,
              {
                backgroundColor: theme.colors.surface,
                borderColor: theme.colors.outlineVariant,
              },
            ]}
          >
            {showServerInput ? (
              <>
                <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
                  Server configuration
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
                  <Text style={styles.error}>{error}</Text>
                ) : null}
                <GradientButton
                  label="Save & Continue"
                  colors={gradientPrimary}
                  onPress={handleSaveServerUrl}
                />
              </>
            ) : (
              <>
                <Text style={[styles.formTitle, { color: theme.colors.onSurface }]}>
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
                  <Text style={styles.error}>{error}</Text>
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
                <GradientButton
                  label="Sign In"
                  colors={gradientPrimary}
                  onPress={handleLogin}
                  loading={loading}
                  icon="arrow-right"
                />
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function GradientButton({
  label,
  colors,
  onPress,
  loading,
  icon,
}: {
  label: string;
  colors: readonly [string, string, ...string[]];
  onPress: () => void;
  loading?: boolean;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={loading}
      style={({ pressed }) => [
        styles.gradientButtonWrap,
        { opacity: pressed || loading ? 0.9 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] },
      ]}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradientButton}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" size="small" />
        ) : (
          <>
            <Text style={styles.gradientButtonLabel}>{label}</Text>
            {icon ? (
              <MaterialCommunityIcons name={icon} size={18} color="#FFFFFF" />
            ) : null}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
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
  brandMark: {
    width: 84,
    height: 84,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    shadowColor: Colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  brandTitle: {
    fontFamily: FontFamily.display,
    fontSize: 32,
    letterSpacing: -0.5,
    marginBottom: Spacing.xs,
  },
  brandSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 14,
    opacity: 0.85,
  },
  formCard: {
    borderRadius: Radius.xl,
    padding: Spacing.xxl,
    borderWidth: 1,
    shadowColor: '#1B1530',
    shadowOpacity: 0.08,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 4,
  },
  formTitle: {
    fontFamily: FontFamily.displaySemi,
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  input: {
    marginBottom: Spacing.md,
  },
  inputOutline: {
    borderRadius: Radius.md,
  },
  inputContent: {
    paddingLeft: 12,
    fontFamily: FontFamily.regular,
  },
  serverLink: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.md,
  },
  serverLinkLabel: {
    fontSize: 12,
    fontFamily: FontFamily.semibold,
  },
  error: {
    color: Colors.error,
    marginBottom: Spacing.md,
    fontSize: 13,
    fontFamily: FontFamily.medium,
  },
  gradientButtonWrap: {
    marginTop: Spacing.sm,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  gradientButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: Radius.md,
  },
  gradientButtonLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: FontFamily.bold,
    letterSpacing: 0.3,
  },
});
