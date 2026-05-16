import { StyleSheet, TextInput, type TextInputProps } from 'react-native';

import { EchoColors } from '@/constants/echo-theme';

export function JournalSearchBar(props: TextInputProps) {
  return (
    <TextInput
      placeholder="Search memories…"
      placeholderTextColor={EchoColors.textDim}
      {...props}
      style={[styles.input, props.style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    padding: 14,
    color: EchoColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 12,
  },
});
