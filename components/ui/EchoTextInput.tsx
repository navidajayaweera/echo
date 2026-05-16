import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

export function EchoTextInput(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={EchoColors.textDim}
      autoCapitalize="none"
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    padding: 16,
    color: EchoColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 12,
  },
});
