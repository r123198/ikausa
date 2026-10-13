import { Tabs, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon } from '@/components/icon';
import { C, Fonts } from '@/constants/theme';

const TAB_BAR_HEIGHT = 60;

function CreateIcon() {
  return (
    <View style={styles.createIcon}>
      <Icon ios="plus" material="add" size={20} color={C.onPrimary} />
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: TAB_BAR_HEIGHT + insets.bottom }],
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.onSurfaceVariant,
        tabBarLabelStyle: styles.tabLabel,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <Icon ios="house.fill" material="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="create-placeholder"
        options={{
          title: 'New roll',
          tabBarIcon: () => <CreateIcon />,
          tabBarActiveTintColor: C.onSurface,
          tabBarInactiveTintColor: C.onSurface,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.push('/create/event-name');
          },
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Icon ios="person.crop.circle" material="account_circle" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.surfaceLow,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: C.outlineVariant,
  },
  tabLabel: {
    fontFamily: Fonts.hanken,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
  },
  createIcon: {
    width: 44,
    height: 26,
    borderRadius: 13,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
