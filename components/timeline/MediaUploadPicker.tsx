import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';

interface Props {
  isUploading: boolean;
  onUpload: (memoryYear: number, title?: string) => Promise<void>;
}

export function MediaUploadPicker({ isUploading, onUpload }: Props) {
  const [modalVisible, setModalVisible] = useState(false);
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [title, setTitle] = useState('');

  const handleConfirm = async () => {
    const y = parseInt(year, 10);
    if (!y || y < 1900 || y > new Date().getFullYear()) return;
    setModalVisible(false);
    await onUpload(y, title.trim() || undefined);
    setTitle('');
  };

  return (
    <>
      <Pressable
        style={[styles.trigger, isUploading && styles.triggerDisabled]}
        onPress={() => setModalVisible(true)}
        disabled={isUploading}>
        {isUploading ? (
          <ActivityIndicator size="small" color={EchoColors.accent} />
        ) : (
          <Text style={styles.triggerText}>+ Add memory</Text>
        )}
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.backdrop} onPress={() => setModalVisible(false)} />
        <View style={styles.sheet}>
          <Text style={styles.sheetTitle}>Add a memory</Text>

          <Text style={styles.label}>Year (e.g. 1985)</Text>
          <TextInput
            style={styles.input}
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="Year"
            placeholderTextColor={EchoColors.textDim}
          />

          <Text style={styles.label}>Title (optional)</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Summer in Italy…"
            placeholderTextColor={EchoColors.textDim}
          />

          <View style={styles.row}>
            <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Choose photo / video</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  triggerDisabled: { opacity: 0.5 },
  triggerText: {
    color: EchoColors.textMuted,
    fontSize: 15,
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: EchoColors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    gap: 8,
  },
  sheetTitle: {
    fontFamily: EchoFonts.serif,
    fontSize: 22,
    color: EchoColors.text,
    marginBottom: 8,
  },
  label: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 8,
  },
  input: {
    backgroundColor: EchoColors.bg,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: EchoColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    alignItems: 'center',
  },
  cancelText: {
    color: EchoColors.textMuted,
    fontWeight: '500',
  },
  confirmBtn: {
    flex: 2,
    padding: 14,
    borderRadius: 12,
    backgroundColor: EchoColors.accent,
    alignItems: 'center',
  },
  confirmText: {
    color: EchoColors.bg,
    fontWeight: '600',
  },
});
