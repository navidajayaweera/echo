import { SectionList, StyleSheet, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/ui/ScreenContainer';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { EchoColors, EchoFonts } from '@/constants/echo-theme';
import { useAppInsets } from '@/hooks/use-app-insets';

type TimelineItem = { id: string; title: string; type: 'letter' | 'photo' };

const PLACEHOLDER_SECTIONS: { title: string; data: TimelineItem[] }[] = [
  {
    title: '1985',
    data: [{ id: '1', title: 'Summer letters', type: 'letter' }],
  },
  {
    title: '1974',
    data: [{ id: '2', title: 'Kitchen photo', type: 'photo' }],
  },
];

export default function TimelineScreen() {
  const { contentBottom } = useAppInsets({ includeTabBar: true });

  return (
    <ScreenContainer includeTabBarPadding>
      <SectionHeader
        title="Memory vault"
        subtitle="Upload photos & legacy media — full Storage sync coming soon"
      />
      <SectionList
        sections={PLACEHOLDER_SECTIONS}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: contentBottom }}
        showsVerticalScrollIndicator={false}
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.year}>{title}</Text>
        )}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.itemType}>{item.type}</Text>
            <Text style={styles.itemTitle}>{item.title}</Text>
            <Text style={styles.preview}>Preview · demo data</Text>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.uploadHint}>
            <Text style={styles.uploadText}>+ Upload media to Supabase Storage</Text>
          </View>
        }
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  year: {
    fontFamily: EchoFonts.serif,
    fontSize: 32,
    fontWeight: '300',
    color: EchoColors.text,
    marginTop: 24,
    marginBottom: 12,
  },
  item: {
    backgroundColor: EchoColors.bgElevated,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: EchoColors.border,
  },
  itemType: {
    color: EchoColors.accentWarm,
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemTitle: {
    color: EchoColors.text,
    fontSize: 17,
    fontWeight: '500',
  },
  preview: {
    color: EchoColors.textDim,
    fontSize: 13,
    marginTop: 6,
  },
  uploadHint: {
    marginTop: 24,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: EchoColors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  uploadText: {
    color: EchoColors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
});
