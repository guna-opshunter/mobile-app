import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert } from 'react-native';
import { useTheme } from '../../theme';

const WORDS = [
    { word: 'REACT', hint: 'JavaScript library for UI' },
    { word: 'MOBILE', hint: 'Phone or tablet app' },
    { word: 'CODING', hint: 'Writing computer programs' },
    { word: 'JAVASCRIPT', hint: 'Popular programming language' },
    { word: 'ANDROID', hint: 'Google mobile OS' },
    { word: 'GAMING', hint: 'Playing video games' },
    { word: 'PUZZLE', hint: 'Brain teaser' },
    { word: 'SCREEN', hint: 'Display device' },
    { word: 'KEYBOARD', hint: 'Input device with keys' },
    { word: 'NETWORK', hint: 'Connected computers' },
];

const scrambleWord = (word: string): string => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

export default function WordScrambleGame({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [scrambledWord, setScrambledWord] = useState('');
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [streak, setStreak] = useState(0);

    const textColor = isDarkMode ? '#ffffff' : '#1a1a2e';
    const subtitleColor = isDarkMode ? '#a0a0a0' : '#666666';
    const cardBg = isDarkMode ? '#1e1e2d' : 'white';
    const inputBg = isDarkMode ? '#2a2a3a' : '#f5f5f5';
    const inputBorder = isDarkMode ? '#3d3d5c' : '#e0e0e0';
    const containerBg = isDarkMode ? '#0f0f1a' : '#f0f4ff';

    useEffect(() => {
        loadNewWord();
    }, []);

    const loadNewWord = () => {
        if (currentWordIndex >= WORDS.length) {
            setGameOver(true);
            return;
        }
        const word = WORDS[currentWordIndex].word;
        let scrambled = scrambleWord(word);
        while (scrambled === word) {
            scrambled = scrambleWord(word);
        }
        setScrambledWord(scrambled);
        setUserInput('');
        setShowHint(false);
        setMessage('');
    };

    const checkAnswer = () => {
        Keyboard.dismiss();
        const currentWord = WORDS[currentWordIndex].word;
        if (userInput.toUpperCase() === currentWord) {
            setScore(score + (showHint ? 5 : 10));
            setStreak(streak + 1);
            setMessage('✓ Correct!');
            setTimeout(() => {
                setCurrentWordIndex(prev => prev + 1);
                if (currentWordIndex + 1 < WORDS.length) {
                    const nextWord = WORDS[currentWordIndex + 1].word;
                    let scrambled = scrambleWord(nextWord);
                    while (scrambled === nextWord) {
                        scrambled = scrambleWord(nextWord);
                    }
                    setScrambledWord(scrambled);
                    setUserInput('');
                    setShowHint(false);
                    setMessage('');
                } else {
                    setGameOver(true);
                }
            }, 1000);
        } else {
            setMessage('✗ Try again!');
            setStreak(0);
        }
    };

    const skipWord = () => {
        setStreak(0);
        setCurrentWordIndex(prev => prev + 1);
        if (currentWordIndex + 1 < WORDS.length) {
            const nextWord = WORDS[currentWordIndex + 1].word;
            let scrambled = scrambleWord(nextWord);
            while (scrambled === nextWord) {
                scrambled = scrambleWord(nextWord);
            }
            setScrambledWord(scrambled);
            setUserInput('');
            setShowHint(false);
            setMessage('');
        } else {
            setGameOver(true);
        }
    };

    const restartGame = () => {
        setCurrentWordIndex(0);
        setScore(0);
        setStreak(0);
        setGameOver(false);
        const word = WORDS[0].word;
        let scrambled = scrambleWord(word);
        while (scrambled === word) {
            scrambled = scrambleWord(word);
        }
        setScrambledWord(scrambled);
        setUserInput('');
        setShowHint(false);
        setMessage('');
    };

    const getPerformance = () => {
        const percentage = (score / (WORDS.length * 10)) * 100;
        if (percentage >= 80) return { emoji: '🏆', text: 'Excellent!', color: '#f1c40f' };
        if (percentage >= 60) return { emoji: '🌟', text: 'Great Job!', color: '#2ecc71' };
        if (percentage >= 40) return { emoji: '👍', text: 'Good Try!', color: '#3498db' };
        return { emoji: '📚', text: 'Keep Learning!', color: '#e74c3c' };
    };

    if (gameOver) {
        const performance = getPerformance();
        return (
            <View style={[styles.container, { backgroundColor: containerBg }]}>
                <View style={styles.gameOverContainer}>
                    <View style={[styles.performanceCircle, { backgroundColor: performance.color + '20', borderColor: performance.color }]}>
                        <Text style={styles.performanceEmoji}>{performance.emoji}</Text>
                    </View>
                    <Text style={[styles.performanceText, { color: performance.color }]}>{performance.text}</Text>
                    <Text style={[styles.gameOverTitle, { color: textColor }]}>Game Complete!</Text>

                    <View style={styles.finalStatsRow}>
                        <View style={[styles.finalStatCard, { backgroundColor: cardBg }]}>
                            <Text style={styles.finalStatIcon}>🎯</Text>
                            <Text style={[styles.finalStatValue, { color: textColor }]}>{score}</Text>
                            <Text style={[styles.finalStatLabel, { color: subtitleColor }]}>Points</Text>
                        </View>
                        <View style={[styles.finalStatCard, { backgroundColor: cardBg }]}>
                            <Text style={styles.finalStatIcon}>📊</Text>
                            <Text style={[styles.finalStatValue, { color: textColor }]}>{Math.round((score / (WORDS.length * 10)) * 100)}%</Text>
                            <Text style={[styles.finalStatLabel, { color: subtitleColor }]}>Accuracy</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.playAgainButton} onPress={restartGame} activeOpacity={0.85}>
                        <Text style={styles.playAgainButtonText}>🔄 Play Again</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    const progress = ((currentWordIndex) / WORDS.length) * 100;

    return (
        <View style={[styles.container, { backgroundColor: containerBg }]}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.titleRow}>
                    <Text style={styles.titleEmoji}>🔤</Text>
                    <Text style={[styles.title, { color: textColor }]}>Word Scramble</Text>
                </View>
                <Text style={[styles.subtitle, { color: subtitleColor }]}>Unscramble the letters!</Text>
                <TouchableOpacity style={{ position: 'absolute', right: 0, top: 0, padding: 8 }} onPress={() => {
                    Alert.alert(
                        '⚙️ Game Menu',
                        'What would you like to do?',
                        [
                            { text: 'Save & Quit', onPress: () => navigation.goBack() },
                            { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
                            { text: 'Cancel', style: 'cancel' },
                        ]
                    );
                }}>
                    <Text style={{ fontSize: 16, color: subtitleColor }}>⚙️ Menu</Text>
                </TouchableOpacity>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressContainer}>
                <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2a2a3a' : '#e0e0e0' }]}>
                    <View style={[styles.progressFill, { width: `${progress}%` }]} />
                </View>
                <Text style={[styles.progressText, { color: subtitleColor }]}>
                    Word {currentWordIndex + 1} of {WORDS.length}
                </Text>
            </View>

            {/* Stats Bar */}
            <View style={[styles.statsBar, { backgroundColor: cardBg }]}>
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#6C63FF' }]}>{score}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Score</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#00b894' }]}>{streak}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Streak</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#e17055' }]}>{WORDS.length - currentWordIndex}</Text>
                    <Text style={[styles.statLabel, { color: subtitleColor }]}>Left</Text>
                </View>
            </View>

            {/* Game Card */}
            <View style={[styles.card, { backgroundColor: cardBg }]}>
                {/* Scrambled Word Display */}
                <View style={styles.scrambledContainer}>
                    {scrambledWord.split('').map((letter, index) => (
                        <View key={index} style={styles.letterBox}>
                            <Text style={styles.letterText}>{letter}</Text>
                        </View>
                    ))}
                </View>

                {showHint && (
                    <View style={styles.hintCard}>
                        <Text style={styles.hintIcon}>💡</Text>
                        <Text style={[styles.hintText, { color: textColor }]}>{WORDS[currentWordIndex].hint}</Text>
                    </View>
                )}

                <TextInput
                    style={[styles.input, { backgroundColor: inputBg, borderColor: inputBorder, color: textColor }]}
                    placeholder="Enter the word..."
                    placeholderTextColor="#888"
                    value={userInput}
                    onChangeText={setUserInput}
                    autoCapitalize="characters"
                    onSubmitEditing={checkAnswer}
                />

                {message !== '' && (
                    <View style={[styles.messageBadge, { backgroundColor: message.includes('✓') ? '#e8f5e9' : '#ffebee' }]}>
                        <Text style={[styles.messageText, { color: message.includes('✓') ? '#2e7d32' : '#c62828' }]}>
                            {message}
                        </Text>
                    </View>
                )}

                <TouchableOpacity style={styles.submitButton} onPress={checkAnswer} activeOpacity={0.85}>
                    <Text style={styles.submitButtonText}>Check Answer</Text>
                </TouchableOpacity>

                <View style={styles.actionRow}>
                    <TouchableOpacity
                        style={[styles.hintButton, showHint && styles.hintButtonDisabled]}
                        onPress={() => setShowHint(true)}
                        disabled={showHint}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.hintButtonEmoji}>💡</Text>
                        <Text style={[styles.hintButtonText, showHint && { opacity: 0.5 }]}>Hint (-5)</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.skipButton} onPress={skipWord} activeOpacity={0.8}>
                        <Text style={styles.skipButtonEmoji}>⏭️</Text>
                        <Text style={styles.skipButtonText}>Skip</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    header: {
        marginTop: 50,
        marginBottom: 16,
        alignItems: 'center',
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    titleEmoji: {
        fontSize: 28,
        marginRight: 10,
    },
    title: {
        fontSize: 26,
        fontWeight: '800',
    },
    subtitle: {
        fontSize: 14,
    },
    progressContainer: {
        marginBottom: 16,
    },
    progressBg: {
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        backgroundColor: '#6C63FF',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 12,
        marginTop: 6,
        textAlign: 'center',
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 10,
        borderRadius: 20,
        marginBottom: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 5,
    },
    statItem: {
        alignItems: 'center',
        flex: 1,
    },
    statDivider: {
        width: 1,
        height: 30,
        backgroundColor: '#e0e0e0',
    },
    statValue: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 2,
        textTransform: 'uppercase',
    },
    card: {
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        elevation: 8,
        alignItems: 'center',
    },
    scrambledContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        marginBottom: 24,
    },
    letterBox: {
        width: 44,
        height: 52,
        backgroundColor: '#6C63FF',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.3,
        shadowRadius: 6,
        elevation: 4,
    },
    letterText: {
        color: 'white',
        fontSize: 24,
        fontWeight: 'bold',
    },
    hintCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(253, 203, 110, 0.15)',
        paddingVertical: 12,
        paddingHorizontal: 18,
        borderRadius: 14,
        marginBottom: 20,
    },
    hintIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    hintText: {
        fontSize: 14,
        fontStyle: 'italic',
        flex: 1,
    },
    input: {
        width: '100%',
        height: 58,
        borderWidth: 2,
        borderRadius: 16,
        paddingHorizontal: 20,
        fontSize: 20,
        textAlign: 'center',
        letterSpacing: 3,
        marginBottom: 16,
        fontWeight: '600',
    },
    messageBadge: {
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginBottom: 16,
    },
    messageText: {
        fontSize: 16,
        fontWeight: '700',
    },
    submitButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        paddingHorizontal: 50,
        borderRadius: 30,
        marginBottom: 20,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 8,
    },
    submitButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 16,
    },
    hintButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fdcb6e',
        backgroundColor: 'rgba(253, 203, 110, 0.1)',
    },
    hintButtonDisabled: {
        opacity: 0.5,
    },
    hintButtonEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    hintButtonText: {
        color: '#e17055',
        fontWeight: '700',
        fontSize: 14,
    },
    skipButton: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 25,
        backgroundColor: '#6c757d',
    },
    skipButtonEmoji: {
        fontSize: 16,
        marginRight: 6,
    },
    skipButtonText: {
        color: 'white',
        fontWeight: '700',
        fontSize: 14,
    },
    gameOverContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    performanceCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    performanceEmoji: {
        fontSize: 50,
    },
    performanceText: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
    },
    gameOverTitle: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 30,
    },
    finalStatsRow: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 35,
    },
    finalStatCard: {
        alignItems: 'center',
        paddingVertical: 20,
        paddingHorizontal: 30,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
        elevation: 4,
    },
    finalStatIcon: {
        fontSize: 28,
        marginBottom: 8,
    },
    finalStatValue: {
        fontSize: 26,
        fontWeight: 'bold',
    },
    finalStatLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
        textTransform: 'uppercase',
    },
    playAgainButton: {
        backgroundColor: '#6C63FF',
        paddingVertical: 18,
        paddingHorizontal: 50,
        borderRadius: 30,
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    },
    playAgainButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
