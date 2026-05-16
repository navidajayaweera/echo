// Material Icons fallback for Android and web (iOS uses icon-symbol.ios.tsx).

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

const MAPPING: Record<string, MaterialIconName> = {
  'house.fill': 'home',
  'book.fill': 'menu-book',
  'video.fill': 'videocam',
  'clock.fill': 'schedule',
  'gearshape.fill': 'settings',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
  'plus': 'add',
  'magnifyingglass': 'search',
  'person.fill': 'person',
  'person.2.fill': 'people',
  'archivebox.fill': 'inventory-2',
  'photo.fill': 'photo',
  'mic.fill': 'mic',
};

export type IconSymbolName = SymbolViewProps['name'];

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const materialName = MAPPING[name] ?? 'help-outline';

  return (
    <MaterialIcons color={color} size={size} name={materialName} style={style} />
  );
}
