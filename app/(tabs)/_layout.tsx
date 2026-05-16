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
          paddingTop: 8,
          paddingBottom: insets.bottom + 4,
          paddingHorizontal: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerShown: false,
        tabBarButton: HapticTab,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="house.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="personas"
        options={{
          title: 'Personas',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="person.2.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="presence"
        options={{
          title: 'Presence',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="video.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="vault"
        options={{
          title: 'Vault',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="archivebox.fill" color={color} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color }) => <IconSymbol size={24} name="gearshape.fill" color={color} />,
        }}
      />
      <Tabs.Screen name="journal" options={{ href: null }} />
      <Tabs.Screen name="timeline" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
    marginBottom: Platform.OS === 'ios' ? 0 : 4,
  },
  tabIcon: {
    marginBottom: 0,
  },
});
