import { ScrollView, StyleSheet, View } from 'react-native';
import { Text, Provider as PaperProvider } from 'react-native-paper';
import type { AppConfigIssue } from '../appConfig';
import { Colors, LightTheme, Radius, Spacing } from '../theme';

interface ConfigErrorScreenProps {
  issues: AppConfigIssue[];
}

export function ConfigErrorScreen({ issues }: ConfigErrorScreenProps) {
  const blocking = issues.filter((issue) => issue.blocking);
  const optional = issues.filter((issue) => !issue.blocking);

  return (
    <PaperProvider theme={LightTheme}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Configuration required
        </Text>
        <Text variant="bodyMedium" style={styles.subtitle}>
          This build is missing settings the app needs to start. Fix the items below, then rebuild
          and reinstall the APK.
        </Text>

        {blocking.map((issue) => (
          <View key={issue.id} style={[styles.card, styles.cardBlocking]}>
            <Text variant="titleMedium" style={styles.cardTitle}>
              {issue.title}
            </Text>
            <Text variant="bodyMedium" style={styles.cardDetail}>
              {issue.detail}
            </Text>
          </View>
        ))}

        {optional.length > 0 && (
          <>
            <Text variant="titleSmall" style={styles.sectionLabel}>
              Also worth checking
            </Text>
            {optional.map((issue) => (
              <View key={issue.id} style={[styles.card, styles.cardOptional]}>
                <Text variant="titleMedium" style={styles.cardTitle}>
                  {issue.title}
                </Text>
                <Text variant="bodyMedium" style={styles.cardDetail}>
                  {issue.detail}
                </Text>
              </View>
            ))}
          </>
        )}

        <View style={styles.hintBox}>
          <Text variant="labelLarge" style={styles.hintTitle}>
            EAS / release APK
          </Text>
          <Text variant="bodySmall" style={styles.hintText}>
            Local .env is not uploaded to EAS. In expo.dev → tenants-mobile → Environment
            variables, add the EXPO_PUBLIC_* names for your build profile (preview or production),
            then run eas build again.
          </Text>
        </View>
      </ScrollView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: Spacing.xl,
    paddingTop: Spacing.xxxl * 2,
    backgroundColor: Colors.background,
  },
  title: {
    color: Colors.text,
    fontWeight: '700',
  },
  subtitle: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
    lineHeight: 22,
  },
  sectionLabel: {
    color: Colors.textSecondary,
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: Radius.md,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    borderWidth: 1,
  },
  cardBlocking: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
  },
  cardOptional: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
  },
  cardTitle: {
    color: Colors.text,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  cardDetail: {
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  hintBox: {
    marginTop: Spacing.lg,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    backgroundColor: Colors.primarySurface,
    borderWidth: 1,
    borderColor: Colors.primaryLight,
  },
  hintTitle: {
    color: Colors.primaryDark,
    marginBottom: Spacing.xs,
  },
  hintText: {
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
