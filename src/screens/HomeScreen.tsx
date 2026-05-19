import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, ScrollView, Animated, KeyboardAvoidingView, Platform, useWindowDimensions, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../theme';
import SoundEffects from '../utils/sounds';
import { ms, fp, wp, getHorizontalPadding } from '../utils/responsive';

// Static data arrays moved outside component to prevent re-creation on every render
const calculators = [
    { name: 'Calculator', icon: '🧮', route: 'Calculator', gradient: ['#6366F1', '#818CF8'] },
    { name: 'EMI', icon: '💰', route: 'EMI', gradient: ['#10B981', '#34D399'] },
    { name: 'Age', icon: '🎂', route: 'Age', gradient: ['#F97316', '#FB923C'] },
    { name: 'BMI', icon: '⚖️', route: 'BMI', gradient: ['#3B82F6', '#60A5FA'] },
    { name: 'Area', icon: '📐', route: 'Area', gradient: ['#8B5CF6', '#A78BFA'] },
    { name: 'Percentage', icon: '💯', route: 'Percentage', gradient: ['#EC4899', '#F472B6'] },
    { name: 'Temp', icon: '🌡️', route: 'Temperature', gradient: ['#EF4444', '#F87171'] },
    { name: 'Speed', icon: '🚀', route: 'Speed', gradient: ['#14B8A6', '#2DD4BF'] },
    { name: 'Currency', icon: '💱', route: 'Currency', gradient: ['#F59E0B', '#FBBF24'] },
    { name: 'Trig', icon: '📐', route: 'Trig', gradient: ['#8B5CF6', '#C084FC'] },
    { name: 'Mensuration', icon: '📏', route: 'Mensuration', gradient: ['#3B82F6', '#60A5FA'] },
    { name: 'Algebra', icon: '🔣', route: 'Algebra', gradient: ['#10B981', '#34D399'] },
    { name: 'Log', icon: '📊', route: 'Log', gradient: ['#6366F1', '#818CF8'] },
    { name: 'Password', icon: '🔐', route: 'PasswordGen', gradient: ['#EC4899', '#F472B6'] },
    { name: 'Tip Calc', icon: '💵', route: 'TipCalc', gradient: ['#F59E0B', '#FBBF24'] },
];

const games = [
    { name: 'Word Scramble', icon: '🔤', route: 'WordScramble', gradient: ['#EC4899', '#F472B6'] },
    { name: 'Quiz', icon: '❓', route: 'Quiz', gradient: ['#EAB308', '#FACC15'] },
    { name: 'Memory', icon: '🃏', route: 'MemoryMatch', gradient: ['#14B8A6', '#2DD4BF'] },
    { name: 'Sudoku', icon: '🔢', route: 'Sudoku', gradient: ['#0EA5E9', '#38BDF8'] },
    { name: '2048', icon: '🧩', route: 'Game2048', gradient: ['#EDC22E', '#F5D456'] },
    { name: 'Ludo', icon: '🎲', route: 'Ludo', gradient: ['#EF4444', '#F87171'] },
    { name: 'Chess', icon: '♟️', route: 'Chess', gradient: ['#6B7280', '#9CA3AF'] },
    { name: 'Snake & Ladder', icon: '🪜', route: 'SnakeLadder', gradient: ['#10B981', '#34D399'] },
    { name: 'Tic Tac Toe', icon: '❌', route: 'TicTacToe', gradient: ['#8B5CF6', '#A78BFA'] },
    { name: 'Neon Snake', icon: '🐍', route: 'Snake', gradient: ['#38BDF8', '#0284C7'] },
];

const allItems = [...calculators, ...games];

export default function HomeScreen({ navigation }: any) {
    const { userName, setUserName, isDarkMode, backgroundColor, recentlyUsed, addRecentlyUsed, favorites, toggleFavorite, isFavorite } = useTheme();
    const [showOptions, setShowOptions] = React.useState(!!userName);
    const [searchQuery, setSearchQuery] = useState('');
    const { width, height } = useWindowDimensions();

    const theme = isDarkMode ? COLORS.dark : COLORS.light;
    
    // Responsive grid: adapt columns and card size to screen width
    const hPad = getHorizontalPadding();
    const containerWidth = Math.min(width, 600);
    const numCols = width >= 600 ? 5 : width >= 430 ? 4 : 3;
    const gridGap = ms(12);
    const CARD_WIDTH = (containerWidth - (hPad * 2) - (gridGap * (numCols - 1))) / numCols;

    // Lightweight animations — one per section instead of one per card
    const headerOpacity = useRef(new Animated.Value(0)).current;
    const headerSlide = useRef(new Animated.Value(-20)).current;
    const contentOpacity = useRef(new Animated.Value(0)).current;

    // Welcome screen animations
    const welcomeOpacity = useRef(new Animated.Value(0)).current;
    const welcomeScale = useRef(new Animated.Value(0.95)).current;

    useEffect(() => {
        if (!showOptions) {
            // Welcome screen entrance - fast fade in
            Animated.parallel([
                Animated.timing(welcomeOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
                Animated.timing(welcomeScale, { toValue: 1, duration: 200, useNativeDriver: true }),
            ]).start();
        } else {
            // Dashboard entrance — simple fade in for header + content
            Animated.parallel([
                Animated.timing(headerOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
                Animated.timing(headerSlide, { toValue: 0, duration: 300, useNativeDriver: true }),
                Animated.timing(contentOpacity, { toValue: 1, duration: 400, delay: 100, useNativeDriver: true }),
            ]).start();
        }
    }, [showOptions]);

    const handleDone = () => {
        if (userName.trim()) {
            setShowOptions(true);
            Keyboard.dismiss();
        } else {
            alert("Please enter your name first!");
        }
    };

    const getTimeGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    };

    // Search filtering
    const filteredCalculators = useMemo(() => {
        if (!searchQuery.trim()) return calculators;
        const q = searchQuery.toLowerCase();
        return calculators.filter(item => item.name.toLowerCase().includes(q));
    }, [searchQuery]);

    const filteredGames = useMemo(() => {
        if (!searchQuery.trim()) return games;
        const q = searchQuery.toLowerCase();
        return games.filter(item => item.name.toLowerCase().includes(q));
    }, [searchQuery]);

    // Recently used items
    const recentItems = useMemo(() => {
        return recentlyUsed
            .map(route => allItems.find(item => item.route === route))
            .filter(Boolean) as typeof allItems;
    }, [recentlyUsed]);

    const handleNavigate = useCallback((route: string) => {
        SoundEffects.tap();
        addRecentlyUsed(route);
        navigation.navigate(route);
    }, [addRecentlyUsed, navigation]);

    const handleLongPress = useCallback((route: string, name: string) => {
        SoundEffects.capture();
        toggleFavorite(route);
    }, [toggleFavorite]);

    // Favorite items
    const favoriteItems = useMemo(() => {
        return favorites
            .map(route => allItems.find(item => item.route === route))
            .filter(Boolean) as typeof allItems;
    }, [favorites]);

    const handleSkip = () => {
        setUserName('Friend');
        setShowOptions(true);
        Keyboard.dismiss();
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : backgroundColor }]} edges={['top']}>
            {!showOptions ? (
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                    style={{ flex: 1 }}
                >
                    <Animated.View style={[styles.inputSection, {
                        opacity: welcomeOpacity,
                        transform: [{ scale: welcomeScale }],
                    }]}>
                        {/* Decorative circles */}
                        <View style={[styles.decorCircle, styles.decorCircle1, { backgroundColor: COLORS.primary + '15' }]} />
                        <View style={[styles.decorCircle, styles.decorCircle2, { backgroundColor: COLORS.accent + '10' }]} />

                        <Text style={styles.welcomeIcon}>✨</Text>
                        <Text style={[styles.title, { color: theme.text }]}>Welcome!</Text>
                        <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                            Let's personalize your experience
                        </Text>

                        <View style={[styles.card, { backgroundColor: theme.card }]}>
                            <Text style={[styles.cardLabel, { color: theme.textSecondary }]}>
                                What's your name?
                            </Text>

                            <TextInput
                                style={[styles.input, {
                                    backgroundColor: theme.surface,
                                    borderColor: theme.border,
                                    color: theme.text
                                }]}
                                placeholder="Enter your name"
                                placeholderTextColor={theme.textSecondary}
                                value={userName}
                                onChangeText={setUserName}
                                returnKeyType="done"
                                onSubmitEditing={handleDone}
                                autoFocus={true}
                                autoCorrect={false}
                                autoCapitalize="words"
                            />

                            <TouchableOpacity
                                style={styles.doneButton}
                                onPress={handleDone}
                                activeOpacity={0.85}
                            >
                                <Text style={styles.doneButtonText}>Get Started →</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={handleSkip}
                                activeOpacity={0.7}
                                style={styles.skipButton}
                            >
                                <Text style={[styles.skipButtonText, { color: theme.textSecondary }]}>Skip for now</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </KeyboardAvoidingView>
            ) : (
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={[styles.navSection, { maxWidth: 600, alignSelf: 'center', width: '100%', paddingHorizontal: hPad }]}
                    showsVerticalScrollIndicator={false}
                    keyboardDismissMode="on-drag"
                >
                    {/* Animated Header */}
                    <Animated.View style={[styles.header, {
                        opacity: headerOpacity,
                        transform: [{ translateY: headerSlide }],
                        flexDirection: 'row',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }]}>
                        <View>
                            <Text style={[styles.greeting, { color: theme.textSecondary }]}>{getTimeGreeting()},</Text>
                            <Text style={[styles.userName, { color: theme.text }]}>{userName} 👋</Text>
                        </View>
                        <TouchableOpacity 
                            onPress={() => navigation.navigate('Profile')}
                            style={{
                                width: 44,
                                height: 44,
                                borderRadius: 22,
                                backgroundColor: theme.card,
                                justifyContent: 'center',
                                alignItems: 'center',
                                shadowColor: '#000',
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.1,
                                shadowRadius: 8,
                                elevation: 3,
                            }}
                        >
                            <Text style={{ fontSize: 20 }}>👤</Text>
                        </TouchableOpacity>
                    </Animated.View>

                    {/* Search Bar */}
                    <View style={[styles.searchContainer, { backgroundColor: theme.card }]}>
                        <Text style={styles.searchIcon}>🔍</Text>
                        <TextInput
                            style={[styles.searchInput, { color: theme.text }]}
                            placeholder="Search tools & games..."
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

                    {/* Favorites */}
                    {favoriteItems.length > 0 && !searchQuery && (
                        <View style={{ marginBottom: 24 }}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <View style={[styles.sectionDot, { backgroundColor: '#F59E0B' }]} />
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>⭐ Favorites</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {favoriteItems.map((item) => (
                                    <TouchableOpacity
                                        key={'fav-' + item.route}
                                        style={[styles.recentCard, styles.favCard, { backgroundColor: theme.card }]}
                                        onPress={() => handleNavigate(item.route)}
                                        onLongPress={() => handleLongPress(item.route, item.name)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={styles.favStarBadge}>
                                            <Text style={{ fontSize: 10 }}>⭐</Text>
                                        </View>
                                        <View style={[styles.recentIconBg, { backgroundColor: item.gradient[0] + '15' }]}>
                                            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                                        </View>
                                        <Text style={[styles.recentName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                        <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Recently Used */}
                    {recentItems.length > 0 && !searchQuery && (
                        <View style={{ marginBottom: 24 }}>
                            <View style={styles.sectionHeader}>
                                <View style={styles.sectionTitleRow}>
                                    <View style={[styles.sectionDot, { backgroundColor: COLORS.warning }]} />
                                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Recently Used</Text>
                                </View>
                            </View>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                {recentItems.map((item) => (
                                    <TouchableOpacity
                                        key={'recent-' + item.route}
                                        style={[styles.recentCard, { backgroundColor: theme.card }]}
                                        onPress={() => handleNavigate(item.route)}
                                        onLongPress={() => handleLongPress(item.route, item.name)}
                                        activeOpacity={0.75}
                                    >
                                        {isFavorite(item.route) && (
                                            <View style={styles.favStarBadge}>
                                                <Text style={{ fontSize: 10 }}>⭐</Text>
                                            </View>
                                        )}
                                        <View style={[styles.recentIconBg, { backgroundColor: item.gradient[0] + '15' }]}>
                                            <Text style={{ fontSize: 22 }}>{item.icon}</Text>
                                        </View>
                                        <Text style={[styles.recentName, { color: theme.text }]} numberOfLines={1}>{item.name}</Text>
                                        <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        </View>
                    )}

                    {/* Animated Hero Records Card */}
                    {!searchQuery && (
                    <Animated.View style={{ opacity: contentOpacity }}>
                        <TouchableOpacity
                            style={styles.recordsCard}
                            onPress={() => { SoundEffects.tap(); navigation.navigate('Records'); }}
                            activeOpacity={0.9}
                        >
                            <View style={styles.recordsCardOverlay}>
                                <View style={styles.recordsContent}>
                                    <View style={styles.recordsIconContainer}>
                                        <Text style={styles.recordsIcon}>📊</Text>
                                    </View>
                                    <View style={styles.recordsTextContainer}>
                                        <Text style={styles.recordsTitle}>Your Records</Text>
                                        <Text style={styles.recordsSubtitle}>View saved data & history</Text>
                                    </View>
                                </View>
                                <View style={styles.recordsArrowContainer}>
                                    <Text style={styles.recordsArrow}>→</Text>
                                </View>
                            </View>
                        </TouchableOpacity>
                    </Animated.View>
                    )}

                    {/* Calculators Section */}
                    {filteredCalculators.length > 0 && (
                    <Animated.View style={{ opacity: contentOpacity }}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionDot, { backgroundColor: COLORS.primary }]} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Calculators</Text>
                        </View>
                        <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{filteredCalculators.length} tools</Text>
                    </View>
                    <View style={styles.grid}>
                        {filteredCalculators.map((item, index) => {
                            const isHero = item.route === 'Calculator';
                            return (
                                <View
                                    key={item.route}
                                    style={isHero ? { width: '100%' } : undefined}
                                >
                                    <TouchableOpacity
                                        style={[
                                            styles.navButton,
                                            { backgroundColor: theme.card, width: CARD_WIDTH },
                                            isHero && styles.navButtonHero,
                                        ]}
                                        onPress={() => handleNavigate(item.route)}
                                        onLongPress={() => handleLongPress(item.route, item.name)}
                                        activeOpacity={0.75}
                                    >
                                        <View style={[styles.navIconBg, { backgroundColor: item.gradient[0] + '15' }, isHero && styles.navIconBgHero]}>
                                            <Text style={[styles.navIcon, isHero && styles.navIconHero]}>{item.icon}</Text>
                                        </View>
                                        {isFavorite(item.route) && <Text style={styles.favBadge}>⭐</Text>}
                                        <Text style={[styles.navButtonText, { color: theme.text }, isHero && styles.navButtonTextHero]}>{item.name}</Text>
                                        <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })}
                    </View>
                    </Animated.View>)}

                    {/* Games Section */}
                    {filteredGames.length > 0 && (
                    <Animated.View style={{ opacity: contentOpacity }}>
                    <View style={styles.sectionHeader}>
                        <View style={styles.sectionTitleRow}>
                            <View style={[styles.sectionDot, { backgroundColor: COLORS.danger }]} />
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>Games</Text>
                        </View>
                        <Text style={[styles.sectionCount, { color: theme.textSecondary }]}>{filteredGames.length} games</Text>
                    </View>
                    <View style={styles.grid}>
                        {filteredGames.map((item) => (
                            <TouchableOpacity
                                key={item.route}
                                style={[styles.navButton, { backgroundColor: theme.card, width: CARD_WIDTH }]}
                                onPress={() => handleNavigate(item.route)}
                                onLongPress={() => handleLongPress(item.route, item.name)}
                                activeOpacity={0.75}
                            >
                                <View style={[styles.navIconBg, { backgroundColor: item.gradient[0] + '15' }]}>
                                    <Text style={styles.navIcon}>{item.icon}</Text>
                                </View>
                                <Text style={[styles.navButtonText, { color: theme.text }]}>{item.name}</Text>
                                <View style={[styles.cardAccent, { backgroundColor: item.gradient[0] }]} />
                            </TouchableOpacity>
                        ))}
                    </View>
                    </Animated.View>)}

                    {/* No results */}
                    {searchQuery && filteredCalculators.length === 0 && filteredGames.length === 0 && (
                        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
                            <Text style={{ fontSize: 48, marginBottom: 12 }}>🔍</Text>
                            <Text style={[{ fontSize: 18, fontWeight: '700', color: theme.text }]}>No results found</Text>
                            <Text style={[{ fontSize: 14, color: theme.textSecondary, marginTop: 4 }]}>Try a different search term</Text>
                        </View>
                    )}

                    <View style={styles.footerSpace} />
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    // Welcome Section
    inputSection: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 28,
    },
    decorCircle: {
        position: 'absolute',
        borderRadius: 999,
    },
    decorCircle1: {
        width: 300,
        height: 300,
        top: '10%',
        right: -80,
    },
    decorCircle2: {
        width: 250,
        height: 250,
        bottom: '15%',
        left: -60,
    },
    welcomeIcon: {
        fontSize: fp(56),
        marginBottom: 16,
    },
    title: {
        fontSize: fp(34),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 8,
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: fp(16),
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: fp(22),
    },
    card: {
        width: '100%',
        padding: 28,
        borderRadius: 24,
        shadowColor: '#6366F1',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.12,
        shadowRadius: 32,
        elevation: 16,
    },
    cardLabel: {
        fontSize: 13,
        fontWeight: '700',
        marginBottom: 16,
        textTransform: 'uppercase',
        letterSpacing: 1.2,
    },
    input: {
        width: '100%',
        height: 56,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 20,
        fontSize: 16,
        marginBottom: 20,
    },
    doneButton: {
        backgroundColor: COLORS.primary,
        width: '100%',
        height: 56,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 8,
    },
    doneButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    skipButton: {
        marginTop: 16,
        paddingVertical: 8,
        alignItems: 'center',
    },
    skipButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Dashboard Section
    navSection: {
        paddingHorizontal: 20,
        paddingTop: ms(16),
        paddingBottom: ms(30),
    },
    header: {
        marginBottom: 24,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    greeting: {
        fontSize: fp(15),
        fontWeight: '500',
        letterSpacing: 0.2,
    },
    userName: {
        fontSize: fp(28),
        fontWeight: '800',
        marginTop: 4,
        letterSpacing: -0.5,
    },
    // Records Hero Card
    recordsCard: {
        backgroundColor: COLORS.primary,
        borderRadius: 20,
        marginBottom: 32,
        overflow: 'hidden',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.35,
        shadowRadius: 24,
        elevation: 14,
    },
    recordsCardOverlay: {
        padding: 22,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    recordsContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    recordsIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 14,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    recordsIcon: {
        fontSize: 24,
    },
    recordsTextContainer: {
        flex: 1,
    },
    recordsTitle: {
        color: 'white',
        fontSize: 19,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    recordsSubtitle: {
        color: 'rgba(255,255,255,0.75)',
        fontSize: 13,
        marginTop: 3,
        fontWeight: '500',
    },
    recordsArrowContainer: {
        width: 36,
        height: 36,
        borderRadius: 12,
        backgroundColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    recordsArrow: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
    },
    // Section Headers
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
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
        fontSize: fp(20),
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    sectionCount: {
        fontSize: fp(13),
        fontWeight: '600',
    },
    // Grid
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: ms(10),
        marginBottom: ms(28),
    },
    navButton: {
        paddingTop: ms(18),
        paddingBottom: ms(14),
        paddingHorizontal: ms(6),
        borderRadius: ms(16),
        marginBottom: ms(4),
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    navButtonHero: {
        width: '100%',
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        gap: 14,
    },
    navIconBgHero: {
        width: 56,
        height: 56,
        borderRadius: 16,
        marginBottom: 0,
    },
    navIconHero: {
        fontSize: 30,
    },
    navButtonTextHero: {
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    navIconBg: {
        width: ms(44),
        height: ms(44),
        borderRadius: ms(13),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: ms(8),
    },
    navIcon: {
        fontSize: fp(24),
    },
    navButtonText: {
        fontSize: fp(11),
        fontWeight: '700',
        textAlign: 'center',
        letterSpacing: 0.1,
    },
    cardAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: 18,
        borderBottomRightRadius: 18,
    },
    footerSpace: {
        height: 20,
    },
    // Board Games Menu Button
    boardGamesBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 18,
        paddingHorizontal: 20,
        borderRadius: 18,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
        elevation: 3,
        overflow: 'hidden',
    },
    boardGamesBtnContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    boardGamesIconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    boardGamesIcon: {
        fontSize: 26,
    },
    boardGamesBtnTextWrap: {
        flex: 1,
    },
    boardGamesBtnTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    boardGamesBtnSub: {
        fontSize: 12,
        fontWeight: '500',
        marginTop: 2,
    },
    boardGamesArrow: {
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
    },
    // Board Games Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 360,
        borderRadius: 24,
        padding: 28,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.2,
        shadowRadius: 32,
        elevation: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 24,
        letterSpacing: -0.3,
    },
    modalGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 12,
    },
    modalGameBtn: {
        width: '47%',
        paddingVertical: 20,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        overflow: 'hidden',
    },
    modalGameIconBg: {
        width: 52,
        height: 52,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    modalGameIcon: {
        fontSize: 28,
    },
    modalGameName: {
        fontSize: 14,
        fontWeight: '700',
        textAlign: 'center',
    },
    modalGameAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
        borderBottomLeftRadius: 16,
        borderBottomRightRadius: 16,
    },
    modalCloseBtn: {
        marginTop: 20,
        alignSelf: 'center',
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 12,
        backgroundColor: COLORS.primary + '15',
    },
    modalCloseBtnText: {
        color: COLORS.primary,
        fontSize: 15,
        fontWeight: '700',
    },
    // Search Bar
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
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
    // Recently Used
    recentCard: {
        width: ms(88),
        paddingVertical: ms(14),
        paddingHorizontal: ms(8),
        borderRadius: ms(16),
        alignItems: 'center',
        marginRight: ms(10),
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        overflow: 'hidden',
    },
    recentIconBg: {
        width: ms(42),
        height: ms(42),
        borderRadius: ms(12),
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: ms(8),
    },
    recentName: {
        fontSize: fp(11),
        fontWeight: '700',
        textAlign: 'center',
    },
    // Favorites
    favCard: {
        borderWidth: 1.5,
        borderColor: '#F59E0B30',
    },
    favStarBadge: {
        position: 'absolute',
        top: 6,
        right: 6,
        zIndex: 1,
    },
    favBadge: {
        fontSize: 10,
        position: 'absolute',
        top: 8,
        right: 8,
    },
});
