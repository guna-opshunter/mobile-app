/**
 * Design System Constants
 * Centralized tokens for spacing, typography, border radius, and shadows.
 * Import from here instead of using magic numbers.
 */

// Spacing scale (4px base)
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20,
    '2xl': 24,
    '3xl': 28,
    '4xl': 32,
    '5xl': 40,
    '6xl': 48,
    '7xl': 56,
    '8xl': 64,
} as const;

// Border radius tokens
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 14,
    xl: 16,
    '2xl': 18,
    '3xl': 20,
    '4xl': 24,
    full: 999,
} as const;

// Typography presets
export const TYPOGRAPHY = {
    // Headings
    h1: {
        fontSize: 34,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
    },
    h2: {
        fontSize: 28,
        fontWeight: '800' as const,
        letterSpacing: -0.5,
    },
    h3: {
        fontSize: 22,
        fontWeight: '800' as const,
        letterSpacing: -0.3,
    },
    h4: {
        fontSize: 20,
        fontWeight: '700' as const,
        letterSpacing: -0.3,
    },
    // Body
    bodyLg: {
        fontSize: 17,
        fontWeight: '600' as const,
    },
    body: {
        fontSize: 16,
        fontWeight: '500' as const,
    },
    bodySm: {
        fontSize: 15,
        fontWeight: '500' as const,
    },
    // Labels
    label: {
        fontSize: 13,
        fontWeight: '700' as const,
        textTransform: 'uppercase' as const,
        letterSpacing: 1.2,
    },
    labelSm: {
        fontSize: 12,
        fontWeight: '600' as const,
    },
    caption: {
        fontSize: 11,
        fontWeight: '600' as const,
    },
    captionSm: {
        fontSize: 10,
        fontWeight: '600' as const,
    },
} as const;

// Shadow presets
export const SHADOWS = {
    sm: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 6,
        elevation: 2,
    },
    md: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
    },
    lg: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        elevation: 6,
    },
    xl: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
        elevation: 10,
    },
    colored: (color: string) => ({
        shadowColor: color,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 8,
    }),
} as const;

// Icon sizes
export const ICON_SIZES = {
    sm: 16,
    md: 20,
    lg: 26,
    xl: 28,
    '2xl': 36,
    '3xl': 48,
    '4xl': 56,
    '5xl': 64,
} as const;

// Card dimensions
export const CARD = {
    iconBg: {
        width: 48,
        height: 48,
        borderRadius: RADIUS.lg,
    },
    iconBgLg: {
        width: 56,
        height: 56,
        borderRadius: RADIUS.xl,
    },
    accentHeight: 3,
    padding: SPACING.xl,
    radius: RADIUS['2xl'],
} as const;

// Screen layout
export const LAYOUT = {
    screenPaddingH: SPACING.xl,
    screenPaddingTop: 56,
    maxContentWidth: 600,
    tabBarHeight: 68,
} as const;

// Animation durations
export const ANIMATION = {
    fast: 150,
    normal: 250,
    slow: 400,
    stagger: 30,
    staggerDelay: 150,
} as const;

// Recently used max count
export const MAX_RECENTLY_USED = 5;

// Maximum saved games
export const MAX_SAVED_GAMES = 1;
