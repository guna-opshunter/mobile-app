import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, FlatList, RefreshControl } from 'react-native';
import { useTheme, COLORS } from '../theme';
import { useRecords, getBirthdayCountdown, BMIRecord, BirthdayRecord, GameRecord, QuizRecord, SavedLudoGame } from '../context/RecordsContext';

type TabType = 'bmi' | 'birthday' | 'games' | 'quiz';

export default function RecordsScreen({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const {
        bmiRecords,
        birthdayRecords,
        gameRecords,
        quizRecords,
        savedGames,
        deleteBMIRecord,
        deleteBirthdayRecord,
        deleteGameRecord,
        deleteQuizRecord,
        deleteSavedGame,
    } = useRecords();

    const [activeTab, setActiveTab] = useState<TabType>('quiz');
    const [countdowns, setCountdowns] = useState<{ [key: string]: ReturnType<typeof getBirthdayCountdown> }>({});

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    // Update birthday countdowns every second
    useEffect(() => {
        if (activeTab !== 'birthday') return;

        const updateCountdowns = () => {
            const newCountdowns: typeof countdowns = {};
            birthdayRecords.forEach(record => {
                newCountdowns[record.id] = getBirthdayCountdown(record.day, record.month);
            });
            setCountdowns(newCountdowns);
        };

        updateCountdowns();
        const interval = setInterval(updateCountdowns, 1000);
        return () => clearInterval(interval);
    }, [activeTab, birthdayRecords]);

    const handleDelete = (type: TabType, id: string, name: string) => {
        const typeLabel = type === 'bmi' ? 'BMI' : type === 'birthday' ? 'birthday' : type === 'quiz' ? 'quiz' : 'game';

        Alert.alert(
            'Delete Record',
            `Delete this ${typeLabel} record?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => {
                        if (type === 'bmi') deleteBMIRecord(id);
                        else if (type === 'birthday') deleteBirthdayRecord(id);
                        else if (type === 'quiz') deleteQuizRecord(id);
                        else deleteGameRecord(id);
                    },
                },
            ]
        );
    };

    const tabs = [
        { key: 'quiz' as TabType, label: 'Quiz', icon: '🎓', count: quizRecords.length, color: COLORS.primary },
        { key: 'bmi' as TabType, label: 'BMI', icon: '⚖️', count: bmiRecords.length, color: '#3B82F6' },
        { key: 'birthday' as TabType, label: 'Birthday', icon: '🎂', count: birthdayRecords.length, color: '#F97316' },
        { key: 'games' as TabType, label: 'Games', icon: '🎮', count: gameRecords.length + savedGames.length, color: '#EF4444' },
    ];

    const renderQuizRecords = () => {
        if (quizRecords.length === 0) {
            return renderEmptyState('🎓', 'No quiz records yet', 'Complete a quiz to see your scores here', 'Start a Quiz →', 'Quiz');
        }

        // Group records by level
        const groupedByLevel: { [key: number]: QuizRecord[] } = {};
        quizRecords.forEach(record => {
            if (!groupedByLevel[record.levelId]) {
                groupedByLevel[record.levelId] = [];
            }
            groupedByLevel[record.levelId].push(record);
        });

        return (
            <View>
                {Object.entries(groupedByLevel).map(([levelId, records]) => {
                    const levelRecord = records[0];
                    const highScore = Math.max(...records.map(r => r.score));

                    return (
                        <View key={levelId} style={[styles.quizLevelCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.quizLevelHeader, { borderBottomColor: theme.border }]}>
                                <View style={[styles.levelIconBg, { backgroundColor: levelRecord.levelColor + '18' }]}>
                                    <Text style={styles.levelIconText}>{levelRecord.levelIcon}</Text>
                                </View>
                                <View style={styles.levelHeaderInfo}>
                                    <Text style={[styles.levelTitle, { color: theme.text }]}>{levelRecord.levelName}</Text>
                                    <Text style={[styles.levelSubtitle, { color: levelRecord.levelColor }]}>
                                        {records.length} attempt{records.length > 1 ? 's' : ''}
                                    </Text>
                                </View>
                                <View style={[styles.highScoreContainer, { backgroundColor: '#F59E0B15' }]}>
                                    <Text style={styles.highScoreLabel}>🏆 Best</Text>
                                    <Text style={[styles.highScoreValue, { color: levelRecord.levelColor }]}>{highScore}</Text>
                                </View>
                            </View>

                            {records.slice(0, 5).map((record) => (
                                <View key={record.id} style={[styles.quizAttempt, { borderBottomColor: theme.border + '40' }]}>
                                    <View style={styles.attemptInfo}>
                                        <Text style={[styles.attemptDate, { color: theme.textSecondary }]}>{record.dateTime}</Text>
                                        <View style={styles.attemptStats}>
                                            <View style={[styles.statPill, { backgroundColor: levelRecord.levelColor + '15' }]}>
                                                <Text style={[styles.attemptScore, { color: levelRecord.levelColor }]}>
                                                    {record.score} pts
                                                </Text>
                                            </View>
                                            <View style={[styles.statPill, { backgroundColor: theme.surface }]}>
                                                <Text style={[styles.attemptCorrect, { color: theme.text }]}>
                                                    {record.correctAnswers}/{record.totalQuestions} ✓
                                                </Text>
                                            </View>
                                            <View style={[styles.statPill, {
                                                backgroundColor: record.percentage >= 70 ? '#10B98115' : record.percentage >= 40 ? '#F59E0B15' : '#EF444415'
                                            }]}>
                                                <Text style={[
                                                    styles.attemptPercentage,
                                                    { color: record.percentage >= 70 ? '#10B981' : record.percentage >= 40 ? '#F59E0B' : '#EF4444' }
                                                ]}>
                                                    {record.percentage}%
                                                </Text>
                                            </View>
                                            {record.highScore && (
                                                <Text style={styles.highScoreBadge}>👑</Text>
                                            )}
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={[styles.deleteButton, { backgroundColor: '#EF444410' }]}
                                        onPress={() => handleDelete('quiz', record.id, '')}
                                    >
                                        <Text style={styles.deleteButtonText}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}

                            {records.length > 5 && (
                                <Text style={[styles.moreAttempts, { color: theme.textSecondary }]}>
                                    +{records.length - 5} more attempts
                                </Text>
                            )}
                        </View>
                    );
                })}
            </View>
        );
    };

    const renderBMIRecords = () => {
        if (bmiRecords.length === 0) {
            return renderEmptyState('⚖️', 'No BMI records saved yet', 'Calculate your BMI and tap "Save to Records"', 'Calculate BMI →', 'BMI');
        }

        return bmiRecords.map((record: BMIRecord) => (
            <View key={record.id} style={[styles.recordCard, { backgroundColor: theme.card }]}>
                <View style={styles.recordHeader}>
                    <View>
                        <Text style={[styles.recordName, { color: theme.text }]}>{record.name || 'BMI Record'}</Text>
                        <Text style={[styles.recordDate, { color: theme.textSecondary }]}>{record.dateTime}</Text>
                    </View>
                    <TouchableOpacity
                        style={[styles.deleteButton, { backgroundColor: '#EF444410' }]}
                        onPress={() => handleDelete('bmi', record.id, '')}
                    >
                        <Text style={styles.deleteIconText}>×</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.bmiContent}>
                    <View style={[styles.bmiValueContainer, { backgroundColor: record.color + '12' }]}>
                        <Text style={[styles.bmiValue, { color: record.color }]}>{record.bmi}</Text>
                        <Text style={[styles.bmiCategory, { color: record.color }]}>{record.category}</Text>
                    </View>
                    <View style={styles.bmiDetails}>
                        <View style={[styles.bmiDetailRow, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.bmiDetailLabel, { color: theme.textSecondary }]}>Height</Text>
                            <Text style={[styles.bmiDetailValue, { color: theme.text }]}>{record.height} cm</Text>
                        </View>
                        <View style={[styles.bmiDetailRow, { backgroundColor: theme.surface }]}>
                            <Text style={[styles.bmiDetailLabel, { color: theme.textSecondary }]}>Weight</Text>
                            <Text style={[styles.bmiDetailValue, { color: theme.text }]}>{record.weight} kg</Text>
                        </View>
                    </View>
                </View>
            </View>
        ));
    };

    const renderBirthdayRecords = () => {
        if (birthdayRecords.length === 0) {
            return renderEmptyState('🎂', 'No birthdays saved yet', 'Use the Age Calculator and save your birthday', 'Calculate Age →', 'Age');
        }

        return birthdayRecords.map((record: BirthdayRecord) => {
            const countdown = countdowns[record.id];
            return (
                <View key={record.id} style={[styles.recordCard, { backgroundColor: theme.card }]}>
                    <View style={styles.recordHeader}>
                        <Text style={[styles.recordName, { color: theme.text }]}>{record.name || 'My Birthday'}</Text>
                        <TouchableOpacity
                            style={[styles.deleteButton, { backgroundColor: '#EF444410' }]}
                            onPress={() => handleDelete('birthday', record.id, record.name)}
                        >
                            <Text style={styles.deleteIconText}>×</Text>
                        </TouchableOpacity>
                    </View>
                    <View style={[styles.birthdayDateRow, { backgroundColor: theme.surface }]}>
                        <Text style={styles.birthdayDateIcon}>📅</Text>
                        <Text style={[styles.birthdayDate, { color: theme.text }]}>
                            {record.day}/{record.month}/{record.year}
                        </Text>
                    </View>
                    {record.ageYears !== undefined && (
                        <View style={[styles.ageRow, { backgroundColor: '#6366F110' }]}>
                            <Text style={styles.ageIcon}>🎈</Text>
                            <Text style={[styles.ageText, { color: theme.text }]}>
                                {record.ageYears}y {record.ageMonths}m {record.ageDays}d
                            </Text>
                        </View>
                    )}
                    {countdown && (
                        <View style={styles.countdownContainer}>
                            <Text style={[styles.countdownLabel, { color: theme.text }]}>
                                🎉 Next Birthday In
                            </Text>
                            <View style={styles.countdownRow}>
                                {[
                                    { val: countdown.days, label: 'Days' },
                                    { val: countdown.hours, label: 'Hours' },
                                    { val: countdown.minutes, label: 'Mins' },
                                    { val: countdown.seconds, label: 'Secs' },
                                ].map((item, idx) => (
                                    <View key={idx} style={styles.countdownBox}>
                                        <Text style={styles.countdownValue}>{item.val}</Text>
                                        <Text style={styles.countdownUnit}>{item.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}
                    <Text style={[styles.savedDate, { color: theme.textSecondary }]}>Saved: {record.dateTime}</Text>
                </View>
            );
        });
    };

    const LUDO_COLORS = ['#E53935', '#1E88E5', '#43A047', '#FDD835'];
    const LUDO_COLOR_NAMES = ['Red', 'Blue', 'Green', 'Yellow'];

    const renderGameRecords = () => {
        if (gameRecords.length === 0 && savedGames.length === 0) {
            return renderEmptyState('🎲', 'No game records saved yet', 'Complete a Ludo game and save the result', 'Play Ludo →', 'Ludo');
        }

        return (
            <View>
                {/* Saved Games - Continue Playing */}
                {savedGames.map((save: SavedLudoGame) => {
                    const activePlayers = save.players.filter(p => p.active).length;
                    return (
                        <View key={save.id} style={[styles.recordCard, styles.savedGameCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.savedGameBanner, { backgroundColor: '#10B98118' }]}>
                                <Text style={styles.savedGameBannerIcon}>⏸️</Text>
                                <Text style={[styles.savedGameBannerText, { color: '#10B981' }]}>Saved Game</Text>
                            </View>
                            <View style={styles.recordHeader}>
                                <Text style={[styles.recordDate, { color: theme.textSecondary }]}>{save.dateTime}</Text>
                                <TouchableOpacity
                                    style={[styles.deleteButton, { backgroundColor: '#EF444410' }]}
                                    onPress={() => {
                                        Alert.alert('Delete Save', 'Delete this saved game?', [
                                            { text: 'Cancel', style: 'cancel' },
                                            { text: 'Delete', style: 'destructive', onPress: () => deleteSavedGame(save.id) },
                                        ]);
                                    }}
                                >
                                    <Text style={styles.deleteButtonText}>🗑️</Text>
                                </TouchableOpacity>
                            </View>
                            <View style={styles.gameContent}>
                                <View style={[styles.gameIconContainer, { backgroundColor: '#6366F115' }]}>
                                    <Text style={styles.gameIcon}>🎲</Text>
                                </View>
                                <View style={styles.gameDetails}>
                                    <Text style={[styles.gameTitle, { color: theme.text }]}>Ludo Match</Text>
                                    <View style={styles.gameMetaRow}>
                                        <View style={[styles.gameMetaPill, { backgroundColor: theme.surface }]}>
                                            <Text style={[styles.gameInfo, { color: theme.textSecondary }]}>
                                                {save.playMode === 'passplay' ? '👥 Pass & Play' : '🤖 vs CPU'}
                                            </Text>
                                        </View>
                                        <View style={[styles.gameMetaPill, { backgroundColor: theme.surface }]}>
                                            <Text style={[styles.gameInfo, { color: theme.textSecondary }]}>
                                                {activePlayers} Players
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={styles.savedTokensRow}>
                                        {save.players.map((p, idx) => p.active && (
                                            <View key={idx} style={[styles.savedTokenDot, { backgroundColor: LUDO_COLORS[idx] }]}>
                                                <Text style={styles.savedTokenLabel}>{LUDO_COLOR_NAMES[idx][0]}</Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            </View>
                            <TouchableOpacity
                                style={styles.continueButton}
                                onPress={() => navigation.navigate('Ludo', { savedGame: save })}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.continueButtonText}>▶ Continue Game</Text>
                            </TouchableOpacity>
                        </View>
                    );
                })}

                {/* Completed Game Records */}
                {gameRecords.map((record: GameRecord) => (
                    <View key={record.id} style={[styles.recordCard, { backgroundColor: theme.card }]}>
                        <View style={styles.recordHeader}>
                            <Text style={[styles.recordDate, { color: theme.textSecondary }]}>{record.dateTime}</Text>
                            <TouchableOpacity
                                style={[styles.deleteButton, { backgroundColor: '#EF444410' }]}
                                onPress={() => handleDelete('games', record.id, '')}
                            >
                                <Text style={styles.deleteButtonText}>🗑️</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.gameContent}>
                            <View style={[styles.gameIconContainer, { backgroundColor: '#EF444415' }]}>
                                <Text style={styles.gameIcon}>🎲</Text>
                            </View>
                            <View style={styles.gameDetails}>
                                <Text style={[styles.gameTitle, { color: theme.text }]}>Ludo Match</Text>
                                <View style={styles.winnerRow}>
                                    <View style={[styles.colorDot, { backgroundColor: record.winnerColor }]} />
                                    <Text style={[styles.winnerText, { color: record.winnerColor }]}>
                                        🏆 {record.winner} {record.isHumanWinner ? 'Won!' : 'Won'}
                                    </Text>
                                </View>
                                <View style={styles.gameMetaRow}>
                                    <View style={[styles.gameMetaPill, { backgroundColor: theme.surface }]}>
                                        <Text style={[styles.gameInfo, { color: theme.textSecondary }]}>
                                            {record.gameMode === 'passplay' ? '👥 Pass & Play' : '🤖 vs CPU'}
                                        </Text>
                                    </View>
                                    {record.difficulty && (
                                        <View style={[styles.gameMetaPill, { backgroundColor: theme.surface }]}>
                                            <Text style={[styles.gameInfo, { color: theme.textSecondary }]}>
                                                {record.difficulty.charAt(0).toUpperCase() + record.difficulty.slice(1)}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    const renderEmptyState = (icon: string, title: string, subtitle: string, ctaLabel?: string, ctaRoute?: string) => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconBg, { backgroundColor: COLORS.primary + '10' }]}>
                <Text style={styles.emptyIcon}>{icon}</Text>
            </View>
            <Text style={[styles.emptyText, { color: theme.text }]}>{title}</Text>
            <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>{subtitle}</Text>
            {ctaLabel && ctaRoute && (
                <TouchableOpacity
                    style={styles.emptyCta}
                    onPress={() => navigation.navigate(ctaRoute)}
                    activeOpacity={0.8}
                >
                    <Text style={styles.emptyCtaText}>{ctaLabel}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            {/* Header */}
            <View style={styles.headerContainer}>
                {navigation?.canGoBack?.() && (
                    <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                        <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                            <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                        </View>
                    </TouchableOpacity>
                )}
                <Text style={[styles.title, { color: theme.text }]}>Records</Text>
                <Text style={[styles.subtitleText, { color: theme.textSecondary }]}>Your saved data & history</Text>
            </View>

            {/* Tabs */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabScrollView}>
                <View style={styles.tabContainer}>
                    {tabs.map((tab) => {
                        const isActive = activeTab === tab.key;
                        return (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.tab,
                                    isActive && { backgroundColor: tab.color },
                                    !isActive && { backgroundColor: theme.surface },
                                ]}
                                onPress={() => setActiveTab(tab.key)}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.tabIcon}>{tab.icon}</Text>
                                <Text style={[
                                    styles.tabText,
                                    { color: isActive ? 'white' : theme.textSecondary }
                                ]}>
                                    {tab.label}
                                </Text>
                                <View style={[
                                    styles.tabBadge,
                                    { backgroundColor: isActive ? 'rgba(255,255,255,0.25)' : theme.border }
                                ]}>
                                    <Text style={[
                                        styles.tabBadgeText,
                                        { color: isActive ? 'white' : theme.textSecondary }
                                    ]}>
                                        {tab.count}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>

            {/* Records Content */}
            <FlatList
                style={styles.content}
                data={[activeTab]}
                keyExtractor={() => activeTab}
                renderItem={() => (
                    <View>
                        {activeTab === 'quiz' && renderQuizRecords()}
                        {activeTab === 'bmi' && renderBMIRecords()}
                        {activeTab === 'birthday' && renderBirthdayRecords()}
                        {activeTab === 'games' && renderGameRecords()}
                        <View style={styles.bottomPadding} />
                    </View>
                )}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={false}
                        onRefresh={() => {
                            // Force a re-render by toggling tab
                            const current = activeTab;
                            setActiveTab(current);
                        }}
                        tintColor={COLORS.primary}
                        colors={[COLORS.primary]}
                    />
                }
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    headerContainer: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 8,
    },
    backButton: {
        marginBottom: 12,
    },
    backButtonBg: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 15,
        fontWeight: '500',
    },
    // Tabs
    tabScrollView: {
        marginVertical: 16,
        maxHeight: 52,
        paddingLeft: 20,
    },
    tabContainer: {
        flexDirection: 'row',
        gap: 10,
        paddingRight: 20,
    },
    tab: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 14,
        gap: 6,
    },
    tabIcon: {
        fontSize: 16,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
    },
    tabBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
        marginLeft: 2,
    },
    tabBadgeText: {
        fontSize: 11,
        fontWeight: '700',
    },
    content: {
        flex: 1,
        paddingHorizontal: 20,
    },
    // Record Cards
    recordCard: {
        borderRadius: 18,
        padding: 18,
        marginBottom: 12,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
    },
    recordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    recordDate: {
        fontSize: 13,
        fontWeight: '600',
    },
    recordName: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 2,
        letterSpacing: -0.2,
    },
    deleteButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
    },
    deleteButtonText: {
        fontSize: 16,
    },
    deleteIconText: {
        fontSize: 22,
        color: '#EF4444',
        fontWeight: '300',
    },
    // Quiz Styles
    quizLevelCard: {
        borderRadius: 18,
        marginBottom: 16,
        overflow: 'hidden',
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 10,
    },
    quizLevelHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    levelIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    levelIconText: {
        fontSize: 24,
    },
    levelHeaderInfo: {
        flex: 1,
    },
    levelTitle: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    levelSubtitle: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    highScoreContainer: {
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    highScoreLabel: {
        fontSize: 11,
        fontWeight: '600',
    },
    highScoreValue: {
        fontSize: 20,
        fontWeight: '800',
    },
    quizAttempt: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderBottomWidth: 0.5,
    },
    attemptInfo: {
        flex: 1,
    },
    attemptDate: {
        fontSize: 12,
        marginBottom: 6,
        fontWeight: '500',
    },
    attemptStats: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 6,
    },
    statPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    attemptScore: {
        fontSize: 13,
        fontWeight: '700',
    },
    attemptCorrect: {
        fontSize: 13,
        fontWeight: '600',
    },
    attemptPercentage: {
        fontSize: 13,
        fontWeight: '700',
    },
    highScoreBadge: {
        fontSize: 14,
        marginLeft: 2,
    },
    moreAttempts: {
        textAlign: 'center',
        padding: 12,
        fontSize: 13,
        fontWeight: '500',
    },
    // BMI Styles
    bmiContent: {
        flexDirection: 'row',
        alignItems: 'stretch',
    },
    bmiValueContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 14,
        marginRight: 14,
    },
    bmiValue: {
        fontSize: 32,
        fontWeight: '800',
    },
    bmiCategory: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    bmiDetails: {
        flex: 1,
        gap: 8,
    },
    bmiDetailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
    },
    bmiDetailLabel: {
        fontSize: 13,
        fontWeight: '500',
    },
    bmiDetailValue: {
        fontSize: 14,
        fontWeight: '700',
    },
    // Birthday Styles
    birthdayDateRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    birthdayDateIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    birthdayDate: {
        fontSize: 15,
        fontWeight: '600',
    },
    ageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 10,
        marginBottom: 10,
    },
    ageIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    ageText: {
        fontSize: 15,
        fontWeight: '600',
    },
    countdownContainer: {
        backgroundColor: COLORS.primary + '10',
        borderRadius: 14,
        padding: 14,
        marginBottom: 10,
    },
    countdownLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    countdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    countdownBox: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 6,
        flex: 1,
    },
    countdownValue: {
        fontSize: 22,
        fontWeight: '800',
        color: 'white',
    },
    countdownUnit: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        fontWeight: '600',
    },
    savedDate: {
        fontSize: 12,
        fontWeight: '500',
    },
    // Game Styles
    gameContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    gameIconContainer: {
        width: 52,
        height: 52,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    gameIcon: {
        fontSize: 26,
    },
    gameDetails: {
        flex: 1,
    },
    gameTitle: {
        fontSize: 17,
        fontWeight: '700',
        marginBottom: 4,
        letterSpacing: -0.2,
    },
    winnerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    colorDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        marginRight: 8,
    },
    winnerText: {
        fontSize: 15,
        fontWeight: '600',
    },
    gameMetaRow: {
        flexDirection: 'row',
        gap: 8,
    },
    gameMetaPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
    },
    gameInfo: {
        fontSize: 12,
        fontWeight: '600',
    },
    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIconBg: {
        width: 80,
        height: 80,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    emptyIcon: {
        fontSize: 36,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        letterSpacing: -0.2,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        paddingHorizontal: 40,
        lineHeight: 20,
        fontWeight: '400',
    },
    emptyCta: {
        marginTop: 20,
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 14,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    emptyCtaText: {
        color: 'white',
        fontSize: 15,
        fontWeight: '700',
    },
    // Saved Game Styles
    savedGameCard: {
        borderWidth: 1.5,
        borderColor: '#10B98140',
    },
    savedGameBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 10,
        marginBottom: 12,
        gap: 8,
    },
    savedGameBannerIcon: {
        fontSize: 14,
    },
    savedGameBannerText: {
        fontSize: 13,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    savedTokensRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 8,
    },
    savedTokenDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    savedTokenLabel: {
        color: 'white',
        fontSize: 11,
        fontWeight: '800',
    },
    continueButton: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 14,
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    continueButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    bottomPadding: {
        height: 30,
    },
});
