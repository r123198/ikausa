import '@/global.css';

export const C = {
  background: '#131313',
  surface: '#201f1f',
  surfaceHigh: '#2a2a2a',
  surfaceHighest: '#353534',
  surfaceBright: '#393939',
  surfaceLowest: '#0e0e0e',
  surfaceLow: '#1c1b1b',
  primary: '#ffc499',
  primaryFixed: '#ffdcc4',
  primaryFixedDim: '#ffb780',
  primaryContainer: '#f4a261',
  onPrimary: '#4e2600',
  onPrimaryFixed: '#2f1400',
  onPrimaryContainer: '#6f3800',
  secondaryFixed: '#e6e2d6',
  secondaryFixedDim: '#cac6bb',
  secondaryContainer: '#48473e',
  onSecondaryFixed: '#1d1c15',
  onSecondary: '#323129',
  onSurface: '#e5e2e1',
  onSurfaceVariant: '#d8c2b5',
  outline: '#a08d80',
  outlineVariant: '#534439',
  inverseSurface: '#e5e2e1',
  error: '#ffb4ab',
} as const;

export const FilmColors = {
  background: C.background,
  surface: C.surface,
  surfaceHigh: C.surfaceHigh,
  surfaceBright: C.surfaceBright,
  surfaceLowest: C.surfaceLowest,
  primary: C.primary,
  primaryContainer: C.primaryContainer,
  onPrimary: C.onPrimary,
  onPrimaryContainer: C.onPrimaryContainer,
  onSurface: C.onSurface,
  onSurfaceVariant: C.onSurfaceVariant,
  outline: C.outline,
  outlineVariant: C.outlineVariant,
  error: C.error,
} as const;

export const Fonts = {
  playfair: 'PlayfairDisplay',
  hanken: 'HankenGrotesk',
  mono: 'SpaceMono',
  monoBold: 'SpaceMono-Bold',
} as const;

export const T = {
  headlineLg: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 40,
    lineHeight: 48,
    letterSpacing: -0.8,
    fontWeight: '700' as const,
    color: C.onSurface,
  },
  headlineLgMobile: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 32,
    lineHeight: 38,
    fontWeight: '700' as const,
    color: C.onSurface,
  },
  headlineMd: {
    fontFamily: 'PlayfairDisplay',
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '600' as const,
    color: C.onSurface,
  },
  bodyLg: {
    fontFamily: 'HankenGrotesk',
    fontSize: 18,
    lineHeight: 29,
    fontWeight: '400' as const,
    color: C.onSurface,
  },
  bodyMd: {
    fontFamily: 'HankenGrotesk',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as const,
    color: C.onSurface,
  },
  label: {
    fontFamily: 'SpaceMono',
    fontSize: 12,
    lineHeight: 12,
    letterSpacing: 0.6,
    fontWeight: '700' as const,
    color: C.onSurfaceVariant,
  },
} as const;

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = 0;
export const MaxContentWidth = 800;
