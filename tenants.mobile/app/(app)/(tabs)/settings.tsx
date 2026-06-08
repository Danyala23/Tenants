import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { TextInput, Button, Text, Switch, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import { useThemeMode } from '../../../src/context/ThemeContext';
import { getServerUrl, setServerUrl, normalizeServerUrl } from '../../../src/config';
import { Colors, Spacing, Radius, Gradients, FontFamily } from '../../../src/theme';

export default function SettingsScreen() {
  const [serverUrl, setServerUrlLocal] = useState('');
  const [saved, setSaved] = useState(false);
  const { logout } = useAuth();
  const { theme: themeMode, toggleTheme } = useThemeMode();
  const theme = useTheme();
  const router = useRouter();
  const isDark = themeMode === 'dark';

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
    <ScrollView
      style={{ backgroundColor: theme.colors.background }}
      contentContainerStyle={styles.container}
    >
      {/* Brand hero */}
      <LinearGradient
        colors={isDark ? Gradients.brandDark : Gradients.brand}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <View style={styles.heroMark}>
          <MaterialCommunityIcons name="home-city" size={26} color="#FFFFFF" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.heroTitle}>Haven</Text>
          <Text style={styles.heroSubtitle}>Property &amp; tenant manager</Text>
        </View>
      </LinearGradient>

      {/* Server Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="server-network"
            size={18}
            color={theme.colors.primary}
          />
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Server
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <TextInput
            label="Server URL"
            value={serverUrl}
            onChangeText={setServerUrlLocal}
            placeholder="https://your-app.vercel.app"
            mode="outlined"
            style={styles.input}
            outlineStyle={styles.inputOutline}
            left={<TextInput.Icon icon="link-variant" />}
          />
          <Button
            mode="contained"
            onPress={handleSaveUrl}
            style={styles.saveBtn}
            contentStyle={styles.saveBtnContent}
            labelStyle={styles.saveBtnLabel}
            icon={saved ? 'check' : undefined}
          >
            {saved ? 'Saved!' : 'Save Server URL'}
          </Button>
        </View>
      </View>

      {/* Appearance Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="palette-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Appearance
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <MaterialCommunityIcons
                name={isDark ? 'moon-waning-crescent' : 'white-balance-sunny'}
                size={20}
                color={theme.colors.onSurface}
              />
              <View style={styles.settingText}>
                <Text variant="bodyLarge" style={{ color: theme.colors.onSurface }}>
                  Dark Mode
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {isDark ? 'Currently using dark theme' : 'Currently using light theme'}
                </Text>
              </View>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              color={Colors.primary}
            />
          </View>
        </View>
      </View>

      {/* Account Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons
            name="account-circle-outline"
            size={18}
            color={theme.colors.primary}
          />
          <Text
            variant="titleSmall"
            style={[styles.sectionTitle, { color: theme.colors.onBackground }]}
          >
            Account
          </Text>
        </View>
        <View style={[styles.card, { backgroundColor: theme.colors.surface, borderColor: theme.colors.outlineVariant }]}>
          <Button
            mode="outlined"
            onPress={handleLogout}
            style={styles.logoutBtn}
            contentStyle={styles.logoutBtnContent}
            textColor={Colors.error}
            icon="logout"
          >
            Log Out
          </Button>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <MaterialCommunityIcons
          name="home-city"
          size={20}
          color={theme.colors.onSurfaceVariant}
          style={{ opacity: 0.4 }}
        />
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, opacity: 0.6, marginTop: 4 }}>
          Property Manager v1.0.0
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  hero: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
    borderRadius: Radius.xl,
    marginBottom: Spacing.xxl,
    shadowColor: Colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 6,
  },
  heroMark: {
    width: 48,
    height: 48,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontFamily: FontFamily.display,
    fontSize: 24,
    color: '#FFFFFF',
  },
  heroSubtitle: {
    fontFamily: FontFamily.medium,
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  section: {
    marginBottom: Spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  sectionTitle: {
    fontFamily: FontFamily.displaySemi,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontSize: 12,
  },
  card: {
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
  },
  input: {
    marginBottom: Spacing.md,
  },
  inputOutline: {
    borderRadius: Radius.sm,
  },
  saveBtn: {
    borderRadius: Radius.sm,
  },
  saveBtnContent: {
    height: 44,
  },
  saveBtnLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  logoutBtn: {
    borderRadius: Radius.sm,
    borderColor: Colors.error,
  },
  logoutBtnContent: {
    height: 44,
  },
  footer: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.lg,
  },
});
