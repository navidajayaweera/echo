import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EchoLayout } from '@/constants/echo-theme';

/** Safe-area + tab bar spacing; height matches `app/(tabs)/_layout.tsx`. */
export function useAppInsets(options?: { includeTabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const tabBarHeight = EchoLayout.tabBarBaseHeight + insets.bottom;

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
