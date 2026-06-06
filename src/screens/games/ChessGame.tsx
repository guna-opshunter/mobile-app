import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, Alert, useWindowDimensions, Modal, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import GameMenuModal from '../../components/GameMenuModal';
import { LinearGradient } from 'expo-linear-gradient';
import { useRecords } from '../../context/RecordsContext';
import AdBanner from '../../components/AdBanner';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { getInterstitialAdUnitId } from '../../utils/adConfig';
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
    const { addGameRecord } = useRecords();

    // Interstitial Ad setup
    const {
        isLoaded: isInterstitialLoaded,
        isClosed: isInterstitialClosed,
        load: loadInterstitial,
        show: showInterstitial
    } = useInterstitialAd(getInterstitialAdUnitId(), {
        requestNonPersonalizedAdsOnly: true,
    });

    // Load ad on mount
    useEffect(() => {
        loadInterstitial();
    }, [loadInterstitial]);

    // Reload ad when closed
    useEffect(() => {
        if (isInterstitialClosed) {
            loadInterstitial();
        }
    }, [isInterstitialClosed]);
    
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
    const [inCheck, setInCheck] = useState<'w' | 'b' | null>(null);
    const [menuVisible, setMenuVisible] = useState(false);

    useEffect(() => {
        if (gameStatus.includes('Wins')) {
            const winnerName = gameStatus.includes('White') ? 'White' : 'Black';
            addGameRecord({
                game: 'chess',
                winner: winnerName,
                winnerColor: winnerName === 'White' ? '#D1D5DB' : '#374151',
                gameMode: 'passplay',
                isHumanWinner: true,
                details: `King captured by ${winnerName}`
            });
        }
    }, [gameStatus]);

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

    const isPathClear = (boardState: (string | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
        const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
        const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;

        let row = fromRow + rowStep;
        let col = fromCol + colStep;

        while (row !== toRow || col !== toCol) {
            if (boardState[row][col]) return false;
            row += rowStep;
            col += colStep;
        }
        return true;
    };

    const isPseudoLegalMove = (boardState: (string | null)[][], fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
        const piece = boardState[fromRow][fromCol];
        if (!piece) return false;

        const pieceType = piece[1];
        const pieceColor = piece[0];
        const targetPiece = boardState[toRow][toCol];

        if (targetPiece && targetPiece[0] === pieceColor) return false;

        const rowDiff = toRow - fromRow;
        const colDiff = toCol - fromCol;
        const absRowDiff = Math.abs(rowDiff);
        const absColDiff = Math.abs(colDiff);

        switch (pieceType) {
            case 'P':
                const direction = pieceColor === 'w' ? -1 : 1;
                const startRow = pieceColor === 'w' ? 6 : 1;

                if (colDiff === 0 && !targetPiece) {
                    if (rowDiff === direction) return true;
                    if (fromRow === startRow && rowDiff === 2 * direction && !boardState[fromRow + direction][fromCol]) return true;
                }
                if (absColDiff === 1 && rowDiff === direction && targetPiece) return true;
                return false;

            case 'R':
                if (rowDiff !== 0 && colDiff !== 0) return false;
                return isPathClear(boardState, fromRow, fromCol, toRow, toCol);

            case 'N':
                return (absRowDiff === 2 && absColDiff === 1) || (absRowDiff === 1 && absColDiff === 2);

            case 'B':
                if (absRowDiff !== absColDiff) return false;
                return isPathClear(boardState, fromRow, fromCol, toRow, toCol);

            case 'Q':
                if (rowDiff !== 0 && colDiff !== 0 && absRowDiff !== absColDiff) return false;
                return isPathClear(boardState, fromRow, fromCol, toRow, toCol);

            case 'K':
                return absRowDiff <= 1 && absColDiff <= 1;

            default:
                return false;
        }
    };

    const isKingInCheck = (boardState: (string | null)[][], color: 'w' | 'b'): boolean => {
        let kingRow = -1, kingCol = -1;
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c] === `${color}K`) {
                    kingRow = r; kingCol = c; break;
                }
            }
            if (kingRow !== -1) break;
        }
        if (kingRow === -1) return false;

        const oppColor = color === 'w' ? 'b' : 'w';
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c]?.startsWith(oppColor)) {
                    if (isPseudoLegalMove(boardState, r, c, kingRow, kingCol)) return true;
                }
            }
        }
        return false;
    };

    const getValidMoves = (boardState: (string | null)[][], row: number, col: number): [number, number][] => {
        const piece = boardState[row][col];
        if (!piece) return [];
        const color = piece[0] as 'w' | 'b';
        const moves: [number, number][] = [];
        
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (isPseudoLegalMove(boardState, row, col, r, c)) {
                    const cloned = boardState.map(rowArr => [...rowArr]);
                    cloned[r][c] = cloned[row][col];
                    cloned[row][col] = null;
                    if (!isKingInCheck(cloned, color)) {
                        moves.push([r, c]);
                    }
                }
            }
        }
        return moves;
    };

    const hasAnyValidMove = (boardState: (string | null)[][], color: 'w' | 'b'): boolean => {
        for (let r = 0; r < 8; r++) {
            for (let c = 0; c < 8; c++) {
                if (boardState[r][c]?.startsWith(color)) {
                    if (getValidMoves(boardState, r, c).length > 0) return true;
                }
            }
        }
        return false;
    };

    const handleSquarePress = (row: number, col: number) => {
        if (gameStatus && (gameStatus.includes('Wins') || gameStatus.includes('Draw'))) return;
        const piece = board[row][col];

        if (selectedSquare) {
            const [fromRow, fromCol] = selectedSquare;
            const valid = validMoves.some(([r, c]) => r === row && c === col);

            if (valid) {
                const newBoard = board.map(r => [...r]);
                const movingPiece = newBoard[fromRow][fromCol];
                const capturedPiece = newBoard[row][col];

                if (capturedPiece) {
                    if (capturedPiece[0] === 'w') {
                        setCapturedWhite([...capturedWhite, capturedPiece]);
                    } else {
                        setCapturedBlack([...capturedBlack, capturedPiece]);
                    }
                    if (capturedPiece[1] === 'K') {
                        setGameStatus(`${currentPlayer === 'w' ? 'White' : 'Black'} Wins!`);
                    }
                }

                newBoard[row][col] = newBoard[fromRow][fromCol];
                newBoard[fromRow][fromCol] = null;

                if (movingPiece && movingPiece[1] === 'P') {
                    if ((movingPiece[0] === 'w' && row === 0) || (movingPiece[0] === 'b' && row === 7)) {
                        newBoard[row][col] = movingPiece[0] + 'Q';
                    }
                }
                
                setBoard(newBoard);
                
                // Switch turn and check for mate/check
                const nextPlayer = currentPlayer === 'w' ? 'b' : 'w';
                setCurrentPlayer(nextPlayer);
                
                const nextPlayerInCheck = isKingInCheck(newBoard, nextPlayer);
                const nextPlayerHasMoves = hasAnyValidMove(newBoard, nextPlayer);

                if (nextPlayerInCheck) {
                    setInCheck(nextPlayer);
                    if (!nextPlayerHasMoves) {
                        setGameStatus(`${currentPlayer === 'w' ? 'White' : 'Black'} Wins by Checkmate!`);
                    }
                } else {
                    setInCheck(null);
                    if (!nextPlayerHasMoves) {
                        setGameStatus("Stalemate! It's a Draw.");
                    }
                }
            }

            setSelectedSquare(null);
            setValidMoves([]);
        } else if (piece && piece[0] === currentPlayer) {
            setSelectedSquare([row, col]);
            setValidMoves(getValidMoves(board, row, col));
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
        setInCheck(null);
    };

    const resetGameWithAd = () => {
        if (isInterstitialLoaded) {
            showInterstitial();
        }
        resetGame();
    };

    const quitWithAd = () => {
        if (isInterstitialLoaded) {
            showInterstitial();
        }
        navigation.goBack();
    };

    const isValidMoveSquare = (row: number, col: number) => {
        return validMoves.some(([r, c]) => r === row && c === col);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: pureWhite }]} edges={['top', 'bottom']}>
            {/* Navigation and Reset Floating Menus */}
            <TouchableOpacity 
                style={[styles.floatingNavBtn, { left: 20, top: 40, backgroundColor: isDarkMode ? 'rgba(50,50,50,0.8)' : 'rgba(255,255,255,0.8)' }]} 
                onPress={() => setMenuVisible(true)}
            >
                <Text style={{ fontSize: 14, fontWeight: '700', color: textColor, paddingHorizontal: 8 }}>Menu</Text>
            </TouchableOpacity>



            {/* Split Screen Background Effect */}
            
            {/* Top Half (Black's Side) */}
            <Animated.View style={[StyleSheet.absoluteFill, { bottom: '50%', overflow: 'hidden', backgroundColor: inCheck === 'b' ? 'rgba(239, 68, 68, 0.15)' : pureWhite }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: turnAnim }]}>
                    <LinearGradient
                        colors={[inCheck === 'b' ? 'rgba(239, 68, 68, 0.5)' : darkEdge, inCheck === 'b' ? 'rgba(239, 68, 68, 0.05)' : pureWhite]}
                        locations={[0, 0.9]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </Animated.View>

            {/* Bottom Half (White's Side) */}
            <Animated.View style={[StyleSheet.absoluteFill, { top: '50%', overflow: 'hidden', backgroundColor: inCheck === 'w' ? 'rgba(239, 68, 68, 0.15)' : pureWhite }]}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: whiteTurnOpacity }]}>
                    <LinearGradient
                        colors={[inCheck === 'w' ? 'rgba(239, 68, 68, 0.5)' : darkEdge, inCheck === 'w' ? 'rgba(239, 68, 68, 0.05)' : pureWhite]}
                        locations={[0, 0.9]}
                        start={{ x: 0, y: 1 }}
                        end={{ x: 0, y: 0 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
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
                    {inCheck === 'b' && !gameStatus && (
                        <View style={[styles.checkWarning, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                            <Text style={styles.checkText}>⚠️ CHECK</Text>
                        </View>
                    )}
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
                                const isKingInCheckSquare = piece === `${inCheck}K`;

                                // Modern board colors
                                const lightSquare = isDarkMode ? '#6B7280' : '#E5E7EB';
                                const darkSquare = isDarkMode ? '#374151' : '#9CA3AF';
                                const selectedColor = 'rgba(234, 186, 68, 0.7)';
                                const checkColor = 'rgba(239, 68, 68, 0.8)';

                                return (
                                    <TouchableOpacity
                                        key={colIndex}
                                        style={[
                                            styles.square,
                                            {
                                                width: squareSize,
                                                height: squareSize,
                                                backgroundColor: isKingInCheckSquare ? checkColor : (isSelected ? selectedColor : (isLight ? lightSquare : darkSquare)),
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

            <View style={[styles.playerZone, { backgroundColor: 'transparent', overflow: 'hidden' }]}>
                {inCheck === 'w' && !gameStatus && (
                    <View style={[styles.checkWarning, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
                        <Text style={styles.checkText}>⚠️ CHECK</Text>
                    </View>
                )}
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
                visible={gameStatus !== ''}
                transparent
                animationType="fade"
                onRequestClose={() => {}}
            >
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
                        <Text style={styles.modalEmoji}>{gameStatus.includes('Draw') ? '🤝' : '🏆'}</Text>
                        <Text style={[styles.modalTitle, { color: textColor }]}>{gameStatus}</Text>
                        <Text style={[styles.modalSub, { color: isDarkMode ? '#999' : '#666' }]}>
                            {gameStatus.includes('Checkmate') ? 'The king is trapped!' : (gameStatus.includes('Draw') ? 'No valid moves available.' : 'Game finished')}
                        </Text>
                        <View style={styles.modalActions}>
                            <TouchableOpacity style={styles.modalPrimaryBtn} onPress={resetGameWithAd}>
                                <Text style={styles.modalPrimaryText}>Play Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.modalSecondaryBtn, { borderColor: isDarkMode ? '#444' : '#ddd' }]} onPress={quitWithAd}>
                                <Text style={[styles.modalSecondaryText, { color: textColor }]}>Go Back</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>

            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onSaveAndQuit={quitWithAd} 
                onQuit={quitWithAd} 
            />

        <AdBanner />
        </ScrollView>
    </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingHorizontal: 20,
        paddingTop: 8,
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
    checkWarning: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
        marginBottom: 8,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(239, 68, 68, 0.5)',
    },
    checkText: {
        color: '#EF4444',
        fontSize: 12,
        fontWeight: '900',
        letterSpacing: 1,
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
