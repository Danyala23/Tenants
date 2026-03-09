import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { TextInput, Button, Text, Card, IconButton } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from './src/context/AuthContext';
import { useThemeMode } from './src/context/ThemeContext';
import { getServerUrl, setServerUrl, normalizeServerUrl } from './src/config';

export default function LoginScreen() {
  const [serverUrl, setServerUrlLocal] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showServerInput, setShowServerInput] = useState(false);
  const { login } = useAuth();
  const { theme, toggleTheme } = useThemeMode();
  const router = useRouter();

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
      const url = await getServerUrl();
      if (!url) {
        setShowServerInput(true);
        setError('Please configure the server URL first');
        setLoading(false);
        return;
      }
      await login(username, password);
      router.replace('/(app)');
    } catch {
      setError('Invalid username or password');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <IconButton
            icon={theme === 'dark' ? 'white-balance-sunny' : 'moon-waning-crescent'}
            onPress={toggleTheme}
            size={24}
          />
        </View>
        <Card style={styles.card}>
          <Card.Content>
            <Text variant="headlineMedium" style={styles.title}>
              Property Manager
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Sign in to your account
            </Text>

            {showServerInput ? (
              <>
                <TextInput
                  label="Server URL"
                  value={serverUrl}
                  onChangeText={setServerUrlLocal}
                  placeholder="https://your-server.com"
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  style={styles.input}
                />
                <Button mode="contained" onPress={handleSaveServerUrl} style={styles.button}>
                  Save Server URL
                </Button>
              </>
            ) : (
              <>
                <Button
                  mode="text"
                  onPress={() => setShowServerInput(true)}
                  style={styles.serverLink}
                >
                  Change Server URL
                </Button>
                {error ? (
                  <Text variant="bodyMedium" style={styles.error}>
                    {error}
                  </Text>
                ) : null}
                <TextInput
                  label="Username"
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Enter username"
                  mode="outlined"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.input}
                />
                <TextInput
                  label="Password"
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter password"
                  mode="outlined"
                  secureTextEntry
                  style={styles.input}
                />
                <Button
                  mode="contained"
                  onPress={handleLogin}
                  loading={loading}
                  disabled={loading}
                  style={styles.button}
                >
                  Sign In
                </Button>
              </>
            )}
          </Card.Content>
        </Card>
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
    padding: 24,
  },
  header: {
    position: 'absolute',
    top: 48,
    right: 8,
    zIndex: 10,
  },
  card: {
    marginVertical: 16,
  },
  title: {
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 16,
  },
  button: {
    marginTop: 8,
  },
  serverLink: {
    marginBottom: 8,
  },
  error: {
    color: '#d32f2f',
    marginBottom: 8,
  },
});
