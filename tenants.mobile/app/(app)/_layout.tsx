import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';
import { FontFamily } from '../../src/theme';

export default function AppLayout() {
  const theme = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: theme.colors.surface,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: FontFamily.displaySemi,
          fontSize: 19,
        },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: {
          backgroundColor: theme.colors.background,
        },
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="property/[id]"
        options={{ title: 'Property' }}
      />
      <Stack.Screen
        name="tenant/[id]"
        options={{ title: 'Tenant' }}
      />
    </Stack>
  );
}
