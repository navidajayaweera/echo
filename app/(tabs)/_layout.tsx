import { Tabs } from 'expo-router';
import { Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoLayout } from '@/constants/echo-theme';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = EchoLayout.tabBarBaseHeight + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: EchoColors.primary,
        tabBarInactiveTintColor: EchoColors.textDim,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIconStyle: styles.tabIcon,
        tabBarStyle: {
          backgroundColor: EchoColors.bgLowest,
          borderTopColor: EchoColors.glassBorder,
          borderTopWidth: StyleSheet.hairlineWidth,
          height: tabBarHeight,
          paddingTop: 12,
          paddingBottom: Math.max(insets.bottom, 10) + 8,
          paddingHorizontal: 4,
        },
        tabBarItemStyle: {
          minHeight: 52,
          paddingVertical: 8,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="presence"
        options={{
          title: 'Presence',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="video.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="archivebox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={30} name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="timeline" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginTop: 4,
    marginBottom: Platform.OS === 'ios' ? 2 : 6,
  },
  tabIcon: {
    marginBottom: 2,
  },
});
