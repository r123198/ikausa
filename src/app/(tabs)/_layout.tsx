import { Tabs, useRouter } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { C, Fonts } from '@/constants/theme';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

const TABS = {
  index: { ios: 'film.stack', material: 'photo_library', label: 'Rolls' },
  profile: { ios: 'person.crop.circle', material: 'account_circle', label: 'Profile' },
} as const;

function FloatingTabBar({ state, navigation }: TabBarProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  function renderTab(name: keyof typeof TABS) {
    const index = state.routes.findIndex((r) => r.name === name);
    const route = state.routes[index];
    const isFocused = state.index === index;
    const tab = TABS[name];
    const color = isFocused ? C.onSurface : C.textMuted;

    return (
      <Pressable
        key={name}
        accessibilityRole="tab"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={tab.label}
        style={styles.tab}
        onPress={() => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) navigation.navigate(route.name);
        }}>
        <Icon ios={tab.ios} material={tab.material} size={22} color={color} />
        <Text style={[styles.tabLabel, { color }]}>{tab.label}</Text>
      </Pressable>
    );
  }

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.bar}>
        {renderTab('index')}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="New roll"
          style={({ pressed }) => [styles.create, pressed && styles.pressed]}
          onPress={() => router.push('/create/name')}>
          <Icon ios="plus" material="add" size={26} color={C.onPrimary} />
        </Pressable>
        {renderTab('profile')}
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <FloatingTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Rolls' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 32,
    backgroundColor: 'rgba(28,28,30,0.96)',
    borderWidth: 1,
    borderColor: C.hairline,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 16,
  },
  tab: { width: 76, height: 52, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabLabel: { fontFamily: Fonts.hanken, fontSize: 11, lineHeight: 14, fontWeight: '600' },
  create: {
    width: 60,
    height: 52,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.85, transform: [{ scale: 0.97 }] },
});
