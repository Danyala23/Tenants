import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from 'react-native-paper';
import { Platform } from 'react-native';
import { FontFamily } from '../../../src/theme';

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 90 : 68,
          paddingTop: 10,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: FontFamily.semibold,
          marginTop: 3,
        },
        tabBarItemStyle: {
          borderRadius: 12,
        },
        headerStyle: {
          backgroundColor: theme.colors.surface,
          elevation: 0,
        },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: {
          fontFamily: FontFamily.display,
          fontSize: 22,
        },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Properties',
          headerTitle: 'My Properties',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'home-city' : 'home-city-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name={focused ? 'cog' : 'cog-outline'}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
