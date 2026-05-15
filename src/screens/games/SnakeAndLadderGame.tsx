import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Alert, Easing } from 'react-native';
import { useTheme } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, 400);
const CELL_SIZE = BOARD_SIZE / 10;

const LADDERS: Record<number, number> = {
    4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91
};
const SNAKES: Record<number, number> = {
    17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78
};

const COLORS = ['#EF4444', '#3B82F6', '#EAB308', '#22C55E']; // Red, Blue, Yellow, Green

// Helper: Get X, Y coordinates for a cell (1-100)
const getCoordinates = (cell: number) => {
    if (cell < 1) return { x: 0, y: 9 * CELL_SIZE };
    if (cell > 100) cell = 100;
    
    const row = Math.floor((cell - 1) / 10);
    const col = (cell - 1) % 10;
    
    const isOddRow = row % 2 !== 0; // Serpentine pattern
    const actualCol = isOddRow ? 9 - col : col;
    const actualRow = 9 - row; // Bottom to top
    
    return {
        x: actualCol * CELL_SIZE,
        y: actualRow * CELL_SIZE
    };
};

export default function SnakeAndLadderGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const [players, setPlayers] = useState([1, 1, 1, 1]); // Positions for 4 players (1 to 100)
    const [activePlayers, setActivePlayers] = useState([true, true, false, false]); // 2 players by default
    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [isRolling, setIsRolling] = useState(false);
    const [winner, setWinner] = useState<number | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const diceRotation = useRef(new Animated.Value(0)).current;
    const diceScale = useRef(new Animated.Value(1)).current;
    
    // Player animations
    const playerAnims = useRef([
        new Animated.ValueXY(getCoordinates(1)),
        new Animated.ValueXY(getCoordinates(1)),
        new Animated.ValueXY(getCoordinates(1)),
        new Animated.ValueXY(getCoordinates(1)),
    ]).current;

    const pureWhite = isDarkMode ? '#1E293B' : '#FFFFFF';
    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';

    useEffect(() => {
        // Init player positions
        playerAnims.forEach(anim => {
            const start = getCoordinates(1);
            anim.setValue(start);
        });
    }, []);

    const rollDice = () => {
        if (isRolling || winner !== null) return;
        setIsRolling(true);
        setMessage(null);

        Animated.sequence([
            Animated.timing(diceScale, { toValue: 0.8, duration: 100, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1.1, duration: 100, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1, duration: 100, useNativeDriver: true }),
        ]).start();

        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 15) {
                clearInterval(interval);
                const finalValue = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalValue);
                handleMove(finalValue);
            }
        }, 50);
    };

    const handleMove = async (roll: number) => {
        const currentPos = players[currentPlayer];
        let newPos = currentPos + roll;
        
        if (newPos > 100) {
            setMessage(`Needs exactly ${100 - currentPos} to win!`);
            finishTurn(roll);
            return;
        }

        // Animate move step-by-step
        await animateMovement(currentPlayer, currentPos, newPos);

        // Check for snake or ladder
        let finalPos = newPos;
        if (LADDERS[newPos]) {
            setMessage(`🪜 Ladder! Up to ${LADDERS[newPos]}`);
            finalPos = LADDERS[newPos];
            await animateMovement(currentPlayer, newPos, finalPos, true);
        } else if (SNAKES[newPos]) {
            setMessage(`🐍 Snake! Down to ${SNAKES[newPos]}`);
            finalPos = SNAKES[newPos];
            await animateMovement(currentPlayer, newPos, finalPos, true);
        }

        const newPlayers = [...players];
        newPlayers[currentPlayer] = finalPos;
        setPlayers(newPlayers);

        if (finalPos === 100) {
            setWinner(currentPlayer);
            setIsRolling(false);
            return;
        }

        finishTurn(roll);
    };

    const animateMovement = (playerIdx: number, from: number, to: number, isDirect: boolean = false) => {
        return new Promise<void>((resolve) => {
            if (isDirect) {
                // Direct move for snakes and ladders
                const coords = getCoordinates(to);
                Animated.timing(playerAnims[playerIdx], {
                    toValue: coords,
                    duration: 500,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false
                }).start(() => resolve());
            } else {
                // Step by step
                const steps: Animated.CompositeAnimation[] = [];
                for (let i = from + 1; i <= to; i++) {
                    const coords = getCoordinates(i);
                    steps.push(
                        Animated.timing(playerAnims[playerIdx], {
                            toValue: coords,
                            duration: 250,
                            easing: Easing.linear,
                            useNativeDriver: false
                        })
                    );
                }
                Animated.sequence(steps).start(() => resolve());
            }
        });
    };

    const finishTurn = (roll: number) => {
        setIsRolling(false);
        if (roll === 6) {
            setMessage('Rolled a 6! Roll again!');
            return; // Extra turn
        }

        // Next player
        let next = (currentPlayer + 1) % 4;
        while (!activePlayers[next]) {
            next = (next + 1) % 4;
        }
        setCurrentPlayer(next);
        setTimeout(() => setDiceValue(null), 1000);
    };

    const resetGame = () => {
        setPlayers([1, 1, 1, 1]);
        setCurrentPlayer(0);
        setWinner(null);
        setDiceValue(null);
        setIsRolling(false);
        setMessage(null);
        playerAnims.forEach(anim => anim.setValue(getCoordinates(1)));
    };

    const renderBoard = () => {
        const cells = [];
        for (let row = 9; row >= 0; row--) {
            const rowCells = [];
            for (let col = 0; col < 10; col++) {
                const isOddRow = row % 2 !== 0;
                const actualCol = isOddRow ? 9 - col : col;
                const cellNum = (row * 10) + actualCol + 1;
                
                // Checkerboard colors
                const isDarkCell = (row + col) % 2 === 0;
                const cellColor = isDarkCell ? (isDarkMode ? '#334155' : '#E2E8F0') : (isDarkMode ? '#1E293B' : '#F8FAFC');

                rowCells.push(
                    <View key={cellNum} style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE, backgroundColor: cellColor }]}>
                        <Text style={[styles.cellText, { color: isDarkMode ? '#94A3B8' : '#64748B' }]}>{cellNum}</Text>
                        {LADDERS[cellNum] && <Text style={styles.boardIcon}>🪜</Text>}
                        {SNAKES[cellNum] && <Text style={styles.boardIcon}>🐍</Text>}
                    </View>
                );
            }
            cells.push(<View key={`row-${row}`} style={styles.row}>{rowCells}</View>);
        }
        return cells;
    };

    const renderDice = () => {
        const dots: { [key: number]: [number, number][] } = {
            1: [[1, 1]],
            2: [[0, 0], [2, 2]],
            3: [[0, 0], [1, 1], [2, 2]],
            4: [[0, 0], [0, 2], [2, 0], [2, 2]],
            5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
            6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
        };

        return (
            <Animated.View style={[styles.dice, { transform: [{ scale: diceScale }] }]}>
                {[0, 1, 2].map(row => (
                    <View key={row} style={styles.diceRow}>
                        {[0, 1, 2].map(col => (
                            <View
                                key={col}
                                style={[
                                    styles.diceDot,
                                    diceValue && dots[diceValue]?.some(d => d[0] === row && d[1] === col)
                                        ? [styles.diceDotFilled, { backgroundColor: COLORS[currentPlayer] }]
                                        : null,
                                ]}
                            />
                        ))}
                    </View>
                ))}
            </Animated.View>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#0F172A' : '#F1F5F9' }]}>
            <View style={styles.header}>
                <TouchableOpacity style={[styles.menuBtn, { backgroundColor: isDarkMode ? '#334155' : '#E2E8F0' }]} onPress={() => setMenuVisible(true)}>
                    <Text style={[styles.menuBtnText, { color: textColor }]}>Menu</Text>
                </TouchableOpacity>
                <Text style={[styles.title, { color: textColor }]}>SNAKES & LADDERS</Text>
                <View style={{ width: 60 }} />
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={[styles.turnBadge, { backgroundColor: COLORS[currentPlayer] }]}>
                    <Text style={styles.turnText}>Player {currentPlayer + 1}'s Turn</Text>
                </View>

                {message && (
                    <View style={[styles.messageBadge, { backgroundColor: pureWhite }]}>
                        <Text style={[styles.messageText, { color: textColor }]}>{message}</Text>
                    </View>
                )}

                <View style={styles.boardWrapper}>
                    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
                        {renderBoard()}
                        
                        {/* Players */}
                        {activePlayers.map((isActive, i) => {
                            if (!isActive) return null;
                            // Offset slightly so multiple players on same cell don't overlap completely
                            const offsetX = (i % 2) * (CELL_SIZE * 0.2);
                            const offsetY = Math.floor(i / 2) * (CELL_SIZE * 0.2);
                            
                            return (
                                <Animated.View
                                    key={i}
                                    style={[
                                        styles.playerToken,
                                        { 
                                            backgroundColor: COLORS[i],
                                            width: CELL_SIZE * 0.5,
                                            height: CELL_SIZE * 0.5,
                                            transform: [
                                                { translateX: playerAnims[i].x },
                                                { translateY: playerAnims[i].y }
                                            ]
                                        }
                                    ]}
                                >
                                    <View style={[styles.playerTokenInner, { left: offsetX + CELL_SIZE * 0.15, top: offsetY + CELL_SIZE * 0.15 }]} />
                                </Animated.View>
                            );
                        })}
                    </View>
                </View>

                {/* Dice Section */}
                <View style={styles.diceSection}>
                    <TouchableOpacity
                        style={[styles.diceContainer, isRolling && styles.diceContainerDisabled]}
                        onPress={rollDice}
                        disabled={isRolling || winner !== null}
                    >
                        {renderDice()}
                        <Text style={[styles.rollText, { color: textColor }]}>
                            {isRolling ? 'Rolling...' : 'Tap to Roll'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {winner !== null && (
                <View style={styles.winnerOverlay}>
                    <View style={[styles.winnerCard, { backgroundColor: pureWhite }]}>
                        <Text style={styles.winnerEmoji}>🏆</Text>
                        <Text style={[styles.winnerText, { color: textColor }]}>Player {winner + 1} Wins!</Text>
                        <TouchableOpacity style={styles.playAgainBtn} onPress={resetGame}>
                            <Text style={styles.playAgainText}>Play Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.quitBtn, { borderColor: isDarkMode ? '#334155' : '#E2E8F0' }]} onPress={() => navigation.goBack()}>
                            <Text style={[styles.quitText, { color: textColor }]}>Quit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

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
    container: { flex: 1 },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 50,
        paddingBottom: 20,
    },
    menuBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
    menuBtnText: { fontSize: 14, fontWeight: '700' },
    title: { fontSize: 20, fontWeight: '900', letterSpacing: 1 },
    scrollContent: { paddingBottom: 40, alignItems: 'center' },
    turnBadge: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        marginBottom: 10,
    },
    turnText: { color: 'white', fontWeight: '800', fontSize: 16 },
    messageBadge: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 16,
        marginBottom: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
    },
    messageText: { fontSize: 14, fontWeight: '700' },
    boardWrapper: {
        padding: 8,
        backgroundColor: '#475569',
        borderRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.2, shadowRadius: 16, elevation: 10,
    },
    board: { borderRadius: 8, overflow: 'hidden', position: 'relative' },
    row: { flexDirection: 'row' },
    cell: { justifyContent: 'center', alignItems: 'center', position: 'relative' },
    cellText: { fontSize: 12, fontWeight: '700', position: 'absolute', top: 4, left: 4 },
    boardIcon: { fontSize: 24, opacity: 0.8 },
    playerToken: {
        position: 'absolute',
        borderRadius: 100,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'white',
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 5,
        zIndex: 10,
    },
    playerTokenInner: { position: 'absolute', width: '100%', height: '100%' },
    diceSection: { marginTop: 30, alignItems: 'center' },
    diceContainer: { alignItems: 'center' },
    diceContainerDisabled: { opacity: 0.7 },
    dice: {
        width: 80, height: 80, backgroundColor: 'white', borderRadius: 16, padding: 8,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.15, shadowRadius: 10, elevation: 8,
    },
    diceRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    diceDot: { width: 14, height: 14, borderRadius: 7 },
    diceDotFilled: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.3, shadowRadius: 2, elevation: 2 },
    rollText: { marginTop: 16, fontSize: 16, fontWeight: '800' },
    winnerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    winnerCard: { width: 300, padding: 30, borderRadius: 24, alignItems: 'center' },
    winnerEmoji: { fontSize: 60, marginBottom: 10 },
    winnerText: { fontSize: 24, fontWeight: '900', marginBottom: 24 },
    playAgainBtn: { backgroundColor: '#10B981', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginBottom: 12 },
    playAgainText: { color: 'white', fontSize: 16, fontWeight: '800' },
    quitBtn: { width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center', borderWidth: 2 },
    quitText: { fontSize: 16, fontWeight: '700' },
});
