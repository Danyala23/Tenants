import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { List, TextInput, Button, Text, Switch, Divider } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { useThemeMode } from '../../src/context/ThemeContext';
import { getServerUrl, setServerUrl, normalizeServerUrl } from '../../src/config';

export default function SettingsScreen() {
  const [serverUrl, setServerUrlLocal] = useState('');
  const [saved, setSaved] = useState(false);
  const { logout } = useAuth();
  const { theme, toggleTheme } = useThemeMode();
  const router = useRouter();

  useEffect(() => {
    getServerUrl().then(setServerUrlLocal);
  }, []);

  const handleSaveUrl = async () => {
    const normalized = normalizeServerUrl(serverUrl);
    if (!normalized) return;
    await setServerUrl(normalized);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.container}>
      <List.Section>
        <List.Subheader>Server</List.Subheader>
        <TextInput
          label="Server URL"
          value={serverUrl}
          onChangeText={setServerUrlLocal}
          placeholder="https://your-server.com"
          mode="outlined"
          style={styles.input}
        />
        <Button mode="contained" onPress={handleSaveUrl} style={styles.button}>
          {saved ? 'Saved!' : 'Save Server URL'}
        </Button>
      </List.Section>
      <Divider />
      <List.Section>
        <List.Subheader>Appearance</List.Subheader>
        <List.Item
          title="Dark mode"
          right={() => (
            <Switch value={theme === 'dark'} onValueChange={toggleTheme} />
          )}
        />
      </List.Section>
      <Divider />
      <List.Section>
        <List.Subheader>Account</List.Subheader>
        <Button mode="outlined" onPress={handleLogout} style={styles.button}>
          Log Out
        </Button>
      </List.Section>
      <View style={styles.footer}>
        <Text variant="bodySmall">Property Manager v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  input: {
    marginHorizontal: 16,
    marginBottom: 8,
  },
  button: {
    margin: 16,
  },
  footer: {
    padding: 24,
    alignItems: 'center',
  },
});
