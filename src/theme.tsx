import { createContext, useContext } from 'react';

// Design System Colors
export const COLORS = {
    primary: '#6366F1',       // Indigo
    primaryLight: '#818CF8',
    primaryDark: '#4F46E5',
    accent: '#8B5CF6',        // Purple accent
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',

    // Light theme
    light: {
        bg: '#F8FAFC',
        card: '#FFFFFF',
        text: '#0F172A',
        textSecondary: '#64748B',
        border: '#E2E8F0',
        surface: '#F1F5F9',
    },
    // Dark theme
    dark: {
        bg: '#0F172A',
        card: '#1E293B',
        text: '#F8FAFC',
        textSecondary: '#94A3B8',
        border: '#334155',
        surface: '#1E293B',
    }
};

// Theme Context
export interface ThemeContextType {
    backgroundColor: string;
    setBackgroundColor: (color: string) => void;
    userName: string;
    setUserName: (name: string) => void;
    isDarkMode: boolean;
    setIsDarkMode: (isDark: boolean) => void;
    recentlyUsed: string[];
    addRecentlyUsed: (route: string) => void;
    favorites: string[];
    toggleFavorite: (route: string) => void;
    isFavorite: (route: string) => boolean;
    currencyType: string;
    setCurrencyType: (currency: string) => void;
    isLoading: boolean;
}

export const ThemeContext = createContext<ThemeContextType>({
    backgroundColor: '#F8FAFC',
    setBackgroundColor: () => { },
    userName: '',
    setUserName: () => { },
    isDarkMode: false,
    setIsDarkMode: () => { },
    recentlyUsed: [],
    addRecentlyUsed: () => { },
    favorites: [],
    toggleFavorite: () => { },
    isFavorite: () => false,
    currencyType: '$',
    setCurrencyType: () => { },
    isLoading: true,
});

export const useTheme = () => useContext(ThemeContext);
