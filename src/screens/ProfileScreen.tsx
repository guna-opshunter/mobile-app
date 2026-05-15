import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, Linking, TextInput, ScrollView, Share } from 'react-native';
import { useTheme, COLORS } from '../theme';
import { useAchievements, ACHIEVEMENTS, Achievement } from '../context/AchievementsContext';
import { useRecords } from '../context/RecordsContext';

export default function ProfileScreen() {
    const { backgroundColor, setBackgroundColor, userName, setUserName, isDarkMode, setIsDarkMode, currencyType, setCurrencyType } = useTheme();
    const { progress, getProgress, getUnlockedCount, getTotalCount, stats } = useAchievements();
    const { quizRecords, gameRecords, bmiRecords, birthdayRecords } = useRecords();

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const colors = [
        { value: '#F8FAFC', name: 'Slate', label: 'S' },
        { value: '#EFF6FF', name: 'Blue', label: 'B' },
        { value: '#FFF1F2', name: 'Rose', label: 'R' },
        { value: '#F0FDF4', name: 'Green', label: 'G' },
        { value: '#FFFBEB', name: 'Amber', label: 'A' },
        { value: '#FAF5FF', name: 'Purple', label: 'P' },
    ];

    const openYouTube = () => {
        Linking.openURL('https://www.youtube.com');
    };

    const shareApp = async () => {
        try {
            await Share.share({
                message: `🎮 Check out NexaPlay — Games & Smart Tools for Students! I've completed ${stats.totalQuizzes} quizzes and won ${stats.totalLudoWins} Ludo games. Download now!`,
                title: 'NexaPlay App',
            });
        } catch (e) { }
    };

    // Stats calculations
    const totalRecords = bmiRecords.length + birthdayRecords.length + gameRecords.length + quizRecords.length;
    const quizAccuracy = stats.totalQuizQuestions > 0
        ? Math.round((stats.totalQuizCorrect / stats.totalQuizQuestions) * 100)
        : 0;
    const ludoWinRate = stats.totalLudoGames > 0
        ? Math.round((stats.totalLudoWins / stats.totalLudoGames) * 100)
        : 0;

    const unlockedCount = getUnlockedCount();
    const totalBadges = getTotalCount();
    const badgePercentage = totalBadges > 0 ? Math.round((unlockedCount / totalBadges) * 100) : 0;

    // Group achievements by category
    const categories = [
        { key: 'quiz', label: 'Quiz', icon: '📚', color: '#6366F1' },
        { key: 'ludo', label: 'Ludo', icon: '🎲', color: '#EF4444' },
        { key: 'calculator', label: 'Tools', icon: '🧮', color: '#10B981' },
        { key: 'general', label: 'General', icon: '⭐', color: '#F59E0B' },
    ];

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: theme.bg }]}
            contentContainerStyle={styles.contentContainer}
            showsVerticalScrollIndicator={false}
        >
            {/* Header with Avatar */}
            <View style={styles.header}>
                <View style={styles.avatarWrapper}>
                    <View style={styles.avatarRing}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarText}>
                                {userName ? userName.charAt(0).toUpperCase() : '?'}
                            </Text>
                        </View>
                    </View>
                </View>
                <Text style={[styles.profileName, { color: theme.text }]}>
                    {userName || 'Guest User'}
                </Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                    🏅 {unlockedCount}/{totalBadges} badges unlocked
                </Text>
            </View>

            {/* Stats Dashboard */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBg, { backgroundColor: '#F59E0B15' }]}>
                        <Text style={styles.cardIcon}>📊</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Your Stats</Text>
                </View>

                <View style={styles.statsGrid}>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>🎯</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalQuizzes}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Quizzes</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>📈</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{quizAccuracy}%</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Accuracy</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>🎲</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.totalLudoGames}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Ludo Games</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>🏆</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{ludoWinRate}%</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Win Rate</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>🔥</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{stats.bestQuizStreak}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Best Streak</Text>
                    </View>
                    <View style={[styles.statItem, { backgroundColor: theme.surface }]}>
                        <Text style={styles.statEmoji}>📋</Text>
                        <Text style={[styles.statValue, { color: theme.text }]}>{totalRecords}</Text>
                        <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Records</Text>
                    </View>
                </View>
            </View>

            {/* Achievements */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBg, { backgroundColor: '#F59E0B15' }]}>
                        <Text style={styles.cardIcon}>🏅</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.cardTitle, { color: theme.text }]}>Achievements</Text>
                        <Text style={[styles.achieveSubtitle, { color: theme.textSecondary }]}>
                            {unlockedCount}/{totalBadges} • {badgePercentage}% complete
                        </Text>
                    </View>
                </View>

                {/* Progress bar */}
                <View style={[styles.achieveProgressTrack, { backgroundColor: theme.surface }]}>
                    <View style={[styles.achieveProgressFill, { width: `${badgePercentage}%` }]} />
                </View>

                {categories.map(cat => {
                    const catAchievements = ACHIEVEMENTS.filter(a => a.category === cat.key);
                    return (
                        <View key={cat.key} style={styles.categorySection}>
                            <View style={styles.categoryHeader}>
                                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                                <Text style={[styles.categoryTitle, { color: theme.text }]}>{cat.label}</Text>
                                <Text style={[styles.categoryCount, { color: theme.textSecondary }]}>
                                    {catAchievements.filter(a => getProgress(a.id).unlocked).length}/{catAchievements.length}
                                </Text>
                            </View>
                            <View style={styles.badgesRow}>
                                {catAchievements.map(achievement => {
                                    const prog = getProgress(achievement.id);
                                    const isUnlocked = prog.unlocked;
                                    return (
                                        <View
                                            key={achievement.id}
                                            style={[
                                                styles.badge,
                                                {
                                                    backgroundColor: isUnlocked ? achievement.color + '15' : theme.surface,
                                                    borderColor: isUnlocked ? achievement.color : theme.border,
                                                },
                                            ]}
                                        >
                                            <Text style={[styles.badgeIcon, !isUnlocked && styles.badgeLocked]}>
                                                {isUnlocked ? achievement.icon : '🔒'}
                                            </Text>
                                            <Text
                                                style={[
                                                    styles.badgeName,
                                                    { color: isUnlocked ? achievement.color : theme.textSecondary },
                                                ]}
                                                numberOfLines={1}
                                            >
                                                {achievement.name}
                                            </Text>
                                            {!isUnlocked && achievement.target > 1 && (
                                                <Text style={[styles.badgeProgress, { color: theme.textSecondary }]}>
                                                    {prog.current}/{achievement.target}
                                                </Text>
                                            )}
                                        </View>
                                    );
                                })}
                            </View>
                        </View>
                    );
                })}
            </View>

            {/* User Profile Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBg, { backgroundColor: COLORS.primary + '15' }]}>
                        <Text style={styles.cardIcon}>👤</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Your Profile</Text>
                </View>
                <View style={styles.inputContainer}>
                    <Text style={[styles.label, { color: theme.textSecondary }]}>Display Name</Text>
                    <TextInput
                        style={[styles.input, {
                            backgroundColor: theme.surface,
                            color: theme.text,
                            borderColor: theme.border
                        }]}
                        value={userName}
                        onChangeText={setUserName}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>
            </View>

            {/* Appearance Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBg, { backgroundColor: COLORS.accent + '15' }]}>
                        <Text style={styles.cardIcon}>🎨</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Appearance</Text>
                </View>

                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <Text style={[styles.settingLabel, { color: theme.text }]}>Dark Mode</Text>
                        <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                            {isDarkMode ? 'Enabled — easy on eyes' : 'Disabled — light & bright'}
                        </Text>
                    </View>
                    <Switch
                        value={isDarkMode}
                        onValueChange={setIsDarkMode}
                        trackColor={{ false: '#E2E8F0', true: COLORS.primaryLight }}
                        thumbColor={isDarkMode ? COLORS.primary : '#ffffff'}
                    />
                </View>

                {!isDarkMode && (
                    <View style={styles.colorSection}>
                        <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 16 }]}>
                            Background Theme
                        </Text>
                        <View style={styles.colorGrid}>
                            {colors.map((color) => {
                                const isSelected = backgroundColor === color.value;
                                return (
                                    <TouchableOpacity
                                        key={color.value}
                                        style={[
                                            styles.colorOption,
                                            {
                                                backgroundColor: color.value,
                                                borderColor: isSelected ? COLORS.primary : theme.border,
                                                borderWidth: isSelected ? 2.5 : 1,
                                            }
                                        ]}
                                        onPress={() => setBackgroundColor(color.value)}
                                        activeOpacity={0.7}
                                    >
                                        {isSelected && (
                                            <View style={styles.checkContainer}>
                                                <Text style={styles.checkmark}>✓</Text>
                                            </View>
                                        )}
                                        <Text style={[styles.colorLabel, { color: isSelected ? COLORS.primary : theme.textSecondary }]}>
                                            {color.name}
                                        </Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </View>
                )}

                <View style={[styles.colorSection, { marginTop: isDarkMode ? 16 : 24, paddingTop: 16 }]}>
                    <Text style={[styles.settingLabel, { color: theme.text, marginBottom: 12 }]}>
                        Preferred Currency
                    </Text>
                    <View style={styles.currencyGrid}>
                        {['$', '₹', '€', '£'].map((curr) => {
                            const isSelected = currencyType === curr;
                            return (
                                <TouchableOpacity
                                    key={curr}
                                    style={[
                                        styles.currencyBtn,
                                        {
                                            backgroundColor: isSelected ? COLORS.primary : theme.surface,
                                            borderColor: isSelected ? COLORS.primary : theme.border,
                                            borderWidth: isSelected ? 2 : 1,
                                        }
                                    ]}
                                    onPress={() => setCurrencyType(curr)}
                                    activeOpacity={0.7}
                                >
                                    <Text style={[styles.currencyText, { color: isSelected ? '#fff' : theme.textSecondary }]}>
                                        {curr}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            {/* Share & Links */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <View style={[styles.cardIconBg, { backgroundColor: '#EF444415' }]}>
                        <Text style={styles.cardIcon}>🔗</Text>
                    </View>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>Share & Links</Text>
                </View>

                <TouchableOpacity
                    onPress={shareApp}
                    style={[styles.linkButton, { backgroundColor: theme.surface }]}
                    activeOpacity={0.8}
                >
                    <View style={[styles.linkIconContainer, { backgroundColor: COLORS.primary + '15' }]}>
                        <Text style={styles.linkEmoji}>📤</Text>
                    </View>
                    <View style={styles.linkContent}>
                        <Text style={[styles.linkTitle, { color: theme.text }]}>Share App</Text>
                        <Text style={[styles.linkDesc, { color: theme.textSecondary }]}>Invite friends to NexaPlay</Text>
                    </View>
                    <View style={[styles.linkArrowBg, { backgroundColor: theme.border }]}>
                        <Text style={[styles.linkArrow, { color: theme.textSecondary }]}>→</Text>
                    </View>
                </TouchableOpacity>

                <View style={{ height: 8 }} />

                <TouchableOpacity
                    onPress={openYouTube}
                    style={[styles.linkButton, { backgroundColor: theme.surface }]}
                    activeOpacity={0.8}
                >
                    <View style={styles.linkIconContainer}>
                        <Text style={styles.linkEmoji}>📺</Text>
                    </View>
                    <View style={styles.linkContent}>
                        <Text style={[styles.linkTitle, { color: theme.text }]}>YouTube</Text>
                        <Text style={[styles.linkDesc, { color: theme.textSecondary }]}>Watch tutorials & more</Text>
                    </View>
                    <View style={[styles.linkArrowBg, { backgroundColor: theme.border }]}>
                        <Text style={[styles.linkArrow, { color: theme.textSecondary }]}>→</Text>
                    </View>
                </TouchableOpacity>
            </View>

            {/* App Info */}
            <View style={styles.appInfo}>
                <View style={[styles.appInfoDivider, { backgroundColor: theme.border }]} />
                <Text style={[styles.appName, { color: theme.textSecondary }]}>NexaPlay — Games & Smart Tools</Text>
                <Text style={[styles.appVersion, { color: theme.textSecondary }]}>Version 1.0.0</Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    contentContainer: {
        padding: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    // Header
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarWrapper: {
        marginBottom: 16,
    },
    avatarRing: {
        width: 100,
        height: 100,
        borderRadius: 50,
        padding: 3,
        backgroundColor: COLORS.primary + '20',
    },
    avatar: {
        width: '100%',
        height: '100%',
        borderRadius: 50,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    avatarText: {
        color: 'white',
        fontSize: 38,
        fontWeight: '700',
    },
    profileName: {
        fontSize: 26,
        fontWeight: '800',
        marginBottom: 4,
        letterSpacing: -0.3,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    // Cards
    card: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    cardIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    cardIcon: {
        fontSize: 20,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    // Stats Dashboard
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    statItem: {
        width: '30%',
        flexGrow: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 14,
    },
    statEmoji: {
        fontSize: 20,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    // Achievements
    achieveSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    achieveProgressTrack: {
        height: 6,
        borderRadius: 3,
        marginBottom: 18,
        overflow: 'hidden',
    },
    achieveProgressFill: {
        height: '100%',
        borderRadius: 3,
        backgroundColor: '#F59E0B',
    },
    categorySection: {
        marginBottom: 16,
    },
    categoryHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 6,
    },
    categoryIcon: {
        fontSize: 16,
    },
    categoryTitle: {
        fontSize: 14,
        fontWeight: '700',
        flex: 1,
    },
    categoryCount: {
        fontSize: 12,
        fontWeight: '600',
    },
    badgesRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    badge: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 10,
        borderRadius: 12,
        borderWidth: 1.5,
        minWidth: 72,
    },
    badgeIcon: {
        fontSize: 22,
        marginBottom: 4,
    },
    badgeLocked: {
        opacity: 0.4,
    },
    badgeName: {
        fontSize: 9,
        fontWeight: '700',
        textAlign: 'center',
    },
    badgeProgress: {
        fontSize: 8,
        marginTop: 2,
    },
    // Input
    inputContainer: {
        width: '100%',
    },
    label: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 10,
        textTransform: 'uppercase',
        letterSpacing: 0.8,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 16,
        fontWeight: '500',
    },
    // Settings
    settingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
    settingDesc: {
        fontSize: 13,
        marginTop: 3,
        fontWeight: '400',
    },
    // Color Picker
    colorSection: {
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    colorGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    colorOption: {
        width: 68,
        height: 68,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    checkContainer: {
        width: 22,
        height: 22,
        borderRadius: 11,
        backgroundColor: COLORS.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    checkmark: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
    colorLabel: {
        fontSize: 10,
        fontWeight: '600',
        textAlign: 'center',
    },
    currencyGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
    },
    currencyBtn: {
        width: 50,
        height: 50,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
    },
    currencyText: {
        fontSize: 20,
        fontWeight: '700',
    },
    // Links
    linkButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 14,
    },
    linkIconContainer: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: '#FF000010',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    linkEmoji: {
        fontSize: 22,
    },
    linkContent: {
        flex: 1,
    },
    linkTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    linkDesc: {
        fontSize: 13,
        marginTop: 2,
        fontWeight: '400',
    },
    linkArrowBg: {
        width: 32,
        height: 32,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    linkArrow: {
        fontSize: 16,
        fontWeight: '600',
    },
    // App Info
    appInfo: {
        alignItems: 'center',
        marginTop: 16,
    },
    appInfoDivider: {
        width: 48,
        height: 2,
        borderRadius: 1,
        marginBottom: 16,
    },
    appName: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    appVersion: {
        fontSize: 12,
        fontWeight: '500',
    },
});
