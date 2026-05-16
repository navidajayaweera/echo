/** Stitch design system — cinematic dark + memory gold + cosmic violet */
export const EchoColors = {
  bg: '#121318',
  bgLowest: '#0d0e13',
  bgElevated: '#1e1f25',
  bgCard: '#292a2f',
  bgCardHigh: '#33343a',
  border: '#484555',
  borderSubtle: '#33343a',
  text: '#e3e2e9',
  textMuted: '#c9c4d8',
  textDim: '#938ea1',
  primary: '#cabeff',
  primaryContainer: '#947dff',
  secondary: '#ecc071',
  tertiary: '#67d5f0',
  accent: '#cabeff',
  accentWarm: '#ecc071',
  success: '#7DCEA0',
  error: '#ffb4ab',
  errorContainer: '#93000a',
  onPrimary: '#1c0062',
  onSecondary: '#271900',
  glass: 'rgba(30, 31, 37, 0.65)',
  glassBorder: 'rgba(202, 190, 255, 0.12)',
  glowViolet: 'rgba(124, 92, 255, 0.25)',
  glowGold: 'rgba(236, 192, 113, 0.3)',
  gradientStart: '#0d0e13',
  gradientMid: '#121318',
  gradientEnd: '#1a1b20',
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
  tabBarBaseHeight: 56,
} as const;
