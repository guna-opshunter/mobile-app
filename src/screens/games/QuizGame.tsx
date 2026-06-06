import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Animated, Share, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { CLASS_LEVELS, ClassLevel, QuestionSet, QUESTION_POOLS, getRandomQuestions } from '../../data/classQuestions';
import { useRecords } from '../../context/RecordsContext';
import { useAchievements } from '../../context/AchievementsContext';
import AdBanner from '../../components/AdBanner';
import { useInterstitialAd, useRewardedAd } from 'react-native-google-mobile-ads';
import { getInterstitialAdUnitId, getRewardedAdUnitId } from '../../utils/adConfig';

const { width } = Dimensions.get('window');

type Screen = 'levels' | 'sets' | 'playing' | 'result';

export default function QuizGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const { addQuizRecord, getQuizHighScore, getSetHighScore } = useRecords();
    const { checkAndUnlock, incrementStat, updateStat, stats } = useAchievements();

    const [screen, setScreen] = useState<Screen>('levels');
    const [selectedLevel, setSelectedLevel] = useState<ClassLevel | null>(null);
    const [selectedSet, setSelectedSet] = useState<QuestionSet | null>(null);
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);
    const [selectedOption, setSelectedOption] = useState<number | null>(null);
    const [showResult, setShowResult] = useState(false);
    const [timeLeft, setTimeLeft] = useState(15);
    const [correctAnswers, setCorrectAnswers] = useState(0);
    const [isNewHighScore, setIsNewHighScore] = useState(false);
    const [streak, setStreak] = useState(0);
    const [bestStreak, setBestStreak] = useState(0);

    // Lifeline & Ad states
    const [eliminatedOptions, setEliminatedOptions] = useState<number[]>([]);
    const [lifelineUsed, setLifelineUsed] = useState(false);

    // Interstitial Ad setup
    const {
        isLoaded: isInterstitialLoaded,
        isClosed: isInterstitialClosed,
        load: loadInterstitial,
        show: showInterstitial
    } = useInterstitialAd(getInterstitialAdUnitId(), {
        requestNonPersonalizedAdsOnly: true,
    });

    // Rewarded Ad setup
    const {
        isLoaded: isRewardedLoaded,
        isClosed: isRewardedClosed,
        load: loadRewarded,
        show: showRewarded,
        reward: rewardedReward
    } = useRewardedAd(getRewardedAdUnitId(), {
        requestNonPersonalizedAdsOnly: true,
    });

    // Load ads on mount
    useEffect(() => {
        loadInterstitial();
        loadRewarded();
    }, [loadInterstitial, loadRewarded]);

    // Reload ads when closed
    useEffect(() => {
        if (isInterstitialClosed) {
            loadInterstitial();
        }
    }, [isInterstitialClosed]);

    useEffect(() => {
        if (isRewardedClosed) {
            loadRewarded();
        }
    }, [isRewardedClosed]);

    // Handle rewarded ad result
    useEffect(() => {
        if (rewardedReward) {
            eliminateTwoOptions();
            setLifelineUsed(true);
        }
    }, [rewardedReward]);

    const eliminateTwoOptions = () => {
        if (!selectedSet) return;
        const currentQ = selectedSet.questions[currentQuestion];
        const correctIndex = currentQ.correct;
        const incorrectIndices = [0, 1, 2, 3].filter(idx => idx !== correctIndex);
        
        // Shuffle and pick 2 options to eliminate
        const shuffled = incorrectIndices.sort(() => 0.5 - Math.random());
        const toEliminate = shuffled.slice(0, 2);
        setEliminatedOptions(toEliminate);
    };

    const useLifeline = () => {
        if (isRewardedLoaded) {
            showRewarded();
        } else {
            Alert.alert("Ad Loading", "Please wait a moment for the video to load...");
        }
    };

    // Animations
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.9)).current;
    const timerScale = useRef(new Animated.Value(1)).current;
    const timerBarWidth = useRef(new Animated.Value(1)).current; // 1 = full, 0 = empty
    const streakAnim = useRef(new Animated.Value(1)).current;

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const subtitleColor = isDarkMode ? '#94A3B8' : '#64748B';
    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const containerBg = isDarkMode ? '#0F172A' : '#F1F5F9';
    const surfaceBg = isDarkMode ? '#334155' : '#E2E8F0';

    useEffect(() => {
        if (!selectedSet || !selectedLevel) return;
        if (timeLeft > 0 && !showResult && screen === 'playing') {
            const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);

            // Animate timer bar
            Animated.timing(timerBarWidth, {
                toValue: (timeLeft - 1) / selectedLevel.timePerQuestion,
                duration: 1000,
                useNativeDriver: false,
            }).start();

            if (timeLeft <= 5) {
                Animated.sequence([
                    Animated.timing(timerScale, { toValue: 1.2, duration: 150, useNativeDriver: true }),
                    Animated.timing(timerScale, { toValue: 1, duration: 150, useNativeDriver: true }),
                ]).start();
            }

            return () => clearTimeout(timer);
        } else if (timeLeft === 0 && !showResult) {
            handleTimeout();
        }
    }, [timeLeft, showResult, screen, selectedSet]);

    useEffect(() => {
        if (selectedSet && screen === 'playing') {
            Animated.parallel([
                Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                Animated.spring(scaleAnim, { toValue: 1, friction: 8, useNativeDriver: true }),
            ]).start();
        }
    }, [currentQuestion, selectedSet, screen]);

    const handleTimeout = () => {
        setShowResult(true);
        setTimeout(() => nextQuestion(), 1500);
    };

    const selectOption = (index: number) => {
        if (showResult || !selectedSet) return;
        setSelectedOption(index);
        setShowResult(true);

        if (index === selectedSet.questions[currentQuestion].correct) {
            setScore(score + 10 + timeLeft);
            setCorrectAnswers(correctAnswers + 1);
            const newStreak = streak + 1;
            setStreak(newStreak);
            if (newStreak > bestStreak) setBestStreak(newStreak);
            // Achievement: streak tracking
            if (newStreak >= 3) checkAndUnlock('quiz_streak3');
            if (newStreak >= 5) checkAndUnlock('quiz_streak5');
            // Track fast answers (10+ seconds left)
            if (timeLeft >= 10) incrementStat('fastAnswers');
            // Streak pop animation
            Animated.sequence([
                Animated.timing(streakAnim, { toValue: 1.4, duration: 150, useNativeDriver: true }),
                Animated.spring(streakAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
            ]).start();
        } else {
            setStreak(0);
        }

        setTimeout(() => nextQuestion(), 1500);
    };

    const nextQuestion = () => {
        if (!selectedSet || !selectedLevel) return;
        if (currentQuestion + 1 < selectedSet.questions.length) {
            fadeAnim.setValue(0);
            scaleAnim.setValue(0.9);
            setCurrentQuestion(currentQuestion + 1);
            setSelectedOption(null);
            setShowResult(false);
            setTimeLeft(selectedLevel.timePerQuestion);
            timerBarWidth.setValue(1);
            setEliminatedOptions([]); // reset eliminated options
        } else {
            finishGame();
        }
    };

    const finishGame = () => {
        if (!selectedLevel || !selectedSet) return;

        const finalScore = score;
        const finalCorrect = correctAnswers;
        const percentage = Math.round((finalCorrect / selectedSet.questions.length) * 100);
        const currentHighScore = getSetHighScore(selectedLevel.id, selectedSet.setNumber);
        const isHigh = finalScore > currentHighScore;

        setIsNewHighScore(isHigh);

        addQuizRecord({
            levelId: selectedLevel.id,
            levelName: selectedLevel.name,
            levelIcon: selectedLevel.icon,
            levelColor: selectedLevel.color,
            setNumber: selectedSet.setNumber,
            score: finalScore,
            correctAnswers: finalCorrect,
            totalQuestions: selectedSet.questions.length,
            percentage: percentage,
        });

        // Track achievements & stats
        incrementStat('totalQuizzes');
        incrementStat('totalQuizCorrect', finalCorrect);
        incrementStat('totalQuizQuestions', selectedSet.questions.length);
        if (bestStreak > stats.bestQuizStreak) updateStat('bestQuizStreak', bestStreak);
        checkAndUnlock('quiz_first');
        checkAndUnlock('quiz_10');
        if (percentage === 100) checkAndUnlock('quiz_perfect');
        if (stats.fastAnswers >= 10) checkAndUnlock('quiz_speedster');
        checkAndUnlock('quiz_master');

        setScreen('result');

        // Show interstitial ad when finishing a quiz set
        if (isInterstitialLoaded) {
            showInterstitial();
        }
    };

    const selectLevel = (level: ClassLevel) => {
        setSelectedLevel(level);
        setScreen('sets');
    };

    const startSet = (set: QuestionSet) => {
        if (!selectedLevel) return;
        // Pick random questions from the full pool for fresh questions on each start/retry
        const pool = QUESTION_POOLS[selectedLevel.id] || set.questions;
        const randomQuestions = getRandomQuestions(pool, selectedLevel.questionsPerSet);
        setSelectedSet({ ...set, questions: randomQuestions });
        setCurrentQuestion(0);
        setScore(0);
        setSelectedOption(null);
        setShowResult(false);
        setTimeLeft(selectedLevel.timePerQuestion);
        setCorrectAnswers(0);
        setIsNewHighScore(false);
        setStreak(0);
        setBestStreak(0);
        setEliminatedOptions([]); // reset eliminated options
        setLifelineUsed(false);    // reset lifeline
        fadeAnim.setValue(0);
        scaleAnim.setValue(0.9);
        timerBarWidth.setValue(1);
        setScreen('playing');
    };

    const backToLevels = () => {
        setSelectedLevel(null);
        setSelectedSet(null);
        setScreen('levels');
    };

    const backToSets = () => {
        setSelectedSet(null);
        setScreen('sets');
    };

    const getOptionStyle = (index: number) => {
        if (!selectedSet) return [styles.option, { backgroundColor: cardBg }];
        if (!showResult) {
            return selectedOption === index
                ? [styles.option, styles.optionSelected]
                : [styles.option, { backgroundColor: cardBg, borderColor: surfaceBg }];
        }
        if (index === selectedSet.questions[currentQuestion].correct) {
            return [styles.option, styles.optionCorrect];
        }
        if (selectedOption === index) {
            return [styles.option, styles.optionWrong];
        }
        return [styles.option, { backgroundColor: cardBg, borderColor: surfaceBg, opacity: 0.5 }];
    };

    // Level Selection Screen
    if (screen === 'levels') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.header}>
                    <Text style={styles.titleEmoji}>📚</Text>
                    <Text style={[styles.title, { color: textColor }]}>Knowledge Quiz</Text>
                    <Text style={[styles.subtitle, { color: subtitleColor }]}>Choose your level</Text>
                </View>

                <View style={styles.levelsContainer}>
                    {CLASS_LEVELS.map((level) => {
                        const totalSets = level.sets.length;
                        return (
                            <TouchableOpacity
                                key={level.id}
                                style={[styles.levelCard, { backgroundColor: cardBg }]}
                                onPress={() => selectLevel(level)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.levelAccent, { backgroundColor: level.color }]} />
                                <View style={[styles.levelIconBg, { backgroundColor: level.color + '18' }]}>
                                    <Text style={styles.levelIcon}>{level.icon}</Text>
                                </View>
                                <View style={styles.levelInfo}>
                                    <Text style={[styles.levelName, { color: textColor }]}>{level.name}</Text>
                                    <Text style={[styles.levelSubtitle, { color: subtitleColor }]}>{level.subtitle}</Text>
                                    <Text style={[styles.setCount, { color: level.color }]}>
                                        {totalSets} sets • {level.questionsPerSet} Q each
                                    </Text>
                                </View>
                                <View style={[styles.arrowCircle, { backgroundColor: surfaceBg }]}>
                                    <Text style={[styles.arrow, { color: subtitleColor }]}>→</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            </SafeAreaView>
        );
    }

    // Sets Selection Screen
    if (screen === 'sets' && selectedLevel) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
            <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
                <View style={styles.setsHeader}>
                    <TouchableOpacity style={styles.backBtn} onPress={backToLevels}>
                        <Text style={[styles.backIcon, { color: subtitleColor }]}>←</Text>
                    </TouchableOpacity>
                    <View style={styles.headerCenter}>
                        <Text style={styles.levelIconSmall}>{selectedLevel.icon}</Text>
                        <Text style={[styles.headerTitle, { color: textColor }]}>{selectedLevel.name}</Text>
                    </View>
                    <View style={{ width: 40 }} />
                </View>

                <Text style={[styles.setsTitle, { color: textColor }]}>Select a Set</Text>
                <Text style={[styles.setsSubtitle, { color: subtitleColor }]}>
                    {selectedLevel.questionsPerSet} questions per set • {selectedLevel.timePerQuestion}s each
                </Text>

                <View style={styles.setsGrid}>
                    {selectedLevel.sets.map((set) => {
                        const highScore = getSetHighScore(selectedLevel.id, set.setNumber);
                        const hasPlayed = highScore > 0;
                        return (
                            <TouchableOpacity
                                key={set.setNumber}
                                style={[styles.setCard, { backgroundColor: cardBg }]}
                                onPress={() => startSet(set)}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.setNumber, { backgroundColor: selectedLevel.color }]}>
                                    <Text style={styles.setNumberText}>{set.setNumber}</Text>
                                </View>
                                <Text style={[styles.setLabel, { color: textColor }]}>Set {set.setNumber}</Text>
                                {hasPlayed ? (
                                    <View style={styles.highScoreRow}>
                                        <Text style={[styles.trophySmall, { color: selectedLevel.color }]}>🏆</Text>
                                        <Text style={[styles.setHighScore, { color: selectedLevel.color }]}>{highScore}</Text>
                                    </View>
                                ) : (
                                    <Text style={[styles.notPlayed, { color: subtitleColor }]}>Not played</Text>
                                )}
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </ScrollView>
            </SafeAreaView>
        );
    }

    // Result Screen
    if (screen === 'result' && selectedLevel && selectedSet) {
        const percentage = Math.round((correctAnswers / selectedSet.questions.length) * 100);
        let grade = { letter: '🏆', text: 'Excellent!', color: '#F59E0B', bg: '#FEF3C7' };
        if (percentage < 40) grade = { letter: '📖', text: 'Keep Learning', color: '#EF4444', bg: '#FEE2E2' };
        else if (percentage < 60) grade = { letter: '👍', text: 'Good Effort', color: '#3B82F6', bg: '#DBEAFE' };
        else if (percentage < 80) grade = { letter: '⭐', text: 'Great Job!', color: '#10B981', bg: '#D1FAE5' };

        return (
            <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
                <ScrollView contentContainerStyle={styles.resultScroll} showsVerticalScrollIndicator={false}>
                    {isNewHighScore && (
                        <View style={styles.newHighScoreBanner}>
                            <Text style={styles.newHighScoreText}>🎉 New High Score!</Text>
                        </View>
                    )}

                    <View style={[styles.gradeCircle, { backgroundColor: grade.bg, borderColor: grade.color }]}>
                        <Text style={styles.gradeEmoji}>{grade.letter}</Text>
                    </View>
                    <Text style={[styles.gradeText, { color: grade.color }]}>{grade.text}</Text>
                    <Text style={[styles.levelComplete, { color: textColor }]}>
                        {selectedLevel.name} - Set {selectedSet.setNumber}
                    </Text>

                    <View style={styles.statsGrid}>
                        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                            <Text style={styles.statEmoji}>🎯</Text>
                            <Text style={[styles.statValue, { color: textColor }]}>{score}</Text>
                            <Text style={[styles.statLabel, { color: subtitleColor }]}>Points</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                            <Text style={styles.statEmoji}>✅</Text>
                            <Text style={[styles.statValue, { color: textColor }]}>{correctAnswers}/{selectedSet.questions.length}</Text>
                            <Text style={[styles.statLabel, { color: subtitleColor }]}>Correct</Text>
                        </View>
                        <View style={[styles.statCard, { backgroundColor: cardBg }]}>
                            <Text style={styles.statEmoji}>📊</Text>
                            <Text style={[styles.statValue, { color: textColor }]}>{percentage}%</Text>
                            <Text style={[styles.statLabel, { color: subtitleColor }]}>Accuracy</Text>
                        </View>
                    </View>

                    <Text style={[styles.savedNote, { color: subtitleColor }]}>✓ Score saved to Records</Text>

                    <View style={[styles.breakCard, { backgroundColor: selectedLevel.color + '10', borderColor: selectedLevel.color + '30' }]}>
                        <Text style={[styles.breakText, { color: selectedLevel.color }]}>
                            ⏳ Take a few seconds' break before starting your next set or quiz!
                        </Text>
                    </View>

                    <TouchableOpacity
                        style={[styles.shareBtn, { borderColor: selectedLevel.color }]}
                        onPress={() => Share.share({
                            message: `📚 I scored ${score} points (${percentage}%) on ${selectedLevel.name} - Set ${selectedSet.setNumber}! ${percentage === 100 ? '💯 Perfect!' : ''} Try NexaPlay Quiz!`,
                        })}
                    >
                        <Text style={[styles.shareBtnText, { color: selectedLevel.color }]}>📤 Share Score</Text>
                    </TouchableOpacity>

                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={[styles.primaryBtn, { backgroundColor: selectedLevel.color }]}
                            onPress={() => startSet(selectedSet)}
                        >
                            <Text style={styles.primaryBtnText}>Retry Set</Text>
                        </TouchableOpacity>
                        {selectedSet.setNumber < selectedLevel.sets.length ? (
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { borderColor: selectedLevel.color }]}
                                onPress={() => startSet(selectedLevel.sets[selectedSet.setNumber])}
                            >
                                <Text style={[styles.secondaryBtnText, { color: selectedLevel.color }]}>Next Set →</Text>
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity
                                style={[styles.secondaryBtn, { borderColor: surfaceBg }]}
                                onPress={backToSets}
                            >
                                <Text style={[styles.secondaryBtnText, { color: textColor }]}>Go Back</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    <TouchableOpacity style={styles.levelLink} onPress={backToLevels}>
                        <Text style={[styles.levelLinkText, { color: subtitleColor }]}>← All Levels</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // Playing Game Screen
    if (!selectedLevel || !selectedSet) return null;

    const question = selectedSet.questions[currentQuestion];

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={styles.gameHeader}>
                <TouchableOpacity style={styles.backBtn} onPress={backToSets}>
                    <Text style={[styles.backIcon, { color: subtitleColor }]}>←</Text>
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.headerTitle, { color: textColor }]}>
                        {selectedLevel.name} • Set {selectedSet.setNumber}
                    </Text>
                </View>
                <View style={styles.questionCounter}>
                    <Text style={[styles.questionNum, { color: selectedLevel.color }]}>{currentQuestion + 1}</Text>
                    <Text style={[styles.questionTotal, { color: subtitleColor }]}>/{selectedSet.questions.length}</Text>
                </View>
            </View>

            {/* Timer Bar */}
            <View style={[styles.timerBarTrack, { backgroundColor: surfaceBg }]}>
                <Animated.View style={[
                    styles.timerBarFill,
                    {
                        backgroundColor: timeLeft <= 5 ? '#EF4444' : selectedLevel.color,
                        width: timerBarWidth.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['0%', '100%'],
                        }),
                    }
                ]} />
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
                <View style={styles.statPill}>
                    <Text style={[styles.statPillValue, { color: selectedLevel.color }]}>{score}</Text>
                    <Text style={[styles.statPillLabel, { color: subtitleColor }]}>pts</Text>
                </View>

                <Animated.View style={[
                    styles.timerPill,
                    { backgroundColor: timeLeft <= 5 ? '#EF4444' : selectedLevel.color },
                    { transform: [{ scale: timerScale }] }
                ]}>
                    <Text style={styles.timerValue}>{timeLeft}</Text>
                </Animated.View>

                <View style={styles.statPill}>
                    <Text style={[styles.statPillValue, { color: '#10B981' }]}>{correctAnswers}</Text>
                    <Text style={[styles.statPillLabel, { color: subtitleColor }]}>✓</Text>
                </View>

                {streak >= 2 && (
                    <Animated.View style={[styles.streakBadge, { transform: [{ scale: streakAnim }] }]}>
                        <Text style={styles.streakText}>🔥 {streak}</Text>
                    </Animated.View>
                )}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.questionScroll}>
                <Animated.View style={[
                    styles.questionCard,
                    { backgroundColor: cardBg, opacity: fadeAnim, transform: [{ scale: scaleAnim }] }
                ]}>
                    <View style={[styles.categoryTag, { backgroundColor: selectedLevel.color + '15' }]}>
                        <Text style={[styles.categoryText, { color: selectedLevel.color }]}>{question.category}</Text>
                    </View>

                    <Text style={[styles.questionText, { color: textColor }]}>{question.question}</Text>

                    <View style={styles.optionsGrid}>
                        {question.options.map((option, index) => {
                            const isEliminated = eliminatedOptions.includes(index);
                            return (
                                <TouchableOpacity
                                    key={index}
                                    style={[getOptionStyle(index), isEliminated && { opacity: 0.15 }]}
                                    onPress={() => selectOption(index)}
                                    disabled={showResult || isEliminated}
                                    activeOpacity={0.7}
                                >
                                    <View style={[
                                        styles.optionIndex,
                                        showResult && index === question.correct && styles.optionIndexCorrect,
                                        showResult && selectedOption === index && index !== question.correct && styles.optionIndexWrong,
                                        !showResult && { backgroundColor: selectedLevel.color + '20' }
                                    ]}>
                                        <Text style={[
                                            styles.optionIndexText,
                                            showResult && (index === question.correct || selectedOption === index) && { color: '#fff' },
                                            !showResult && { color: selectedLevel.color }
                                        ]}>{String.fromCharCode(65 + index)}</Text>
                                    </View>
                                    <Text style={[
                                        styles.optionText,
                                        { color: showResult && (index === question.correct || selectedOption === index) ? '#fff' : textColor }
                                    ]}>{option}</Text>
                                    {showResult && index === question.correct && (
                                        <Text style={styles.resultMark}>✓</Text>
                                    )}
                                    {showResult && selectedOption === index && index !== question.correct && (
                                        <Text style={styles.resultMark}>✗</Text>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {!lifelineUsed && !showResult && (
                        <TouchableOpacity
                            style={[
                                styles.lifelineBtn,
                                {
                                    borderColor: selectedLevel.color,
                                    backgroundColor: isRewardedLoaded ? 'transparent' : 'rgba(0,0,0,0.05)',
                                    opacity: isRewardedLoaded ? 1 : 0.6
                                }
                            ]}
                            onPress={useLifeline}
                            disabled={!isRewardedLoaded}
                        >
                            <Text style={[styles.lifelineText, { color: selectedLevel.color }]}>
                                {isRewardedLoaded ? '💡 Use 50/50 Lifeline (Watch Video Ad)' : '⏳ Loading Lifeline Ad...'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </Animated.View>
            <AdBanner />
        </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingTop: 60,
        paddingBottom: 28,
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    titleEmoji: {
        fontSize: 48,
        marginBottom: 14,
    },
    title: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 14,
        marginTop: 4,
    },
    levelsContainer: {
        paddingHorizontal: 20,
        gap: 12,
        paddingBottom: 40,
    },
    levelCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingRight: 16,
        paddingLeft: 0,
        borderRadius: 16,
        overflow: 'hidden',
    },
    levelAccent: {
        width: 4,
        height: '100%',
        marginRight: 14,
    },
    levelIconBg: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 14,
    },
    levelIcon: {
        fontSize: 24,
    },
    levelInfo: {
        flex: 1,
    },
    levelName: {
        fontSize: 16,
        fontWeight: '600',
    },
    levelSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    setCount: {
        fontSize: 12,
        fontWeight: '600',
        marginTop: 4,
    },
    arrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    arrow: {
        fontSize: 16,
    },
    setsHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingHorizontal: 20,
        paddingBottom: 16,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        fontWeight: '300',
    },
    headerCenter: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    levelIconSmall: {
        fontSize: 18,
        marginRight: 6,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    setsTitle: {
        fontSize: 22,
        fontWeight: '700',
        textAlign: 'center',
        marginTop: 8,
    },
    setsSubtitle: {
        fontSize: 13,
        textAlign: 'center',
        marginTop: 4,
        marginBottom: 24,
    },
    setsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        paddingBottom: 40,
    },
    setCard: {
        width: (width - 44) / 2,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
    },
    setNumber: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    setNumberText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    setLabel: {
        fontSize: 15,
        fontWeight: '600',
    },
    highScoreRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
    },
    trophySmall: {
        fontSize: 14,
        marginRight: 4,
    },
    setHighScore: {
        fontSize: 14,
        fontWeight: '700',
    },
    notPlayed: {
        fontSize: 12,
        marginTop: 6,
    },
    resultScroll: {
        flexGrow: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    newHighScoreBanner: {
        backgroundColor: '#F59E0B',
        paddingVertical: 10,
        paddingHorizontal: 24,
        borderRadius: 20,
        marginBottom: 20,
    },
    newHighScoreText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    gradeCircle: {
        width: 90,
        height: 90,
        borderRadius: 45,
        borderWidth: 3,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 14,
    },
    gradeEmoji: {
        fontSize: 40,
    },
    gradeText: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 4,
    },
    levelComplete: {
        fontSize: 15,
        fontWeight: '500',
        marginBottom: 24,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 18,
    },
    statCard: {
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderRadius: 14,
        minWidth: 85,
    },
    statEmoji: {
        fontSize: 22,
        marginBottom: 6,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 10,
        fontWeight: '600',
        marginTop: 2,
    },
    savedNote: {
        fontSize: 12,
        marginBottom: 12,
    },
    shareBtn: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 20,
        marginBottom: 16,
    },
    shareBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    primaryBtn: {
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 12,
        paddingHorizontal: 22,
        borderRadius: 12,
        borderWidth: 2,
    },
    secondaryBtnText: {
        fontSize: 14,
        fontWeight: '600',
    },
    levelLink: {
        marginTop: 20,
        padding: 10,
    },
    levelLinkText: {
        fontSize: 14,
    },
    timerBarTrack: {
        height: 6,
        marginHorizontal: 20,
        borderRadius: 3,
        overflow: 'hidden',
    },
    timerBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    streakBadge: {
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#F59E0B',
    },
    streakText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D97706',
    },
    gameHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 8,
        paddingHorizontal: 20,
        paddingBottom: 14,
    },
    questionCounter: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    questionNum: {
        fontSize: 17,
        fontWeight: '700',
    },
    questionTotal: {
        fontSize: 13,
    },
    statsRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 14,
    },
    statPill: {
        flexDirection: 'row',
        alignItems: 'baseline',
        gap: 4,
    },
    statPillValue: {
        fontSize: 18,
        fontWeight: '700',
    },
    statPillLabel: {
        fontSize: 12,
        fontWeight: '500',
    },
    timerPill: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    timerValue: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
    questionScroll: {
        paddingHorizontal: 20,
        paddingBottom: 40,
    },
    questionCard: {
        borderRadius: 18,
        padding: 22,
    },
    categoryTag: {
        alignSelf: 'flex-start',
        paddingVertical: 5,
        paddingHorizontal: 10,
        borderRadius: 8,
        marginBottom: 14,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    questionText: {
        fontSize: 18,
        fontWeight: '600',
        lineHeight: 26,
        marginBottom: 22,
    },
    optionsGrid: {
        gap: 10,
    },
    option: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 13,
        borderRadius: 12,
        borderWidth: 1.5,
    },
    optionSelected: {
        borderColor: '#6366F1',
        backgroundColor: '#6366F110',
    },
    optionCorrect: {
        borderColor: '#10B981',
        backgroundColor: '#10B981',
    },
    optionWrong: {
        borderColor: '#EF4444',
        backgroundColor: '#EF4444',
    },
    optionIndex: {
        width: 30,
        height: 30,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    optionIndexCorrect: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    optionIndexWrong: {
        backgroundColor: 'rgba(255,255,255,0.3)',
    },
    optionIndexText: {
        fontSize: 13,
        fontWeight: '700',
    },
    optionText: {
        fontSize: 14,
        flex: 1,
        fontWeight: '500',
    },
    resultMark: {
        fontSize: 16,
        color: '#fff',
        fontWeight: '700',
    },
    lifelineBtn: {
        borderWidth: 1.5,
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 14,
        borderStyle: 'dashed',
    },
    lifelineText: {
        fontSize: 14,
        fontWeight: '700',
    },
    breakCard: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 16,
        width: '100%',
        alignItems: 'center',
        justifyContent: 'center',
    },
    breakText: {
        fontSize: 13,
        fontWeight: '600',
        textAlign: 'center',
        lineHeight: 18,
    },
});
