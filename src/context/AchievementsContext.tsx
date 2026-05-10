import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Achievement definitions
export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: 'quiz' | 'ludo' | 'general' | 'calculator';
    target: number;
    color: string;
}

export interface AchievementProgress {
    id: string;
    current: number;
    unlocked: boolean;
    unlockedDate?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
    // Quiz achievements
    { id: 'quiz_first', name: 'First Steps', description: 'Complete your first quiz', icon: '🎓', category: 'quiz', target: 1, color: '#6366F1' },
    { id: 'quiz_10', name: 'Quiz Explorer', description: 'Complete 10 quizzes', icon: '📚', category: 'quiz', target: 10, color: '#3B82F6' },
    { id: 'quiz_perfect', name: 'Perfectionist', description: 'Get 100% on any quiz', icon: '💯', category: 'quiz', target: 1, color: '#F59E0B' },
    { id: 'quiz_streak3', name: 'On Fire', description: 'Get a 3-answer streak', icon: '🔥', category: 'quiz', target: 1, color: '#EF4444' },
    { id: 'quiz_streak5', name: 'Unstoppable', description: 'Get a 5-answer streak', icon: '⚡', category: 'quiz', target: 1, color: '#F97316' },
    { id: 'quiz_master', name: 'Quiz Master', description: 'Complete 50 quizzes', icon: '🧠', category: 'quiz', target: 50, color: '#8B5CF6' },
    { id: 'quiz_speedster', name: 'Speedster', description: 'Answer 10 questions with 10+ seconds left', icon: '⏱️', category: 'quiz', target: 10, color: '#14B8A6' },

    // Ludo achievements
    { id: 'ludo_first', name: 'Game On', description: 'Finish your first Ludo game', icon: '🎲', category: 'ludo', target: 1, color: '#EF4444' },
    { id: 'ludo_win', name: 'Winner', description: 'Win a Ludo game', icon: '🏆', category: 'ludo', target: 1, color: '#F59E0B' },
    { id: 'ludo_5wins', name: 'Ludo Champion', description: 'Win 5 Ludo games', icon: '👑', category: 'ludo', target: 5, color: '#F59E0B' },
    { id: 'ludo_capture', name: 'Gotcha!', description: 'Capture an opponent token', icon: '💥', category: 'ludo', target: 1, color: '#EC4899' },
    { id: 'ludo_captures10', name: 'Ruthless', description: 'Capture 10 tokens total', icon: '🎯', category: 'ludo', target: 10, color: '#DC2626' },

    // Calculator achievements
    { id: 'calc_bmi', name: 'Health Check', description: 'Calculate your BMI', icon: '⚖️', category: 'calculator', target: 1, color: '#10B981' },
    { id: 'calc_age', name: 'Time Tracker', description: 'Calculate an age', icon: '🎂', category: 'calculator', target: 1, color: '#F97316' },
    { id: 'calc_emi', name: 'Finance Pro', description: 'Calculate an EMI', icon: '💰', category: 'calculator', target: 1, color: '#10B981' },
    { id: 'calc_all', name: 'Calculator Pro', description: 'Use all calculators', icon: '🧮', category: 'calculator', target: 5, color: '#6366F1' },

    // General achievements
    { id: 'gen_records5', name: 'Record Keeper', description: 'Save 5 records', icon: '📊', category: 'general', target: 5, color: '#3B82F6' },
    { id: 'gen_records20', name: 'Data Collector', description: 'Save 20 records', icon: '🗄️', category: 'general', target: 20, color: '#6366F1' },
    { id: 'gen_dedicated', name: 'Dedicated', description: 'Use the app 7 days', icon: '📅', category: 'general', target: 7, color: '#8B5CF6' },
];

interface AchievementsContextType {
    progress: AchievementProgress[];
    checkAndUnlock: (achievementId: string, increment?: number) => boolean;
    getProgress: (achievementId: string) => AchievementProgress;
    getUnlockedCount: () => number;
    getTotalCount: () => number;
    recentUnlock: Achievement | null;
    dismissUnlock: () => void;
    stats: AppStats;
    updateStat: (key: keyof AppStats, value: number) => void;
    incrementStat: (key: keyof AppStats, amount?: number) => void;
}

export interface AppStats {
    totalQuizzes: number;
    totalQuizCorrect: number;
    totalQuizQuestions: number;
    totalLudoGames: number;
    totalLudoWins: number;
    totalCaptures: number;
    totalBMI: number;
    totalAge: number;
    totalEMI: number;
    totalArea: number;
    totalCalc: number;
    totalRecords: number;
    bestQuizStreak: number;
    fastAnswers: number;
    daysUsed: number;
    lastUsedDate: string;
}

const DEFAULT_STATS: AppStats = {
    totalQuizzes: 0,
    totalQuizCorrect: 0,
    totalQuizQuestions: 0,
    totalLudoGames: 0,
    totalLudoWins: 0,
    totalCaptures: 0,
    totalBMI: 0,
    totalAge: 0,
    totalEMI: 0,
    totalArea: 0,
    totalCalc: 0,
    totalRecords: 0,
    bestQuizStreak: 0,
    fastAnswers: 0,
    daysUsed: 1,
    lastUsedDate: new Date().toDateString(),
};

const STORAGE_KEY_ACHIEVEMENTS = '@achievements_progress';
const STORAGE_KEY_STATS = '@app_stats';

const AchievementsContext = createContext<AchievementsContextType | undefined>(undefined);

export function AchievementsProvider({ children }: { children: ReactNode }) {
    const [progress, setProgress] = useState<AchievementProgress[]>([]);
    const [recentUnlock, setRecentUnlock] = useState<Achievement | null>(null);
    const [stats, setStats] = useState<AppStats>(DEFAULT_STATS);

    useEffect(() => {
        loadData();
    }, []);

    // Track daily usage
    useEffect(() => {
        const today = new Date().toDateString();
        if (stats.lastUsedDate !== today) {
            const newStats = {
                ...stats,
                daysUsed: stats.daysUsed + 1,
                lastUsedDate: today,
            };
            setStats(newStats);
            saveData(STORAGE_KEY_STATS, newStats);
        }
    }, [stats.lastUsedDate]);

    const loadData = async () => {
        try {
            const [achieveData, statsData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEY_ACHIEVEMENTS),
                AsyncStorage.getItem(STORAGE_KEY_STATS),
            ]);

            if (achieveData) {
                setProgress(JSON.parse(achieveData));
            } else {
                // Initialize all achievements
                const initial: AchievementProgress[] = ACHIEVEMENTS.map(a => ({
                    id: a.id,
                    current: 0,
                    unlocked: false,
                }));
                setProgress(initial);
                saveData(STORAGE_KEY_ACHIEVEMENTS, initial);
            }

            if (statsData) {
                setStats({ ...DEFAULT_STATS, ...JSON.parse(statsData) });
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    };

    const saveData = async (key: string, data: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving data:', error);
        }
    };

    const checkAndUnlock = useCallback((achievementId: string, increment: number = 1): boolean => {
        const achievement = ACHIEVEMENTS.find(a => a.id === achievementId);
        if (!achievement) return false;

        setProgress(prev => {
            const existing = prev.find(p => p.id === achievementId);
            if (!existing) {
                // Create new progress entry
                const newEntry: AchievementProgress = {
                    id: achievementId,
                    current: increment,
                    unlocked: increment >= achievement.target,
                    unlockedDate: increment >= achievement.target ? new Date().toISOString() : undefined,
                };
                if (newEntry.unlocked) {
                    setRecentUnlock(achievement);
                }
                const updated = [...prev, newEntry];
                saveData(STORAGE_KEY_ACHIEVEMENTS, updated);
                return updated;
            }

            if (existing.unlocked) return prev;

            const newCurrent = existing.current + increment;
            const nowUnlocked = newCurrent >= achievement.target;

            if (nowUnlocked) {
                setRecentUnlock(achievement);
            }

            const updated = prev.map(p =>
                p.id === achievementId
                    ? {
                        ...p,
                        current: newCurrent,
                        unlocked: nowUnlocked,
                        unlockedDate: nowUnlocked ? new Date().toISOString() : p.unlockedDate,
                    }
                    : p
            );
            saveData(STORAGE_KEY_ACHIEVEMENTS, updated);
            return updated;
        });

        return true;
    }, []);

    const getProgress = useCallback((achievementId: string): AchievementProgress => {
        const found = progress.find(p => p.id === achievementId);
        return found || { id: achievementId, current: 0, unlocked: false };
    }, [progress]);

    const getUnlockedCount = useCallback(() => {
        return progress.filter(p => p.unlocked).length;
    }, [progress]);

    const getTotalCount = useCallback(() => {
        return ACHIEVEMENTS.length;
    }, []);

    const dismissUnlock = useCallback(() => {
        setRecentUnlock(null);
    }, []);

    const updateStat = useCallback((key: keyof AppStats, value: number) => {
        setStats(prev => {
            const updated = { ...prev, [key]: value };
            saveData(STORAGE_KEY_STATS, updated);
            return updated;
        });
    }, []);

    const incrementStat = useCallback((key: keyof AppStats, amount: number = 1) => {
        setStats(prev => {
            const updated = { ...prev, [key]: (prev[key] as number) + amount };
            saveData(STORAGE_KEY_STATS, updated);
            return updated;
        });
    }, []);

    return (
        <AchievementsContext.Provider
            value={{
                progress,
                checkAndUnlock,
                getProgress,
                getUnlockedCount,
                getTotalCount,
                recentUnlock,
                dismissUnlock,
                stats,
                updateStat,
                incrementStat,
            }}
        >
            {children}
        </AchievementsContext.Provider>
    );
}

export const useAchievements = () => {
    const context = useContext(AchievementsContext);
    if (!context) {
        throw new Error('useAchievements must be used within an AchievementsProvider');
    }
    return context;
};
