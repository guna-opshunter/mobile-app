import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Alert, useWindowDimensions } from 'react-native';
import { useTheme } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';

const EMOJIS = ['🌟', '🌈', '🌻', '🦄', '🌍', '🍒', '🚀', '🎵'];
const { width: _ignored } = Dimensions.get('window'); // Removed global execution
const CARD_MARGIN = 6;

interface CardData {
    id: number;
    emoji: string;
    isFlipped: boolean;
    isMatched: boolean;
}

const createBoard = (): CardData[] => {
    const cards: CardData[] = [];
    const shuffledEmojis = [...EMOJIS, ...EMOJIS].sort(() => Math.random() - 0.5);
    shuffledEmojis.forEach((emoji, index) => {
        cards.push({
            id: index,
            emoji,
            isFlipped: false,
            isMatched: false,
        });
    });
    return cards;
};

// Custom animated card component
const MemoryCard = ({
    card,
    onPress,
    disabled,
    isDarkMode,
    cardSize
}: {
    card: CardData,
    onPress: () => void,
    disabled: boolean,
    isDarkMode: boolean,
    cardSize: number
}) => {
    const flipAnim = useRef(new Animated.Value(card.isFlipped || card.isMatched ? 1 : 0)).current;
    const matchScale = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        Animated.spring(flipAnim, {
            toValue: card.isFlipped || card.isMatched ? 1 : 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
        }).start();

        if (card.isMatched) {
            Animated.sequence([
                Animated.timing(matchScale, { toValue: 1.15, duration: 150, useNativeDriver: true }),
                Animated.spring(matchScale, { toValue: 1, friction: 4, useNativeDriver: true })
            ]).start();
        }
    }, [card.isFlipped, card.isMatched]);

    const frontInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '180deg'],
    });

    const backInterpolate = flipAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['180deg', '360deg'],
    });

    const frontOpacity = flipAnim.interpolate({
        inputRange: [0.5, 0.51],
        outputRange: [1, 0],
    });

    const backOpacity = flipAnim.interpolate({
        inputRange: [0.5, 0.51],
        outputRange: [0, 1],
    });

    return (
        <TouchableOpacity
            style={[styles.cardWrapper, { width: cardSize, height: cardSize }]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.9}
        >
            <Animated.View style={[
                styles.cardFace,
                styles.cardFront,
                { transform: [{ rotateY: frontInterpolate }, { scale: matchScale }], opacity: frontOpacity }
            ]}>
                {/* Visual design for card back */}
                <View style={styles.cardFrontInner}>
                    <Text style={styles.cardFrontLogo}>?</Text>
                </View>
            </Animated.View>

            <Animated.View style={[
                styles.cardFace,
                card.isMatched ? styles.cardMatched : (isDarkMode ? styles.cardBackDark : styles.cardBackLight),
                { transform: [{ rotateY: backInterpolate }, { scale: matchScale }], opacity: backOpacity }
            ]}>
                <Text style={[styles.cardEmoji, { fontSize: cardSize * 0.45 }, card.isMatched && { opacity: 0.6 }]}>{card.emoji}</Text>
            </Animated.View>
        </TouchableOpacity>
    );
};

export default function MemoryMatchGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    
    // Dynamic sizing based on actual window layout
    const boardWidth = Math.min(width, 500);
    const cardSize = (boardWidth - 40 - (CARD_MARGIN * 8)) / 4;

    const [cards, setCards] = useState<CardData[]>(createBoard());
    const [flippedCards, setFlippedCards] = useState<number[]>([]);
    const [moves, setMoves] = useState(0);
    const [matches, setMatches] = useState(0);
    const [isLocked, setIsLocked] = useState(false);
    const [gameOver, setGameOver] = useState(false);
    const [timer, setTimer] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const textColor = isDarkMode ? '#ffffff' : '#1a1a2e';
    const subtitleColor = isDarkMode ? '#a0a0a0' : '#8f9bb3';
    const cardBg = isDarkMode ? '#1e1e2d' : '#ffffff';
    const containerBg = isDarkMode ? '#0f0f1a' : '#f4f6fa';

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isPlaying && !gameOver) {
            interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isPlaying, gameOver]);

    useEffect(() => {
        if (matches === EMOJIS.length) {
            setTimeout(() => {
                setGameOver(true);
                setIsPlaying(false);
            }, 800);
        }
    }, [matches]);

    const flipCard = (index: number) => {
        if (isLocked || cards[index].isFlipped || cards[index].isMatched) return;

        if (!isPlaying) setIsPlaying(true);

        setCards(prevCards => {
            const newCards = [...prevCards];
            newCards[index] = { ...newCards[index], isFlipped: true };
            return newCards;
        });

        const newFlippedCards = [...flippedCards, index];
        setFlippedCards(newFlippedCards);

        if (newFlippedCards.length === 2) {
            setMoves(prev => prev + 1);
            setIsLocked(true);

            const [first, second] = newFlippedCards;
            if (cards[first].emoji === cards[second].emoji) {
                setTimeout(() => {
                    setCards(prevCards => {
                        const matchedCards = [...prevCards];
                        matchedCards[first] = { ...matchedCards[first], isMatched: true };
                        matchedCards[second] = { ...matchedCards[second], isMatched: true };
                        return matchedCards;
                    });
                    setMatches(prev => prev + 1);
                    setFlippedCards([]);
                    setIsLocked(false);
                }, 400);
            } else {
                setTimeout(() => {
                    setCards(prevCards => {
                        const resetCards = [...prevCards];
                        resetCards[first] = { ...resetCards[first], isFlipped: false };
                        resetCards[second] = { ...resetCards[second], isFlipped: false };
                        return resetCards;
                    });
                    setFlippedCards([]);
                    setIsLocked(false);
                }, 1000);
            }
        }
    };

    const restartGame = () => {
        setIsPlaying(false);
        setFlippedCards([]);
        setMoves(0);
        setMatches(0);
        setIsLocked(false);
        setGameOver(false);
        setTimer(0);
        
        // Unflip all first to show animation
        setCards(prev => prev.map(c => ({ ...c, isFlipped: false, isMatched: false })));
        
        // Wait for flip to finish before shuffling
        setTimeout(() => {
            setCards(createBoard());
        }, 400);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const getPerformanceMsg = () => {
        if (moves <= 10) return { title: 'Perfect Memory!', emoji: '🏆', stars: '⭐⭐⭐', color: '#FFD700' };
        if (moves <= 15) return { title: 'Great Job!', emoji: '🌟', stars: '⭐⭐', color: '#00b894' };
        return { title: 'Good Try!', emoji: '👍', stars: '⭐', color: '#6C63FF' };
    };

    if (gameOver) {
        const perf = getPerformanceMsg();
        return (
            <View style={[styles.container, { backgroundColor: containerBg, justifyContent: 'center' }]}>
                <View style={[styles.gameOverCard, { backgroundColor: cardBg }]}>
                    <Text style={styles.confettiEmoji}>{perf.emoji}</Text>
                    <Text style={styles.starsText}>{perf.stars}</Text>
                    <Text style={[styles.gameOverTitle, { color: perf.color }]}>{perf.title}</Text>
                    <Text style={[styles.performanceText, { color: subtitleColor }]}>Moves: {moves} • Time: {formatTime(timer)}</Text>

                    <TouchableOpacity 
                        style={[styles.playAgainButton, { backgroundColor: perf.color, shadowColor: perf.color }]} 
                        onPress={restartGame} 
                        activeOpacity={0.8}
                    >
                        <Text style={styles.playAgainButtonText}>Play Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: containerBg }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <View style={styles.titleIconWrapper}>
                        <Text style={styles.titleEmoji}>🃏</Text>
                    </View>
                    <View>
                        <Text style={[styles.title, { color: textColor }]}>Memory Match</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>Find all matching pairs!</Text>
                    </View>
                </View>
                <TouchableOpacity style={[styles.menuBtn, { backgroundColor: isDarkMode ? '#2eb3' : '#edeff5' }]} onPress={() => setMenuVisible(true)}>
                    <Text style={{ fontSize: 13, color: textColor, fontWeight: '600' }}>Menu</Text>
                </TouchableOpacity>
            </View>

            {/* Stats Overview */}
            <View style={[styles.statsOuter, { backgroundColor: cardBg }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#6C63FF' }]}>{moves}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Moves</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#2e2e42' : '#edf0f5' }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#00b894' }]}>{formatTime(timer)}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Time</Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: isDarkMode ? '#2e2e42' : '#edf0f5' }]} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FF9F43' }]}>{matches}/{EMOJIS.length}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Pairs</Text>
                </View>
            </View>

            {/* Game Board */}
            <View style={{ flex: 1, justifyContent: 'center' }}>
                <View style={styles.boardInner}>
                    {cards.map((card, index) => (
                        <MemoryCard
                            key={card.id}
                            card={card}
                            onPress={() => flipCard(index)}
                            disabled={card.isFlipped || card.isMatched || isLocked}
                            isDarkMode={isDarkMode}
                            cardSize={cardSize}
                        />
                    ))}
                </View>
            </View>

            {/* Reset */}
            <TouchableOpacity style={[styles.resetButton, { backgroundColor: isDarkMode ? '#2a2a3a' : '#edeff5' }]} onPress={restartGame}>
                <Text style={[styles.resetButtonText, { color: textColor }]}>🔄 Reset Board</Text>
            </TouchableOpacity>

            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onSaveAndQuit={() => navigation.goBack()} 
                onQuit={() => navigation.goBack()} 
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 40,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    titleIconWrapper: {
        width: 48,
        height: 48,
        borderRadius: 16,
        backgroundColor: '#6C63FF20',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    titleEmoji: {
        fontSize: 26,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    subtitle: {
        fontSize: 13,
        fontWeight: '500',
        marginTop: 2,
    },
    menuBtn: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    statsOuter: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 12,
        borderRadius: 24,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.06,
        shadowRadius: 16,
        elevation: 4,
    },
    statItem: {
        flex: 1,
        alignItems: 'center',
    },
    statDivider: {
        width: 2,
        height: 30,
        borderRadius: 1,
    },
    statValue: {
        fontSize: 24,
        fontWeight: '900',
        letterSpacing: 0.5,
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '700',
        marginTop: 6,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    boardInner: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardWrapper: {
        margin: CARD_MARGIN,
    },
    cardFace: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backfaceVisibility: 'hidden',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    cardFront: {
        backgroundColor: '#6C63FF',
        shadowColor: '#6C63FF',
        padding: 5,
    },
    cardFrontInner: {
        flex: 1,
        width: '100%',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'rgba(255,255,255,0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardFrontLogo: {
        fontSize: 28,
        color: 'rgba(255,255,255,0.6)',
        fontWeight: '900',
    },
    cardBackLight: {
        backgroundColor: '#ffffff',
        shadowColor: '#000',
        borderWidth: 1.5,
        borderColor: '#e8e8e8',
    },
    cardBackDark: {
        backgroundColor: '#27273a',
        shadowColor: '#000',
        borderWidth: 1.5,
        borderColor: '#3a3a4c',
    },
    cardMatched: {
        backgroundColor: '#ebfbf5',
        shadowColor: '#00b894',
        borderWidth: 2,
        borderColor: '#b2e8d6',
    },
    cardEmoji: {
    },
    resetButton: {
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 10,
    },
    resetButtonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    // Game Over specific styles
    gameOverCard: {
        padding: 40,
        borderRadius: 30,
        alignItems: 'center',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 8,
    },
    confettiEmoji: {
        fontSize: 70,
        marginBottom: 10,
    },
    starsText: {
        fontSize: 40,
        marginBottom: 16,
    },
    gameOverTitle: {
        fontSize: 32,
        fontWeight: '900',
        marginBottom: 12,
    },
    performanceText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 40,
    },
    playAgainButton: {
        paddingVertical: 18,
        paddingHorizontal: 40,
        borderRadius: 100,
        width: '100%',
        alignItems: 'center',
    },
    playAgainButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
