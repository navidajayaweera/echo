import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EchoLayout } from '@/constants/echo-theme';

/**
 * Consistent safe-area + tab bar spacing for screens and floating controls.
 */
export function useAppInsets(options?: { includeTabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const bottomInset = insets.bottom;
  const tabBar = options?.includeTabBar ? tabBarHeight : 0;
  const contentBottom = tabBar + EchoLayout.contentBottomGap;
  const fabBottom = tabBar + bottomInset + EchoLayout.fabOffset;

  return {
    top: insets.top,
    bottom: bottomInset,
    left: insets.left,
    right: insets.right,
    horizontal: EchoLayout.screenHorizontal,
    tabBarHeight,
    contentBottom,
    fabBottom,
    screenPaddingTop: insets.top + EchoLayout.screenTopExtra,
  };
}
