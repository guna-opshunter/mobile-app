import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, useWindowDimensions, Modal, Animated } from 'react-native';
import { useTheme } from '../../theme';

// Board config is calculated dynamically based on screen width

// Chess pieces as Unicode characters
const PIECES: { [key: string]: string } = {
    'wK': '♔', 'wQ': '♕', 'wR': '♖', 'wB': '♗', 'wN': '♘', 'wP': '♙',
    'bK': '♚', 'bQ': '♛', 'bR': '♜', 'bB': '♝', 'bN': '♞', 'bP': '♟',
};

const initialBoard = (): (string | null)[][] => [
    ['bR', 'bN', 'bB', 'bQ', 'bK', 'bB', 'bN', 'bR'],
    ['bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP', 'bP'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP', 'wP'],
    ['wR', 'wN', 'wB', 'wQ', 'wK', 'wB', 'wN', 'wR'],
];

export default function ChessGame({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const { width } = useWindowDimensions();
    
    // Dynamic Responsive Sizing
    const boardSize = Math.min(width - 40, 400);
    const squareSize = boardSize / 8;

    const [board, setBoard] = useState<(string | null)[][]>(initialBoard());
    const [selectedSquare, setSelectedSquare] = useState<[number, number] | null>(null);
    const [currentPlayer, setCurrentPlayer] = useState<'w' | 'b'>('w');
    const [capturedWhite, setCapturedWhite] = useState<string[]>([]);
    const [capturedBlack, setCapturedBlack] = useState<string[]>([]);
    const [gameStatus, setGameStatus] = useState<string>('');
    const [validMoves, setValidMoves] = useState<[number, number][]>([]);

    const textColor = isDarkMode ? '#ffffff' : '#333';
    const cardBg = isDarkMode ? '#1e1e1e' : 'white';

    // Animation for Turn Change
    const turnAnim = useRef(new Animated.Value(currentPlayer === 'w' ? 0 : 1)).current;

    useEffect(() => {
        Animated.timing(turnAnim, {
            toValue: currentPlayer === 'w' ? 0 : 1,
            duration: 400,
            useNativeDriver: false // Because we are animating color
        }).start();
    }, [currentPlayer]);

    // Colors requested: fade from dark edge to white, responding dynamically to user's chosen theme
    const pureWhite = isDarkMode ? '#1a1a1c' : '#ffffff';
    // If the user picked a specific theme background color (other than the default app background), apply it to the gradient
    const darkEdge = (backgroundColor && backgroundColor !== '#F8FAFC' && backgroundColor !== '#0F172A')
        ? backgroundColor 
        : (isDarkMode ? '#444446' : '#6b6b6b');

    const blackZoneBg = turnAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [pureWhite, pureWhite] // Base is white, gradient overlay handles the dark part
    });

    const whiteTurnOpacity = turnAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 0]
    });

    // Badge styling - static transparent grey
    const badgeBg = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)';
    const badgeBorder = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)';

    const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
        const piece = board[fromRow][fromCol];
        if (!piece) return false;

        const pieceType = piece[1];
        const pieceColor = piece[0];
        const targetPiece = board[toRow][toCol];

        // Can't capture own piece
        if (targetPiece && targetPiece[0] === pieceColor) return false;

        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (pieceType) {
            case 'P': // Pawn
                const direction = pieceColor === 'w' ? -1 : 1;
                const startRow = pieceColor === 'w' ? 6 : 1;

                // Move forward
                if (colDiff === 0 && !targetPiece) {
                    if (rowDiff === direction) return true;
                    if (fromRow === startRow && rowDiff === 2 * direction && !board[fromRow + direction][fromCol]) return true;
                }
                // Capture diagonally
                if (absColDiff === 1 && rowDiff === direction && targetPiece) return true;
                return false;

            case 'R': // Rook
                if (rowDiff !== 0 && colDiff !== 0) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol);

            case 'N': // Knight
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

            case 'B': // Bishop
                if (absRowDiff !== absColDiff) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol);

            case 'Q': // Queen
                if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false;
                return isPathClear(fromRow, fromCol, toRow, toCol);

            case 'K': // King
                return absRowDiff <= 1 && absColDiff <= 1;

            default:
                return false;
        }
    };

    const isPathClear = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let row = fromRow + rowStep;
        let col = fromCol + colStep;

        while (row !== toRow || col !== toCol) {
            if (board[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
    };

    const getValidMoves = (row: number, col: number): [number, number][] => {
        const moves: [number, number][] = [];
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isValidMove(row, col, r, c)) {
                    moves.push([r, c]);
                }
            }
        }
        return moves;
    };

    const handleSquarePress = (row: number, col: number) => {
        if (gameStatus && gameStatus.includes('Wins')) return;
        const piece = board[row][col];

        if (selectedSquare) {
            const [fromRow, fromCol] = selectedSquare;

            // Try to move
            if (isValidMove(fromRow, fromCol, row, col)) {
                const newBoard = board.map(r => [...r]);
                const movingPiece = newBoard[fromRow][fromCol];
                const capturedPiece = newBoard[row][col];

                // Handle capture
                if (capturedPiece) {
                    if (capturedPiece[0] === 'w') {
                        setCapturedWhite([...capturedWhite, capturedPiece]);
                    } else {
                        setCapturedBlack([...capturedBlack, capturedPiece]);
                    }
                    // Check for king capture (simplified checkmate)
                    if (capturedPiece[1] === 'K') {
                        setGameStatus(`${currentPlayer === 'w' ? 'White' : 'Black'} Wins!`);
                    }
                }

                newBoard[row][col] = newBoard[fromRow][fromCol];
                newBoard[fromRow][fromCol] = null;

                // Pawn promotion (auto-queen)
                if (movingPiece && movingPiece[1] === 'P') {
                    if ((movingPiece[0] === 'w' && row === 0) || (movingPiece[0] === 'b' && row === 7)) {
                        newBoard[row][col] = movingPiece[0] + 'Q';
                    }
                }
                setBoard(newBoard);
                setCurrentPlayer(currentPlayer === 'w' ? 'b' : 'w');
            }

            setSelectedSquare(null);
            setValidMoves([]);
        } else if (piece && piece[0] === currentPlayer) {
            setSelectedSquare([row, col]);
            setValidMoves(getValidMoves(row, col));
        }
    };

    const resetGame = () => {
        setBoard(initialBoard());
        setSelectedSquare(null);
        setCurrentPlayer('w');
        setCapturedWhite([]);
        setCapturedBlack([]);
        setGameStatus('');
        setValidMoves([]);
    };

    const isValidMoveSquare = (row: number, col: number) => {
        return validMoves.some(([r, c]) => r === row && c === col);
    };

    return (
        <View style={[styles.container, { backgroundColor: pureWhite }]}>
            {/* Navigation and Reset Floating Menus */}
            <TouchableOpacity 
                style={[styles.floatingNavBtn, { left: 20, top: 40, backgroundColor: isDarkMode ? 'rgba(50,50,50,0.8)' : 'rgba(255,255,255,0.8)' }]} 
                onPress={() => navigation.goBack()}
            >
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, paddingHorizontal: 8 }}>Menu</Text>
            </TouchableOpacity>



            {/* Split Screen Background Effect */}
            
            {/* Top Half (Black's Side) */}
            <Animated.View style={[StyleSheet.absoluteFill, { bottom: '50%', overflow: 'hidden', backgroundColor: pureWhite }]}>
                <Animated.View style={[
                    StyleSheet.absoluteFill, 
                    { opacity: turnAnim },
                    { backgroundImage: `linear-gradient(to bottom, ${darkEdge}, ${pureWhite} 90%)` } as any
                ]} />
            </Animated.View>

            {/* Bottom Half (White's Side) */}
            <Animated.View style={[StyleSheet.absoluteFill, { top: '50%', overflow: 'hidden', backgroundColor: pureWhite }]}>
                <Animated.View style={[
                    StyleSheet.absoluteFill, 
                    { opacity: whiteTurnOpacity },
                    { backgroundImage: `linear-gradient(to top,  ${darkEdge}, ${pureWhite} 90%)` } as any
                ]} />
            </Animated.View>

            <ScrollView contentContainerStyle={{ flexGrow: 1 }} style={{ flex: 1 }}>

                {/* BLACK'S SIDE content */}
                <View style={[styles.playerZone, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                    <View style={[styles.namePill, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                        <Text style={[styles.namePillText, { color: textColor }]}>
                            BLACK'S SIDE {currentPlayer === 'b' ? '🎯' : '⏳'}
                        </Text>
                    </View>
                    <View style={[styles.piecesBox, { backgroundColor: badgeBg, borderColor: badgeBorder }]}>
                        <Text style={[styles.piecesText, { color: textColor }]}>
                            {capturedBlack.length > 0 ? capturedBlack.map((p, i) => <Text key={i}>{PIECES[p]}</Text>) : '-'}
                        </Text>
                    </View>
                </View>

            <View style={[styles.boardContainer, { 
                backgroundColor: isDarkMode ? '#2c2c2c' : '#ffffff', 
                borderColor: isDarkMode ? '#3d3d3d' : '#e0e0e0' 
            }]}>
                <View style={styles.boardInner}>
                    {board.map((row, rowIndex) => (
                        <View key={rowIndex} style={styles.row}>
                            {row.map((piece, colIndex) => {
                                const isLight = (rowIndex + colIndex) % 2 === 0;
                                const isSelected = selectedSquare?.[0] === rowIndex && selectedSquare?.[1] === colIndex;
                                const isValid = isValidMoveSquare(rowIndex, colIndex);

                                // Modern board colors
                                const lightSquare = isDarkMode ? '#6B7280' : '#E5E7EB';
                                const darkSquare = isDarkMode ? '#374151' : '#9CA3AF';
                                const selectedColor = 'rgba(234, 186, 68, 0.7)';

                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[
                                            styles.square,
                                            {
                                                width: squareSize,
                                                height: squareSize,
                                                backgroundColor: isSelected ? selectedColor : (isLight ? lightSquare : darkSquare),
                                            },
                                        ]}
                                        onPress={() => handleSquarePress(rowIndex, colIndex)}
                                        activeOpacity={0.9}
                                    >
                                        {isValid && (
                                            <View style={[
                                                styles.validDot, 
                                                { backgroundColor: piece ? 'rgba(239,68,68,0.4)' : 'rgba(34,197,94,0.4)',
                                                  width: piece ? squareSize * 0.8 : squareSize * 0.3,
                                                  height: piece ? squareSize * 0.8 : squareSize * 0.3,
                                                  borderRadius: squareSize,
                                                  borderWidth: piece ? 4 : 0,
                                                  borderColor: piece ? 'rgba(239,68,68,0.7)' : 'transparent',
                                                }
                                            ]} />
                                        )}
                                        {piece && (
                                            <Text style={[
                                                styles.piece,
                                                { fontSize: squareSize * 0.75 },
                                                piece[0] === 'w' ? styles.whitePiece : styles.blackPiece,
                                                isSelected && { transform: [{ scale: 1.15 }] }
                                            ]}>
                                                {PIECES[piece]}
                                            </Text>
                                        )}
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    ))}
                </View>
            </View>

            {/* WHITE'S SIDE content */}
            <View style={[styles.playerZone, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                <View style={[styles.piecesBox, { backgroundColor: badgeBg, borderColor: badgeBorder, marginBottom: 8 }]}>
                    <Text style={[styles.piecesText, { color: textColor }]}>
                        {capturedWhite.length > 0 ? capturedWhite.map((p, i) => <Text key={i}>{PIECES[p]}</Text>) : '-'}
                    </Text>
                </View>
                <View style={[styles.namePill, { backgroundColor: badgeBg, borderColor: badgeBorder, marginBottom: 0 }]}>
                    <Text style={[styles.namePillText, { color: textColor }]}>
                        WHITE'S SIDE {currentPlayer === 'w' ? '🎯' : '⏳'}
                    </Text>
                </View>
            </View>



            {/* Game Over Popup */}
            <Modal
                visible={gameStatus.includes('Wins')}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={styles.modalEmoji}>🏆</Text>
                        <Text style={[styles.modalTitle, { color: textColor }]}>{gameStatus}</Text>
                        <Text style={[styles.modalSub, { color: isDarkMode ? '#999' : '#666' }]}>The king has been captured!</Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={resetGame}>
                                <Text style={styles.modalPrimaryText}>Play Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSecondaryBtn, { borderColor: isDarkMode ? '#444' : '#ddd' }]} onPress={() => navigation.goBack()}>
                                <Text style={[styles.modalSecondaryText, { color: textColor }]}>Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

        </ScrollView>
    </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 50,
    },
    topHeaderGroup: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 20,
    },
    backButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
    },
    backButtonText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 26,
        fontWeight: '900',
        letterSpacing: -0.5,
    },
    turnIndicator: {
        alignItems: 'center',
        marginBottom: 16,
        paddingVertical: 14,
        borderRadius: 12,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3,
    },
    turnText: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    playerZone: {
        alignItems: 'center',
        paddingVertical: 18,
        paddingHorizontal: 20,
        marginHorizontal: -20,
    },
    fadeStripContainer: {
        marginHorizontal: -20,
    },
    fadeStrip: {
        height: 6,
        width: '100%',
    },
    namePill: {
        paddingVertical: 6,
        paddingHorizontal: 20,
        borderRadius: 20,
        borderWidth: 1,
        marginBottom: 8,
        alignItems: 'center',
    },
    namePillText: {
        fontSize: 12,
        fontWeight: '800',
        opacity: 0.8,
    },
    piecesBox: {
        alignItems: 'center',
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 6,
        minWidth: 200,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
    },
    piecesText: {
        fontSize: 22,
        letterSpacing: 2,
    },
    boardContainer: {
        alignSelf: 'center',
        padding: 8,
        borderRadius: 16,
        borderWidth: 1,
        shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 12,
        marginVertical: 4,
    },
    boardInner: {
        borderRadius: 8,
        overflow: 'hidden',
    },
    row: {
        flexDirection: 'row',
    },
    square: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    validDot: {
        position: 'absolute',
        backgroundColor: 'rgba(34,197,94,0.4)',
    },
    piece: {
        textAlign: 'center',
    },
    whitePiece: {
        color: '#ffffff',
        textShadowColor: 'rgba(0,0,0,0.4)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 3,
    },
    blackPiece: {
        color: '#0f0f0f',
        textShadowColor: 'rgba(255,255,255,0.4)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 1,
    },
    resetButton: {
        marginTop: 10,
        marginBottom: 40,
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        paddingHorizontal: 40,
        borderRadius: 30,
        alignSelf: 'center',
        shadowColor: '#6C63FF', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
    },
    resetButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
    // Game Over Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    modalContent: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 28,
        padding: 36,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.3,
        shadowRadius: 32,
        elevation: 24,
    },
    modalEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 26,
        fontWeight: '900',
        marginBottom: 8,
        letterSpacing: -0.3,
    },
    modalSub: {
        fontSize: 14,
        fontWeight: '500',
        marginBottom: 28,
    },
    modalActions: {
        width: '100%',
        gap: 12,
    },
    modalPrimaryBtn: {
        backgroundColor: '#6C63FF',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#6C63FF',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 6,
    },
    modalPrimaryText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '800',
    },
    modalSecondaryBtn: {
        paddingVertical: 14,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 2,
    },
    modalSecondaryText: {
        fontSize: 15,
        fontWeight: '700',
    },
    floatingNavBtn: {
        position: 'absolute',
        zIndex: 100,
        padding: 10,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
});
