import { LinearGradient } from 'expo-linear-gradient';
import { StyleSheet, View, type ViewProps } from 'react-native';

import { EchoColors, EchoLayout } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';

interface ScreenContainerProps extends ViewProps {
  withGradient?: boolean;
  edges?: ('top' | 'bottom')[];
  /** Add padding above the bottom tab bar (use on tab screens) */
  includeTabBarPadding?: boolean;
}

export function ScreenContainer({
  children,
  withGradient = true,
  edges = ['top'],
  includeTabBarPadding = false,
  style,
  ...props
}: ScreenContainerProps) {
  const { top, bottom, left, right, screenPaddingTop, contentBottom, horizontal } =
    useAppInsets({ includeTabBar: includeTabBarPadding });

  const paddingTop = edges.includes('top') ? screenPaddingTop : 0;
  const paddingBottom = edges.includes('bottom')
    ? bottom + EchoLayout.contentBottomGap
    : includeTabBarPadding
      ? contentBottom
      : 0;

  const content = (
    <View
      style={[
        styles.inner,
        {
          paddingTop,
          paddingBottom,
          paddingLeft: horizontal + left,
          paddingRight: horizontal + right,
        },
        style,
      ]}
      {...props}>
      <View style={styles.contentWrap}>{children}</View>
    </View>
  );

  if (!withGradient) {
    return <View style={styles.root}>{content}</View>;
  }

  return (
    <LinearGradient
      colors={[EchoColors.gradientStart, EchoColors.gradientMid, EchoColors.gradientEnd]}
      style={styles.root}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}>
      {content}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: EchoColors.bg,
  },
  inner: {
    flex: 1,
  },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: EchoLayout.maxContentWidth,
    alignSelf: 'center',
  },
});
