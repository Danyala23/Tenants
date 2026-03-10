import { Stack } from 'expo-router';
import { useTheme } from 'react-native-paper';

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
          fontWeight: '600',
          fontSize: 18,
        },
        headerShadowVisible: false,
        headerBackTitleVisible: false,
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
