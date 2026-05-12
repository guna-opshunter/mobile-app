import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ScrollView, Animated, Share } from 'react-native';
import { useTheme } from '../../theme';
import { useRecords } from '../../context/RecordsContext';
import { useAchievements } from '../../context/AchievementsContext';

const { width, height } = Dimensions.get('window');
const BOARD_SIZE = Math.min(width - 24, height * 0.48); // ~70% feel, fits with dice panels
const CELL_SIZE = BOARD_SIZE / 15;

// Traditional Indian Ludo: 0=Red(bottom-left), 1=Green(top-left), 2=Yellow(top-right), 3=Blue(bottom-right)
const COLORS = ['#EF4444', '#22C55E', '#EAB308', '#3B82F6'];
const COLOR_NAMES = ['Red', 'Green', 'Yellow', 'Blue'];
const COLOR_BG = ['#FEE2E2', '#DCFCE7', '#FEF9C3', '#DBEAFE'];
const COLOR_LIGHT = ['#FECACA', '#BBF7D0', '#FEF08A', '#BFDBFE'];
const COLOR_DARK = ['#DC2626', '#16A34A', '#CA8A04', '#2563EB'];

// Common path: 52 cells around the board (counter-clockwise, traditional Indian Ludo)
// Starting from Red's entry (bottom-left area)
const COMMON_PATH: [number, number][] = [
    // Red start zone (Left arm top row) → going RIGHT
    [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
    // Top arm left col → UP
    [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
    // Top edge → RIGHT
    [0, 7], [0, 8],
    // Top arm right col (Green start) → DOWN
    [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
    // Right arm top row → RIGHT
    [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
    // Right edge → DOWN
    [7, 14], [8, 14],
    // Right arm bottom row (Yellow start) → LEFT
    [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
    // Bottom arm right col → DOWN
    [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
    // Bottom edge → LEFT
    [14, 7], [14, 6],
    // Bottom arm left col (Blue start) → UP
    [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
    // Left arm bottom row → LEFT
    [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
    // Left edge → UP
    [7, 0], [6, 0],
];

// Player start indices on COMMON_PATH:
// Red=0 (bottom-left), Green=13 (top-left), Yellow=26 (top-right), Blue=39 (bottom-right)
const PLAYER_START_INDEX = [0, 13, 26, 39];

// Home lanes (5 cells each, leading to center)
const HOME_LANES: [number, number][][] = [
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],       // Red (from left)
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],       // Green (from top)
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],   // Yellow (from right)
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],   // Blue (from bottom)
];

// Build full path for each player (positions 0-55 = board cells, 56 = finished/home)
function buildPlayerPath(playerIndex: number): [number, number][] {
    const startIdx = PLAYER_START_INDEX[playerIndex];
    const path: [number, number][] = [];
    // 51 cells on common path (full loop minus the entry back to start)
    for (let i = 0; i < 51; i++) {
        path.push(COMMON_PATH[(startIdx + i) % 52]);
    }
    // 5 home lane cells
    for (let i = 0; i < 5; i++) {
        path.push(HOME_LANES[playerIndex][i]);
    }
    return path; // 56 entries: indices 0-55 are board cells, position 56 = finished
}

const PLAYER_PATHS = [0, 1, 2, 3].map(i => buildPlayerPath(i));

function getTokenBoardPosition(playerIndex: number, position: number): [number, number] | null {
    if (position < 0 || position >= 56) return null; // -1 = home base, 56 = finished
    return PLAYER_PATHS[playerIndex][position];
}

type GameMode = 'setup' | 'playing';
type PlayMode = 'passplay' | 'computer';
type Difficulty = 'easy' | 'medium' | 'hard';

interface Token {
    position: number;
    color: number;
}

interface PlayerConfig {
    isComputer: boolean;
    active: boolean;
}

export default function LudoGame({ navigation, route }: any) {
    const { isDarkMode } = useTheme();
    const { addGameRecord, saveLudoGame, deleteSavedGame } = useRecords();
    const { checkAndUnlock, incrementStat } = useAchievements();

    // Check if we're restoring a saved game
    const savedGame = route?.params?.savedGame;

    const [gameMode, setGameMode] = useState<GameMode>('setup');
    const [playMode, setPlayMode] = useState<PlayMode>('passplay');
    const [playerCount, setPlayerCount] = useState(2);
    const [difficulty, setDifficulty] = useState<Difficulty>('medium');
    const [players, setPlayers] = useState<PlayerConfig[]>([
        { isComputer: false, active: true },
        { isComputer: true, active: true },
        { isComputer: true, active: false },
        { isComputer: true, active: false },
    ]);

    const [currentPlayer, setCurrentPlayer] = useState(0);
    const [diceValue, setDiceValue] = useState<number | null>(null);
    const [tokens, setTokens] = useState<Token[][]>([
        [{ position: -1, color: 0 }, { position: -1, color: 0 }, { position: -1, color: 0 }, { position: -1, color: 0 }],
        [{ position: -1, color: 1 }, { position: -1, color: 1 }, { position: -1, color: 1 }, { position: -1, color: 1 }],
        [{ position: -1, color: 2 }, { position: -1, color: 2 }, { position: -1, color: 2 }, { position: -1, color: 2 }],
        [{ position: -1, color: 3 }, { position: -1, color: 3 }, { position: -1, color: 3 }, { position: -1, color: 3 }],
    ]);
    const [isRolling, setIsRolling] = useState(false);
    const [hasRolled, setHasRolled] = useState(false);
    const [winner, setWinner] = useState<number | null>(null);
    const [isComputerTurn, setIsComputerTurn] = useState(false);
    const [gameSaved, setGameSaved] = useState(false);
    const [movableTokens, setMovableTokens] = useState<{ player: number, token: number }[]>([]);
    const [message, setMessage] = useState<string | null>(null);
    const [consecutive6s, setConsecutive6s] = useState(0);
    const lastMovedTokenRef = useRef<{ player: number; token: number; prevPos: number } | null>(null);
    const tokensRef = useRef(tokens);
    useEffect(() => { tokensRef.current = tokens; }, [tokens]);

    const diceRotation = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const diceScale = useRef(new Animated.Value(1)).current;

    // Animated positions for each token on the board (4 players x 4 tokens)
    const tokenAnims = useRef<Animated.ValueXY[][]>(
        Array.from({ length: 4 }, () =>
            Array.from({ length: 4 }, () => new Animated.ValueXY({ x: 0, y: 0 }))
        )
    ).current;
    const tokenScaleAnims = useRef<Animated.Value[][]>(
        Array.from({ length: 4 }, () =>
            Array.from({ length: 4 }, () => new Animated.Value(1))
        )
    ).current;
    const prevTokenPositions = useRef<number[][]>(
        Array.from({ length: 4 }, () => [-1, -1, -1, -1])
    );
    const tokenInitialized = useRef<boolean[][]>(
        Array.from({ length: 4 }, () => [false, false, false, false])
    );

    // Dice position animation (slides between side and bottom)
    const dicePositionAnim = useRef(new Animated.Value(0)).current; // 0 = bottom, 1 = right side

    const textColor = isDarkMode ? '#F8FAFC' : '#0F172A';
    const subtitleColor = isDarkMode ? '#94A3B8' : '#64748B';
    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const containerBg = isDarkMode ? '#0F172A' : '#F1F5F9';
    const surfaceBg = isDarkMode ? '#334155' : '#E2E8F0';

    // Determine if dice should be on top (Green=1, Yellow=2) or bottom (Red=0, Blue=3)
    const isDiceTop = currentPlayer === 1 || currentPlayer === 2;

    useEffect(() => {
        Animated.spring(dicePositionAnim, {
            toValue: isDiceTop ? 1 : 0,
            friction: 8,
            tension: 80,
            useNativeDriver: false,
        }).start();
    }, [currentPlayer]);

    // Background Gradients Opacities
    const bgOpacities = useRef([
        new Animated.Value(currentPlayer === 0 ? 1 : 0),
        new Animated.Value(currentPlayer === 1 ? 1 : 0),
        new Animated.Value(currentPlayer === 2 ? 1 : 0),
        new Animated.Value(currentPlayer === 3 ? 1 : 0),
    ]).current;

    useEffect(() => {
        bgOpacities.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: currentPlayer === index ? 1 : 0,
                duration: 600,
                useNativeDriver: false,
            }).start();
        });
    }, [currentPlayer]);

    useEffect(() => {
        const newPlayers: PlayerConfig[] = [];
        for (let i = 0; i < 4; i++) {
            if (i < playerCount) {
                if (playMode === 'passplay') {
                    newPlayers.push({ isComputer: false, active: true });
                } else {
                    newPlayers.push({ isComputer: i > 0, active: true });
                }
            } else {
                newPlayers.push({ isComputer: true, active: false });
            }
        }
        setPlayers(newPlayers);
    }, [playMode, playerCount]);

    // Restore saved game if navigated with savedGame param
    useEffect(() => {
        if (savedGame) {
            setTokens(savedGame.tokens);
            setCurrentPlayer(savedGame.currentPlayer);
            setPlayers(savedGame.players);
            setPlayMode(savedGame.playMode);
            setDifficulty(savedGame.difficulty);
            setPlayerCount(savedGame.playerCount);
            setGameMode('playing');
            setHasRolled(false);
            setDiceValue(null);
            setWinner(null);
            setMovableTokens([]);
            setMessage('Game restored! Tap dice to roll');
            // Delete the saved game since it's been loaded
            if (savedGame.id) {
                deleteSavedGame(savedGame.id);
            }
        }
    }, []);

    // Counter-clockwise turn order (traditional): Red(0) → Green(1) → Yellow(2) → Blue(3)
    const TURN_ORDER = [0, 1, 2, 3];

    const getNextActivePlayer = useCallback((current: number) => {
        const currentIdx = TURN_ORDER.indexOf(current);
        let nextIdx = (currentIdx + 1) % 4;
        let attempts = 0;
        while (!players[TURN_ORDER[nextIdx]].active && attempts < 4) {
            nextIdx = (nextIdx + 1) % 4;
            attempts++;
        }
        return TURN_ORDER[nextIdx];
    }, [players]);

    const getComputerMove = useCallback((playerIndex: number, dice: number): number | null => {
        const playerTokens = tokens[playerIndex];
        const validMoves: { tokenIndex: number; score: number }[] = [];

        playerTokens.forEach((token, index) => {
            if (token.position === -1 && dice === 6) {
                let score = 50;
                if (difficulty === 'hard') score += 20;
                validMoves.push({ tokenIndex: index, score });
            } else if (token.position >= 0 && token.position < 57) {
                const newPos = token.position + dice;
                if (newPos <= 56) {
                    let score = 10;
                    if (newPos === 56) score += 100;
                    if (difficulty !== 'easy') score += token.position;
                    if (difficulty === 'hard') score += newPos * 2;
                    if (difficulty === 'easy') score += Math.random() * 30;
                    validMoves.push({ tokenIndex: index, score });
                }
            }
        });

        if (validMoves.length === 0) return null;
        validMoves.sort((a, b) => b.score - a.score);
        if (difficulty === 'easy') {
            return validMoves[Math.floor(Math.random() * validMoves.length)].tokenIndex;
        }
        return validMoves[0].tokenIndex;
    }, [tokens, difficulty]);

    useEffect(() => {
        if (gameMode !== 'playing' || winner !== null) return;
        const currentPlayerConfig = players[currentPlayer];
        if (!currentPlayerConfig?.isComputer || !currentPlayerConfig?.active) return;

        setIsComputerTurn(true);

        if (!hasRolled) {
            const delay = difficulty === 'easy' ? 1500 : difficulty === 'medium' ? 1000 : 600;
            const timer = setTimeout(() => rollDice(), delay);
            return () => clearTimeout(timer);
        }

        if (hasRolled && diceValue !== null) {
            const delay = difficulty === 'easy' ? 1200 : difficulty === 'medium' ? 800 : 400;
            const timer = setTimeout(() => {
                const moveIndex = getComputerMove(currentPlayer, diceValue);
                if (moveIndex !== null) {
                    moveToken(currentPlayer, moveIndex);
                } else {
                    nextTurn();
                }
            }, delay);
            return () => clearTimeout(timer);
        }
    }, [gameMode, currentPlayer, hasRolled, diceValue, winner, players, getComputerMove, difficulty]);

    useEffect(() => {
        if (movableTokens.length > 0) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, { toValue: 1.15, duration: 400, useNativeDriver: true }),
                    Animated.timing(pulseAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
                ])
            ).start();
        } else {
            pulseAnim.setValue(1);
        }
    }, [movableTokens, pulseAnim]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(null), 2000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const getMovableTokens = useCallback((playerIndex: number, dice: number) => {
        const playerTokens = tokens[playerIndex];
        const movable: { player: number, token: number }[] = [];

        playerTokens.forEach((token, index) => {
            if (token.position === -1 && dice === 6) {
                movable.push({ player: playerIndex, token: index });
            } else if (token.position >= 0 && token.position < 57 && token.position + dice <= 56) {
                movable.push({ player: playerIndex, token: index });
            }
        });

        return movable;
    }, [tokens]);

    const rollDice = () => {
        if (hasRolled || isRolling) return;

        setIsRolling(true);
        setMessage(null);

        Animated.sequence([
            Animated.timing(diceScale, { toValue: 0.9, duration: 60, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1.05, duration: 60, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1, duration: 60, useNativeDriver: true }),
        ]).start();

        Animated.loop(
            Animated.timing(diceRotation, { toValue: 1, duration: 80, useNativeDriver: true }),
            { iterations: 12 }
        ).start();

        let rolls = 0;
        const interval = setInterval(() => {
            setDiceValue(Math.floor(Math.random() * 6) + 1);
            rolls++;
            if (rolls > 14) {
                clearInterval(interval);
                const finalValue = Math.floor(Math.random() * 6) + 1;
                setDiceValue(finalValue);
                setIsRolling(false);
                setHasRolled(true);
                diceRotation.setValue(0);

                // Three consecutive 6s rule: forfeit turn
                if (finalValue === 6) {
                    const newCount = consecutive6s + 1;
                    setConsecutive6s(newCount);
                    if (newCount >= 3) {
                        setMessage('🚫 Three 6s! Turn forfeited');
                        // Send back the last moved token (if any was moved this turn sequence)
                        if (lastMovedTokenRef.current && lastMovedTokenRef.current.player === currentPlayer) {
                            const { player, token, prevPos } = lastMovedTokenRef.current;
                            const revertTokens = [...tokens.map(p => [...p.map(t => ({ ...t }))])];
                            revertTokens[player][token].position = prevPos;
                            setTokens(revertTokens);
                            setMessage('🚫 Three 6s! Last move reverted');
                        }
                        setConsecutive6s(0);
                        lastMovedTokenRef.current = null;
                        setTimeout(() => nextTurn(), 1200);
                        return;
                    }
                } else {
                    setConsecutive6s(0);
                }

                if (!players[currentPlayer].isComputer) {
                    const movable = getMovableTokens(currentPlayer, finalValue);
                    setMovableTokens(movable);

                    if (movable.length === 0) {
                        setTimeout(() => nextTurn(), 800);
                    } else if (movable.length === 1) {
                        // Auto-move: only 1 token can move (Ludo King style)
                        setTimeout(() => moveToken(movable[0].player, movable[0].token, true, finalValue), 400);
                    } else if (finalValue === 6) {
                        // Ludo King style: if all movable tokens are at home, auto-deploy one
                        const latestTokens = tokensRef.current[currentPlayer];
                        const allMovableAreHome = movable.every(m => latestTokens[m.token].position === -1);
                        if (allMovableAreHome) {
                            const homeToken = movable[0];
                            setTimeout(() => moveToken(homeToken.player, homeToken.token, true, finalValue), 400);
                        }
                        // Otherwise: tokens on board + home tokens — let user choose
                    }
                }
            }
        }, 60);
    };

    const moveToken = (playerIndex: number, tokenIndex: number, autoMove: boolean = false, explicitDice: number | null = null) => {
        const dValue = autoMove && explicitDice !== null ? explicitDice : diceValue;
        if ((!hasRolled && !autoMove) || playerIndex !== currentPlayer || dValue === null) return;
        if (players[currentPlayer].isComputer && !isComputerTurn) return;

        const token = tokens[playerIndex][tokenIndex];

        if (!players[currentPlayer].isComputer && !autoMove) {
            const isMovable = movableTokens.some(t => t.player === playerIndex && t.token === tokenIndex);
            if (!isMovable) {
                if (token.position === -1 && dValue !== 6) {
                    setMessage('Need 6 to start');
                } else {
                    setMessage('Can\'t move');
                }
                return;
            }
        }

        if (token.position === -1) {
            if (dValue !== 6) return;
            const newTokens = [...tokens.map(p => [...p.map(t => ({ ...t }))])];
            newTokens[playerIndex][tokenIndex].position = 0;

            // Save for three-6s revert
            lastMovedTokenRef.current = { player: playerIndex, token: tokenIndex, prevPos: -1 };

            setTokens(newTokens);
            setMessage('🏠 Token out!');

            // Bonus turn: rolled a 6 (always the case here) + possible capture
            setMovableTokens([]);
            setHasRolled(false);
            setDiceValue(null);
            return;
        } else if (token.position >= 0 && token.position < 57) {
            const newPosition = token.position + dValue;
            if (newPosition > 56) return;
            const newTokens = [...tokens.map(p => [...p.map(t => ({ ...t }))])];
            newTokens[playerIndex][tokenIndex].position = newPosition;

            // Save for three-6s revert
            lastMovedTokenRef.current = { player: playerIndex, token: tokenIndex, prevPos: token.position };

            // Capture logic: check if an opponent is on the same cell (common path only, not home lane)
            let captured = false;
            if (newPosition < 51) { // Only on common path, not home lane (51-55)
                const landedCoords = getTokenBoardPosition(playerIndex, newPosition);
                if (landedCoords) {
                    // Safe spots where capture is not allowed (4 star cells)
                    const safeCells: [number, number][] = [
                        [8, 2], [2, 6], [6, 12], [12, 8]
                    ];
                    // Also each player's start cell is safe
                    const startCells: [number, number][] = [[6, 1], [1, 8], [8, 13], [13, 6]];
                    const allSafe = [...safeCells, ...startCells];
                    const isOnSafe = allSafe.some(s => s[0] === landedCoords[0] && s[1] === landedCoords[1]);

                    if (!isOnSafe) {
                        // Check all other players' tokens
                        for (let op = 0; op < 4; op++) {
                            if (op === playerIndex || !players[op].active) continue;
                            for (let ot = 0; ot < 4; ot++) {
                                const opToken = newTokens[op][ot];
                                if (opToken.position < 0 || opToken.position >= 51) continue; // skip home/home lane
                                const opCoords = getTokenBoardPosition(op, opToken.position);
                                if (opCoords && opCoords[0] === landedCoords[0] && opCoords[1] === landedCoords[1]) {
                                    // Capture! Send opponent home
                                    newTokens[op][ot].position = -1;
                                    captured = true;
                                    setMessage(`💥 ${COLOR_NAMES[playerIndex]} captured ${COLOR_NAMES[op]}!`);
                                    // Achievement tracking
                                    checkAndUnlock('ludo_capture');
                                    checkAndUnlock('ludo_captures10');
                                    incrementStat('totalCaptures');
                                }
                            }
                        }
                    }
                }
            }

            setTokens(newTokens);

            // Check if player won (all tokens home)
            if (newTokens[playerIndex].every(t => t.position === 56)) {
                setWinner(playerIndex);
                setIsComputerTurn(false);
                setMovableTokens([]);
                // Achievement tracking
                incrementStat('totalLudoGames');
                checkAndUnlock('ludo_first');
                const isHuman = !players[playerIndex].isComputer;
                if (isHuman) {
                    incrementStat('totalLudoWins');
                    checkAndUnlock('ludo_win');
                    checkAndUnlock('ludo_5wins');
                }
                return;
            }

            // Bonus roll: capture, rolling 6, or reaching home (position 56)
            const reachedHome = newPosition === 56;
            if (captured || dValue === 6 || reachedHome) {
                if (reachedHome && !captured && dValue !== 6) {
                    setMessage('🏠 Home! Bonus roll!');
                } else if (captured) {
                    setMessage('💥 Captured! Bonus roll!');
                } else {
                    setMessage('🎲 Rolled 6! Roll again!');
                }
                setMovableTokens([]);
                setHasRolled(false);
                setDiceValue(null);
                return;
            }
        }

        setMovableTokens([]);
        setConsecutive6s(0);
        lastMovedTokenRef.current = null;
        setTimeout(() => nextTurn(), 500);
    };

    const nextTurn = () => {
        setIsComputerTurn(false);
        setMovableTokens([]);
        setMessage(null);
        setConsecutive6s(0);
        lastMovedTokenRef.current = null;
        const next = getNextActivePlayer(currentPlayer);
        setCurrentPlayer(next);
        setHasRolled(false);
        setDiceValue(null);
    };

    const startGame = () => {
        setTokens([
            [{ position: -1, color: 0 }, { position: -1, color: 0 }, { position: -1, color: 0 }, { position: -1, color: 0 }],
            [{ position: -1, color: 1 }, { position: -1, color: 1 }, { position: -1, color: 1 }, { position: -1, color: 1 }],
            [{ position: -1, color: 2 }, { position: -1, color: 2 }, { position: -1, color: 2 }, { position: -1, color: 2 }],
            [{ position: -1, color: 3 }, { position: -1, color: 3 }, { position: -1, color: 3 }, { position: -1, color: 3 }],
        ]);
        setCurrentPlayer(0);
        setDiceValue(null);
        setHasRolled(false);
        setWinner(null);
        setIsComputerTurn(false);
        setGameSaved(false);
        setMovableTokens([]);
        setMessage('Tap dice to roll');
        setGameMode('playing');
    };

    const resetGame = () => {
        setGameMode('setup');
        setWinner(null);
        setIsComputerTurn(false);
        setGameSaved(false);
        setMovableTokens([]);
        setMessage(null);
    };

    const saveGameResult = () => {
        if (winner === null) return;

        Alert.alert(
            'Save Result',
            'Save this game to records?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Save',
                    onPress: () => {
                        const isHumanWinner = !players[winner].isComputer;
                        addGameRecord({
                            game: 'ludo',
                            winner: COLOR_NAMES[winner],
                            winnerColor: COLORS[winner],
                            isHumanWinner,
                            playerCount,
                            gameMode: playMode,
                            difficulty: playMode === 'computer' ? difficulty : undefined,
                        });
                        setGameSaved(true);
                        Alert.alert('✓ Saved', 'Game recorded.');
                    },
                },
            ]
        );
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
            <View style={styles.dice}>
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
            </View>
        );
    };

    // Simple Circle Token
    const renderToken = (playerIndex: number, tokenIndex: number, isMovable: boolean, isInHome: boolean = true) => {
        const token = tokens[playerIndex][tokenIndex];
        const canInteract = !players[currentPlayer]?.isComputer && currentPlayer === playerIndex && hasRolled;
        const tokenColor = COLORS[playerIndex];
        const tokenDark = COLOR_DARK[playerIndex];

        return (
            <Animated.View
                key={tokenIndex}
                style={[
                    styles.tokenContainer,
                    isMovable && { transform: [{ scale: pulseAnim }] },
                ]}
            >
                <TouchableOpacity
                    onPress={() => moveToken(playerIndex, tokenIndex)}
                    disabled={!canInteract}
                    activeOpacity={0.8}
                >
                    {/* Circular token */}
                    <View style={[styles.tokenCircle, { backgroundColor: tokenColor, borderColor: tokenDark }]}>
                        <View style={styles.tokenShine} />
                    </View>

                    {/* Glow effect for movable tokens */}
                    {isMovable && (
                        <View style={[styles.tokenGlow, { borderColor: '#FFD700', shadowColor: '#FFD700' }]} />
                    )}
                </TouchableOpacity>
            </Animated.View>
        );
    };

    // Home base with 4 token slots
    const renderHomeBase = (playerIndex: number) => {
        if (!players[playerIndex].active) return null;

        const baseColor = COLORS[playerIndex];
        const bgColor = COLOR_BG[playerIndex];

        const homeTokens = tokens[playerIndex].filter(t => t.position === -1);
        const homeTokenIndices = tokens[playerIndex]
            .map((t, i) => t.position === -1 ? i : -1)
            .filter(i => i !== -1);

        return (
            <View style={[styles.homeBase, { backgroundColor: baseColor }]}>
                <View style={styles.homeInner}>
                    <View style={styles.homeTokenGrid}>
                        {[0, 1, 2, 3].map((slotIndex) => {
                            const tokenIdx = tokens[playerIndex].findIndex((t, i) =>
                                t.position === -1 &&
                                tokens[playerIndex].slice(0, i).filter(tt => tt.position === -1).length === slotIndex
                            );
                            const actualTokenIndex = homeTokenIndices[slotIndex];
                            const hasToken = actualTokenIndex !== undefined;
                            const isMovable = hasToken && movableTokens.some(
                                t => t.player === playerIndex && t.token === actualTokenIndex
                            );

                            return (
                                <View key={slotIndex} style={styles.homeSlot}>
                                    {hasToken ? (
                                        renderToken(playerIndex, actualTokenIndex, isMovable, true)
                                    ) : (
                                        <View style={[styles.emptySlot, { backgroundColor: bgColor }]} />
                                    )}
                                </View>
                            );
                        })}
                    </View>
                </View>
            </View>
        );
    };

    // Board cell
    const renderCell = (row: number, col: number) => {
        const isCenter = row >= 6 && row <= 8 && col >= 6 && col <= 8;
        if (isCenter) return null;

        const isCorner = (row < 6 && col < 6) || (row < 6 && col > 8) ||
            (row > 8 && col < 6) || (row > 8 && col > 8);
        if (isCorner) return null;

        // Determine cell color
        let cellColor = '#FFFFFF';
        let borderColor = '#CBD5E1';
        let isPath = true;

        // Red home lane (left middle — from bottom-left)
        if (col >= 1 && col <= 5 && row === 7) {
            cellColor = COLOR_LIGHT[0];
        }
        // Green home lane (top middle — from top-left)
        if (row >= 1 && row <= 5 && col === 7) {
            cellColor = COLOR_LIGHT[1];
        }
        // Yellow home lane (right middle — from top-right)
        if (col >= 9 && col <= 13 && row === 7) {
            cellColor = COLOR_LIGHT[2];
        }
        // Blue home lane (bottom middle — from bottom-right)
        if (row >= 9 && row <= 13 && col === 7) {
            cellColor = COLOR_LIGHT[3];
        }

        // Start positions (where tokens enter the board) — colored with player's color
        if (row === 6 && col === 1) cellColor = COLORS[0]; // Red start (left arm)
        if (row === 1 && col === 8) cellColor = COLORS[1]; // Green start (top arm)
        if (row === 8 && col === 13) cellColor = COLORS[2]; // Yellow start (right arm)
        if (row === 13 && col === 6) cellColor = COLORS[3]; // Blue start (bottom arm)

        // Safe star spots — colored with the respective player's color
        if (row === 8 && col === 2) cellColor = COLOR_LIGHT[0];  // Red's safe star
        if (row === 2 && col === 6) cellColor = COLOR_LIGHT[1];  // Green's safe star
        if (row === 6 && col === 12) cellColor = COLOR_LIGHT[2]; // Yellow's safe star
        if (row === 12 && col === 8) cellColor = COLOR_LIGHT[3]; // Blue's safe star

        // Safe spots (4 star cells + 4 start cells are safe)
        const safeSpots = [
            [8, 2], [2, 6], [6, 12], [12, 8],
            [6, 1], [1, 8], [8, 13], [13, 6]
        ];
        const isSafe = safeSpots.some(s => s[0] === row && s[1] === col);

        return (
            <View
                key={`${row}-${col}`}
                style={[
                    styles.cell,
                    {
                        backgroundColor: cellColor,
                        borderColor: borderColor,
                        top: row * CELL_SIZE,
                        left: col * CELL_SIZE,
                    }
                ]}
            >
                {isSafe && <Text style={styles.safeStar}>★</Text>}
            </View>
        );
    };

    // Center triangles
    const renderCenter = () => {
        return (
            <View style={styles.centerContainer}>
                {/* Red triangle (pointing right) */}
                <View style={[styles.centerTriangle, styles.triangleRed]} />
                {/* Blue triangle (pointing down) */}
                <View style={[styles.centerTriangle, styles.triangleBlue]} />
                {/* Green triangle (pointing up) */}
                <View style={[styles.centerTriangle, styles.triangleGreen]} />
                {/* Yellow triangle (pointing left) */}
                <View style={[styles.centerTriangle, styles.triangleYellow]} />
            </View>
        );
    };

    // Animate tokens when positions change
    useEffect(() => {
        tokens.forEach((playerTokens, pi) => {
            playerTokens.forEach((token, ti) => {
                const prevPos = prevTokenPositions.current[pi][ti];
                const curPos = token.position;

                if (prevPos === curPos && tokenInitialized.current[pi][ti]) return;

                if (curPos >= 0 && curPos < 56) {
                    const coords = getTokenBoardPosition(pi, curPos);
                    if (!coords) return;
                    const [row, col] = coords;
                    const targetX = col * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.85) / 2;
                    const targetY = row * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.85) / 2;

                    if (!tokenInitialized.current[pi][ti] || prevPos === -1) {
                        // Token just entered the board — pop in
                        tokenAnims[pi][ti].setValue({ x: targetX, y: targetY });
                        tokenScaleAnims[pi][ti].setValue(0);
                        Animated.spring(tokenScaleAnims[pi][ti], {
                            toValue: 1,
                            friction: 4,
                            tension: 200,
                            useNativeDriver: true,
                        }).start();
                    } else {
                        // Slide to new position
                        Animated.spring(tokenAnims[pi][ti], {
                            toValue: { x: targetX, y: targetY },
                            friction: 6,
                            tension: 120,
                            useNativeDriver: true,
                        }).start();
                        // Little bounce at arrival
                        Animated.sequence([
                            Animated.timing(tokenScaleAnims[pi][ti], {
                                toValue: 1.25,
                                duration: 100,
                                useNativeDriver: true,
                            }),
                            Animated.spring(tokenScaleAnims[pi][ti], {
                                toValue: 1,
                                friction: 3,
                                tension: 200,
                                useNativeDriver: true,
                            }),
                        ]).start();
                    }
                    tokenInitialized.current[pi][ti] = true;
                } else {
                    tokenInitialized.current[pi][ti] = false;
                }

                prevTokenPositions.current[pi][ti] = curPos;
            });
        });
    }, [tokens]);

    // Render tokens that are ON the board path (position 0-55)
    const renderBoardTokens = () => {
        const boardTokenElements: React.ReactNode[] = [];
        tokens.forEach((playerTokens, playerIndex) => {
            if (!players[playerIndex].active) return;
            playerTokens.forEach((token, tokenIndex) => {
                if (token.position < 0 || token.position >= 56) return;
                const coords = getTokenBoardPosition(playerIndex, token.position);
                if (!coords) return;
                const isMovable = movableTokens.some(
                    t => t.player === playerIndex && t.token === tokenIndex
                );
                const canInteract = !players[currentPlayer]?.isComputer && currentPlayer === playerIndex && hasRolled;
                const tokenColor = COLORS[playerIndex];
                const tokenDark = COLOR_DARK[playerIndex];
                const animPos = tokenAnims[playerIndex][tokenIndex];
                const animScale = tokenScaleAnims[playerIndex][tokenIndex];

                boardTokenElements.push(
                    <Animated.View
                        key={`board-${playerIndex}-${tokenIndex}`}
                        style={[
                            styles.boardTokenWrapper,
                            {
                                transform: [
                                    { translateX: animPos.x },
                                    { translateY: animPos.y },
                                    {
                                        scale: isMovable
                                            ? Animated.multiply(pulseAnim, animScale)
                                            : animScale
                                    },
                                ],
                            },
                            isMovable && { zIndex: 100 },
                        ]}
                    >
                        <TouchableOpacity
                            onPress={() => moveToken(playerIndex, tokenIndex)}
                            disabled={!canInteract}
                            activeOpacity={0.7}
                            style={styles.boardTokenTouchable}
                        >
                            {/* Simple circle token on board */}
                            <View style={[styles.boardTokenCircle, { backgroundColor: tokenColor, borderColor: tokenDark }]}>
                                <View style={styles.boardTokenShine} />
                            </View>
                            {isMovable && (
                                <View style={[styles.boardTokenGlow, { borderColor: '#FFD700' }]} />
                            )}
                        </TouchableOpacity>
                    </Animated.View>
                );
            });
        });
        return boardTokenElements;
    };

    // Setup Screen
    if (gameMode === 'setup') {
        return (
            <View style={[styles.container, { backgroundColor: containerBg }]}>
                <ScrollView style={styles.scrollView} contentContainerStyle={styles.setupContainer} showsVerticalScrollIndicator={false}>
                    <View style={styles.titleSection}>
                        <Text style={styles.titleEmoji}>🎲</Text>
                        <Text style={[styles.title, { color: textColor }]}>Ludo</Text>
                        <Text style={[styles.subtitle, { color: subtitleColor }]}>Classic Board Game</Text>
                    </View>

                    {/* Game Mode */}
                    <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.sectionLabel, { color: subtitleColor }]}>Game Mode</Text>
                        <View style={styles.modeRow}>
                            <TouchableOpacity
                                style={[
                                    styles.modeOption,
                                    { backgroundColor: playMode === 'passplay' ? '#6366F1' : surfaceBg }
                                ]}
                                onPress={() => setPlayMode('passplay')}
                            >
                                <Text style={styles.modeEmoji}>👥</Text>
                                <Text style={[styles.modeLabel, { color: playMode === 'passplay' ? '#fff' : textColor }]}>Local</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modeOption,
                                    { backgroundColor: playMode === 'computer' ? '#6366F1' : surfaceBg }
                                ]}
                                onPress={() => setPlayMode('computer')}
                            >
                                <Text style={styles.modeEmoji}>🤖</Text>
                                <Text style={[styles.modeLabel, { color: playMode === 'computer' ? '#fff' : textColor }]}>vs AI</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Player Count */}
                    <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.sectionLabel, { color: subtitleColor }]}>Players</Text>
                        <View style={styles.countRow}>
                            {[2, 3, 4].map(count => (
                                <TouchableOpacity
                                    key={count}
                                    style={[
                                        styles.countBtn,
                                        { backgroundColor: playerCount === count ? '#6366F1' : surfaceBg }
                                    ]}
                                    onPress={() => setPlayerCount(count)}
                                >
                                    <Text style={[styles.countText, { color: playerCount === count ? '#fff' : textColor }]}>{count}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.playerChips}>
                            {players.slice(0, playerCount).map((player, index) => (
                                <View key={index} style={[styles.playerChip, { backgroundColor: COLOR_LIGHT[index] }]}>
                                    <View style={[styles.chipDot, { backgroundColor: COLORS[index] }]} />
                                    <Text style={[styles.chipText, { color: COLORS[index] }]}>
                                        {playMode === 'passplay' ? `P${index + 1}` : (index === 0 ? 'You' : 'AI')}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    {/* AI Difficulty */}
                    {playMode === 'computer' && (
                        <View style={[styles.settingsCard, { backgroundColor: cardBg }]}>
                            <Text style={[styles.sectionLabel, { color: subtitleColor }]}>AI Difficulty</Text>
                            <View style={styles.diffRow}>
                                {(['easy', 'medium', 'hard'] as Difficulty[]).map((diff) => (
                                    <TouchableOpacity
                                        key={diff}
                                        style={[
                                            styles.diffBtn,
                                            difficulty === diff && (
                                                diff === 'easy' ? styles.diffEasy :
                                                    diff === 'medium' ? styles.diffMedium : styles.diffHard
                                            ),
                                            difficulty !== diff && { backgroundColor: surfaceBg }
                                        ]}
                                        onPress={() => setDifficulty(diff)}
                                    >
                                        <Text style={styles.diffEmoji}>
                                            {diff === 'easy' ? '😊' : diff === 'medium' ? '🧐' : '😈'}
                                        </Text>
                                        <Text style={[styles.diffLabel, { color: difficulty === diff ? '#fff' : textColor }]}>
                                            {diff.charAt(0).toUpperCase() + diff.slice(1)}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        </View>
                    )
                    }

                    {/* Start Button */}
                    <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.8}>
                        <Text style={styles.startBtnText}>🎮 Start Game</Text>
                    </TouchableOpacity>
                </ScrollView >
            </View >
        );
    }

    // Winner Screen
    if (winner !== null) {
        const isHumanWinner = !players[winner].isComputer;
        return (
            <View style={[styles.container, { backgroundColor: COLOR_BG[winner] }]}>
                <View style={styles.winnerContainer}>
                    <View style={[styles.winnerCard, { backgroundColor: '#fff' }]}>
                        <Text style={styles.winnerEmoji}>{isHumanWinner ? '🏆' : '🤖'}</Text>
                        <Text style={[styles.winnerTitle, { color: COLORS[winner] }]}>
                            {COLOR_NAMES[winner]} Wins!
                        </Text>
                        {!isHumanWinner && playMode === 'computer' && (
                            <Text style={styles.loseNote}>Better luck next time!</Text>
                        )}

                        <TouchableOpacity
                            style={[styles.saveBtn, gameSaved && styles.saveBtnDisabled]}
                            onPress={saveGameResult}
                            disabled={gameSaved}
                        >
                            <Text style={styles.saveBtnText}>
                                {gameSaved ? '✓ Saved' : 'Save Result'}
                            </Text>
                        </TouchableOpacity>

                        <View style={styles.winnerActions}>
                            <TouchableOpacity style={styles.primaryBtn} onPress={startGame}>
                                <Text style={styles.primaryBtnText}>Play Again</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.secondaryBtn, { borderColor: surfaceBg }]} onPress={resetGame}>
                                <Text style={[styles.secondaryBtnText, { color: '#64748B' }]}>Settings</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
        );
    }

    // Game Screen
    const isCurrentPlayerHuman = !players[currentPlayer]?.isComputer;

    const diceRotate = diceRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    // Dice + Player Indicator component
    const renderDicePanel = () => (
        <View style={styles.dicePanelInner}>
            {/* Player indicator */}
            <View style={[
                styles.playerIndicator,
                { backgroundColor: COLORS[currentPlayer] + '20', borderColor: COLORS[currentPlayer] }
            ]}>
                <View style={[styles.playerDot, { backgroundColor: COLORS[currentPlayer] }]} />
                <Text style={[styles.playerName, { color: COLORS[currentPlayer] }]}>
                    {COLOR_NAMES[currentPlayer]}
                </Text>
                {players[currentPlayer]?.isComputer && (
                    <Text style={styles.aiTag}>🤖</Text>
                )}
            </View>

            {/* Dice */}
            <Animated.View style={{ transform: [{ rotate: isRolling ? diceRotate : '0deg' }, { scale: diceScale }] }}>
                <TouchableOpacity
                    style={[
                        styles.diceBtn,
                        { borderColor: COLORS[currentPlayer] },
                        !isCurrentPlayerHuman && styles.diceBtnDisabled,
                        hasRolled && isCurrentPlayerHuman && styles.diceBtnUsed,
                    ]}
                    onPress={rollDice}
                    disabled={hasRolled || isRolling || !isCurrentPlayerHuman}
                    activeOpacity={0.7}
                >
                    {renderDice()}
                </TouchableOpacity>
            </Animated.View>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: containerBg }]}>
            {/* Dynamic Background Gradients */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[0], backgroundImage: `linear-gradient(to top right, ${COLORS[0]}40, transparent 80%)` } as any]} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[1], backgroundImage: `linear-gradient(to bottom right, ${COLORS[1]}40, transparent 80%)` } as any]} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[2], backgroundImage: `linear-gradient(to bottom left, ${COLORS[2]}40, transparent 80%)` } as any]} />
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[3], backgroundImage: `linear-gradient(to top left, ${COLORS[3]}40, transparent 80%)` } as any]} />

            {/* Turn Indicator */}
            <View style={[styles.turnBadge, { backgroundColor: COLORS[currentPlayer] }]}>
                <Text style={styles.turnText}>
                    {COLOR_NAMES[currentPlayer]}{players[currentPlayer]?.isComputer ? ' 🤖' : ''}'s Turn
                </Text>
            </View>

            {/* Message */}
            {message && (
                <View style={[styles.messageBadge, { backgroundColor: cardBg }]}>
                    <Text style={[styles.messageText, { color: textColor }]}>{message}</Text>
                </View>
            )}

            {/* Game Layout: Top Dice → Board → Bottom Dice */}
            <View style={styles.gameArea}>
                {/* Top Dice Panel (for Red/Blue) */}
                {isDiceTop && (
                    <View style={[styles.topDicePanel, { backgroundColor: cardBg }]}>
                        {renderDicePanel()}
                    </View>
                )}

                {/* Board */}
                <View style={styles.boardWrapper}>
                    <View style={[styles.boardFrame, { backgroundColor: '#C9A227' }]}>
                        <View style={[styles.board, { backgroundColor: '#FDF6E3' }]}>
                            {Array.from({ length: 15 }, (_, row) =>
                                Array.from({ length: 15 }, (_, col) => renderCell(row, col))
                            )}
                            <View style={[styles.homeBasePosition, styles.homeBottomLeft]}>
                                {renderHomeBase(0)}
                            </View>
                            <View style={[styles.homeBasePosition, styles.homeTopLeft]}>
                                {renderHomeBase(1)}
                            </View>
                            <View style={[styles.homeBasePosition, styles.homeTopRight]}>
                                {renderHomeBase(2)}
                            </View>
                            <View style={[styles.homeBasePosition, styles.homeBottomRight]}>
                                {renderHomeBase(3)}
                            </View>
                            {renderCenter()}
                            {renderBoardTokens()}
                        </View>
                    </View>
                </View>

                {/* Bottom Dice Panel (for Green/Yellow) */}
                {!isDiceTop && (
                    <View style={[styles.bottomDicePanel, { backgroundColor: cardBg }]}>
                        {renderDicePanel()}
                    </View>
                )}
            </View>

            <TouchableOpacity style={styles.settingsLink} onPress={() => {
                Alert.alert(
                    '⚙️ Game Menu',
                    'What would you like to do?',
                    [
                        {
                            text: 'Save & Quit',
                            onPress: () => {
                                // Save full game state for continue later
                                saveLudoGame({
                                    tokens: tokens.map(p => p.map(t => ({ ...t }))),
                                    currentPlayer,
                                    players: players.map(p => ({ ...p })),
                                    playMode,
                                    difficulty,
                                    playerCount: players.filter(p => p.active).length,
                                });
                                Alert.alert('✓ Saved', 'Game saved! Continue from Records.');
                                resetGame();
                            },
                        },
                        {
                            text: 'Quit',
                            style: 'destructive',
                            onPress: () => resetGame(),
                        },
                        {
                            text: 'Cancel',
                            style: 'cancel',
                        },
                    ]
                );
            }}>
                <Text style={[styles.settingsLinkText, { color: subtitleColor }]}>⚙️ Menu</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    setupContainer: {
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 60,
    },
    // Setup
    titleSection: {
        alignItems: 'center',
        paddingTop: 60,
        marginBottom: 32,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    titleEmoji: {
        fontSize: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 15,
        marginTop: 4,
    },
    settingsCard: {
        width: '100%',
        padding: 20,
        borderRadius: 16,
        marginBottom: 16,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 14,
    },
    modeRow: {
        flexDirection: 'row',
        gap: 12,
    },
    modeOption: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 12,
    },
    modeEmoji: {
        fontSize: 28,
        marginBottom: 6,
    },
    modeLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    countRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 16,
    },
    countBtn: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    countText: {
        fontSize: 22,
        fontWeight: '700',
    },
    playerChips: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 16,
        gap: 8,
        flexWrap: 'wrap',
    },
    playerChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
    },
    chipDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 6,
    },
    chipText: {
        fontSize: 12,
        fontWeight: '700',
    },
    diffRow: {
        flexDirection: 'row',
        gap: 10,
    },
    diffBtn: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 14,
        borderRadius: 12,
    },
    diffEasy: {
        backgroundColor: '#10B981',
    },
    diffMedium: {
        backgroundColor: '#F59E0B',
    },
    diffHard: {
        backgroundColor: '#EF4444',
    },
    diffEmoji: {
        fontSize: 24,
        marginBottom: 4,
    },
    diffLabel: {
        fontSize: 12,
        fontWeight: '600',
    },
    startBtn: {
        backgroundColor: '#6366F1',
        paddingVertical: 16,
        paddingHorizontal: 56,
        borderRadius: 28,
        marginTop: 8,
    },
    startBtnText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '700',
    },
    // Game Screen
    turnBadge: {
        marginTop: 40,
        paddingVertical: 10,
        paddingHorizontal: 28,
        borderRadius: 24,
        alignSelf: 'center',
    },
    turnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    messageBadge: {
        marginTop: 8,
        paddingVertical: 6,
        paddingHorizontal: 16,
        borderRadius: 12,
        alignSelf: 'center',
    },
    messageText: {
        fontSize: 13,
        fontWeight: '600',
    },
    // Game Area
    gameArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
    },
    topDicePanel: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 10,
        marginBottom: 10,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        gap: 12,
    },
    bottomDicePanel: {
        flexDirection: 'row',
        borderRadius: 16,
        padding: 10,
        marginTop: 12,
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 6,
        elevation: 4,
        gap: 12,
    },
    dicePanelInner: {
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    playerIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1.5,
        gap: 4,
    },
    playerDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    playerName: {
        fontSize: 11,
        fontWeight: '800',
    },
    aiTag: {
        fontSize: 10,
    },
    // Board
    boardWrapper: {
        alignItems: 'center',
    },
    boardFrame: {
        padding: 8,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 8,
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderRadius: 8,
        position: 'relative',
        overflow: 'visible',
    },
    // Cells
    cell: {
        position: 'absolute',
        width: CELL_SIZE - 1,
        height: CELL_SIZE - 1,
        borderWidth: 0.5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    safeStar: {
        fontSize: CELL_SIZE * 0.5,
        color: '#94A3B8',
    },
    // Home Bases
    homeBasePosition: {
        position: 'absolute',
    },
    homeBottomLeft: {
        bottom: 0,
        left: 0,
    },
    homeTopLeft: {
        top: 0,
        left: 0,
    },
    homeTopRight: {
        top: 0,
        right: 0,
    },
    homeBottomRight: {
        bottom: 0,
        right: 0,
    },
    homeBase: {
        width: CELL_SIZE * 6,
        height: CELL_SIZE * 6,
        borderRadius: 8,
        padding: 8,
    },
    homeInner: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    homeTokenGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        width: CELL_SIZE * 4,
        gap: 4,
    },
    homeSlot: {
        width: CELL_SIZE * 1.8,
        height: CELL_SIZE * 1.8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptySlot: {
        width: CELL_SIZE * 1.2,
        height: CELL_SIZE * 1.2,
        borderRadius: CELL_SIZE * 0.6,
        borderWidth: 2,
        borderColor: 'rgba(0,0,0,0.15)',
        borderStyle: 'dashed',
    },
    // Center
    centerContainer: {
        position: 'absolute',
        top: CELL_SIZE * 6,
        left: CELL_SIZE * 6,
        width: CELL_SIZE * 3,
        height: CELL_SIZE * 3,
        backgroundColor: '#FFFFFF',
    },
    centerTriangle: {
        position: 'absolute',
        width: 0,
        height: 0,
    },
    // Center triangles: Red=left (bottom-left player), Green=top (top-left player), Yellow=right (top-right player), Blue=bottom (bottom-right player)
    triangleRed: {
        left: 0,
        top: 0,
        borderTopWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: COLORS[0],
    },
    triangleBlue: {
        right: 0,
        top: 0,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: COLORS[1],
    },
    triangleGreen: {
        left: 0,
        bottom: 0,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderTopWidth: CELL_SIZE * 1.5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS[2],
    },
    triangleYellow: {
        right: 0,
        bottom: 0,
        borderTopWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: COLORS[3],
    },
    // Simple Circle Token (Home)
    tokenContainer: {
        width: CELL_SIZE * 1.4,
        height: CELL_SIZE * 1.4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tokenCircle: {
        width: CELL_SIZE * 1.15,
        height: CELL_SIZE * 1.15,
        borderRadius: CELL_SIZE * 0.575,
        borderWidth: 2.5,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 5,
    },
    tokenShine: {
        position: 'absolute',
        top: CELL_SIZE * 0.12,
        left: CELL_SIZE * 0.15,
        width: CELL_SIZE * 0.3,
        height: CELL_SIZE * 0.2,
        borderRadius: CELL_SIZE * 0.1,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    tokenGlow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: CELL_SIZE,
        borderWidth: 2.5,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.9,
        shadowRadius: 12,
    },
    // Board path token styles (simple circle)
    boardTokenWrapper: {
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 50,
        width: CELL_SIZE * 0.88,
        height: CELL_SIZE * 0.88,
        justifyContent: 'center',
        alignItems: 'center',
    },
    boardTokenTouchable: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    boardTokenCircle: {
        width: CELL_SIZE * 0.78,
        height: CELL_SIZE * 0.78,
        borderRadius: CELL_SIZE * 0.39,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.25,
        shadowRadius: 2,
        elevation: 4,
    },
    boardTokenShine: {
        position: 'absolute',
        top: CELL_SIZE * 0.07,
        left: CELL_SIZE * 0.1,
        width: CELL_SIZE * 0.2,
        height: CELL_SIZE * 0.12,
        borderRadius: CELL_SIZE * 0.06,
        backgroundColor: 'rgba(255,255,255,0.55)',
    },
    boardTokenGlow: {
        position: 'absolute',
        top: -2,
        left: -2,
        right: -2,
        bottom: -2,
        borderRadius: CELL_SIZE * 0.5,
        borderWidth: 2,
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.8,
        shadowRadius: 6,
        elevation: 8,
    },
    // Dice
    diceArea: {
        alignItems: 'center',
        marginTop: 16,
    },
    diceBtn: {
        backgroundColor: '#fff',
        padding: 10,
        borderRadius: 8,
        borderWidth: 3,
        width: 64,
        height: 64,
        justifyContent: 'center',
        alignItems: 'center',
    },
    diceBtnDisabled: {
        opacity: 0.5,
        borderColor: '#94A3B8',
    },
    diceBtnUsed: {
        opacity: 0.4,
        backgroundColor: '#F1F5F9',
    },
    dice: {
        width: 60,
        height: 60,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    diceRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        width: '100%',
    },
    diceDot: {
        width: 12,
        height: 12,
        borderRadius: 6,
    },
    diceDotFilled: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 3,
        elevation: 3,
    },
    diceHint: {
        marginTop: 10,
        fontSize: 13,
        fontWeight: '500',
    },
    settingsLink: {
        marginTop: 12,
        alignSelf: 'center',
        paddingVertical: 8,
        paddingHorizontal: 16,
    },
    settingsLinkText: {
        fontSize: 14,
        fontWeight: '600',
    },
    // Winner Screen
    winnerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 24,
    },
    winnerCard: {
        padding: 40,
        borderRadius: 28,
        alignItems: 'center',
        width: '100%',
    },
    winnerEmoji: {
        fontSize: 72,
        marginBottom: 16,
    },
    winnerTitle: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    loseNote: {
        fontSize: 14,
        color: '#64748B',
        marginBottom: 16,
    },
    saveBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 12,
        paddingHorizontal: 28,
        borderRadius: 24,
        marginVertical: 16,
    },
    saveBtnDisabled: {
        backgroundColor: '#94A3B8',
    },
    saveBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    winnerActions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 8,
    },
    primaryBtn: {
        backgroundColor: '#6366F1',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
    },
    primaryBtnText: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '700',
    },
    secondaryBtn: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        borderWidth: 2,
    },
    secondaryBtnText: {
        fontSize: 15,
        fontWeight: '600',
    },
});
