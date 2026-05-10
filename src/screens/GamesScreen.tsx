import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Animated, useWindowDimensions, Modal } from 'react-native';
import { useTheme, COLORS } from '../theme';
import SoundEffects from '../utils/sounds';

const puzzleGames = [
    { name: 'Word Scramble', icon: '🔤', route: 'WordScramble', gradient: ['#EC4899', '#F472B6'], desc: 'Unscramble words' },
    { name: 'Quiz', icon: '❓', route: 'Quiz', gradient: ['#EAB308', '#FACC15'], desc: 'Test your knowledge' },
    { name: 'Memory', icon: '🃏', route: 'MemoryMatch', gradient: ['#14B8A6', '#2DD4BF'], desc: 'Match the pairs' },
    { name: 'Sudoku', icon: '🔢', route: 'Sudoku', gradient: ['#0EA5E9', '#38BDF8'], desc: 'Number puzzles' },
    { name: '2048', icon: '🧩', route: 'Game2048', gradient: ['#EDC22E', '#F5D456'], desc: 'Slide & merge' },
];

const boardGames = [
    { name: 'Ludo', icon: '🎲', route: 'Ludo', gradient: ['#EF4444', '#F87171'], desc: 'Classic board game' },
    { name: 'Chess', icon: '♟️', route: 'Chess', gradient: ['#6B7280', '#9CA3AF'], desc: 'Strategy classic' },
    { name: 'Tic Tac Toe', icon: '❌', route: 'TicTacToe', gradient: ['#8B5CF6', '#A78BFA'], desc: 'X marks the spot' },
    { name: 'Neon Snake', icon: '🐍', route: 'Snake', gradient: ['#38BDF8', '#0284C7'], desc: 'Retro arcade' },
];

const allGames = [...puzzleGames, ...boardGames];

export default function GamesScreen({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    const [searchQuery, setSearchQuery] = useState('');
    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const containerWidth = Math.min(width, 600);
    const CARD_WIDTH = (containerWidth - 56) / 2;

    // Entrance animations
    const headerAnim = useRef(new Animated.Value(0)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(headerAnim, { toValue: 1, duration: 350, useNativeDriver: true }),
            Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 150, useNativeDriver: true }),
        ]).start();
    }, []);

    const filteredPuzzle = useMemo(() => {
        if (!searchQuery.trim()) return puzzleGames;
        const q = searchQuery.toLowerCase();
        return puzzleGames.filter(g => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q));
    }, [searchQuery]);

    const filteredBoard = useMemo(() => {
        if (!searchQuery.trim()) return boardGames;
        const q = searchQuery.toLowerCase();
        return boardGames.filter(g => g.name.toLowerCase().includes(q) || g.desc.toLowerCase().includes(q));
    }, [searchQuery]);

    const handleNavigate = useCallback((route: string) => {
        SoundEffects.tap();
        navigation.navigate(route);
    }, [navigation]);

    const getAnimIndex = (item: typeof allGames[0]) => allGames.findIndex(g => g.route === item.route);

    return (
        <View style={[styles.container, { backgroundColor: theme.bg }]}>
            {/* Header */}
            <Animated.View style={[styles.header, { opacity: headerAnim }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Games</Text>
                <Text style={[styles.headerSubtitle, { color: theme.textSecondary }]}>
                    {allGames.length} games to play
                </Text>
            </Animated.View>

            {/* Search */}
            <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                    style={[styles.searchInput, { color: theme.text }]}
                    placeholder="Search games..."
                    placeholderTextColor={theme.textSecondary}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                        <Text style={[styles.searchClear, { color: theme.textSecondary }]}>✕</Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={[styles.content, { maxWidth: 600, alignSelf: 'center', width: '100%' }]}
                showsVerticalScrollIndicator={false}
                keyboardDismissMode="on-drag"
            >
                {/* Puzzle & Trivia Section */}
                {filteredPuzzle.length > 0 && (
                    <Animated.View style={{ opacity: contentOpacity }}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionDot, { backgroundColor: '#EC4899' }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Puzzle & Trivia</Text>
                            </View>
                            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{filteredPuzzle.length} games</Text>
                        </View>
                        <View style={styles.grid}>
                            {filteredPuzzle.map((item) => (
                                <TouchableOpacity
                                    key={item.route}
                                    style={[styles.gameCard, { backgroundColor: theme.card, width: CARD_WIDTH }]}
                                    onPress={() => handleNavigate(item.route)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.gameIconBg, { backgroundColor: item.gradient[0] + '15' }]}>
                                        <Text style={styles.gameIcon}>{item.icon}</Text>
                                    </View>
                                    <Text style={[styles.gameName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.gameDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                                    <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* Board Games Section */}
                {filteredBoard.length > 0 && (
                    <Animated.View style={{ opacity: contentOpacity }}>
                        <View style={styles.sectionHeader}>
                            <View style={styles.sectionTitleRow}>
                                <View style={[styles.sectionDot, { backgroundColor: '#EF4444' }]} />
                                <Text style={[styles.sectionTitle, { color: theme.text }]}>Board Games</Text>
                            </View>
                            <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{filteredBoard.length} games</Text>
                        </View>
                        <View style={styles.grid}>
                            {filteredBoard.map((item) => (
                                <TouchableOpacity
                                    key={item.route}
                                    style={[styles.gameCard, { backgroundColor: theme.card, width: CARD_WIDTH }]}
                                    onPress={() => handleNavigate(item.route)}
                                    activeOpacity={0.75}
                                >
                                    <View style={[styles.gameIconBg, { backgroundColor: item.gradient[0] + '15' }]}>
                                        <Text style={styles.gameIcon}>{item.icon}</Text>
                                    </View>
                                    <Text style={[styles.gameName, { color: theme.text }]}>{item.name}</Text>
                                    <Text style={[styles.gameDesc, { color: theme.textSecondary }]}>{item.desc}</Text>
                                    <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </Animated.View>
                )}

                {/* No results */}
                {searchQuery && filteredPuzzle.length === 0 && filteredBoard.length === 0 && (
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🎮</Text>
                        <Text style={[styles.emptyText, { color: theme.text }]}>No games found</Text>
                        <Text style={[styles.emptySubtext, { color: theme.textSecondary }]}>Try a different search</Text>
                    </View>
                )}

                <View style={{ height: 100 }} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 30,
    },
    // Header
    header: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: 15,
        fontWeight: '500',
    },
    // Search
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginHorizontal: 20,
        marginTop: 16,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    searchIcon: {
        fontSize: 18,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 15,
        fontWeight: '500',
        paddingVertical: 0,
    },
    searchClear: {
        fontSize: 16,
        fontWeight: '600',
        paddingLeft: 8,
    },
    // Section
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        marginTop: 8,
    },
    sectionTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    sectionDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 10,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    sectionCount: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    gameCard: {
        paddingTop: 22,
        paddingBottom: 18,
        paddingHorizontal: 14,
        borderRadius: 20,
        marginBottom: 14,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    gameIconBg: {
        width: 56,
        height: 56,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    gameIcon: {
        fontSize: 28,
    },
    gameName: {
        fontSize: 15,
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: -0.1,
        marginBottom: 4,
    },
    gameDesc: {
        fontSize: 11,
        fontWeight: '500',
        textAlign: 'center',
    },
    cardAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: 20,
        borderBottomRightRadius: 20,
    },
    // Empty
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '700',
    },
    emptySubtext: {
        fontSize: 14,
        marginTop: 4,
    },
});
