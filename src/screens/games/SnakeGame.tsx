import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import SoundEffects from '../../utils/sounds';
import GameMenuModal from '../../components/GameMenuModal';
import AdBanner from '../../components/AdBanner';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_WIDTH - 40, 380);
const GRID_SIZE = 20; // 20x20 grid
const CELL_SIZE = Math.floor(BOARD_SIZE / GRID_SIZE);
const ACTUAL_BOARD_SIZE = CELL_SIZE * GRID_SIZE; // Ensures exact fit without gaps

type Point = { x: number; y: number };
type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';

const INITIAL_SNAKE: Point[] = [
    { x: 10, y: 10 },
    { x: 10, y: 11 },
    { x: 10, y: 12 },
];
const INITIAL_DIRECTION: Direction = 'UP';
const INITIAL_SPEED = 180;

const getRandomApple = (snake: Point[]): Point => {
    let newApple: Point;
    while (true) {
        newApple = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
        const isOnSnake = snake.some(segment => segment.x === newApple.x && segment.y === newApple.y);
        if (!isOnSnake) break;
    }
    return newApple;
};

export default function SnakeGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const [snake, setSnake] = useState<Point[]>(INITIAL_SNAKE);
    const [direction, setDirection] = useState<Direction>(INITIAL_DIRECTION);
    const [apple, setApple] = useState<Point>({ x: 5, y: 5 });
    const [score, setScore] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [isGameOver, setIsGameOver] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [speed, setSpeed] = useState(INITIAL_SPEED);
    const [menuVisible, setMenuVisible] = useState(false);

    // Using refs for state accessed inside setInterval to avoid stale closures
    const snakeRef = useRef(snake);
    const dirRef = useRef(direction);
    const appleRef = useRef(apple);
    const scoreRef = useRef(score);

    const applePulse = useRef(new Animated.Value(1)).current;

    const bgColor = '#050B14'; // Always dark neon theme
    const boardBg = '#0A1128';
    const gridColor = 'rgba(255, 255, 255, 0.03)';

    useEffect(() => {
        setApple(getRandomApple(INITIAL_SNAKE));
        appleRef.current = apple;

        Animated.loop(
            Animated.sequence([
                Animated.timing(applePulse, { toValue: 1.2, duration: 400, useNativeDriver: true }),
                Animated.timing(applePulse, { toValue: 1, duration: 400, useNativeDriver: true }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        snakeRef.current = snake;
        dirRef.current = direction;
        appleRef.current = apple;
        scoreRef.current = score;
    });

    useEffect(() => {
        if (isGameOver || isPaused) return;

        const moveSnake = () => {
            const currentSnake = [...snakeRef.current];
            const head = currentSnake[0];
            let newHead = { ...head };

            switch (dirRef.current) {
                case 'UP': newHead.y -= 1; break;
                case 'DOWN': newHead.y += 1; break;
                case 'LEFT': newHead.x -= 1; break;
                case 'RIGHT': newHead.x += 1; break;
            }

            // Check collision with walls
            if (newHead.x < 0 || newHead.x >= GRID_SIZE || newHead.y < 0 || newHead.y >= GRID_SIZE) {
                handleGameOver();
                return;
            }

            // Check collision with self
            if (currentSnake.some(segment => segment.x === newHead.x && segment.y === newHead.y)) {
                handleGameOver();
                return;
            }

            currentSnake.unshift(newHead);

            // Check apple eat
            if (newHead.x === appleRef.current.x && newHead.y === appleRef.current.y) {
                SoundEffects.correct(); // Haptic popup
                const newScore = scoreRef.current + 10;
                setScore(newScore);
                setHighScore(prev => Math.max(prev, newScore));
                
                // Speed up every 5 apples
                if (newScore > 0 && newScore % 50 === 0) {
                    setSpeed(prev => Math.max(70, prev - 15));
                }
                
                setApple(getRandomApple(currentSnake));
            } else {
                currentSnake.pop();
            }

            setSnake(currentSnake);
        };

        const interval = setInterval(moveSnake, speed);
        return () => clearInterval(interval);
    }, [isGameOver, isPaused, speed]);

    const handleGameOver = () => {
        SoundEffects.capture(); // Heavy haptic crash
        setIsGameOver(true);
    };

    const resetGame = () => {
        setSnake(INITIAL_SNAKE);
        setDirection(INITIAL_DIRECTION);
        setApple(getRandomApple(INITIAL_SNAKE));
        setScore(0);
        setSpeed(INITIAL_SPEED);
        setIsGameOver(false);
        setIsPaused(false);
    };

    const handleDirection = (newDir: Direction) => {
        SoundEffects.tap(); // Light haptic tap
        const currentDir = dirRef.current;
        if (
            (newDir === 'UP' && currentDir === 'DOWN') ||
            (newDir === 'DOWN' && currentDir === 'UP') ||
            (newDir === 'LEFT' && currentDir === 'RIGHT') ||
            (newDir === 'RIGHT' && currentDir === 'LEFT')
        ) {
            return; // Prevent reverse moving into self
        }
        setDirection(newDir);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bgColor }]} edges={['top', 'bottom']}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => {
                    if (!isPaused && !isGameOver) setIsPaused(true);
                    setMenuVisible(true);
                }}>
                    <Text style={styles.backBtnText}>Menu</Text>
                </TouchableOpacity>
                <Text style={styles.title}>NEON SNAKE</Text>
                <View style={{ width: 60 }} />
            </View>

            <View style={styles.scoreBoard}>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>SCORE</Text>
                    <Text style={styles.scoreValue}>{score}</Text>
                </View>
                <View style={styles.scoreBox}>
                    <Text style={styles.scoreLabel}>BEST</Text>
                    <Text style={[styles.scoreValue, { color: '#F59E0B' }]}>{highScore}</Text>
                </View>
            </View>

            <View style={[styles.boardWrapper, { width: ACTUAL_BOARD_SIZE, height: ACTUAL_BOARD_SIZE, backgroundColor: boardBg }]}>
                {/* Grid Overlay */}
                <View style={styles.gridOverlay}>
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <View key={`v-${i}`} style={[styles.gridLineVertical, { left: i * CELL_SIZE, backgroundColor: gridColor }]} />
                    ))}
                    {Array.from({ length: GRID_SIZE }).map((_, i) => (
                        <View key={`h-${i}`} style={[styles.gridLineHorizontal, { top: i * CELL_SIZE, backgroundColor: gridColor }]} />
                    ))}
                </View>

                {/* Apple */}
                <Animated.View style={[
                    styles.apple,
                    {
                        left: apple.x * CELL_SIZE,
                        top: apple.y * CELL_SIZE,
                        width: CELL_SIZE,
                        height: CELL_SIZE,
                        transform: [{ scale: applePulse }],
                    }
                ]}>
                    <View style={styles.appleGlow} />
                </Animated.View>

                {/* Snake */}
                {snake.map((segment, index) => {
                    const isHead = index === 0;
                    return (
                        <View
                            key={`${segment.x}-${segment.y}-${index}`}
                            style={[
                                styles.snakeSegment,
                                {
                                    left: segment.x * CELL_SIZE,
                                    top: segment.y * CELL_SIZE,
                                    width: CELL_SIZE,
                                    height: CELL_SIZE,
                                    backgroundColor: isHead ? '#38BDF8' : '#0284C7',
                                    shadowColor: '#38BDF8',
                                    zIndex: isHead ? 10 : 1,
                                }
                            ]}
                        >
                            {isHead && (
                                <View style={styles.snakeEyes}>
                                    <View style={styles.eye} />
                                    <View style={styles.eye} />
                                </View>
                            )}
                        </View>
                    );
                })}

                {isGameOver && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayTitle}>CRASHED!</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={resetGame}>
                            <Text style={styles.retryText}>PLAY AGAIN</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {isPaused && !isGameOver && (
                    <View style={styles.overlay}>
                        <Text style={styles.overlayTitle}>PAUSED</Text>
                        <TouchableOpacity style={styles.retryBtn} onPress={() => setIsPaused(false)}>
                            <Text style={styles.retryText}>RESUME</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Glass D-Pad */}
            <View style={styles.controls}>
                <View style={styles.dpadRow}>
                    <TouchableOpacity style={styles.dpadBtn} onPress={() => handleDirection('LEFT')} activeOpacity={0.5}>
                        <Text style={styles.dpadArrow}>◀</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dpadBtn} onPress={() => handleDirection('UP')} activeOpacity={0.5}>
                        <Text style={styles.dpadArrow}>▲</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dpadBtn} onPress={() => handleDirection('DOWN')} activeOpacity={0.5}>
                        <Text style={styles.dpadArrow}>▼</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.dpadBtn} onPress={() => handleDirection('RIGHT')} activeOpacity={0.5}>
                        <Text style={styles.dpadArrow}>▶</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => {
                    setMenuVisible(false);
                    if (isPaused && !isGameOver) setIsPaused(false);
                }} 
                onSaveAndQuit={() => navigation.goBack()} 
                onQuit={() => navigation.goBack()} 
            />
        <AdBanner />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
    },
    header: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 60,
        paddingBottom: 20,
    },
    backBtn: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    backBtnText: {
        color: '#E2E8F0',
        fontWeight: 'bold',
        fontSize: 14,
    },
    title: {
        color: '#38BDF8',
        fontSize: 22,
        fontWeight: '900',
        letterSpacing: 2,
        textShadowColor: '#38BDF8',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    scoreBoard: {
        flexDirection: 'row',
        gap: 20,
        marginBottom: 20,
    },
    scoreBox: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        paddingHorizontal: 24,
        paddingVertical: 10,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
    },
    scoreLabel: {
        color: '#94A3B8',
        fontSize: 10,
        fontWeight: '800',
        letterSpacing: 1,
        marginBottom: 4,
    },
    scoreValue: {
        color: '#F8FAFC',
        fontSize: 24,
        fontWeight: '900',
        fontVariant: ['tabular-nums'],
    },
    boardWrapper: {
        borderRadius: 8,
        overflow: 'hidden',
        borderWidth: 2,
        borderColor: '#1E293B',
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
    },
    gridOverlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    },
    gridLineVertical: {
        position: 'absolute',
        width: 1,
        height: '100%',
    },
    gridLineHorizontal: {
        position: 'absolute',
        width: '100%',
        height: 1,
    },
    apple: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
    },
    appleGlow: {
        width: '70%',
        height: '70%',
        backgroundColor: '#EF4444',
        borderRadius: 100,
        shadowColor: '#EF4444',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 10,
        elevation: 5,
    },
    snakeSegment: {
        position: 'absolute',
        borderRadius: 4,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    snakeEyes: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        padding: 2,
    },
    eye: {
        width: 3,
        height: 3,
        backgroundColor: '#0F172A',
        borderRadius: 2,
    },
    overlay: {
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(5, 11, 20, 0.85)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 50,
    },
    overlayTitle: {
        color: '#EF4444',
        fontSize: 36,
        fontWeight: '900',
        letterSpacing: 2,
        marginBottom: 20,
        textShadowColor: '#EF4444',
        textShadowOffset: { width: 0, height: 0 },
        textShadowRadius: 10,
    },
    retryBtn: {
        backgroundColor: '#38BDF8',
        paddingHorizontal: 30,
        paddingVertical: 14,
        borderRadius: 25,
        shadowColor: '#38BDF8',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.5,
        shadowRadius: 10,
        elevation: 8,
    },
    retryText: {
        color: '#0F172A',
        fontSize: 16,
        fontWeight: '900',
        letterSpacing: 1,
    },
    controls: {
        marginTop: 30,
        alignItems: 'center',
        gap: 8,
    },
    dpadRow: {
        flexDirection: 'row',
        gap: 8,
    },
    dpadBtn: {
        width: 65,
        height: 65,
        backgroundColor: 'rgba(56, 189, 248, 0.1)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(56, 189, 248, 0.3)',
    },
    dpadCenter: {
        width: 65,
        height: 65,
        backgroundColor: 'rgba(255, 255, 255, 0.02)',
        borderRadius: 30,
    },
    dpadArrow: {
        fontSize: 24,
        color: '#38BDF8',
    },
});
