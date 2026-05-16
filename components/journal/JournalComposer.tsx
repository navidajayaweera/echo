import { File } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { MediaAttachmentStrip, type AttachedMedia } from '@/components/journal/MediaAttachmentStrip';
import { MoodPicker, type MoodKey } from '@/components/journal/MoodPicker';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { getSupabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuth } from '@/providers/AuthProvider';

const BUCKET = 'media-vault';

interface JournalComposerProps {
  visible: boolean;
  onClose: () => void;
  onSave: (input: {
    title?: string;
    body: string;
    moodTag?: string;
    mediaVaultIds?: string[];
  }) => void;
}

export function JournalComposer({ visible, onClose, onSave }: JournalComposerProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [mood, setMood] = useState<MoodKey | null>(null);
  const [media, setMedia] = useState<AttachedMedia[]>([]);
  const [saving, setSaving] = useState(false);

  const reset = useCallback(() => {
    setStep(1);
    setTitle('');
    setBody('');
    setMood(null);
    setMedia([]);
    setSaving(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const goToStep2 = () => {
    if (!body.trim()) return;
    setStep(2);
  };

  const pickMedia = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images', 'videos'],
      quality: 0.85,
      allowsMultipleSelection: true,
      base64: true,
    });

    if (result.canceled || !result.assets?.length) return;

    const newItems: AttachedMedia[] = result.assets.map((a) => ({
      localUri: a.uri,
      mimeType: a.mimeType ?? 'image/jpeg',
      uploading: false,
    }));

    setMedia((prev) => [...prev, ...newItems]);
  };

  const removeMedia = (uri: string) => {
    setMedia((prev) => prev.filter((m) => m.localUri !== uri));
  };

  const uploadAllMedia = async (localId: string): Promise<string[]> => {
    if (!user || !isSupabaseConfigured || media.length === 0) return [];
    const supabase = getSupabase();
    const ids: string[] = [];

    for (const item of media) {
      try {
        setMedia((prev) =>
          prev.map((m) => (m.localUri === item.localUri ? { ...m, uploading: true } : m))
        );

        const ext = item.localUri.split('.').pop()?.split('?')[0] ?? 'jpg';
        const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const storagePath = `${user.id}/${fileName}`;

        // Read via expo-file-system File API (reliable for local URIs on all platforms)
        const fileRef = new File(item.localUri);
        const base64 = await fileRef.base64();
        const byteArray = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));

        const { error: uploadErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, byteArray, { contentType: item.mimeType, upsert: false });

        if (uploadErr) throw uploadErr;

        const mediaType = item.mimeType.startsWith('video/') ? 'video' : 'photo';
        const { data: row, error: dbErr } = await supabase
          .from('media_vault')
          .insert({
            user_id: user.id,
            media_type: mediaType,
            storage_path: storagePath,
            memory_year: new Date().getFullYear(),
            memory_date: new Date().toISOString().slice(0, 10),
            metadata: { localJournalId: localId },
          })
          .select('id')
          .single();

        if (dbErr) throw dbErr;
        if (row?.id) ids.push(row.id);
      } catch {
        // Non-fatal: media upload failure shouldn't block journal save
      } finally {
        setMedia((prev) =>
          prev.map((m) => (m.localUri === item.localUri ? { ...m, uploading: false } : m))
        );
      }
    }
    return ids;
  };

  const handleSave = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);

    const localId = `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
    const mediaVaultIds = await uploadAllMedia(localId);

    onSave({
      title: title.trim() || undefined,
      body: body.trim(),
      moodTag: mood ?? undefined,
      mediaVaultIds: mediaVaultIds.length > 0 ? mediaVaultIds : undefined,
    });

    reset();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <View style={styles.sheet}>
          {/* ── Step indicator ── */}
          <View style={styles.stepRow}>
            <View style={[styles.stepDot, styles.stepDotActive]} />
            <View style={[styles.stepLine, step === 2 && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 2 && styles.stepDotActive]} />
          </View>

          {step === 1 ? (
            /* ── Step 1: Write ── */
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scrollArea}>
              <Text style={styles.heading}>What do you want to remember?</Text>
              <TextInput
                style={[styles.input, styles.bodyInput]}
                placeholder="Write it here…"
                placeholderTextColor={EchoColors.textDim}
                value={body}
                onChangeText={setBody}
                multiline
                textAlignVertical="top"
                autoFocus
                returnKeyType="default"
              />
              <TextInput
                style={styles.input}
                placeholder="Give it a title (optional)"
                placeholderTextColor={EchoColors.textDim}
                value={title}
                onChangeText={setTitle}
              />

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={handleClose}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.nextBtn, !body.trim() && styles.btnDisabled]}
                  onPress={goToStep2}
                  disabled={!body.trim()}>
                  <Text style={styles.nextText}>Next  →</Text>
                </Pressable>
              </View>
            </ScrollView>
          ) : (
            /* ── Step 2: Mood + Media ── */
            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              style={styles.scrollArea}>
              <Text style={styles.heading}>Add a photo and mood</Text>
              <Text style={styles.subheading}>{body.trim().slice(0, 60)}{body.length > 60 ? '…' : ''}</Text>

              <MoodPicker value={mood} onChange={setMood} />
              <MediaAttachmentStrip
                items={media}
                onRemove={removeMedia}
                onAdd={pickMedia}
              />

              <View style={styles.actions}>
                <Pressable style={styles.cancelBtn} onPress={() => setStep(1)}>
                  <Text style={styles.cancelText}>← Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveBtn, saving && styles.btnDisabled]}
                  onPress={handleSave}
                  disabled={saving}>
                  {saving ? (
                    <ActivityIndicator size="small" color={EchoColors.bg} />
                  ) : (
                    <Text style={styles.saveText}>Save Memory</Text>
                  )}
                </Pressable>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: EchoColors.bgElevated,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: EchoColors.border,
    maxHeight: '90%',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: EchoColors.border,
  },
  stepDotActive: {
    backgroundColor: EchoColors.accentWarm,
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: EchoColors.border,
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: EchoColors.accentWarm,
  },
  scrollArea: {
    flexGrow: 0,
  },
  heading: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 24,
    fontWeight: '300',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  subheading: {
    color: EchoColors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  input: {
    backgroundColor: EchoColors.bg,
    borderRadius: 14,
    padding: 16,
    color: EchoColors.text,
    fontSize: 17,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  bodyInput: {
    minHeight: 140,
    fontSize: 18,
    lineHeight: 26,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    paddingBottom: 8,
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
  nextBtn: {
    flex: 2,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: EchoColors.bgCard,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  nextText: {
    color: EchoColors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    backgroundColor: EchoColors.accent,
  },
  saveText: {
    color: EchoColors.bg,
    fontSize: 16,
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.4,
  },
});
