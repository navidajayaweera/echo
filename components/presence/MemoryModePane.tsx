import { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MemoryRecalledEvent } from '@/lib/types/memory-events';
import { MemoryRecallCard } from './MemoryRecallCard';

interface Props {
  isOpen: boolean;
  memory: MemoryRecalledEvent | null;
  onClose: () => void;
  /** How far from the right edge to start, in pixels (accounts for safe area) */
  rightOffset?: number;
  /** How far from the bottom to start, in pixels (accounts for tab bar) */
  bottomOffset?: number;
}

const PANE_WIDTH = 240;

export function MemoryModePane({
  isOpen,
  memory,
  onClose,
  rightOffset = 0,
  bottomOffset = 0,
}: Props) {
  const slideAnim = useRef(new Animated.Value(PANE_WIDTH + 32)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: isOpen ? 0 : PANE_WIDTH + 32,
      useNativeDriver: true,
      tension: 80,
      friction: 12,
    }).start();
  }, [isOpen, slideAnim]);

  if (!memory && !isOpen) return null;

  return (
    <Animated.View
      style={[
        styles.pane,
        {
          right: rightOffset,
          bottom: bottomOffset,
          transform: [{ translateX: slideAnim }],
        },
      ]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Memory recalled</Text>
        <Pressable onPress={onClose} hitSlop={12}>
          <IconSymbol name="xmark" size={16} color={EchoColors.textMuted} />
        </Pressable>
      </View>

      {/* Card */}
      {memory ? <MemoryRecallCard memory={memory} /> : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pane: {
    position: 'absolute',
    width: PANE_WIDTH,
    backgroundColor: 'rgba(16,16,20,0.95)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
    padding: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: -4, height: 0 },
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLabel: {
    color: EchoColors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: EchoFonts.sans,
  },
});
