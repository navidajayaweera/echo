import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { EchoColors } from '@/constants/echo-theme';
import { refreshAvatarKnowledge } from '@/lib/avatar-feed';
import { fetchBeyAvatars, type BeyAvatarListItem } from '@/lib/bey-avatars';
import type { Profile } from '@/lib/types/database';

interface BeyAvatarSectionProps {
  profile: Profile | null;
  isAnonymous: boolean;
  updateProfile: (
    partial: Partial<Pick<Profile, 'bp_avatar_id'>>,
  ) => Promise<void>;
}

function statusLabel(status: string): string {
  switch (status) {
    case 'available':
      return 'Ready';
    case 'training':
      return 'Training';
    case 'to-train':
      return 'Queued';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

interface RowProps {
  item: BeyAvatarListItem;
  selected: boolean;
  enabled: boolean;
  saving: boolean;
  onSelect: (item: BeyAvatarListItem) => void;
}

function AvatarRow({ item, selected, enabled, saving, onSelect }: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        selected && styles.rowSelected,
        !enabled && styles.rowDisabled,
        pressed && enabled && styles.rowPressed,
      ]}
      onPress={() => enabled && onSelect(item)}
      disabled={!enabled || saving}
      accessibilityLabel={`${item.name}, ${statusLabel(item.status)}`}>
      <View style={styles.rowText}>
        <Text style={styles.rowName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.rowMeta}>
          {statusLabel(item.status)} · {item.visibility}
        </Text>
      </View>
      {saving ? <ActivityIndicator size="small" color={EchoColors.accent} /> : null}
      {selected && !saving ? <Text style={styles.checkmark}>✓</Text> : null}
    </Pressable>
  );
}

export function BeyAvatarSection({
  profile,
  isAnonymous,
  updateProfile,
}: BeyAvatarSectionProps) {
  const [avatars, setAvatars] = useState<BeyAvatarListItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadAvatars = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const { avatars: list } = await fetchBeyAvatars({ limit: 40 });
      setAvatars(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load avatars');
      setAvatars([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const selectAvatar = useCallback(
    async (item: BeyAvatarListItem) => {
      if (item.status !== 'available') {
        setError('Only avatars with status "ready" can be used for live calls.');
        return;
      }

      setSavingId(item.id);
      setError(null);
      try {
        await updateProfile({ bp_avatar_id: item.id });
        await refreshAvatarKnowledge();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save avatar');
      } finally {
        setSavingId(null);
      }
    },
    [updateProfile],
  );

  if (isAnonymous) {
    return (
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Echo avatar (Beyond Presence)</Text>
        <Text style={styles.help}>
          Sign in with email to link a digital-human avatar from your Bey account.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.block}>
      <Text style={styles.blockTitle}>Echo avatar (Beyond Presence)</Text>
      <Text style={styles.help}>
        Pick the digital-human tied to this account. Avatars are listed from the Bey API (your
        custom builds and public defaults). Only “ready” avatars can join live calls.
      </Text>

      {profile?.bp_avatar_id ? (
        <Text style={styles.current} allowFontScaling={false}>
          Linked avatar ID:{' '}
          <Text style={styles.mono}>{profile.bp_avatar_id}</Text>
        </Text>
      ) : (
        <Text style={styles.warn} allowFontScaling={false}>
          No avatar linked. Load the list below and select one that is ready, or set
          BEY_DEFAULT_AVATAR_ID on the server.
        </Text>
      )}

      <Pressable
        style={({ pressed }) => [styles.loadBtn, pressed && styles.loadBtnPressed]}
        onPress={loadAvatars}
        disabled={loading}
        accessibilityLabel="Load avatars from Beyond Presence">
        {loading ? (
          <ActivityIndicator color={EchoColors.accent} />
        ) : (
          <Text style={styles.loadBtnText}>Load avatars</Text>
        )}
      </Pressable>

      {error ? <Text style={styles.errText}>{error}</Text> : null}

      {avatars && avatars.length === 0 && !loading ? (
        <Text style={styles.help}>
          No avatars returned. Create one in the Bey dashboard or check BEY_API_KEY.
        </Text>
      ) : null}

      {avatars?.map((item) => (
        <AvatarRow
          key={item.id}
          item={item}
          selected={profile?.bp_avatar_id === item.id}
          enabled={item.status === 'available'}
          saving={savingId === item.id}
          onSelect={selectAvatar}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { marginBottom: 28 },
  blockTitle: {
    color: EchoColors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  help: {
    color: EchoColors.textDim,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  current: {
    color: EchoColors.text,
    fontSize: 13,
    marginBottom: 10,
  },
  mono: {
    fontFamily: 'monospace',
    fontSize: 12,
  },
  warn: {
    color: EchoColors.accentWarm,
    fontSize: 13,
    marginBottom: 10,
    lineHeight: 18,
  },
  loadBtn: {
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
    marginBottom: 12,
  },
  loadBtnPressed: { opacity: 0.85 },
  loadBtnText: {
    color: EchoColors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  errText: { color: '#DC5050', fontSize: 13, marginBottom: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    backgroundColor: EchoColors.bgElevated,
    marginBottom: 8,
    gap: 10,
  },
  rowSelected: {
    borderColor: '#5AC87C',
    backgroundColor: 'rgba(90, 200, 124, 0.12)',
  },
  rowDisabled: { opacity: 0.45 },
  rowPressed: { opacity: 0.9 },
  rowText: { flex: 1, minWidth: 0 },
  rowName: { color: EchoColors.text, fontSize: 16, fontWeight: '600' },
  rowMeta: { color: EchoColors.textDim, fontSize: 12, marginTop: 2 },
  checkmark: { color: '#5AC87C', fontSize: 18, fontWeight: '700' },
});
