import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { C } from '@/constants/theme';

function TabIcon({ glyph, focused }: { glyph: string; focused: boolean }) {
  return (
    <View style={styles.tabItem}>
      <Text style={[styles.tabGlyph, focused && styles.tabGlyphActive]}>{glyph}</Text>
    </View>
  );
}

function CreateFab() {
  const router = useRouter();
  return (
    <Pressable
      style={styles.fab}
      onPress={() => router.push('/create/event-name')}>
      <Text style={styles.fabIcon}>+</Text>
    </Pressable>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { paddingBottom: insets.bottom > 0 ? insets.bottom : 0 }],
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.onSurfaceVariant,
        tabBarShowLabel: false,
        tabBarBackground: () => <View style={styles.tabBarBg} />,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="⌂" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="rolls"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="◈" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="create-placeholder"
        options={{
          tabBarIcon: () => <CreateFab />,
          tabBarLabel: () => null,
        }}
        listeners={{
          tabPress: (e) => e.preventDefault(),
        }}
      />
      <Tabs.Screen
        name="invite"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="↗" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon glyph="◎" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
    marginHorizontal: 16,
    backgroundColor: `${C.surface}ee`,
    borderRadius: 100,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 64,
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBarBg: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 48,
    height: 48,
  },
  tabGlyph: {
    fontSize: 26,
    color: C.onSurfaceVariant,
    opacity: 0.6,
  },
  tabGlyphActive: {
    color: C.primaryFixed,
    opacity: 1,
  },
  fab: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: C.background,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 28,
    color: C.onPrimary,
    lineHeight: 32,
    fontWeight: '300',
  },
});
