import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { MediaGrid } from '@/components/timeline/MediaGrid';
import { MediaTypeFilter, type FilterType } from '@/components/timeline/MediaTypeFilter';
import { MediaUploadWizard } from '@/components/timeline/MediaUploadWizard';
import { TimelineItemCard } from '@/components/timeline/TimelineItemCard';
import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';
import { useTimeline } from '@/hooks/useTimeline';
import type { MediaVaultRow } from '@/lib/types/media-vault';

const VISUAL_TYPES = new Set<MediaVaultRow['media_type']>(['photo', 'video']);

export default function TimelineScreen() {
  const { contentBottom } = useAppInsets({ includeTabBar: true });
  const { sections, totalCount, isLoading, isUploading, error, uploadMedia, deleteMedia } =
    useTimeline();
  const [filter, setFilter] = useState<FilterType>('all');

  const filteredSections = useMemo(() => {
    if (filter === 'all') return sections;
    return sections
      .map((s) => ({ ...s, data: s.data.filter((r) => r.media_type === filter) }))
      .filter((s) => s.data.length > 0);
  }, [sections, filter]);

  const subtitleText = isLoading
    ? 'Loading…'
    : error
      ? error
      : totalCount === 0
        ? 'Add your first memory below'
        : `${totalCount} item${totalCount !== 1 ? 's' : ''} across ${sections.length} year${sections.length !== 1 ? 's' : ''}`;

  return (
    <ScreenContainer includeTabBarPadding>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: contentBottom }]}>

        {/* ── Page header ── */}
        <View style={styles.pageHeader}>
          <Text style={styles.pageTitle}>Memory Vault</Text>
          <Text style={styles.pageSubtitle}>{subtitleText}</Text>
        </View>

        {/* ── Filter bar ── */}
        <MediaTypeFilter value={filter} onChange={setFilter} />

        {/* ── Content ── */}
        {filteredSections.length === 0 && !isLoading ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyIcon}>🗂</Text>
            <Text style={styles.emptyTitle}>
              {filter === 'all' ? 'No memories yet' : `No ${filter}s yet`}
            </Text>
            <Text style={styles.emptyHint}>
              {filter === 'all'
                ? 'Add photos, letters, voice notes and more to preserve your memories.'
                : `Add a ${filter} memory using the button below.`}
            </Text>
          </View>
        ) : (
          filteredSections.map((section) => {
            const visualItems = section.data.filter((r) => VISUAL_TYPES.has(r.media_type));
            const listItems = section.data.filter((r) => !VISUAL_TYPES.has(r.media_type));

            return (
              <View key={section.year}>
                <Text style={styles.yearLabel}>{section.year}</Text>

                {visualItems.length > 0 && (
                  <MediaGrid items={visualItems} onDelete={deleteMedia} />
                )}

                {listItems.map((item) => (
                  <TimelineItemCard key={item.id} item={item} onDelete={deleteMedia} />
                ))}
              </View>
            );
          })
        )}

        {/* ── Upload wizard ── */}
        <MediaUploadWizard isUploading={isUploading} onUpload={uploadMedia} />
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexGrow: 1,
  },
  pageHeader: {
    marginBottom: 16,
    marginTop: 8,
  },
  pageTitle: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 34,
    fontWeight: '300',
    letterSpacing: -0.5,
  },
  pageSubtitle: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 2,
  },
  yearLabel: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    fontWeight: '300',
    color: EchoColors.text,
    marginTop: 24,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingTop: 48,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontFamily: EchoFonts.serif,
    color: EchoColors.text,
    fontSize: 22,
    fontWeight: '300',
  },
  emptyHint: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
