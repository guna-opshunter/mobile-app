import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { useTheme } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';

const { width } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 40, 360);
const CELL_SIZE = BOARD_SIZE / 9;

// Pre-defined Sudoku puzzles (0 represents empty cells)
const PUZZLES = [
    [
        [5, 3, 0, 0, 7, 0, 0, 0, 0],
        [6, 0, 0, 1, 9, 5, 0, 0, 0],
        [0, 9, 8, 0, 0, 0, 0, 6, 0],
        [8, 0, 0, 0, 6, 0, 0, 0, 3],
        [4, 0, 0, 8, 0, 3, 0, 0, 1],
        [7, 0, 0, 0, 2, 0, 0, 0, 6],
        [0, 6, 0, 0, 0, 0, 2, 8, 0],
        [0, 0, 0, 4, 1, 9, 0, 0, 5],
        [0, 0, 0, 0, 8, 0, 0, 7, 9],
    ],
    [
        [0, 0, 0, 2, 6, 0, 7, 0, 1],
        [6, 8, 0, 0, 7, 0, 0, 9, 0],
        [1, 9, 0, 0, 0, 4, 5, 0, 0],
        [8, 2, 0, 1, 0, 0, 0, 4, 0],
        [0, 0, 4, 6, 0, 2, 9, 0, 0],
        [0, 5, 0, 0, 0, 3, 0, 2, 8],
        [0, 0, 9, 3, 0, 0, 0, 7, 4],
        [0, 4, 0, 0, 5, 0, 0, 3, 6],
        [7, 0, 3, 0, 1, 8, 0, 0, 0],
    ],
    [
        [0, 2, 0, 6, 0, 8, 0, 0, 0],
        [5, 8, 0, 0, 0, 9, 7, 0, 0],
        [0, 0, 0, 0, 4, 0, 0, 0, 0],
        [3, 7, 0, 0, 0, 0, 5, 0, 0],
        [6, 0, 0, 0, 0, 0, 0, 0, 4],
        [0, 0, 8, 0, 0, 0, 0, 1, 3],
        [0, 0, 0, 0, 2, 0, 0, 0, 0],
        [0, 0, 9, 8, 0, 0, 0, 3, 6],
        [0, 0, 0, 3, 0, 6, 0, 9, 0],
    ],
];

// Solutions for the puzzles
const SOLUTIONS = [
    [
        [5, 3, 4, 6, 7, 8, 9, 1, 2],
        [6, 7, 2, 1, 9, 5, 3, 4, 8],
        [1, 9, 8, 3, 4, 2, 5, 6, 7],
        [8, 5, 9, 7, 6, 1, 4, 2, 3],
        [4, 2, 6, 8, 5, 3, 7, 9, 1],
        [7, 1, 3, 9, 2, 4, 8, 5, 6],
        [9, 6, 1, 5, 3, 7, 2, 8, 4],
        [2, 8, 7, 4, 1, 9, 6, 3, 5],
        [3, 4, 5, 2, 8, 6, 1, 7, 9],
    ],
    [
        [4, 3, 5, 2, 6, 9, 7, 8, 1],
        [6, 8, 2, 5, 7, 1, 4, 9, 3],
        [1, 9, 7, 8, 3, 4, 5, 6, 2],
        [8, 2, 6, 1, 9, 5, 3, 4, 7],
        [3, 7, 4, 6, 8, 2, 9, 1, 5],
        [9, 5, 1, 7, 4, 3, 6, 2, 8],
        [5, 1, 9, 3, 2, 6, 8, 7, 4],
        [2, 4, 8, 9, 5, 7, 1, 3, 6],
        [7, 6, 3, 4, 1, 8, 2, 5, 9],
    ],
    [
        [1, 2, 3, 6, 7, 8, 9, 4, 5],
        [5, 8, 4, 2, 3, 9, 7, 6, 1],
        [9, 6, 7, 1, 4, 5, 3, 2, 8],
        [3, 7, 2, 4, 6, 1, 5, 8, 9],
        [6, 9, 1, 5, 8, 3, 2, 7, 4],
        [4, 5, 8, 7, 9, 2, 6, 1, 3],
        [8, 3, 6, 9, 2, 4, 1, 5, 7],
        [2, 1, 9, 8, 5, 7, 4, 3, 6],
        [7, 4, 5, 3, 1, 6, 8, 9, 2],
    ],
];

export default function SudokuGame({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [puzzleIndex, setPuzzleIndex] = useState(() => Math.floor(Math.random() * PUZZLES.length));
    const [board, setBoard] = useState<number[][]>([]);
    const [originalBoard, setOriginalBoard] = useState<number[][]>([]);
    const [selectedCell, setSelectedCell] = useState<[number, number] | null>(null);
    const [mistakes, setMistakes] = useState(0);
    const [timer, setTimer] = useState(0);
    const [isCompleted, setIsCompleted] = useState(false);
    const [noteMode, setNoteMode] = useState(false);
    const [notes, setNotes] = useState<Set<number>[][]>([]);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    const textColor = isDarkMode ? '#ffffff' : '#333';
    const cardBg = isDarkMode ? '#1e1e1e' : 'white';
    const cellBg = isDarkMode ? '#2d2d2d' : '#ffffff';
    const selectedBg = isDarkMode ? '#4a4a8a' : '#bbdefb';
    const highlightBg = isDarkMode ? '#3a3a5a' : '#e3f2fd';
    const errorBg = '#ffcdd2';
    const fixedTextColor = isDarkMode ? '#9e9e9e' : '#666';

    useEffect(() => {
        initializeGame();
    }, [puzzleIndex]);

    useEffect(() => {
        if (!isCompleted) {
            const interval = setInterval(() => {
                setTimer(t => t + 1);
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isCompleted]);

    const initializeGame = () => {
        const puzzle = PUZZLES[puzzleIndex].map(row => [...row]);
        setBoard(puzzle);
        setOriginalBoard(PUZZLES[puzzleIndex].map(row => [...row]));
        setNotes(Array(9).fill(null).map(() => Array(9).fill(null).map(() => new Set<number>())));
        setSelectedCell(null);
        setMistakes(0);
        setTimer(0);
        setIsCompleted(false);
        setHighlightedNumber(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCellPress = (row: number, col: number) => {
        if (originalBoard[row][col] !== 0) {
            setHighlightedNumber(board[row][col]);
            setSelectedCell(null);
        } else {
            setSelectedCell([row, col]);
            if (board[row][col] !== 0) {
                setHighlightedNumber(board[row][col]);
            } else {
                setHighlightedNumber(null);
            }
        }
    };

    const handleNumberPress = (num: number) => {
        if (!selectedCell) return;
        const [row, col] = selectedCell;

        if (originalBoard[row][col] !== 0) return;

        if (noteMode) {
            const newNotes = notes.map(r => r.map(c => new Set(c)));
            if (newNotes[row][col].has(num)) {
                newNotes[row][col].delete(num);
            } else {
                newNotes[row][col].add(num);
            }
            setNotes(newNotes);
        } else {
            const newBoard = board.map(r => [...r]);
            newBoard[row][col] = num;
            setBoard(newBoard);
            setHighlightedNumber(num);

            // Clear notes for this cell
            const newNotes = notes.map(r => r.map(c => new Set(c)));
            newNotes[row][col].clear();
            setNotes(newNotes);

            // Check if correct
            if (num !== SOLUTIONS[puzzleIndex][row][col]) {
                setMistakes(m => m + 1);
                if (mistakes + 1 >= 3) {
                    Alert.alert('Game Over', 'You made 3 mistakes!', [
                        { text: 'Try Again', onPress: initializeGame }
                    ]);
                }
            }

            // Check if completed
            if (checkCompletion(newBoard)) {
                setIsCompleted(true);
            }
        }
    };

    const handleErase = () => {
        if (!selectedCell) return;
        const [row, col] = selectedCell;
        if (originalBoard[row][col] !== 0) return;

        const newBoard = board.map(r => [...r]);
        newBoard[row][col] = 0;
        setBoard(newBoard);
        setHighlightedNumber(null);
    };

    const checkCompletion = (currentBoard: number[][]) => {
        for (let i = 0; i < 9; i++) {
            for (let j = 0; j < 9; j++) {
                if (currentBoard[i][j] !== SOLUTIONS[puzzleIndex][i][j]) {
                    return false;
                }
            }
        }
        return true;
    };

    const isConflict = (row: number, col: number, value: number) => {
        if (value === 0) return false;

        // Check row
        for (let c = 0; c < 9; c++) {
            if (c !== col && board[row][c] === value) return true;
        }

        // Check column
        for (let r = 0; r < 9; r++) {
            if (r !== row && board[r][col] === value) return true;
        }

        // Check 3x3 box
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = boxRow; r < boxRow + 3; r++) {
            for (let c = boxCol; c < boxCol + 3; c++) {
                if ((r !== row || c !== col) && board[r][c] === value) return true;
            }
        }

        return false;
    };

    const getCellStyle = (row: number, col: number) => {
        const baseStyle: any[] = [styles.cell, { backgroundColor: cellBg }];

        // Box borders
        if (col % 3 === 0 && col !== 0) {
            baseStyle.push(styles.leftBorder);
        }
        if (row % 3 === 0 && row !== 0) {
            baseStyle.push(styles.topBorder);
        }

        // Selection and highlighting
        if (selectedCell && selectedCell[0] === row && selectedCell[1] === col) {
            baseStyle.push({ backgroundColor: selectedBg });
        } else if (selectedCell) {
            const [selRow, selCol] = selectedCell;
            if (row === selRow || col === selCol ||
                (Math.floor(row / 3) === Math.floor(selRow / 3) && Math.floor(col / 3) === Math.floor(selCol / 3))) {
                baseStyle.push({ backgroundColor: highlightBg });
            }
        }

        // Highlight same numbers
        if (highlightedNumber && board[row][col] === highlightedNumber) {
            baseStyle.push({ backgroundColor: selectedBg });
        }

        // Error highlighting
        if (board[row][col] !== 0 && isConflict(row, col, board[row][col])) {
            baseStyle.push({ backgroundColor: errorBg });
        }

        return baseStyle;
    };

    const renderNotes = (row: number, col: number) => {
        const cellNotes = notes[row][col];
        return (
            <View style={styles.notesContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                    <Text
                        key={num}
                        style={[styles.noteText, { color: isDarkMode ? '#888' : '#666' }]}
                    >
                        {cellNotes.has(num) ? num : ''}
                    </Text>
                ))}
            </View>
        );
    };

    const newGame = () => {
        let newIndex;
        do {
            newIndex = Math.floor(Math.random() * PUZZLES.length);
        } while (newIndex === puzzleIndex && PUZZLES.length > 1);
        setPuzzleIndex(newIndex);
    };

    if (isCompleted) {
        return (
            <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : backgroundColor }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => setMenuVisible(true)}>
                    <Text style={[styles.backButtonText, { color: isDarkMode ? '#646cff' : '#0056b3' }]}>⚙️ Menu</Text>
                </TouchableOpacity>
                <View style={[styles.winnerCard, { backgroundColor: cardBg }]}>
                    <Text style={styles.winnerEmoji}>🎉</Text>
                    <Text style={[styles.winnerText, { color: textColor }]}>Congratulations!</Text>
                    <Text style={[styles.statsText, { color: textColor }]}>
                        Time: {formatTime(timer)}
                    </Text>
                    <Text style={[styles.statsText, { color: textColor }]}>
                        Mistakes: {mistakes}/3
                    </Text>
                    <TouchableOpacity style={styles.playAgainButton} onPress={newGame}>
                        <Text style={styles.playAgainButtonText}>🔄 New Game</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? '#121212' : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => setMenuVisible(true)}>
                <Text style={[styles.backButtonText, { color: isDarkMode ? '#646cff' : '#0056b3' }]}>⚙️ Menu</Text>
            </TouchableOpacity>

            <Text style={[styles.title, { color: textColor }]}>🔢 Sudoku</Text>

            {/* Stats bar */}
            <View style={styles.statsBar}>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: textColor }]}>Mistakes</Text>
                    <Text style={[styles.statValue, { color: mistakes > 0 ? '#e74c3c' : textColor }]}>
                        {mistakes}/3
                    </Text>
                </View>
                <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: textColor }]}>Time</Text>
                    <Text style={[styles.statValue, { color: textColor }]}>{formatTime(timer)}</Text>
                </View>
            </View>

            {/* Sudoku Board */}
            <View style={[styles.boardContainer, { backgroundColor: cardBg }]}>
                <View style={[styles.board, { borderColor: isDarkMode ? '#555' : '#333' }]}>
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((cell, colIndex) => (
                                <TouchableOpacity
                                    key={colIndex}
                                    style={getCellStyle(rowIndex, colIndex)}
                                    onPress={() => handleCellPress(rowIndex, colIndex)}
                                >
                                    {cell !== 0 ? (
                                        <Text
                                            style={[
                                                styles.cellText,
                                                {
                                                    color: originalBoard[rowIndex][colIndex] !== 0
                                                        ? textColor
                                                        : '#646cff',
                                                    fontWeight: originalBoard[rowIndex][colIndex] !== 0
                                                        ? 'bold'
                                                        : 'normal',
                                                }
                                            ]}
                                        >
                                            {cell}
                                        </Text>
                                    ) : notes[rowIndex][colIndex].size > 0 ? (
                                        renderNotes(rowIndex, colIndex)
                                    ) : null}
                                </TouchableOpacity>
                            ))}
                        </View>
                    ))}
                </View>
            </View>

            {/* Controls */}
            <View style={styles.controlsContainer}>
                <TouchableOpacity
                    style={[styles.controlButton, noteMode && styles.activeControl]}
                    onPress={() => setNoteMode(!noteMode)}
                >
                    <Text style={styles.controlIcon}>✏️</Text>
                    <Text style={[styles.controlText, { color: textColor }]}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={handleErase}>
                    <Text style={styles.controlIcon}>🗑️</Text>
                    <Text style={[styles.controlText, { color: textColor }]}>Erase</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.controlButton} onPress={newGame}>
                    <Text style={styles.controlIcon}>🔄</Text>
                    <Text style={[styles.controlText, { color: textColor }]}>New</Text>
                </TouchableOpacity>
            </View>

            {/* Number pad */}
            <View style={styles.numberPad}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
                    // Count remaining of each number
                    let count = 9;
                    board.forEach(row => row.forEach(cell => {
                        if (cell === num) count--;
                    }));

                    return (
                        <TouchableOpacity
                            key={num}
                            style={[
                                styles.numberButton,
                                { backgroundColor: cardBg },
                                highlightedNumber === num && styles.highlightedNumber,
                                count === 0 && styles.disabledNumber,
                            ]}
                            onPress={() => handleNumberPress(num)}
                            disabled={count === 0}
                        >
                            <Text style={[
                                styles.numberButtonText,
                                { color: count === 0 ? '#999' : '#646cff' }
                            ]}>
                                {num}
                            </Text>
                            <Text style={[styles.countText, { color: textColor }]}>
                                {count > 0 ? count : ''}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

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
        padding: 20,
        alignItems: 'center',
    },
    backButton: {
        alignSelf: 'flex-start',
        marginTop: 40,
        marginBottom: 10,
    },
    backButtonText: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    statsBar: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
        marginBottom: 15,
    },
    statItem: {
        alignItems: 'center',
    },
    statLabel: {
        fontSize: 12,
        opacity: 0.7,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    boardContainer: {
        padding: 8,
        borderRadius: 12,
        elevation: 5,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderWidth: 2,
        borderRadius: 4,
    },
    row: {
        flexDirection: 'row',
        flex: 1,
    },
    cell: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 0.5,
        borderColor: '#ccc',
    },
    leftBorder: {
        borderLeftWidth: 2,
        borderLeftColor: '#333',
    },
    topBorder: {
        borderTopWidth: 2,
        borderTopColor: '#333',
    },
    cellText: {
        fontSize: CELL_SIZE * 0.5,
    },
    notesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        width: '100%',
        height: '100%',
        padding: 1,
    },
    noteText: {
        width: '33.33%',
        height: '33.33%',
        fontSize: CELL_SIZE * 0.2,
        textAlign: 'center',
    },
    controlsContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 20,
        marginTop: 20,
        marginBottom: 15,
    },
    controlButton: {
        alignItems: 'center',
        padding: 10,
        borderRadius: 10,
    },
    activeControl: {
        backgroundColor: 'rgba(100, 108, 255, 0.2)',
    },
    controlIcon: {
        fontSize: 24,
    },
    controlText: {
        fontSize: 12,
        marginTop: 4,
    },
    numberPad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        gap: 8,
        maxWidth: 320,
    },
    numberButton: {
        width: 55,
        height: 55,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 10,
        elevation: 2,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,
    },
    highlightedNumber: {
        backgroundColor: 'rgba(100, 108, 255, 0.3)',
    },
    disabledNumber: {
        opacity: 0.4,
    },
    numberButtonText: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    countText: {
        fontSize: 10,
        opacity: 0.6,
    },
    winnerCard: {
        padding: 40,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 100,
        elevation: 5,
    },
    winnerEmoji: {
        fontSize: 60,
        marginBottom: 20,
    },
    winnerText: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    statsText: {
        fontSize: 18,
        marginBottom: 10,
    },
    playAgainButton: {
        backgroundColor: '#646cff',
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 10,
        marginTop: 20,
    },
    playAgainButtonText: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold',
    },
});
