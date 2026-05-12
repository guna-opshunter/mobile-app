
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SOUND_STORAGE_KEY = '@settings_sound_enabled';

let soundEnabled = true;
let initialized = false;

// Load persisted sound preference on first import
const initSound = async () => {
    if (initialized) return;
    initialized = true;
    try {
        const stored = await AsyncStorage.getItem(SOUND_STORAGE_KEY);
        if (stored !== null) {
            soundEnabled = JSON.parse(stored);
        }
    } catch (e) {
        // Fallback to default (enabled)
    }
};

// Initialize immediately
initSound();

export const toggleSound = () => {
    soundEnabled = !soundEnabled;
    AsyncStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(soundEnabled)).catch(() => {});
    return soundEnabled;
};

export const isSoundEnabled = () => soundEnabled;

export const setSoundEnabled = (enabled: boolean) => {
    soundEnabled = enabled;
    AsyncStorage.setItem(SOUND_STORAGE_KEY, JSON.stringify(enabled)).catch(() => {});
};

// Haptic feedback using expo-haptics
export const SoundEffects = {
    // Button tap
    tap: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) { }
    },

    // Correct answer / positive action
    correct: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (e) { }
    },

    // Wrong answer / negative action
    wrong: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } catch (e) { }
    },

    // Dice roll / fast action
    diceRoll: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) { }
    },

    // Token capture / heavy impact
    capture: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        } catch (e) { }
    },

    // Win/celebration
    win: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setTimeout(() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            }, 300);
        } catch (e) { }
    },

    // Token move / card flip
    move: async () => {
        if (!soundEnabled) return;
        try {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } catch (e) { }
    },
};

export default SoundEffects;
