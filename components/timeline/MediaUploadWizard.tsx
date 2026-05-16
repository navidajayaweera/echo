import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import type { MediaType } from '@/lib/types/media-vault';

type Step = 1 | 2 | 3;

interface PickedAsset {
  uri: string;
  mimeType: string;
  fileName: string;
}

// 'note' is a UI-only type that maps to 'letter' in the DB
type UIMediaType = MediaType | 'note';

interface TypeOption {
  uiType: UIMediaType;
  dbType: MediaType;
  icon: string;
  label: string;
  hint: string;
  textOnly: boolean; // skips step 2 (no file picker)
}

const TYPE_OPTIONS: TypeOption[] = [
  { uiType: 'note',     dbType: 'letter',   icon: '📝', label: `Write a Note`,  hint: ' ',   textOnly: true },
  { uiType: 'photo',    dbType: 'photo',    icon: '🖼',  label: 'Photo',         hint: 'A picture from your life',    textOnly: false },
  { uiType: 'video',    dbType: 'video',    icon: '🎬', label: 'Video',          hint: 'A video clip or recording',   textOnly: false },
  { uiType: 'voice',    dbType: 'voice',    icon: '🎙', label: 'Voice',          hint: 'An audio recording',          textOnly: false },
  { uiType: 'letter',   dbType: 'letter',   icon: '✉️', label: 'Letter / Scan',  hint: 'A scanned letter or note',    textOnly: false },
  { uiType: 'document', dbType: 'document', icon: '📄', label: 'Document',       hint: 'A document or PDF',           textOnly: false },
];

interface UploadPayload {
  uri?: string;           // undefined for text-only notes
  mimeType?: string;
  fileName?: string;
  textContent?: string;   // populated for notes
  mediaType: MediaType;
  title?: string;
  description?: string;
  memoryDate: string;
  memoryYear: number;
}

interface Props {
  isUploading: boolean;
  onUpload: (payload: UploadPayload) => Promise<void>;
}

export function MediaUploadWizard({ isUploading, onUpload }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [step, setStep] = useState<Step>(1);
  const [selectedOption, setSelectedOption] = useState<TypeOption | null>(null);
  const [asset, setAsset] = useState<PickedAsset | null>(null);
  const [title, setTitle] = useState('');
  const [storyText, setStoryText] = useState('');  // primary text / description
  const [memoryDate, setMemoryDate] = useState(new Date().toISOString().slice(0, 10));
  const [saveError, setSaveError] = useState<string | null>(null);

  const reset = () => {
    setStep(1);
    setSelectedOption(null);
    setAsset(null);
    setTitle('');
    setStoryText('');
    setMemoryDate(new Date().toISOString().slice(0, 10));
    setSaveError(null);
  };

  const close = () => {
    reset();
    setModalOpen(false);
  };

  const selectType = (opt: TypeOption) => {
    setSelectedOption(opt);
    if (opt.textOnly) {
      // Text note — skip file picking, go directly to details
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const pickFile = async () => {
    if (!selectedOption) return;

    if (selectedOption.uiType === 'photo' || selectedOption.uiType === 'video') {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: selectedOption.uiType === 'photo' ? ['images'] : ['videos'],
        quality: 0.85,
        base64: false,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const a = result.assets[0];
      setAsset({
        uri: a.uri,
        mimeType: a.mimeType ?? (selectedOption.uiType === 'video' ? 'video/mp4' : 'image/jpeg'),
        fileName: a.fileName ?? `${selectedOption.uiType}_${Date.now()}`,
      });
    } else {
      const mimeMap: Record<string, string> = {
        voice: 'audio/*',
        letter: '*/*',
        document: 'application/pdf',
      };
      const result = await DocumentPicker.getDocumentAsync({
        type: mimeMap[selectedOption.uiType] ?? '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const a = result.assets[0];
      setAsset({
        uri: a.uri,
        mimeType: a.mimeType ?? 'application/octet-stream',
        fileName: a.name,
      });
    }
    setStep(3);
  };

  const handleSave = async () => {
    if (!selectedOption) return;
    const isNote = selectedOption.textOnly;
    if (!isNote && !asset) return;
    if (isNote && !storyText.trim()) return;

    const year = parseInt(memoryDate.slice(0, 4), 10);
    const payload: UploadPayload = {
      mediaType: selectedOption.dbType,
      title: title.trim() || undefined,
      description: storyText.trim() || undefined,
      memoryDate,
      memoryYear: isNaN(year) ? new Date().getFullYear() : year,
    };

    if (isNote) {
      payload.textContent = storyText.trim();
      payload.mimeType = 'text/plain';
      payload.fileName = `note_${Date.now()}.txt`;
    } else if (asset) {
      payload.uri = asset.uri;
      payload.mimeType = asset.mimeType;
      payload.fileName = asset.fileName;
    }

    setSaveError(null);
    try {
      await onUpload(payload);
      close();
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Upload failed');
    }
  };

  const parseDateDisplay = (iso: string): string => {
    const d = new Date(iso + 'T00:00:00');
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const adjustDate = (days: number) => {
    const d = new Date(memoryDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const capped = d > new Date() ? new Date() : d;
    setMemoryDate(capped.toISOString().slice(0, 10));
  };

  const isNote = selectedOption?.textOnly ?? false;
  const canSave = isNote ? storyText.trim().length > 0 : !!asset;

  return (
    <>
      <Pressable
        style={[styles.trigger, isUploading && styles.triggerDisabled]}
        onPress={() => setModalOpen(true)}
        disabled={isUploading}
        accessibilityRole="button"
        accessibilityLabel="Add a memory">
        {isUploading ? (
          <ActivityIndicator size="small" color={EchoColors.accent} />
        ) : (
          <>
            <Text style={styles.triggerIcon}>+</Text>
            <Text style={styles.triggerText}>Add a Memory</Text>
          </>
        )}
      </Pressable>

      <Modal visible={modalOpen} animationType="slide" transparent onRequestClose={close}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={styles.sheet}>
          {/* Step indicator — only show 2 steps for notes, 3 for files */}
          <View style={styles.stepRow}>
            {([1, 2, 3] as Step[]).map((n, i) => {
              const isSkipped = isNote && n === 2;
              return (
                <View key={n} style={styles.stepItem}>
                  <View
                    style={[
                      styles.stepDot,
                      step >= n && !isSkipped && styles.stepDotActive,
                      isSkipped && styles.stepDotSkipped,
                    ]}>
                    <Text
                      style={[
                        styles.stepNum,
                        step >= n && !isSkipped && styles.stepNumActive,
                      ]}>
                      {n}
                    </Text>
                  </View>
                  {i < 2 ? (
                    <View
                      style={[styles.stepLine, step > n && !isSkipped && styles.stepLineActive]}
                    />
                  ) : null}
                </View>
              );
            })}
          </View>

          {/* ── Step 1: Choose type ── */}
          {step === 1 && (
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.heading}>What kind of memory?</Text>
              <View style={styles.typeGrid}>
                {TYPE_OPTIONS.map((opt) => (
                  <Pressable
                    key={opt.uiType}
                    style={({ pressed }) => [
                      styles.typeCard,
                      selectedOption?.uiType === opt.uiType && styles.typeCardActive,
                      pressed && styles.typeCardPressed,
                      opt.textOnly && styles.typeCardNote,
                    ]}
                    onPress={() => selectType(opt)}
                    accessibilityRole="button"
                    accessibilityLabel={opt.label}>
                    <Text style={styles.typeIcon}>{opt.icon}</Text>
                    <Text style={styles.typeLabel}>{opt.label}</Text>
                    <Text style={styles.typeHint}>{opt.hint}</Text>
                  </Pressable>
                ))}
              </View>
              <Pressable style={styles.cancelBtn} onPress={close}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </ScrollView>
          )}

          {/* ── Step 2: Pick file (skipped for notes) ── */}
          {step === 2 && selectedOption && !selectedOption.textOnly && (
            <View style={styles.stepContent}>
              <Text style={styles.heading}>
                {selectedOption.icon}  {selectedOption.label}
              </Text>
              <Text style={styles.pickHint}>Tap below to choose a file from your device.</Text>
              <Pressable
                style={({ pressed }) => [styles.pickBtn, pressed && { opacity: 0.75 }]}
                onPress={pickFile}
                accessibilityRole="button">
                <Text style={styles.pickBtnText}>Choose File</Text>
              </Pressable>
              <View style={styles.stepActions}>
                <Pressable style={styles.cancelBtn} onPress={() => setStep(1)}>
                  <Text style={styles.cancelText}>← Back</Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* ── Step 3: Details (title, story, date) ── */}
          {step === 3 && (
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled">
              <Text style={styles.heading}>
                {isNote ? '📝  Write your memory' : 'Add details'}
              </Text>

              {/* Story / Notes — PRIMARY field, always shown first and large */}
              <Text style={styles.fieldLabel}>
                {isNote ? 'Your memory' : 'Write about this'}
              </Text>
              <TextInput
                style={[styles.input, styles.storyInput]}
                placeholder={
                  isNote
                    ? 'Write a memory, story, or something important to remember…'
                    : 'What do you remember about this? Where were you? Who was there?'
                }
                placeholderTextColor={EchoColors.textDim}
                value={storyText}
                onChangeText={setStoryText}
                multiline
                textAlignVertical="top"
                autoFocus={isNote}
              />

              {/* Title — secondary for notes, primary for files */}
              <Text style={styles.fieldLabel}>
                {isNote ? 'Title (optional)' : 'Title'}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={
                  isNote
                    ? 'Give this memory a name…'
                    : `${selectedOption?.label ?? 'Memory'} title…`
                }
                placeholderTextColor={EchoColors.textDim}
                value={title}
                onChangeText={setTitle}
              />

              {/* Date stepper */}
              <Text style={styles.fieldLabel}>When was this?</Text>
              <View style={styles.dateRow}>
                <Pressable style={styles.dateStepper} onPress={() => adjustDate(-1)}>
                  <Text style={styles.dateStepperText}>‹</Text>
                </Pressable>
                <View style={styles.dateDisplay}>
                  <Text style={styles.dateText}>{parseDateDisplay(memoryDate)}</Text>
                </View>
                <Pressable
                  style={styles.dateStepper}
                  onPress={() => adjustDate(1)}
                  disabled={memoryDate >= new Date().toISOString().slice(0, 10)}>
                  <Text style={styles.dateStepperText}>›</Text>
                </Pressable>
              </View>
              <Text style={styles.dateHint}>Use ‹ › to go back or forward one day</Text>

              {saveError ? <Text style={styles.saveError}>{saveError}</Text> : null}

              <View style={styles.stepActions}>
                <Pressable
                  style={styles.cancelBtn}
                  onPress={() => setStep(isNote ? 1 : 2)}>
                  <Text style={styles.cancelText}>← Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, (!canSave || isUploading) && styles.saveBtnDisabled]}
                  onPress={handleSave}
                  disabled={!canSave || isUploading}>
                  {isUploading ? (
                    <ActivityIndicator size="small" color={EchoColors.bg} />
                  ) : (
                    <Text style={styles.saveBtnText}>Save Memory</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20,
    marginBottom: 8,
    paddingVertical: 20,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    borderStyle: 'dashed',
    backgroundColor: EchoColors.bgElevated,
  },
  triggerDisabled: { opacity: 0.5 },
  triggerIcon: {
    color: EchoColors.accentWarm,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  triggerText: {
    color: EchoColors.textMuted,
    fontSize: 17,
    fontWeight: '500',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: EchoColors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 28,
    maxHeight: '92%',
    borderTopWidth: 1,
    borderColor: EchoColors.border,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: EchoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotActive: {
    backgroundColor: EchoColors.accentWarm,
  },
  stepDotSkipped: {
    opacity: 0.3,
  },
  stepNum: {
    color: EchoColors.textDim,
    fontSize: 13,
    fontWeight: '700',
  },
  stepNumActive: {
    color: EchoColors.bg,
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: EchoColors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: EchoColors.accentWarm,
  },
  heading: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 20,
    letterSpacing: -0.3,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  typeCard: {
    width: '47%',
    padding: 18,
    backgroundColor: EchoColors.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: EchoColors.border,
    alignItems: 'flex-start',
    gap: 6,
  },
  // "Write a Note" spans full width at the top
  typeCardNote: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 20,
    borderColor: EchoColors.accentWarm,
    backgroundColor: 'rgba(232,184,109,0.06)',
  },
  typeCardActive: {
    borderColor: EchoColors.accentWarm,
    backgroundColor: 'rgba(232,184,109,0.1)',
  },
  typeCardPressed: { opacity: 0.75 },
  typeIcon: { fontSize: 28 },
  typeLabel: {
    color: EchoColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  typeHint: {
    color: EchoColors.textDim,
    fontSize: 12,
    lineHeight: 16,
  },
  stepContent: { gap: 12 },
  pickHint: {
    color: EchoColors.textMuted,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  pickBtn: {
    backgroundColor: EchoColors.accent,
    borderRadius: 14,
    paddingVertical: 18,
    alignItems: 'center',
  },
  pickBtnText: {
    color: EchoColors.bg,
    fontSize: 17,
    fontWeight: '700',
  },
  fieldLabel: {
    color: EchoColors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 6,
    marginTop: 8,
  },
  input: {
    backgroundColor: EchoColors.bg,
    borderRadius: 12,
    padding: 16,
    color: EchoColors.text,
    fontSize: 16,
    borderWidth: 1,
    borderColor: EchoColors.border,
    marginBottom: 4,
  },
  // Story / notes field — large, prominent, easy to read/write
  storyInput: {
    minHeight: 160,
    fontSize: 17,
    lineHeight: 26,
    borderColor: EchoColors.accentWarm,
    borderWidth: 1.5,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  dateStepper: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: EchoColors.bg,
    borderWidth: 1,
    borderColor: EchoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateStepperText: {
    color: EchoColors.text,
    fontSize: 26,
    fontWeight: '300',
  },
  dateDisplay: {
    flex: 1,
    height: 52,
    backgroundColor: EchoColors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    color: EchoColors.text,
    fontSize: 15,
    fontWeight: '500',
  },
  dateHint: {
    color: EchoColors.textDim,
    fontSize: 12,
    marginBottom: 16,
  },
  stepActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  cancelText: {
    color: EchoColors.textMuted,
    fontSize: 16,
    fontWeight: '500',
  },
  saveBtn: {
    flex: 2,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: EchoColors.accent,
  },
  saveBtnDisabled: { opacity: 0.4 },
  saveBtnText: {
    color: EchoColors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  saveError: {
    color: '#E8A0A0',
    fontSize: 14,
    marginBottom: 12,
    lineHeight: 20,
  },
});
