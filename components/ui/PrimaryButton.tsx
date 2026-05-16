import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'filled' | 'outline' | 'ghost';
}

export function PrimaryButton({
  label,
  onPress,
  disabled,
  loading,
  variant = 'filled',
}: PrimaryButtonProps) {
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        variant === 'filled' && styles.filled,
        variant === 'outline' && styles.outline,
        variant === 'ghost' && styles.ghost,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}
      onPress={handlePress}
      disabled={disabled || loading}>
      {loading ? (
        <ActivityIndicator color={variant === 'filled' ? EchoColors.bg : EchoColors.accent} />
      ) : (
        <Text
          style={[
            styles.label,
            variant === 'filled' && styles.labelFilled,
            variant !== 'filled' && styles.labelOutline,
          ]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 28,
    paddingVertical: 16,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 52,
  },
  filled: {
    backgroundColor: EchoColors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  disabled: {
    opacity: 0.45,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  labelFilled: {
    color: EchoColors.onPrimary,
  },
  labelOutline: {
    color: EchoColors.text,
  },
});
