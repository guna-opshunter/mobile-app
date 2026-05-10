import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert,
    PanResponder, Animated, useWindowDimensions
} from 'react-native';
import { useTheme, COLORS } from '../../theme';

const BOARD_SIZE = 4;
const TILE_MARGIN = 6;
const BOARD_PADDING = 12;

type Board = (number | null)[][];

const TILE_COLORS: Record<number, { bg: string; text: string; fontSize: number }> = {
    2: { bg: '#EDE0C8', text: '#776E65', fontSize: 32 },
    4: { bg: '#ECE0C0', text: '#776E65', fontSize: 32 },
    8: { bg: '#F2B179', text: '#F9F6F2', fontSize: 32 },
    16: { bg: '#F59563', text: '#F9F6F2', fontSize: 30 },
    32: { bg: '#F67C5F', text: '#F9F6F2', fontSize: 30 },
    64: { bg: '#F65E3B', text: '#F9F6F2', fontSize: 30 },
    128: { bg: '#EDCF72', text: '#F9F6F2', fontSize: 26 },
    256: { bg: '#EDCC61', text: '#F9F6F2', fontSize: 26 },
    512: { bg: '#EDC850', text: '#F9F6F2', fontSize: 26 },
    1024: { bg: '#EDC53F', text: '#F9F6F2', fontSize: 22 },
    2048: { bg: '#EDC22E', text: '#F9F6F2', fontSize: 22 },
    4096: { bg: '#3C3A32', text: '#F9F6F2', fontSize: 22 },
};

const createEmptyBoard = (): Board =>
    Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

const addRandomTile = (board: Board): Board => {
    const empty: [number, number][] = [];
    board.forEach((row, r) =>
        row.forEach((cell, c) => { if (cell === null) empty.push([r, c]); })
    );
    if (empty.length === 0) return board;

    const [r, c] = empty[Math.floor(Math.random() * empty.length)];
    const newBoard = board.map(row => [...row]);
    newBoard[r][c] = Math.random() < 0.9 ? 2 : 4;
    return newBoard;
};

const initBoard = (): Board => {
    let board = createEmptyBoard();
    board = addRandomTile(board);
    board = addRandomTile(board);
    return board;
};

const rotateBoard = (board: Board): Board => {
    const N = board.length;
    return board.map((_, i) => board.map((_, j) => board[N - j - 1][i]));
};

const slideRow = (row: (number | null)[]): { result: (number | null)[]; score: number } => {
    let score = 0;
    const filtered = row.filter(v => v !== null) as number[];
    const merged: number[] = [];

    for (let i = 0; i < filtered.length; i++) {
        if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
            const val = filtered[i] * 2;
            merged.push(val);
            score += val;
            i++;
        } else {
            merged.push(filtered[i]);
        }
    }

    while (merged.length < BOARD_SIZE) merged.push(0);
    return {
        result: merged.map(v => (v === 0 ? null : v)),
        score,
    };
};

const moveLeft = (board: Board): { board: Board; score: number; moved: boolean } => {
    let totalScore = 0;
    let moved = false;
    const newBoard = board.map(row => {
        const { result, score } = slideRow(row);
        totalScore += score;
        if (JSON.stringify(row) !== JSON.stringify(result)) moved = true;
        return result;
    });
    return { board: newBoard, score: totalScore, moved };
};

const move = (board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; score: number; moved: boolean } => {
    let rotated = board;
    let rotations = 0;
    switch (dir) {
        case 'left': rotations = 0; break;
        case 'down': rotations = 1; break;
        case 'right': rotations = 2; break;
        case 'up': rotations = 3; break;
    }
    for (let i = 0; i < rotations; i++) rotated = rotateBoard(rotated);

    const result = moveLeft(rotated);

    let finalBoard = result.board;
    for (let i = 0; i < (4 - rotations) % 4; i++) finalBoard = rotateBoard(finalBoard);

    return { board: finalBoard, score: result.score, moved: result.moved };
};

const canMove = (board: Board): boolean => {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (board[r][c] === null) return true;
            if (c + 1 < BOARD_SIZE && board[r][c] === board[r][c + 1]) return true;
            if (r + 1 < BOARD_SIZE && board[r][c] === board[r + 1][c]) return true;
        }
    }
    return false;
};

const has2048 = (board: Board): boolean =>
    board.some(row => row.some(cell => cell === 2048));

const AnimatedTile = ({ cell, tileStyle, tileSize }: { cell: number | null, tileStyle: any, tileSize: number }) => {
    const scale = useRef(new Animated.Value(cell ? 0.5 : 1)).current;

    useEffect(() => {
        if (cell) {
            scale.setValue(0.5);
            Animated.spring(scale, {
                toValue: 1,
                friction: 5,
                tension: 100,
                useNativeDriver: true,
            }).start();
        }
    }, [cell]);

    return (
        <Animated.View
            style={[
                styles.tile,
                {
                    width: tileSize,
                    height: tileSize,
                    backgroundColor: tileStyle.bg,
                    transform: [{ scale }],
                    shadowColor: cell && cell >= 8 ? tileStyle.bg : 'transparent',
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: cell && cell >= 8 ? 0.3 : 0,
                    shadowRadius: 6,
                    elevation: cell && cell >= 8 ? 6 : 0,
                },
            ]}
        >
            {cell !== null && (
                <Text style={[
                    styles.tileText,
                    { color: tileStyle.text, fontSize: tileStyle.fontSize },
                ]}>{cell}</Text>
            )}
        </Animated.View>
    );
};

export default function Game2048({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    
    const boardWidth = Math.min(screenWidth - 40, 420);
    const tileSize = (boardWidth - BOARD_PADDING * 2 - TILE_MARGIN * (BOARD_SIZE + 1)) / BOARD_SIZE;

    const [board, setBoard] = useState<Board>(initBoard);
    const [score, setScore] = useState(0);
    const [bestScore, setBestScore] = useState(0);
    const [gameOver, setGameOver] = useState(false);
    const [won, setWon] = useState(false);
    const [keepPlaying, setKeepPlaying] = useState(false);

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const subColor = isDarkMode ? '#94A3B8' : '#64748B';
    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const containerBg = isDarkMode ? '#0F172A' : '#FAFAFC';
    const boardBg = isDarkMode ? '#334155' : '#BBADA0';
    const emptyCellBg = isDarkMode ? '#475569' : '#CDC1B4';
    const panelBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';

    const panResponder = useRef(
        PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onMoveShouldSetPanResponder: () => true,
            onPanResponderRelease: (_, gestureState) => {
                const { dx, dy } = gestureState;
                const absDx = Math.abs(dx);
                const absDy = Math.abs(dy);

                if (Math.max(absDx, absDy) < 20) return;

                let dir: 'left' | 'right' | 'up' | 'down';
                if (absDx > absDy) {
                    dir = dx > 0 ? 'right' : 'left';
                } else {
                    dir = dy > 0 ? 'down' : 'up';
                }

                handleMove(dir);
            },
        })
    ).current;

    const handleMove = (dir: 'left' | 'right' | 'up' | 'down') => {
        if (gameOver) return;

        setBoard(prevBoard => {
            const result = move(prevBoard, dir);
            if (!result.moved) return prevBoard;

            const newBoard = addRandomTile(result.board);

            setScore(prev => {
                const newScore = prev + result.score;
                setBestScore(best => Math.max(best, newScore));
                return newScore;
            });

            if (!keepPlaying && has2048(newBoard)) {
                setWon(true);
            }

            if (!canMove(newBoard)) {
                setTimeout(() => setGameOver(true), 300);
            }

            return newBoard;
        });
    };

    const newGame = () => {
        setBoard(initBoard());
        setScore(0);
        setGameOver(false);
        setWon(false);
        setKeepPlaying(false);
    };

    const getTileStyle = (value: number | null) => {
        if (!value) return { bg: emptyCellBg, text: 'transparent', fontSize: 32 };
        return TILE_COLORS[value] || TILE_COLORS[4096];
    };

    return (
        <View style={[styles.container, { backgroundColor: containerBg }]}>
            <TouchableOpacity style={styles.backBtn} onPress={() => {
                Alert.alert('⚙️ Game Menu', 'What would you like to do?', [
                    { text: 'Save & Quit', onPress: () => navigation.goBack() },
                    { text: 'Quit', style: 'destructive', onPress: () => navigation.goBack() },
                    { text: 'Cancel', style: 'cancel' },
                ]);
            }}>
                <View style={[styles.backBtnBg, { backgroundColor: cardBg }]}>
                    <Text style={[styles.backBtnText, { color: textColor }]}>Menu</Text>
                </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={[styles.title2048, { color: '#EDC22E' }]}>2048</Text>
                    <Text style={[styles.subtitle, { color: subColor }]}>Join the tiles!</Text>
                </View>
                <View style={styles.scoreBoxes}>
                    <View style={[styles.scoreBox, { backgroundColor: panelBg }]}>
                        <Text style={[styles.scoreBoxLabel, { color: subColor }]}>SCORE</Text>
                        <Text style={[styles.scoreBoxValue, { color: textColor }]}>{score}</Text>
                    </View>
                    <View style={[styles.scoreBox, { backgroundColor: panelBg }]}>
                        <Text style={[styles.scoreBoxLabel, { color: subColor }]}>BEST</Text>
                        <Text style={[styles.scoreBoxValue, { color: textColor }]}>{bestScore}</Text>
                    </View>
                </View>
            </View>

            <View style={styles.toolbar}>
                <Text style={{ color: subColor, fontSize: 13, flex: 1 }}>Swipe to move all tiles</Text>
                <TouchableOpacity style={styles.newGameBtn} onPress={newGame} activeOpacity={0.8}>
                    <Text style={styles.newGameText}>New Game</Text>
                </TouchableOpacity>
            </View>

            {/* Board */}
            <View
                style={[styles.board, { backgroundColor: boardBg, width: boardWidth, height: boardWidth }]}
                {...panResponder.panHandlers}
            >
                {board.map((row, r) =>
                    row.map((cell, c) => {
                        const tileStyle = getTileStyle(cell);
                        return <AnimatedTile key={`${r}-${c}`} cell={cell} tileStyle={tileStyle} tileSize={tileSize} />;
                    })
                )}
            </View>

            {/* Tap controls for accessibility */}
            <View style={styles.tapControls}>
                <View style={styles.tapRow}>
                    <View style={styles.tapSpacer} />
                    <TouchableOpacity style={[styles.tapBtn, { backgroundColor: cardBg }]} onPress={() => handleMove('up')}>
                        <Text style={[styles.tapArrow, { color: '#BBADA0' }]}>▲</Text>
                    </TouchableOpacity>
                    <View style={styles.tapSpacer} />
                </View>
                <View style={styles.tapRow}>
                    <TouchableOpacity style={[styles.tapBtn, { backgroundColor: cardBg }]} onPress={() => handleMove('left')}>
                        <Text style={[styles.tapArrow, { color: '#BBADA0' }]}>◀</Text>
                    </TouchableOpacity>
                    <View style={[styles.tapCenter, { backgroundColor: '#BBADA020' }]}>
                        <Text style={{ fontSize: 18 }}>🎯</Text>
                    </View>
                    <TouchableOpacity style={[styles.tapBtn, { backgroundColor: cardBg }]} onPress={() => handleMove('right')}>
                        <Text style={[styles.tapArrow, { color: '#BBADA0' }]}>▶</Text>
                    </TouchableOpacity>
                </View>
                <View style={styles.tapRow}>
                    <View style={styles.tapSpacer} />
                    <TouchableOpacity style={[styles.tapBtn, { backgroundColor: cardBg }]} onPress={() => handleMove('down')}>
                        <Text style={[styles.tapArrow, { color: '#BBADA0' }]}>▼</Text>
                    </TouchableOpacity>
                    <View style={styles.tapSpacer} />
                </View>
            </View>

            {/* Win overlay */}
            {won && !keepPlaying && (
                <View style={styles.overlay}>
                    <View style={styles.overlayCard}>
                        <Text style={styles.overlayEmoji}>🎉</Text>
                        <Text style={styles.overlayTitle}>You Win!</Text>
                        <Text style={styles.overlayScore}>Score: {score}</Text>
                        <TouchableOpacity
                            style={[styles.overlayBtn, { backgroundColor: '#EDC22E' }]}
                            onPress={() => setKeepPlaying(true)}
                        >
                            <Text style={styles.overlayBtnText}>Keep Playing</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.overlayBtn, { backgroundColor: '#6B7280', marginTop: 10 }]}
                            onPress={newGame}
                        >
                            <Text style={styles.overlayBtnText}>New Game</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Game over overlay */}
            {gameOver && (
                <View style={styles.overlay}>
                    <View style={styles.overlayCard}>
                        <Text style={styles.overlayEmoji}>😵</Text>
                        <Text style={styles.overlayTitle}>Game Over!</Text>
                        <Text style={styles.overlayScore}>Final Score: {score}</Text>
                        <TouchableOpacity style={[styles.overlayBtn, { backgroundColor: '#EDC22E' }]} onPress={newGame}>
                            <Text style={styles.overlayBtnText}>🔄 Try Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.overlayBtn, { backgroundColor: '#6B7280', marginTop: 10 }]}
                            onPress={() => navigation.goBack()}
                        >
                            <Text style={styles.overlayBtnText}>🔙 Exit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingHorizontal: 20, paddingTop: 50 },
    backBtn: { marginBottom: 20 },
    backBtnBg: {
        alignSelf: 'flex-start', paddingHorizontal: 20, paddingVertical: 10,
        borderRadius: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    backBtnText: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
    // Header
    header: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
    },
    title2048: { fontSize: 48, fontWeight: '900', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.1)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 },
    subtitle: { fontSize: 15, fontWeight: '600', marginTop: -4 },
    scoreBoxes: { flexDirection: 'row', gap: 10 },
    scoreBox: {
        borderRadius: 14, paddingHorizontal: 18, paddingVertical: 12, alignItems: 'center', minWidth: 70,
    },
    scoreBoxLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1, marginBottom: 2 },
    scoreBoxValue: { fontSize: 24, fontWeight: '900' },
    toolbar: {
        flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, marginTop: 10,
    },
    newGameBtn: {
        backgroundColor: '#EDC22E', paddingHorizontal: 22, paddingVertical: 12,
        borderRadius: 12, shadowColor: '#EDC22E', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
    },
    newGameText: { color: 'white', fontSize: 14, fontWeight: '800', letterSpacing: 0.5 },
    // Board
    board: {
        alignSelf: 'center', borderRadius: 16, padding: BOARD_PADDING,
        flexDirection: 'row', flexWrap: 'wrap', gap: TILE_MARGIN,
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10,
    },
    tile: {
        borderRadius: 10, justifyContent: 'center', alignItems: 'center',
    },
    tileText: { fontWeight: '900' },
    // Tap controls
    tapControls: { alignSelf: 'center', marginTop: 30, gap: 6 },
    tapRow: { flexDirection: 'row', justifyContent: 'center', gap: 6 },
    tapSpacer: { width: 60, height: 60 },
    tapBtn: {
        width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 4,
    },
    tapArrow: { fontSize: 22, fontWeight: '800' },
    tapCenter: { width: 60, height: 60, borderRadius: 18, justifyContent: 'center', alignItems: 'center' },
    // Overlays
    overlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center', alignItems: 'center',
        zIndex: 100,
    },
    overlayCard: {
        backgroundColor: 'white', borderRadius: 32, padding: 40, alignItems: 'center',
        width: '85%',
        shadowColor: '#EDC22E', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 30, elevation: 20,
    },
    overlayEmoji: { fontSize: 60, marginBottom: 12 },
    overlayTitle: { fontSize: 36, fontWeight: '900', color: '#776E65', marginBottom: 8, textAlign: 'center' },
    overlayScore: { fontSize: 18, fontWeight: '600', color: '#94A3B8', marginBottom: 30 },
    overlayBtn: {
        width: '100%', paddingVertical: 18, borderRadius: 100, alignItems: 'center',
    },
    overlayBtnText: { color: 'white', fontSize: 17, fontWeight: '800', letterSpacing: 0.5 },
});
