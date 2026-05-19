import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ScrollView, useWindowDimensions, Modal } from 'react-native';
import { useTheme, COLORS } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';
import { useRecords } from '../../context/RecordsContext';

// Dimensions are dynamically calculated inside components for responsiveness.

type Player = 'X' | 'O' | null;
type Board = Player[];
type Difficulty = 'easy' | 'medium' | 'hard';
type Mode = 'pvp' | 'ai';

const WINNING_COMBOS = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
    [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
    [0, 4, 8], [2, 4, 6],             // diags
];

export default function TicTacToeGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
    const { width } = useWindowDimensions();
    const { addGameRecord } = useRecords();
    
    // Dynamically calculate responsive maximum width
    const boardWidth = Math.min(width - 40, 420);
    const CELL_SIZE = Math.floor((boardWidth - 32 - 16) / 3);

    const [board, setBoard] = useState<Board>(Array(9).fill(null));
    const [isXTurn, setIsXTurn] = useState(true);
    const [gameOver, setGameOver] = useState(false);
    const [winner, setWinner] = useState<Player>(null);
    const [winLine, setWinLine] = useState<number[] | null>(null);
    const [mode, setMode] = useState<Mode | null>(null);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [scores, setScores] = useState({ X: 0, O: 0, draw: 0 });
    const [menuVisible, setMenuVisible] = useState(false);

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const subColor = isDarkMode ? '#94A3B8' : '#64748B';
    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const containerBg = isDarkMode ? '#0F172A' : '#F8FAFC';
    const surfaceBg = isDarkMode ? '#334155' : '#F1F5F9';

    const checkWinner = useCallback((b: Board): { winner: Player; line: number[] | null } => {
        for (const combo of WINNING_COMBOS) {
            const [a, bIdx, c] = combo;
            if (b[a] && b[a] === b[bIdx] && b[a] === b[c]) {
                return { winner: b[a], line: combo };
            }
        }
        return { winner: null, line: null };
    }, []);

    const getAvailableMoves = (b: Board): number[] => {
        return b.reduce<number[]>((acc, cell, i) => (cell === null ? [...acc, i] : acc), []);
    };

    const minimax = (b: Board, depth: number, isMax: boolean, alpha: number, beta: number): number => {
        const { winner: w } = checkWinner(b);
        if (w === 'O') return 10 - depth;
        if (w === 'X') return depth - 10;
        const moves = getAvailableMoves(b);
        if (moves.length === 0) return 0;

        if (isMax) {
            let best = -Infinity;
            for (const move of moves) {
                b[move] = 'O';
                best = Math.max(best, minimax(b, depth + 1, false, alpha, beta));
                b[move] = null;
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (const move of moves) {
                b[move] = 'X';
                best = Math.min(best, minimax(b, depth + 1, true, alpha, beta));
                b[move] = null;
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    };

    const getAIMove = (b: Board): number => {
        const moves = getAvailableMoves(b);
        if (moves.length === 0) return -1;

        if (difficulty === 'easy') {
            // 70% random, 30% best
            if (Math.random() < 0.7) return moves[Math.floor(Math.random() * moves.length)];
        } else if (difficulty === 'medium') {
            // 30% random, 70% best
            if (Math.random() < 0.3) return moves[Math.floor(Math.random() * moves.length)];
        }

        // Best move (minimax)
        let bestScore = -Infinity;
        let bestMove = moves[0];
        for (const move of moves) {
            b[move] = 'O';
            const score = minimax(b, 0, false, -Infinity, Infinity);
            b[move] = null;
            if (score > bestScore) {
                bestScore = score;
                bestMove = move;
            }
        }
        return bestMove;
    };

    const handlePress = (index: number) => {
        if (board[index] || gameOver) return;

        const newBoard = [...board];
        newBoard[index] = isXTurn ? 'X' : 'O';

        const { winner: w, line } = checkWinner(newBoard);
        if (w) {
            setBoard(newBoard);
            setWinner(w);
            setWinLine(line);
            setGameOver(true);
            setScores(prev => ({ ...prev, [w]: prev[w as 'X' | 'O'] + 1 }));
            addGameRecord({
                game: 'tictactoe',
                winner: w === 'X' ? 'Player X' : 'Player O',
                winnerColor: w === 'X' ? '#EF4444' : '#3B82F6',
                gameMode: mode === 'ai' ? 'computer' : 'passplay',
                difficulty: mode === 'ai' ? difficulty : undefined,
                isHumanWinner: mode === 'ai' ? w === 'X' : true,
            });
            return;
        }

        if (getAvailableMoves(newBoard).length === 0) {
            setBoard(newBoard);
            setGameOver(true);
            setScores(prev => ({ ...prev, draw: prev.draw + 1 }));
            addGameRecord({
                game: 'tictactoe',
                details: 'Game ended in a draw.',
                gameMode: mode === 'ai' ? 'computer' : 'passplay',
                difficulty: mode === 'ai' ? difficulty : undefined,
            });
            return;
        }

        setBoard(newBoard);

        if (mode === 'ai') {
            setIsXTurn(false);
            // AI moves after a short delay
            setTimeout(() => {
                const aiMove = getAIMove([...newBoard]);
                if (aiMove !== -1) {
                    const aiBoard = [...newBoard];
                    aiBoard[aiMove] = 'O';

                    const { winner: aiW, line: aiLine } = checkWinner(aiBoard);
                    if (aiW) {
                        setBoard(aiBoard);
                        setWinner(aiW);
                        setWinLine(aiLine);
                        setGameOver(true);
                        setScores(prev => ({ ...prev, O: prev.O + 1 }));
                        addGameRecord({
                            game: 'tictactoe',
                            winner: 'Player O (AI)',
                            winnerColor: '#3B82F6',
                            gameMode: 'computer',
                            difficulty: difficulty,
                            isHumanWinner: false,
                        });
                        return;
                    }

                    if (getAvailableMoves(aiBoard).length === 0) {
                        setBoard(aiBoard);
                        setGameOver(true);
                        setScores(prev => ({ ...prev, draw: prev.draw + 1 }));
                        addGameRecord({
                            game: 'tictactoe',
                            details: 'Game ended in a draw.',
                            gameMode: 'computer',
                            difficulty: difficulty,
                        });
                        return;
                    }

                    setBoard(aiBoard);
                    setIsXTurn(true);
                }
            }, 400);
        } else {
            setIsXTurn(!isXTurn);
        }
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setIsXTurn(true);
        setGameOver(false);
        setWinner(null);
        setWinLine(null);
    };

    const resetAll = () => {
        resetGame();
        setScores({ X: 0, O: 0, draw: 0 });
        setMode(null);
    };

    // Mode select screen
    if (mode === null) {
        return (
            <ScrollView style={[styles.container, { backgroundColor: containerBg }]} contentContainerStyle={{ maxWidth: 600, alignSelf: 'center', width: '100%', flexGrow: 1 }}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <View style={[styles.backBtnBg, { backgroundColor: cardBg }]}>
                        <Text style={[styles.backBtnText, { color: COLORS.primary }]}>← Back</Text>
                    </View>
                </TouchableOpacity>

                <View style={styles.menuContent}>
                    <Text style={styles.menuEmoji}><Text style={{color: '#EF4444'}}>X</Text> <Text style={{color: '#3B82F6'}}>O</Text></Text>
                    <Text style={[styles.menuTitle, { color: textColor }]}>Tic Tac Toe</Text>
                    <Text style={[styles.menuSubtitle, { color: subColor }]}>Choose your mode</Text>

                    <TouchableOpacity
                        style={[styles.menuButton, { backgroundColor: '#6366F1' }]}
                        onPress={() => setMode('pvp')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.menuBtnIcon}>👥</Text>
                        <View>
                            <Text style={styles.menuBtnTitle}>Player vs Player</Text>
                            <Text style={styles.menuBtnSub}>Play with a friend</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.menuButton, { backgroundColor: '#EF4444' }]}
                        onPress={() => setMode('ai')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.menuBtnIcon}>🤖</Text>
                        <View>
                            <Text style={styles.menuBtnTitle}>Player vs AI</Text>
                            <Text style={styles.menuBtnSub}>Challenge the computer</Text>
                        </View>
                    </TouchableOpacity>

                    {/* Difficulty selector (only shows before starting AI) */}
                    <View style={[styles.diffCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.diffLabel, { color: subColor }]}>AI DIFFICULTY</Text>
                        <View style={styles.diffRow}>
                            {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                                <TouchableOpacity
                                    key={d}
                                    style={[
                                        styles.diffBtn,
                                        difficulty === d && {
                                            backgroundColor: d === 'easy' ? '#10B981' :
                                                d === 'medium' ? '#F59E0B' : '#EF4444'
                                        },
                                    ]}
                                    onPress={() => setDifficulty(d)}
                                >
                                    <Text style={[
                                        styles.diffText,
                                        { color: difficulty === d ? 'white' : subColor },
                                    ]}>{d === 'easy' ? '😊 Easy' : d === 'medium' ? '🤔 Medium' : '😈 Hard'}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                </View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={[styles.container, { backgroundColor: containerBg }]} contentContainerStyle={{ maxWidth: 600, alignSelf: 'center', width: '100%', flexGrow: 1, paddingBottom: 40 }}>
            <TouchableOpacity style={styles.backBtn} onPress={() => setMenuVisible(true)}>
                <View style={[styles.backBtnBg, { backgroundColor: cardBg }]}>
                    <Text style={[styles.backBtnText, { color: COLORS.primary }]}>⚙️ Menu</Text>
                </View>
            </TouchableOpacity>

            {/* Header */}
            <View style={styles.header}>
                <Text style={[styles.gameTitle, { color: textColor }]}>Tic Tac Toe</Text>
                <Text style={[styles.turnText, { color: subColor }]}>
                    {gameOver
                        ? winner ? `${winner} Wins! 🎉` : "It's a Draw! 🤝"
                        : `${isXTurn ? 'X' : 'O'}'s Turn`}
                </Text>
            </View>

            {/* Scoreboard */}
            <View style={[styles.scoreBoard, { backgroundColor: cardBg }]}>
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreLabel, { color: '#EF4444' }]}>X</Text>
                    <Text style={[styles.scoreValue, { color: textColor }]}>{scores.X}</Text>
                </View>
                <View style={[styles.scoreDivider, { backgroundColor: surfaceBg }]} />
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreLabel, { color: subColor }]}>🤝 Draw</Text>
                    <Text style={[styles.scoreValue, { color: textColor }]}>{scores.draw}</Text>
                </View>
                <View style={[styles.scoreDivider, { backgroundColor: surfaceBg }]} />
                <View style={styles.scoreItem}>
                    <Text style={[styles.scoreLabel, { color: '#3B82F6' }]}>O</Text>
                    <Text style={[styles.scoreValue, { color: textColor }]}>{scores.O}</Text>
                </View>
            </View>

            {/* Board */}
            <View style={[styles.board, { backgroundColor: cardBg, width: boardWidth }]}>
                {board.map((cell, i) => (
                    <TouchableOpacity
                        key={i}
                        style={[
                            styles.cell,
                            {
                                width: CELL_SIZE, height: CELL_SIZE,
                                backgroundColor: winLine?.includes(i)
                                    ? (winner === 'X' ? '#EF444420' : '#3B82F620')
                                    : surfaceBg,
                            },
                        ]}
                        onPress={() => handlePress(i)}
                        disabled={gameOver || (mode === 'ai' && !isXTurn)}
                        activeOpacity={0.7}
                    >
                        <Text style={[
                            styles.cellText,
                            { color: cell === 'X' ? '#EF4444' : '#3B82F6' },
                            winLine?.includes(i) && { fontSize: 64 },
                        ]}>
                            {cell}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionRow}>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: COLORS.primary }]}
                    onPress={resetGame}
                    activeOpacity={0.85}
                >
                    <Text style={styles.actionBtnText}>🔄 New Round</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.actionBtn, { backgroundColor: '#6B7280' }]}
                    onPress={resetAll}
                    activeOpacity={0.85}
                >
                    <Text style={styles.actionBtnText}>🔙 Menu</Text>
                </TouchableOpacity>
            </View>

            {/* Game Over Popup Modal */}
            <Modal
                animationType="fade"
                transparent={true}
                visible={gameOver}
                onRequestClose={resetGame}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={styles.modalEmoji}>
                            {winner ? '🎉' : '🤝'}
                        </Text>
                        <Text style={[styles.modalTitle, { color: textColor }]}>
                            {winner ? `${winner} Wins!` : "It's a Draw!"}
                        </Text>
                        <View style={styles.modalActionRow}>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: COLORS.primary }]}
                                onPress={resetGame}
                            >
                                <Text style={styles.modalBtnText}>Play Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modalBtn, { backgroundColor: '#6B7280' }]}
                                onPress={resetAll}
                            >
                                <Text style={styles.modalBtnText}>Menu</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            
            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onSaveAndQuit={() => navigation.goBack()} 
                onQuit={() => navigation.goBack()} 
            />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backBtn: { marginTop: 8, marginBottom: 10 },
    backBtnBg: {
        alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    backBtnText: { fontSize: 16, fontWeight: '700' },
    // Menu
    menuContent: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20, marginTop: -60 },
    menuEmoji: { fontSize: 48, marginBottom: 12 },
    menuTitle: { fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    menuSubtitle: { fontSize: 16, fontWeight: '500', marginBottom: 36 },
    menuButton: {
        width: '100%', flexDirection: 'row', alignItems: 'center', gap: 16,
        padding: 20, borderRadius: 18, marginBottom: 14,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6,
    },
    menuBtnIcon: { fontSize: 32 },
    menuBtnTitle: { color: 'white', fontSize: 18, fontWeight: '700' },
    menuBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '500', marginTop: 2 },
    diffCard: {
        width: '100%', borderRadius: 18, padding: 18, marginTop: 10,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    diffLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12, textAlign: 'center' },
    diffRow: { flexDirection: 'row', gap: 8 },
    diffBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
    diffText: { fontSize: 13, fontWeight: '700' },
    // Game
    header: { alignItems: 'center', marginBottom: 16 },
    gameTitle: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    turnText: { fontSize: 16, fontWeight: '600', marginTop: 6 },
    scoreBoard: {
        flexDirection: 'row', borderRadius: 18, padding: 16, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4,
    },
    scoreItem: { flex: 1, alignItems: 'center' },
    scoreLabel: { fontSize: 14, fontWeight: '600', marginBottom: 6 },
    scoreValue: { fontSize: 24, fontWeight: '800' },
    scoreDivider: { width: 1, height: '80%', alignSelf: 'center' },
    board: {
        alignSelf: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: 8,
        padding: 16, borderRadius: 24,
        shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 16, elevation: 6,
    },
    cell: { borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
    cellText: { fontSize: 52, fontWeight: '900' },
    actionRow: { flexDirection: 'row', gap: 12, marginTop: 24, justifyContent: 'center' },
    actionBtn: {
        flex: 1, paddingVertical: 16, borderRadius: 14, alignItems: 'center',
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 10, elevation: 5,
    },
    actionBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
    // Modal
    modalOverlay: {
        flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20
    },
    modalContent: {
        width: '100%', maxWidth: 350, borderRadius: 24, padding: 32, alignItems: 'center',
        shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.2, shadowRadius: 20, elevation: 10,
    },
    modalEmoji: { fontSize: 64, marginBottom: 16 },
    modalTitle: { fontSize: 28, fontWeight: '800', marginBottom: 32, textAlign: 'center' },
    modalActionRow: { flexDirection: 'row', gap: 12, width: '100%' },
    modalBtn: {
        flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center',
    },
    modalBtnText: { color: 'white', fontSize: 16, fontWeight: '700' },
});
