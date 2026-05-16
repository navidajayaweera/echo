export const EchoColors = {
  bg: '#0A0A0B',
  bgElevated: '#141416',
  bgCard: '#1A1A1E',
  border: '#232326',
  borderSubtle: '#1C1C1F',
  text: '#F4F2EF',
  textMuted: '#8B8884',
  textDim: '#6B6966',
  accent: '#E8E6E3',
  accentWarm: '#E8B86D',
  success: '#7DCEA0',
  error: '#E87D7D',
  gradientStart: '#0A0A0B',
  gradientMid: '#12101A',
  gradientEnd: '#1A1520',
} as const;

export const EchoFonts = {
  serif: 'Georgia',
  sans: 'System',
} as const;

export const EchoSpacing = {
  screen: 24,
  card: 16,
  section: 28,
} as const;

/** Layout tokens for safe areas, tab bar, and readable width on large screens */
export const EchoLayout = {
  screenHorizontal: 20,
  screenTopExtra: 8,
  contentBottomGap: 24,
  fabOffset: 16,
  maxContentWidth: 560,
  /** Must match visual tab bar height in `app/(tabs)/_layout.tsx`. */
  tabBarBaseHeight: 84,
} as const;
