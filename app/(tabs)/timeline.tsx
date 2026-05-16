import { SectionList, StyleSheet, Text, View } from 'react-native';

import { MediaUploadPicker } from '@/components/timeline/MediaUploadPicker';
import { TimelineItemCard } from '@/components/timeline/TimelineItemCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useTimeline } from '@/hooks/useTimeline';
import type { MediaVaultRow } from '@/lib/types/media-vault';

export default function TimelineScreen() {
  const { contentBottom } = useAppInsets({ includeTabBar: true });
  const { sections, isLoading, isUploading, error, pickAndUpload, deleteMedia } = useTimeline();

  return (
    <ScreenContainer includeTabBarPadding>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: contentBottom }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <SectionHeader
            title="Memory vault"
            subtitle={
              isLoading
                ? 'Loading…'
                : error
                  ? error
                  : sections.length === 0
                    ? 'Upload your first memory below'
                    : `${sections.reduce((n, s) => n + s.data.length, 0)} items across ${sections.length} year${sections.length !== 1 ? 's' : ''}`
            }
          />
        }
        renderSectionHeader={({ section: { year } }) => (
          <Text style={styles.yearLabel}>{year}</Text>
        )}
        renderItem={({ item }: { item: MediaVaultRow }) => (
          <TimelineItemCard item={item} onDelete={deleteMedia} />
        )}
        stickySectionHeadersEnabled={false}
        ListFooterComponent={
          <MediaUploadPicker isUploading={isUploading} onUpload={pickAndUpload} />
        }
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No memories yet — add photos, letters, and more.</Text>
            </View>
          ) : null
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  yearLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    fontWeight: '300',
    color: EchoColors.text,
    marginTop: 24,
    marginBottom: 10,
  },
  emptyBox: {
    paddingTop: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    maxWidth: 280,
    lineHeight: 22,
  },
});
