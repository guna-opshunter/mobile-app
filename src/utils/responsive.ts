import { Dimensions, PixelRatio, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Base design dimensions (standard phone ~375x812)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

// Screen size breakpoints
const SMALL_PHONE = 360;   // SE, small Androids
const PHONE = 400;          // Standard phones
const LARGE_PHONE = 430;   // Pro Max, large Androids
const TABLET = 600;         // Tablets

/**
 * Scale a value proportionally to screen width.
 * Use for horizontal dimensions: widths, horizontal padding/margins.
 */
export function wp(size: number): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Scale a value proportionally to screen height.
 * Use for vertical dimensions: heights, vertical padding/margins.
 */
export function hp(size: number): number {
    const scale = SCREEN_HEIGHT / BASE_HEIGHT;
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Scale font sizes based on screen width with PixelRatio clamping.
 * Prevents fonts from becoming too large on tablets or too small on tiny phones.
 */
export function fp(size: number): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size * Math.min(scale, 1.3); // Cap scaling at 1.3x
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Moderate scale — blends between fixed and proportional.
 * factor=0 means no scaling, factor=1 means full proportional scaling.
 * Default factor of 0.5 gives a moderate scale. Great for padding, margins, border-radius.
 */
export function ms(size: number, factor: number = 0.5): number {
    const scale = SCREEN_WIDTH / BASE_WIDTH;
    const newSize = size + (scale - 1) * size * factor;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
}

/**
 * Returns true if the device is considered a small phone.
 */
export function isSmallPhone(): boolean {
    return SCREEN_WIDTH < SMALL_PHONE;
}

/**
 * Returns true if the device is considered a tablet.
 */
export function isTablet(): boolean {
    return SCREEN_WIDTH >= TABLET;
}

/**
 * Returns the number of grid columns based on screen width.
 * Phones get 3 columns, large phones 4, tablets 5.
 */
export function getGridColumns(): number {
    if (SCREEN_WIDTH >= TABLET) return 5;
    if (SCREEN_WIDTH >= LARGE_PHONE) return 4;
    return 3;
}

/**
 * Returns the max content width to prevent layouts from stretching too wide on tablets.
 */
export function getMaxContentWidth(): number {
    return Math.min(SCREEN_WIDTH, 600);
}

/**
 * Get responsive horizontal padding based on screen width.
 */
export function getHorizontalPadding(): number {
    if (SCREEN_WIDTH >= TABLET) return 32;
    if (SCREEN_WIDTH >= LARGE_PHONE) return 24;
    if (SCREEN_WIDTH < SMALL_PHONE) return 14;
    return 20;
}

/**
 * Current screen dimensions (for dynamic calculations).
 */
export const screen = {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    isSmall: SCREEN_WIDTH < SMALL_PHONE,
    isTablet: SCREEN_WIDTH >= TABLET,
};
