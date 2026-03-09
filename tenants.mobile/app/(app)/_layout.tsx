import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerTitle: 'Property Manager',
      }}
    >
      <Stack.Screen
        name="(tabs)"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="property/[id]"
        options={{
          title: 'Property',
        }}
      />
      <Stack.Screen
        name="tenant/[id]"
        options={{
          title: 'Tenant',
        }}
      />
    </Stack>
  );
}
