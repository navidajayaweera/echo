import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

interface JournalComposerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: { title?: string; body: string; memoryYear?: number }) => void;
}

export function JournalComposer({ visible, onClose, onSave }: JournalComposerProps) {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [year, setYear] = useState('');

  const handleSave = () => {
    if (!body.trim()) return;
    onSave({
      title: title.trim() || undefined,
      body: body.trim(),
      memoryYear: year ? parseInt(year, 10) : undefined,
    });
    setTitle('');
    setBody('');
    setYear('');
    onClose();
  };

  const handleClose = () => {
    setTitle('');
    setBody('');
    setYear('');
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.sheet}>
          <Text style={styles.heading}>New memory</Text>
          <TextInput
            style={styles.input}
            placeholder="Title (optional)"
            placeholderTextColor="#6B6966"
            value={title}
            onChangeText={setTitle}
          />
          <TextInput
            style={[styles.input, styles.bodyInput]}
            placeholder="What do you want to preserve?"
            placeholderTextColor="#6B6966"
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
          <TextInput
            style={styles.input}
            placeholder="Year (e.g. 1974)"
            placeholderTextColor="#6B6966"
            value={year}
            onChangeText={setYear}
            keyboardType="number-pad"
          />
          <View style={styles.actions}>
            <Pressable style={styles.cancelBtn} onPress={handleClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.saveBtn, !body.trim() && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!body.trim()}>
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  sheet: {
    backgroundColor: '#141416',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: '#232326',
  },
  heading: {
    color: '#F4F2EF',
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#0A0A0B',
    borderRadius: 10,
    padding: 14,
    color: '#F4F2EF',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#232326',
  },
  bodyInput: {
    minHeight: 120,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#232326',
  },
  cancelText: {
    color: '#A8A6A1',
    fontSize: 16,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
    borderRadius: 12,
    backgroundColor: '#E8E6E3',
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveText: {
    color: '#0A0A0B',
    fontSize: 16,
    fontWeight: '600',
  },
});
