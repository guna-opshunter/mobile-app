import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Alert, ScrollView, Animated, Share, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';
import { useRecords } from '../../context/RecordsContext';
import { useAchievements } from '../../context/AchievementsContext';
import GameMenuModal from '../../components/GameMenuModal';
import { LinearGradient } from 'expo-linear-gradient';
import AdBanner from '../../components/AdBanner';

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
// Red(0) = Bottom-Left (idx 39), Green(1) = Top-Left (idx 0)
// Yellow(2) = Top-Right (idx 13), Blue(3) = Bottom-Right (idx 26)
const PLAYER_START_INDEX = [39, 0, 13, 26];

// Home lanes (5 cells each, leading to center)
const HOME_LANES: [number, number][][] = [
    [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7]],   // Player 0: Red (Bottom arm)
    [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5]],       // Player 1: Green (Left arm)
    [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7]],       // Player 2: Yellow (Top arm)
    [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9]],   // Player 3: Blue (Right arm)
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
    const [menuVisible, setMenuVisible] = useState(false);
    const [consecutive6s, setConsecutive6s] = useState(0);
    const lastMovedTokenRef = useRef<{ player: number; token: number; prevPos: number } | null>(null);
    const tokensRef = useRef(tokens);
    useEffect(() => { tokensRef.current = tokens; }, [tokens]);

    const diceRotation = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const pulseAnimRef = useRef<Animated.CompositeAnimation | null>(null);
    const diceScale = useRef(new Animated.Value(1)).current;

    // Animated turn badge background color
    const turnBadgeAnim = useRef(new Animated.Value(0)).current;
    const prevPlayerRef = useRef(0);
    const turnBadgeColor = useRef(new Animated.Value(currentPlayer)).current;

    // Animated message fade
    const messageOpacity = useRef(new Animated.Value(0)).current;
    const messageScale = useRef(new Animated.Value(0.8)).current;
    const prevMessageRef = useRef<string | null>(null);

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

    // Dice panel opacity animation (smooth fade between top/bottom)
    const dicePanelTopOpacity = useRef(new Animated.Value(currentPlayer === 1 || currentPlayer === 2 ? 1 : 0)).current;
    const dicePanelBottomOpacity = useRef(new Animated.Value(currentPlayer === 0 || currentPlayer === 3 ? 1 : 0)).current;

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

        // Smooth dice panel fade
        const topTarget = isDiceTop ? 1 : 0;
        const bottomTarget = isDiceTop ? 0 : 1;
        Animated.parallel([
            Animated.timing(dicePanelTopOpacity, {
                toValue: topTarget,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.timing(dicePanelBottomOpacity, {
                toValue: bottomTarget,
                duration: 350,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();
    }, [currentPlayer]);

    // Background Gradients Opacities
    const bgOpacities = useRef([
        new Animated.Value(currentPlayer === 0 ? 1 : 0),
        new Animated.Value(currentPlayer === 1 ? 1 : 0),
        new Animated.Value(currentPlayer === 2 ? 1 : 0),
        new Animated.Value(currentPlayer === 3 ? 1 : 0),
    ]).current;

    useEffect(() => {
        Animated.parallel(
            bgOpacities.map((anim, index) =>
                Animated.timing(anim, {
                    toValue: currentPlayer === index ? 1 : 0,
                    duration: 800,
                    easing: Easing.inOut(Easing.ease),
                    useNativeDriver: false,
                })
            )
        ).start();
    }, [currentPlayer]);

    useEffect(() => {
        const newPlayers: PlayerConfig[] = [];
        for (let i = 0; i < 4; i++) {
            if (playerCount === 2) {
                // For 2 players, use Red (0) and Yellow (2) as active so they are on opposite sides
                if (i === 0 || i === 2) {
                    if (playMode === 'passplay') {
                        newPlayers.push({ isComputer: false, active: true });
                    } else {
                        // User is Red (0), Computer is Yellow (2)
                        newPlayers.push({ isComputer: i === 2, active: true });
                    }
                } else {
                    newPlayers.push({ isComputer: true, active: false });
                }
            } else {
                // For 3 or 4 players, active is determined sequentially
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

        // Safe cells on the board (stars + start positions) — captures can't happen here
        const safeCells: [number, number][] = [
            [8, 2], [2, 6], [6, 12], [12, 8],   // star cells
            [13, 6], [6, 1], [1, 8], [8, 13],    // start cells
        ];
        const isSafeCell = (coords: [number, number] | null) =>
            coords !== null && safeCells.some(s => s[0] === coords[0] && s[1] === coords[1]);

        // Check if an opponent token sits at given board coords
        const hasOpponentAt = (coords: [number, number] | null): boolean => {
            if (!coords) return false;
            for (let op = 0; op < 4; op++) {
                if (op === playerIndex || !players[op].active) continue;
                for (let ot = 0; ot < 4; ot++) {
                    const opToken = tokens[op][ot];
                    if (opToken.position < 0 || opToken.position >= 51) continue;
                    const opCoords = getTokenBoardPosition(op, opToken.position);
                    if (opCoords && opCoords[0] === coords[0] && opCoords[1] === coords[1]) return true;
                }
            }
            return false;
        };

        // Check if an opponent could reach the given position in a single roll (1-6)
        const isInDanger = (coords: [number, number] | null): boolean => {
            if (!coords || isSafeCell(coords)) return false;
            for (let op = 0; op < 4; op++) {
                if (op === playerIndex || !players[op].active) continue;
                for (let ot = 0; ot < 4; ot++) {
                    const opToken = tokens[op][ot];
                    if (opToken.position < 0 || opToken.position >= 51) continue;
                    for (let d = 1; d <= 6; d++) {
                        const futurePos = opToken.position + d;
                        if (futurePos > 50) continue;
                        const futureCoords = getTokenBoardPosition(op, futurePos);
                        if (futureCoords && futureCoords[0] === coords[0] && futureCoords[1] === coords[1]) return true;
                    }
                }
            }
            return false;
        };

        playerTokens.forEach((token, index) => {
            if (token.position === -1 && dice === 6) {
                // Deploy a new token from home base
                let score = 50;
                if (difficulty === 'hard') {
                    // Deploy is smart when fewer tokens are on the board
                    const onBoard = playerTokens.filter(t => t.position >= 0 && t.position < 56).length;
                    if (onBoard < 2) score += 15; // encourage getting pieces out early
                }
                validMoves.push({ tokenIndex: index, score });
            } else if (token.position >= 0 && token.position < 57) {
                const newPos = token.position + dice;
                if (newPos <= 56) {
                    let score = 10;

                    // Reaching home is always top priority
                    if (newPos === 56) score += 100;

                    if (difficulty === 'easy') {
                        // Easy: add randomness so it plays unpredictably
                        score += Math.random() * 30;
                    } else {
                        // Medium & Hard: prefer progressing tokens that are further along
                        score += Math.floor(token.position / 5);

                        // Entering home lane (positions 51-55) is safe and valuable
                        if (newPos >= 51 && token.position < 51) score += 25;
                    }

                    if (difficulty === 'hard') {
                        const newCoords = newPos < 56 ? getTokenBoardPosition(playerIndex, newPos) : null;
                        const curCoords = getTokenBoardPosition(playerIndex, token.position);

                        // Capture opportunity: big bonus (also gives a bonus turn)
                        if (newPos < 51 && hasOpponentAt(newCoords)) {
                            score += 40;
                        }

                        // Escape danger: moving away from a threatened cell
                        if (isInDanger(curCoords) && !isInDanger(newCoords)) {
                            score += 20;
                        }

                        // Landing on a safe cell is a modest bonus
                        if (isSafeCell(newCoords)) {
                            score += 8;
                        }

                        // Slight penalty for landing on a dangerous cell
                        if (newPos < 51 && isInDanger(newCoords) && !isSafeCell(newCoords)) {
                            score -= 10;
                        }
                    }

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
    }, [tokens, difficulty, players]);

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
            // Stop previous pulse cleanly before starting new one
            if (pulseAnimRef.current) {
                pulseAnimRef.current.stop();
            }
            pulseAnim.setValue(1);
            const anim = Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 1.18,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1,
                        duration: 500,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true,
                    }),
                ])
            );
            pulseAnimRef.current = anim;
            anim.start();
        } else {
            if (pulseAnimRef.current) {
                pulseAnimRef.current.stop();
                pulseAnimRef.current = null;
            }
            // Ease back to 1 instead of snapping
            Animated.timing(pulseAnim, {
                toValue: 1,
                duration: 150,
                useNativeDriver: true,
            }).start();
        }
    }, [movableTokens]);

    // Animated message fade in/out
    useEffect(() => {
        if (message) {
            // Fade in
            messageOpacity.setValue(0);
            messageScale.setValue(0.85);
            Animated.parallel([
                Animated.timing(messageOpacity, {
                    toValue: 1,
                    duration: 250,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.spring(messageScale, {
                    toValue: 1,
                    friction: 6,
                    tension: 120,
                    useNativeDriver: true,
                }),
            ]).start();
            prevMessageRef.current = message;

            const timer = setTimeout(() => {
                // Fade out then clear
                Animated.parallel([
                    Animated.timing(messageOpacity, {
                        toValue: 0,
                        duration: 300,
                        easing: Easing.in(Easing.ease),
                        useNativeDriver: true,
                    }),
                    Animated.timing(messageScale, {
                        toValue: 0.85,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]).start(() => setMessage(null));
            }, 1700);
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
                    const startCells: [number, number][] = [[13, 6], [6, 1], [1, 8], [8, 13]];
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
                    style={{ width: '100%', height: '100%', justifyContent: 'center', alignItems: 'center' }}
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
        const baseColor = COLORS[playerIndex];
        const bgColor = COLOR_BG[playerIndex];

        const isActive = players[playerIndex].active;
        const homeTokens = isActive ? tokens[playerIndex].filter(t => t.position === -1) : [];
        const homeTokenIndices = isActive ? tokens[playerIndex]
            .map((t, i) => t.position === -1 ? i : -1)
            .filter(i => i !== -1) : [];

        return (
            <View style={[styles.homeBase, { backgroundColor: baseColor }]}>
                <View style={styles.homeInner}>
                    <View style={styles.homeTokenGrid}>
                        {[0, 1, 2, 3].map((slotIndex) => {
                            const tokenIdx = isActive ? tokens[playerIndex].findIndex((t, i) =>
                                t.position === -1 &&
                                tokens[playerIndex].slice(0, i).filter(tt => tt.position === -1).length === slotIndex
                            ) : -1;
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
        let borderColor = '#1E293B';
        let isPath = true;

        // Red home lane (bottom arm)
        if (row >= 9 && row <= 13 && col === 7) {
            cellColor = COLOR_LIGHT[0];
        }
        // Green home lane (left arm)
        if (col >= 1 && col <= 5 && row === 7) {
            cellColor = COLOR_LIGHT[1];
        }
        // Yellow home lane (top arm)
        if (row >= 1 && row <= 5 && col === 7) {
            cellColor = COLOR_LIGHT[2];
        }
        // Blue home lane (right arm)
        if (col >= 9 && col <= 13 && row === 7) {
            cellColor = COLOR_LIGHT[3];
        }

        // Start positions (where tokens enter the board) — colored with player's color
        if (row === 13 && col === 6) cellColor = COLORS[0]; // Red start (bottom arm)
        if (row === 6 && col === 1) cellColor = COLORS[1]; // Green start (left arm)
        if (row === 1 && col === 8) cellColor = COLORS[2]; // Yellow start (top arm)
        if (row === 8 && col === 13) cellColor = COLORS[3]; // Blue start (right arm)

        // Safe star spots — colored with the respective player's color
        if (row === 12 && col === 8) cellColor = COLOR_LIGHT[0]; // Red's safe star (bottom arm)
        if (row === 8 && col === 2) cellColor = COLOR_LIGHT[1];  // Green's safe star (left arm)
        if (row === 2 && col === 6) cellColor = COLOR_LIGHT[2];  // Yellow's safe star (top arm)
        if (row === 6 && col === 12) cellColor = COLOR_LIGHT[3]; // Blue's safe star (right arm)

        // Safe spots (4 star cells + 4 start cells are safe in logic)
        const safeSpots = [
            [8, 2], [2, 6], [6, 12], [12, 8],
            [13, 6], [6, 1], [1, 8], [8, 13]
        ];
        // Only draw the star icon on the 4 actual star cells
        const starSpots = [
            [8, 2], [2, 6], [6, 12], [12, 8]
        ];
        const hasStarIcon = starSpots.some(s => s[0] === row && s[1] === col);

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
                {hasStarIcon && <Text style={styles.safeStar}>★</Text>}
            </View>
        );
    };

    // Center triangles
    const renderCenter = () => {
        return (
            <View style={styles.centerContainer}>
                {/* Red triangle (pointing UP, from bottom arm) */}
                <View style={[styles.centerTriangle, styles.triangleBottom]} />
                {/* Green triangle (pointing RIGHT, from left arm) */}
                <View style={[styles.centerTriangle, styles.triangleLeft]} />
                {/* Yellow triangle (pointing DOWN, from top arm) */}
                <View style={[styles.centerTriangle, styles.triangleTop]} />
                {/* Blue triangle (pointing LEFT, from right arm) */}
                <View style={[styles.centerTriangle, styles.triangleRight]} />
            </View>
        );
    };

    // Helper: compute pixel position for a token at a given path position
    const getTokenPixelPos = useCallback((playerIndex: number, position: number) => {
        const coords = getTokenBoardPosition(playerIndex, position);
        if (!coords) return null;
        const [row, col] = coords;
        return {
            x: col * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.85) / 2,
            y: row * CELL_SIZE + (CELL_SIZE - CELL_SIZE * 0.85) / 2,
        };
    }, []);

    // Track running token animations so we can cancel them on new moves
    const runningTokenAnims = useRef<(Animated.CompositeAnimation | null)[][]>(
        Array.from({ length: 4 }, () => [null, null, null, null])
    );

    // Animate tokens when positions change — smooth glide through waypoints
    useEffect(() => {
        tokens.forEach((playerTokens, pi) => {
            playerTokens.forEach((token, ti) => {
                const prevPos = prevTokenPositions.current[pi][ti];
                const curPos = token.position;

                if (prevPos === curPos && tokenInitialized.current[pi][ti]) return;

                // Stop any in-flight animation for this token
                if (runningTokenAnims.current[pi][ti]) {
                    runningTokenAnims.current[pi][ti]!.stop();
                    runningTokenAnims.current[pi][ti] = null;
                }

                if (curPos >= 0 && curPos < 56) {
                    const target = getTokenPixelPos(pi, curPos);
                    if (!target) return;

                    if (!tokenInitialized.current[pi][ti] || prevPos === -1) {
                        // Token just entered the board — smooth pop in
                        tokenAnims[pi][ti].setValue({ x: target.x, y: target.y });
                        tokenScaleAnims[pi][ti].setValue(0);
                        const anim = Animated.spring(tokenScaleAnims[pi][ti], {
                            toValue: 1,
                            friction: 5,
                            tension: 160,
                            useNativeDriver: true,
                        });
                        runningTokenAnims.current[pi][ti] = anim;
                        anim.start(() => { runningTokenAnims.current[pi][ti] = null; });
                    } else if (prevPos >= 0 && curPos > prevPos && (curPos - prevPos) <= 6) {
                        // Smooth glide through waypoints using a single progress driver
                        const numSteps = curPos - prevPos;
                        const progress = new Animated.Value(0);

                        // Build waypoint arrays for interpolation
                        const inputRange: number[] = [];
                        const xOutput: number[] = [];
                        const yOutput: number[] = [];
                        for (let s = 0; s <= numSteps; s++) {
                            const wp = getTokenPixelPos(pi, prevPos + s);
                            if (!wp) continue;
                            inputRange.push(s);
                            xOutput.push(wp.x);
                            yOutput.push(wp.y);
                        }

                        // Listener-driven approach: update ValueXY from interpolated progress
                        const listenerId = progress.addListener(({ value }) => {
                            // Clamp and find which segment we're in
                            const v = Math.max(0, Math.min(numSteps, value));
                            const idx = Math.floor(v);
                            const frac = v - idx;
                            const i0 = Math.min(idx, inputRange.length - 1);
                            const i1 = Math.min(idx + 1, inputRange.length - 1);
                            const x = xOutput[i0] + (xOutput[i1] - xOutput[i0]) * frac;
                            const y = yOutput[i0] + (yOutput[i1] - yOutput[i0]) * frac;
                            tokenAnims[pi][ti].setValue({ x, y });
                        });

                        // Single smooth animation: ease-in at start, ease-out at end
                        const totalDuration = numSteps * 110; // ~110ms per cell
                        const moveAnim = Animated.sequence([
                            Animated.timing(progress, {
                                toValue: numSteps,
                                duration: totalDuration,
                                easing: Easing.inOut(Easing.cubic),
                                useNativeDriver: false, // needed for listener
                            }),
                            // Subtle landing bounce
                            Animated.timing(tokenScaleAnims[pi][ti], {
                                toValue: 1.12,
                                duration: 60,
                                useNativeDriver: true,
                            }),
                            Animated.spring(tokenScaleAnims[pi][ti], {
                                toValue: 1,
                                friction: 6,
                                tension: 200,
                                useNativeDriver: true,
                            }),
                        ]);

                        runningTokenAnims.current[pi][ti] = moveAnim;
                        moveAnim.start(() => {
                            progress.removeListener(listenerId);
                            runningTokenAnims.current[pi][ti] = null;
                            // Ensure final position is exact
                            tokenAnims[pi][ti].setValue({ x: target.x, y: target.y });
                        });
                    } else {
                        // Fallback: smooth slide (e.g. revert from 3-sixes)
                        const anim = Animated.parallel([
                            Animated.timing(tokenAnims[pi][ti], {
                                toValue: { x: target.x, y: target.y },
                                duration: 350,
                                easing: Easing.inOut(Easing.cubic),
                                useNativeDriver: true,
                            }),
                            Animated.sequence([
                                Animated.delay(250),
                                Animated.spring(tokenScaleAnims[pi][ti], {
                                    toValue: 1,
                                    friction: 6,
                                    tension: 160,
                                    useNativeDriver: true,
                                }),
                            ]),
                        ]);
                        runningTokenAnims.current[pi][ti] = anim;
                        anim.start(() => { runningTokenAnims.current[pi][ti] = null; });
                    }
                    tokenInitialized.current[pi][ti] = true;
                } else {
                    // Token went back home (captured) — shrink out if it was on board
                    if (tokenInitialized.current[pi][ti] && prevPos >= 0) {
                        Animated.timing(tokenScaleAnims[pi][ti], {
                            toValue: 0,
                            duration: 200,
                            easing: Easing.in(Easing.ease),
                            useNativeDriver: true,
                        }).start();
                    }
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
            <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
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
                            {players.filter(p => p.active).map((player, index) => {
                                const originalIndex = players.indexOf(player);
                                return (
                                    <View key={originalIndex} style={[styles.playerChip, { backgroundColor: COLOR_LIGHT[originalIndex] }]}>
                                        <View style={[styles.chipDot, { backgroundColor: COLORS[originalIndex] }]} />
                                        <Text style={[styles.chipText, { color: COLORS[originalIndex] }]}>
                                            {playMode === 'passplay' ? `P${index + 1}` : (originalIndex === 0 ? 'You' : 'AI')}
                                        </Text>
                                    </View>
                                );
                            })}
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

                    <TouchableOpacity style={styles.backLink} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backLinkText, { color: subtitleColor }]}>← Back to Home</Text>
                    </TouchableOpacity>
                </ScrollView >
            </SafeAreaView >
        );
    }

    // Winner Screen
    if (winner !== null) {
        const isHumanWinner = !players[winner].isComputer;
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: COLOR_BG[winner] }]} edges={['top', 'bottom']}>
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
            </SafeAreaView>
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
        <SafeAreaView style={[styles.container, { backgroundColor: containerBg }]} edges={['top', 'bottom']}>
            {/* Dynamic Background Gradients */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[0] }]}>
                <LinearGradient colors={[`${COLORS[0]}40`, `${COLORS[0]}00`]} locations={[0, 0.8]} start={{x: 0, y: 1}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[1] }]}>
                <LinearGradient colors={[`${COLORS[1]}40`, `${COLORS[1]}00`]} locations={[0, 0.8]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[2] }]}>
                <LinearGradient colors={[`${COLORS[2]}40`, `${COLORS[2]}00`]} locations={[0, 0.8]} start={{x: 1, y: 0}} end={{x: 0, y: 1}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[3] }]}>
                <LinearGradient colors={[`${COLORS[3]}40`, `${COLORS[3]}00`]} locations={[0, 0.8]} start={{x: 1, y: 1}} end={{x: 0, y: 0}} style={StyleSheet.absoluteFill} />
            </Animated.View>

            {/* Turn Indicator */}
            <View style={[styles.turnBadge, { backgroundColor: COLORS[currentPlayer] }]}>
                <Text style={styles.turnText}>
                    {COLOR_NAMES[currentPlayer]}{players[currentPlayer]?.isComputer ? ' 🤖' : ''}'s Turn
                </Text>
            </View>

            {/* Message — animated fade in/out */}
            <Animated.View
                pointerEvents={message ? 'auto' : 'none'}
                style={[
                    styles.messageBadge,
                    { backgroundColor: cardBg, opacity: messageOpacity, transform: [{ scale: messageScale }] },
                ]}
            >
                <Text style={[styles.messageText, { color: textColor }]}>{message || prevMessageRef.current || ''}</Text>
            </Animated.View>

            {/* Game Layout: Top Dice → Board → Bottom Dice */}
            <View style={styles.gameArea}>
                {/* Top Dice Panel — always rendered, fades in/out */}
                <Animated.View
                    pointerEvents={isDiceTop ? 'auto' : 'none'}
                    style={[styles.topDicePanel, { backgroundColor: cardBg, opacity: dicePanelTopOpacity }]}
                >
                    {renderDicePanel()}
                </Animated.View>

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

                {/* Bottom Dice Panel — always rendered, fades in/out */}
                <Animated.View
                    pointerEvents={!isDiceTop ? 'auto' : 'none'}
                    style={[styles.bottomDicePanel, { backgroundColor: cardBg, opacity: dicePanelBottomOpacity }]}
                >
                    {renderDicePanel()}
                </Animated.View>
            </View>

            <TouchableOpacity style={styles.settingsLink} onPress={() => setMenuVisible(true)}>
                <Text style={[styles.settingsLinkText, { color: subtitleColor }]}>⚙️ Menu</Text>
            </TouchableOpacity>
            
            <GameMenuModal 
                visible={menuVisible} 
                onClose={() => setMenuVisible(false)} 
                onSaveAndQuit={() => {
                    saveLudoGame({
                        tokens: tokens.map(p => p.map(t => ({ ...t }))),
                        currentPlayer,
                        players: players.map(p => ({ ...p })),
                        playMode,
                        difficulty,
                        playerCount: players.filter(p => p.active).length,
                    });
                    resetGame();
                    setMenuVisible(false);
                }} 
                onQuit={() => {
                    resetGame();
                    setMenuVisible(false);
                }} 
            />
        <AdBanner />
        </SafeAreaView>
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
        marginTop: 8,
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
        borderWidth: 1,
        borderColor: '#1E293B',
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
        borderWidth: 1.5,
        borderColor: '#1E293B',
    },
    homeInner: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        borderWidth: 1.5,
        borderColor: '#1E293B',
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
        borderWidth: 1.5,
        borderColor: '#1E293B',
    },
    centerTriangle: {
        position: 'absolute',
        width: 0,
        height: 0,
    },
    // Center triangles
    triangleTop: { // Yellow (points DOWN)
        top: 0, left: 0,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderTopWidth: CELL_SIZE * 1.5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderTopColor: COLORS[2],
    },
    triangleBottom: { // Red (points UP)
        bottom: 0, left: 0,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderLeftColor: 'transparent',
        borderRightColor: 'transparent',
        borderBottomColor: COLORS[0],
    },
    triangleLeft: { // Green (points RIGHT)
        left: 0, top: 0,
        borderTopWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderLeftWidth: CELL_SIZE * 1.5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderLeftColor: COLORS[1],
    },
    triangleRight: { // Blue (points LEFT)
        right: 0, top: 0,
        borderTopWidth: CELL_SIZE * 1.5,
        borderBottomWidth: CELL_SIZE * 1.5,
        borderRightWidth: CELL_SIZE * 1.5,
        borderTopColor: 'transparent',
        borderBottomColor: 'transparent',
        borderRightColor: COLORS[3],
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
    backLink: {
        marginTop: 20,
        paddingVertical: 10,
        marginBottom: 40,
    },
    backLinkText: {
        fontSize: 15,
        fontWeight: '600',
        textAlign: 'center',
    },
});
