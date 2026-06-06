import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Keyboard, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';
import AdBanner from '../../components/AdBanner';

const WORDS = [
    { word: 'ELEPHANT', hint: 'The giant of the savannah with a very long nose' },
    { word: 'UMBRELLA', hint: 'Your best friend on a rainy day' },
    { word: 'MOUNTAIN', hint: 'A giant peak that touches the clouds' },
    { word: 'GUITAR', hint: 'Strum the strings to make some music' },
    { word: 'PIZZA', hint: 'A cheesy circle from Italy that everyone loves' },
    { word: 'HOSPITAL', hint: 'The place where heroes in white coats work' },
    { word: 'AIRPLANE', hint: 'A massive metal bird that carries people across oceans' },
    { word: 'SUNFLOWER', hint: 'A tall plant that always looks for the sun' },
    { word: 'RAINBOW', hint: 'A bridge of seven colors that appears after a storm' },
    { word: 'BICYCLE', hint: 'Two wheels, two pedals, and lots of balance needed' },
    { word: 'CALENDAR', hint: 'The book that tells you what day it is' },
    { word: 'LIBRARY', hint: 'A quiet home for thousands of stories' },
    { word: 'VOLCANO', hint: 'A mountain with a very hot and fiery temper' },
    { word: 'CHOCOLATE', hint: 'A sweet brown treat made from cocoa beans' },
    { word: 'ASTRONAUT', hint: 'Someone whose job is literally out of this world' },
    { word: 'DINOSAUR', hint: 'A creature that ruled the Earth millions of years ago' },
    { word: 'WINDMILL', hint: 'It has giant arms that spin when the breeze blows' },
    { word: 'BACKPACK', hint: 'A bag you wear on your shoulders to carry your gear' },
    { word: 'FIREWORKS', hint: 'Beautiful explosions of light in the night sky' },
    { word: 'SANDWICH', hint: 'Two slices of bread with something tasty in the middle' },
    { word: 'BUTTERFLY', hint: 'A colorful insect that starts life as a caterpillar' },
    { word: 'KANGAROO', hint: 'The Australian hopper with a built-in pocket' },
    { word: 'SPAGHETTI', hint: 'Long, thin noodles that are fun to twirl on a fork' },
    { word: 'TELEPHONE', hint: 'You use this to talk to people who are far away' },
    { word: 'SUNGLASSES', hint: 'Cool shades to protect your eyes from the bright sun' },
    { word: 'WATERFALL', hint: 'Where a river decides to take a giant leap downward' },
    { word: 'SANDCASTLE', hint: 'A temporary palace built by the edge of the sea' },
    { word: 'SNOWFLAKE', hint: 'A tiny, unique ice crystal that falls from the sky' },
    { word: 'LIGHTNING', hint: 'A powerful flash of electricity during a storm' },
    { word: 'MUSHROOM', hint: 'A little umbrella-shaped fungus found in the woods' },
    { word: 'PINEAPPLE', hint: 'A spiky tropical fruit that wears a crown' },
    { word: 'SKELETON', hint: 'The bony frame that holds your body together' },
    { word: 'OCTOPUS', hint: 'The eight-armed master of camouflage in the ocean' },
    { word: 'TRAMPOLINE', hint: 'A bouncy surface that lets you jump like a frog' },
    { word: 'BINOCULARS', hint: 'Glasses that help you see things very far away' },
    { word: 'HAMBURGER', hint: 'A classic round meal in a bun with many layers' },
    { word: 'SATELLITE', hint: 'A high-tech observer floating in space above Earth' },
    { word: 'COMPASS', hint: 'A handy tool that always points toward the North' },
    { word: 'FLASHLIGHT', hint: 'A portable sun you can carry in your hand' },
    { word: 'HARMONICA', hint: 'A small musical instrument you play with your breath' },
    { word: 'KITCHEN', hint: 'The heart of the home where delicious meals are made' },
    { word: 'PENGUIN', hint: 'A flightless bird that wears a natural tuxedo' },
    { word: 'RAINCOAT', hint: 'A waterproof jacket to keep you dry in a storm' },
    { word: 'HELICOPTER', hint: 'An aircraft with spinning blades on top' },
    { word: 'STRAWBERRY', hint: 'A small red fruit with seeds on the outside' },
    { word: 'DIAMOND', hint: 'The hardest and most sparkly gemstone in the world' },
    { word: 'FIRETRUCK', hint: 'A big red vehicle that carries brave lifesavers' },
    { word: 'MICROPHONE', hint: 'It makes your voice sound much louder to a crowd' },
    { word: 'SUBMARINE', hint: 'A ship that can travel deep under the ocean waves' },
    { word: 'JELLYFISH', hint: 'A squishy, glowing sea creature with stinging tentacles' }
];

const scrambleWord = (word: string): string => {
    const arr = word.split('');
    for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr.join('');
};

const shuffleArray = (array: any[]) => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
};

let playedWordsHistory: string[] = [];

const selectGameWords = (): any[] => {
    let availableWords = WORDS.filter(w => !playedWordsHistory.includes(w.word));
    if (availableWords.length < 15) {
        // Keep the last 15 words in history to avoid consecutive repeats
        playedWordsHistory = playedWordsHistory.slice(-15);
        availableWords = WORDS.filter(w => !playedWordsHistory.includes(w.word));
    }
    const selected = shuffleArray(availableWords).slice(0, 15);
    playedWordsHistory = [...playedWordsHistory, ...selected.map(w => w.word)];
    return selected;
};

export default function WordScrambleGame({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const insets = useSafeAreaInsets();
    const [gameWords, setGameWords] = useState<any[]>([]);
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [scrambledWord, setScrambledWord] = useState('');
    const [userInput, setUserInput] = useState('');
    const [score, setScore] = useState(0);
    const [showHint, setShowHint] = useState(false);
    const [message, setMessage] = useState('');
    const [gameOver, setGameOver] = useState(false);
    const [streak, setStreak] = useState(0);
    const [showAnswer, setShowAnswer] = useState(false);
    const [attempts, setAttempts] = useState(0);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        setGameWords(selectGameWords());
    }, []);

    const textColor = isDarkMode ? '#ffffff' : '#1a1a2e';
    const subtitleColor = isDarkMode ? '#a0a0a0' : '#666666';
    const cardBg = isDarkMode ? '#1e1e2d' : 'white';
    const inputBg = isDarkMode ? '#2a2a3a' : '#f5f5f5';
    const inputBorder = isDarkMode ? '#3d3d5c' : '#e0e0e0';
    const containerBg = isDarkMode ? '#0f0f1a' : '#f0f4ff';

    useEffect(() => {
        if (gameWords.length > 0) {
            if (currentWordIndex < gameWords.length) {
                const word = gameWords[currentWordIndex].word;
                let scrambled = scrambleWord(word);
                // Ensure the word is actually scrambled
                let tries = 0;
                while (scrambled === word && word.length > 1 && tries < 10) {
                    scrambled = scrambleWord(word);
                    tries++;
                }
                setScrambledWord(scrambled);
                setUserInput('');
                setShowHint(false);
                setShowAnswer(false);
                setAttempts(0);
                setMessage('');
            } else {
                setGameOver(true);
            }
        }
    }, [currentWordIndex, gameWords]);

    const checkAnswer = () => {
        if (!gameWords[currentWordIndex]) return;
        Keyboard.dismiss();
        const currentWord = gameWords[currentWordIndex].word;
        const normalizedInput = userInput.trim().toUpperCase();

        if (normalizedInput === currentWord) {
            setScore(score + 10);
            setStreak(streak + 1);
            setMessage('✓ Correct!');
            setTimeout(() => {
                setCurrentWordIndex(prev => prev + 1);
            }, 1000);
        } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            setStreak(0);
            
            if (newAttempts >= 3) {
                setMessage(`✗ Incorrect! The word was ${currentWord}`);
                setShowAnswer(true);
                setTimeout(() => {
                    setCurrentWordIndex(prev => prev + 1);
                }, 2500);
            } else {
                setMessage('✗ Try again!');
            }
        }
    };

    const useHint = () => {
        if (!showHint && !showAnswer) {
            setScore(prev => Math.max(0, prev - 5));
            setShowHint(true);
        }
    };

    const skipWord = () => {
        if (!gameWords[currentWordIndex]) return;
        const currentWord = gameWords[currentWordIndex].word;
        setStreak(0);
        setMessage(`The word was: ${currentWord}`);
        setShowAnswer(true);
        
        setTimeout(() => {
            setCurrentWordIndex(prev => prev + 1);
        }, 1500);
    };

    const restartGame = () => {
        setGameWords(selectGameWords());
        setCurrentWordIndex(0);
        setScore(0);
        setStreak(0);
        setGameOver(false);
        setAttempts(0);
        setShowAnswer(false);
    };

    const getPerformance = () => {
        if (gameWords.length === 0) return { emoji: '🏆', text: 'Excellent!', color: '#f1c40f' };
        const percentage = (score / (gameWords.length * 10)) * 100;
        if (percentage >= 80) return { emoji: '🏆', text: 'Excellent!', color: '#f1c40f' };
        if (percentage >= 60) return { emoji: '🌟', text: 'Great Job!', color: '#2ecc71' };
        if (percentage >= 40) return { emoji: '👍', text: 'Good Try!', color: '#3498db' };
        return { emoji: '📚', text: 'Keep Learning!', color: '#e74c3c' };
    };

    if (gameOver) {
        const performance = getPerformance();
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
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
                            <Text style={[styles.finalStatValue, { color: textColor }]}>{Math.round((score / (gameWords.length * 10)) * 100)}%</Text>
                            <Text style={[styles.finalStatLabel, { color: subtitleColor }]}>Accuracy</Text>
                        </View>
                    </View>

                    <TouchableOpacity style={styles.playAgainButton} onPress={restartGame} activeOpacity={0.85}>
                        <Text style={styles.playAgainButtonText}>🔄 Play Again</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    const progress = ((currentWordIndex) / WORDS.length) * 100;

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={{ flex: 1 }}
        >
            <ScrollView 
                style={[styles.container, { backgroundColor: containerBg }]}
                contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 40 }]}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={[styles.header, { marginTop: Math.max(insets.top, 50) }]}>
                    <View style={styles.titleRow}>
                        <Text style={styles.titleEmoji}>🔤</Text>
                        <Text style={[styles.title, { color: textColor }]}>Word Scramble</Text>
                    </View>
                    <Text style={[styles.subtitle, { color: subtitleColor }]}>Unscramble the letters!</Text>
                    <TouchableOpacity style={{ position: 'absolute', right: 0, top: 0, padding: 8 }} onPress={() => setMenuVisible(true)}>
                        <Text style={{ fontSize: 16, color: subtitleColor }}>⚙️ Menu</Text>
                    </TouchableOpacity>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressContainer}>
                    <View style={[styles.progressBg, { backgroundColor: isDarkMode ? '#2a2a3a' : '#e0e0e0' }]}>
                        <View style={[styles.progressFill, { width: `${progress}%` }]} />
                    </View>
                    <Text style={[styles.progressText, { color: subtitleColor }]}>
                        Word {currentWordIndex + 1} of {gameWords.length}
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
                        <Text style={[styles.statValue, { color: '#e17055' }]}>{Math.max(0, gameWords.length - currentWordIndex)}</Text>
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
                            <Text style={[styles.hintText, { color: textColor }]}>{gameWords[currentWordIndex]?.hint}</Text>
                        </View>
                    )}

                    {showAnswer && (
                        <View style={[styles.hintCard, { backgroundColor: 'rgba(46, 204, 113, 0.15)', borderColor: '#2ecc71', borderWidth: 1 }]}>
                            <Text style={styles.hintIcon}>✅</Text>
                            <Text style={[styles.hintText, { color: textColor, fontWeight: 'bold' }]}>Answer: {gameWords[currentWordIndex]?.word}</Text>
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
                        editable={!showAnswer && !message.includes('✓')}
                    />

                    {message !== '' && (
                        <View style={[styles.messageBadge, { backgroundColor: message.includes('✓') ? '#e8f5e9' : '#ffebee' }]}>
                            <Text style={[styles.messageText, { color: message.includes('✓') ? '#2e7d32' : '#c62828' }]}>
                                {message}
                            </Text>
                        </View>
                    )}

                    <TouchableOpacity 
                        style={[styles.submitButton, (showAnswer || message.includes('✓')) && { opacity: 0.6 }]} 
                        onPress={checkAnswer} 
                        disabled={showAnswer || message.includes('✓')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.submitButtonText}>Check Answer</Text>
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.hintButton, (showHint || showAnswer) && styles.hintButtonDisabled]}
                            onPress={useHint}
                            disabled={showHint || showAnswer}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.hintButtonEmoji}>💡</Text>
                            <Text style={[styles.hintButtonText, (showHint || showAnswer) && { opacity: 0.5 }]}>Hint (-5)</Text>
                        </TouchableOpacity>
                        <TouchableOpacity 
                            style={[styles.skipButton, showAnswer && { opacity: 0.5 }]} 
                            onPress={skipWord} 
                            disabled={showAnswer}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.skipButtonEmoji}>⏭️</Text>
                            <Text style={styles.skipButtonText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
                <AdBanner />
                <View style={{ height: 20 }} />
            </ScrollView>
            
            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onSaveAndQuit={() => navigation.goBack()} 
                onQuit={() => navigation.goBack()} 
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
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
