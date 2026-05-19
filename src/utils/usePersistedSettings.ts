import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
    USER_NAME: '@settings_user_name',
    IS_DARK_MODE: '@settings_dark_mode',
    BACKGROUND_COLOR: '@settings_bg_color',
    RECENTLY_USED: '@settings_recently_used',
    FAVORITES: '@settings_favorites',
    CURRENCY_TYPE: '@settings_currency_type',
    NAVIGATION_TYPE: '@settings_navigation_type', // 'buttons' or 'swipe'
    SETUP_COMPLETED: '@settings_setup_completed',
};

export interface PersistedSettings {
    userName: string;
    setUserName: (name: string) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    backgroundColor: string;
    setBackgroundColor: (color: string) => void;
    recentlyUsed: string[];
    addRecentlyUsed: (route: string) => void;
    favorites: string[];
    toggleFavorite: (route: string) => void;
    isFavorite: (route: string) => boolean;
    currencyType: string;
    setCurrencyType: (currency: string) => void;
    navigationType: 'buttons' | 'swipe';
    setNavigationType: (type: 'buttons' | 'swipe') => void;
    setupCompleted: boolean;
    setSetupCompleted: (completed: boolean) => void;
    isLoading: boolean;
}

export function usePersistedSettings(): PersistedSettings {
    const [userName, setUserNameState] = useState('');
    const [isDarkMode, setIsDarkModeState] = useState(false);
    const [backgroundColor, setBackgroundColorState] = useState('#F8FAFC');
    const [recentlyUsed, setRecentlyUsedState] = useState<string[]>([]);
    const [favorites, setFavoritesState] = useState<string[]>([]);
    const [currencyType, setCurrencyTypeState] = useState('$');
    const [navigationType, setNavigationTypeState] = useState<'buttons' | 'swipe'>('buttons');
    const [setupCompleted, setSetupCompletedState] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Load all settings on mount
    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            const [name, darkMode, bgColor, recent, favs, curr, nav, setup] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.USER_NAME),
                AsyncStorage.getItem(STORAGE_KEYS.IS_DARK_MODE),
                AsyncStorage.getItem(STORAGE_KEYS.BACKGROUND_COLOR),
                AsyncStorage.getItem(STORAGE_KEYS.RECENTLY_USED),
                AsyncStorage.getItem(STORAGE_KEYS.FAVORITES),
                AsyncStorage.getItem(STORAGE_KEYS.CURRENCY_TYPE),
                AsyncStorage.getItem(STORAGE_KEYS.NAVIGATION_TYPE),
                AsyncStorage.getItem(STORAGE_KEYS.SETUP_COMPLETED),
            ]);

            if (name !== null) setUserNameState(name);
            if (darkMode !== null) setIsDarkModeState(JSON.parse(darkMode));
            if (bgColor !== null) setBackgroundColorState(bgColor);
            if (recent !== null) setRecentlyUsedState(JSON.parse(recent));
            if (favs !== null) setFavoritesState(JSON.parse(favs));
            if (curr !== null) setCurrencyTypeState(curr);
            if (nav !== null) setNavigationTypeState(nav as 'buttons' | 'swipe');
            if (setup !== null) setSetupCompletedState(JSON.parse(setup));
        } catch (error) {
            console.error('Error loading settings:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const setUserName = (name: string) => {
        setUserNameState(name);
        AsyncStorage.setItem(STORAGE_KEYS.USER_NAME, name).catch(console.error);
    };

    const setIsDarkMode = (isDark: boolean) => {
        setIsDarkModeState(isDark);
        AsyncStorage.setItem(STORAGE_KEYS.IS_DARK_MODE, JSON.stringify(isDark)).catch(console.error);
    };

    const setBackgroundColor = (color: string) => {
        setBackgroundColorState(color);
        AsyncStorage.setItem(STORAGE_KEYS.BACKGROUND_COLOR, color).catch(console.error);
    };

    const addRecentlyUsed = (route: string) => {
        setRecentlyUsedState(prev => {
            // Remove if already exists, add to front, keep max 5
            const filtered = prev.filter(r => r !== route);
            const updated = [route, ...filtered].slice(0, 5);
            AsyncStorage.setItem(STORAGE_KEYS.RECENTLY_USED, JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    };

    const toggleFavorite = (route: string) => {
        setFavoritesState(prev => {
            const isFav = prev.includes(route);
            const updated = isFav
                ? prev.filter(r => r !== route)
                : [...prev, route];
            AsyncStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(updated)).catch(console.error);
            return updated;
        });
    };

    const isFavorite = (route: string) => favorites.includes(route);

    const setCurrencyType = (currency: string) => {
        setCurrencyTypeState(currency);
        AsyncStorage.setItem(STORAGE_KEYS.CURRENCY_TYPE, currency).catch(console.error);
    };

    const setNavigationType = (type: 'buttons' | 'swipe') => {
        setNavigationTypeState(type);
        AsyncStorage.setItem(STORAGE_KEYS.NAVIGATION_TYPE, type).catch(console.error);
    };

    const setSetupCompleted = (completed: boolean) => {
        setSetupCompletedState(completed);
        AsyncStorage.setItem(STORAGE_KEYS.SETUP_COMPLETED, JSON.stringify(completed)).catch(console.error);
    };

    return {
        userName,
        setUserName,
        isDarkMode,
        setIsDarkMode,
        backgroundColor,
        setBackgroundColor,
        recentlyUsed,
        addRecentlyUsed,
        favorites,
        toggleFavorite,
        isFavorite,
        currencyType,
        setCurrencyType,
        navigationType,
        setNavigationType,
        setupCompleted,
        setSetupCompleted,
        isLoading,
    };
}
