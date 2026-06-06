import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions, ScrollView, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS as APP_COLORS } from '../../theme';
import { LinearGradient } from 'expo-linear-gradient';
import GameMenuModal from '../../components/GameMenuModal';
import { useRecords } from '../../context/RecordsContext';
import AdBanner from '../../components/AdBanner';
import { useInterstitialAd } from 'react-native-google-mobile-ads';
import { getInterstitialAdUnitId } from '../../utils/adConfig';

const { width: SCREEN_W } = Dimensions.get('window');
const BOARD_SIZE = Math.min(SCREEN_W - 32, 380);
const CELL = BOARD_SIZE / 10;

const LADDERS: Record<number, number> = { 4: 14, 9: 31, 20: 38, 28: 84, 40: 59, 51: 67, 63: 81, 71: 91 };
const SNAKES: Record<number, number> = { 17: 7, 54: 34, 62: 19, 64: 60, 87: 24, 93: 73, 95: 75, 99: 78 };

const P_COLORS = ['#EF4444', '#3B82F6', '#F59E0B', '#22C55E'];
const P_NAMES = ['Red', 'Blue', 'Yellow', 'Green'];
const P_LIGHT = ['#FEE2E2', '#DBEAFE', '#FEF3C7', '#DCFCE7'];
const P_EMOJI = ['🔴', '🔵', '🟡', '🟢'];

const getCoords = (cell: number) => {
    const c = Math.max(1, Math.min(cell, 100));
    const row = Math.floor((c - 1) / 10);
    const col = (c - 1) % 10;
    const x = (row % 2 === 0 ? col : 9 - col) * CELL;
    const y = (9 - row) * CELL;
    return { x, y };
};

type Phase = 'setup' | 'playing';

export default function SnakeAndLadderGame({ navigation }: any) {
    const { isDarkMode } = useTheme();
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

    const playAgainWithAd = () => {
        if (isInterstitialLoaded) {
            showInterstitial();
        }
        setPhase('setup');
    };

    const quitWithAd = () => {
        if (isInterstitialLoaded) {
            showInterstitial();
        }
        navigation.goBack();
    };

    const [phase, setPhase] = useState<Phase>('setup');
    const [playerCount, setPlayerCount] = useState(2);
    const [roundTrip, setRoundTrip] = useState(false);
    const [positions, setPositions] = useState([1, 1, 1, 1]);
    const [directions, setDirections] = useState<('up' | 'down')[]>(['up', 'up', 'up', 'up']);
    const [current, setCurrent] = useState(0);
    const [dice, setDice] = useState<number | null>(null);
    const [rolling, setRolling] = useState(false);
    const [winner, setWinner] = useState<number | null>(null);
    const [extraTurn, setExtraTurn] = useState(false);
    const [menuVisible, setMenuVisible] = useState(false);

    const diceScale = useRef(new Animated.Value(1)).current;
    const anims = useRef([0, 1, 2, 3].map(() => new Animated.ValueXY(getCoords(1)))).current;

    // Background gradient opacities for current player
    const bgOpacities = useRef(
        [0, 1, 2, 3].map(i => new Animated.Value(i === 0 ? 1 : 0))
    ).current;

    useEffect(() => {
        bgOpacities.forEach((anim, index) => {
            Animated.timing(anim, {
                toValue: current === index ? 1 : 0,
                duration: 600,
                useNativeDriver: false,
            }).start();
        });
    }, [current]);

    const bg = isDarkMode ? '#0F172A' : '#F8FAFC';
    const cardBg = isDarkMode ? '#1E293B' : '#FFFFFF';
    const txt = isDarkMode ? '#F1F5F9' : '#0F172A';
    const sub = isDarkMode ? '#94A3B8' : '#64748B';
    const surfBg = isDarkMode ? '#334155' : '#F1F5F9';

    const startGame = () => {
        setPositions([1, 1, 1, 1]);
        setDirections(['up', 'up', 'up', 'up']);
        setCurrent(0);
        setWinner(null);
        setDice(null);
        setExtraTurn(false);
        anims.forEach(a => a.setValue(getCoords(1)));
        setPhase('playing');
    };

    const animateMove = (idx: number, from: number, to: number, direct = false): Promise<void> => {
        return new Promise(resolve => {
            if (direct) {
                Animated.timing(anims[idx], {
                    toValue: getCoords(to), duration: 400,
                    easing: Easing.inOut(Easing.ease), useNativeDriver: false,
                }).start(() => resolve());
            } else {
                const steps: Animated.CompositeAnimation[] = [];
                const dir = to > from ? 1 : -1;
                for (let i = from + dir; dir > 0 ? i <= to : i >= to; i += dir) {
                    steps.push(Animated.timing(anims[idx], {
                        toValue: getCoords(i), duration: 180,
                        easing: Easing.linear, useNativeDriver: false,
                    }));
                }
                Animated.sequence(steps).start(() => resolve());
            }
        });
    };

    const rollDice = () => {
        if (rolling || winner !== null) return;
        setRolling(true);
        setExtraTurn(false);

        Animated.sequence([
            Animated.timing(diceScale, { toValue: 0.85, duration: 80, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1.1, duration: 80, useNativeDriver: true }),
            Animated.timing(diceScale, { toValue: 1, duration: 80, useNativeDriver: true }),
        ]).start();

        let rolls = 0;
        const iv = setInterval(() => {
            setDice(Math.floor(Math.random() * 6) + 1);
            if (++rolls > 12) {
                clearInterval(iv);
                const val = Math.floor(Math.random() * 6) + 1;
                setDice(val);
                doMove(val);
            }
        }, 50);
    };

    const doMove = async (roll: number) => {
        const pos = positions[current];
        const dir = directions[current];

        if (dir === 'up') {
            // Going UP (1 → 100)
            let next = pos + roll;

            if (!roundTrip && next > 100) {
                endTurn(roll);
                return;
            }

            if (roundTrip && next > 100) {
                // Bounce off 100: overshoot comes back down
                const overshoot = next - 100;
                next = 100 - overshoot;
                // Animate to 100 first, then back down
                await animateMove(current, pos, 100);
                await animateMove(current, 100, next);
                // Switch direction
                const nd = [...directions];
                nd[current] = 'down';
                setDirections(nd);

                const np = [...positions];
                np[current] = next;
                setPositions(np);
                endTurn(roll);
                return;
            }

            await animateMove(current, pos, next);

            let final = next;
            if (LADDERS[next]) {
                final = LADDERS[next];
                await new Promise(r => setTimeout(r, 250));
                await animateMove(current, next, final, true);
            } else if (SNAKES[next]) {
                final = SNAKES[next];
                await new Promise(r => setTimeout(r, 250));
                await animateMove(current, next, final, true);
            }

            const np = [...positions];
            np[current] = final;
            setPositions(np);

            if (final === 100) {
                if (roundTrip) {
                    // Reached 100 exactly — switch to going down
                    const nd = [...directions];
                    nd[current] = 'down';
                    setDirections(nd);

                    endTurn(roll);
                } else {
                    // Classic mode — win!
                    setWinner(current);
                    setRolling(false);
                    addGameRecord({
                        game: 'snake_ladder',
                        winner: P_NAMES[current],
                        winnerColor: P_COLORS[current],
                        playerCount,
                        gameMode: 'passplay',
                        details: `Player ${current + 1} (${P_NAMES[current]}) won the race!`,
                    });
                }
                return;
            }
            endTurn(roll);
        } else {
            // Going DOWN (100 → 1)
            let next = pos - roll;

            if (next < 1) {
                // Bounce off 1
                const overshoot = 1 - next;
                next = 1 + overshoot;
                await animateMove(current, pos, 1);
                await animateMove(current, 1, next);


                const np = [...positions];
                np[current] = next;
                setPositions(np);
                endTurn(roll);
                return;
            }

            await animateMove(current, pos, next);

            // On the way down, snakes act as ladders and ladders act as snakes!
            let final = next;
            if (SNAKES[next]) {
                // Snake helps you go down faster!
                final = SNAKES[next];
                await new Promise(r => setTimeout(r, 250));
                await animateMove(current, next, final, true);
            } else if (LADDERS[next]) {
                // Ladder pushes you back up!
                final = LADDERS[next];
                await new Promise(r => setTimeout(r, 250));
                await animateMove(current, next, final, true);
            }

            const np = [...positions];
            np[current] = final;
            setPositions(np);

            if (final === 1) {
                // Win!
                setWinner(current);
                setRolling(false);
                addGameRecord({
                    game: 'snake_ladder',
                    winner: P_NAMES[current],
                    winnerColor: P_COLORS[current],
                    playerCount,
                    gameMode: 'passplay',
                    details: `Player ${current + 1} (${P_NAMES[current]}) won the round trip!`,
                });
                return;
            }
            endTurn(roll);
        }
    };

    const endTurn = (roll: number) => {
        setRolling(false);
        if (roll === 6) { setExtraTurn(true); return; }
        let n = (current + 1) % playerCount;
        setCurrent(n);
        setExtraTurn(false);
        setTimeout(() => setDice(null), 800);
    };

    // ── SETUP SCREEN ──
    if (phase === 'setup') {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
                <ScrollView contentContainerStyle={styles.setupContent}>
                    <Text style={{ fontSize: 56, marginBottom: 12 }}>🐍🪜</Text>
                    <Text style={[styles.setupTitle, { color: txt }]}>Snakes & Ladders</Text>
                    <Text style={[styles.setupSub, { color: sub }]}>Classic board game — race to 100!</Text>

                    <View style={[styles.setupCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.setupLabel, { color: sub }]}>GAME MODE</Text>
                        <View style={styles.countRow}>
                            <TouchableOpacity
                                style={[styles.modeBtn, { backgroundColor: !roundTrip ? APP_COLORS.primary : surfBg }]}
                                onPress={() => setRoundTrip(false)}>
                                <Text style={{ fontSize: 18 }}>🏁</Text>
                                <Text style={[styles.modeBtnText, { color: !roundTrip ? '#FFF' : txt }]}>Race to 100</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[styles.modeBtn, { backgroundColor: roundTrip ? APP_COLORS.primary : surfBg }]}
                                onPress={() => setRoundTrip(true)}>
                                <Text style={{ fontSize: 18 }}>🔄</Text>
                                <Text style={[styles.modeBtnText, { color: roundTrip ? '#FFF' : txt }]}>100 & Back</Text>
                            </TouchableOpacity>
                        </View>
                        {roundTrip && (
                            <Text style={[styles.legendHint, { color: sub, marginTop: 8 }]}>Race to 100 then back to 1 to win!</Text>
                        )}
                    </View>

                    <View style={[styles.setupCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.setupLabel, { color: sub }]}>PLAYERS</Text>
                        <View style={styles.countRow}>
                            {[2, 3, 4].map(n => (
                                <TouchableOpacity key={n}
                                    style={[styles.countBtn, { backgroundColor: playerCount === n ? APP_COLORS.primary : surfBg }]}
                                    onPress={() => setPlayerCount(n)}>
                                    <Text style={[styles.countText, { color: playerCount === n ? '#FFF' : txt }]}>{n}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        <View style={styles.chipRow}>
                            {Array.from({ length: playerCount }, (_, i) => (
                                <View key={i} style={[styles.chip, { backgroundColor: P_LIGHT[i] }]}>
                                    <View style={[styles.chipDot, { backgroundColor: P_COLORS[i] }]} />
                                    <Text style={[styles.chipText, { color: P_COLORS[i] }]}>P{i + 1}</Text>
                                </View>
                            ))}
                        </View>
                    </View>

                    <View style={[styles.setupCard, { backgroundColor: cardBg }]}>
                        <Text style={[styles.setupLabel, { color: sub }]}>BOARD LEGEND</Text>
                        <View style={styles.legendRow}>
                            <View style={styles.legendItem}>
                                <Text style={{ fontSize: 22 }}>🪜</Text>
                                <Text style={[styles.legendText, { color: txt }]}>Ladder — climb up</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <Text style={{ fontSize: 22 }}>🐍</Text>
                                <Text style={[styles.legendText, { color: txt }]}>Snake — slide down</Text>
                            </View>
                        </View>
                        <Text style={[styles.legendHint, { color: sub }]}>Roll a 6 to get an extra turn!</Text>
                        {roundTrip && (
                            <Text style={[styles.legendHint, { color: sub, marginTop: 4 }]}>On the way back: snakes help, ladders hinder!</Text>
                        )}
                    </View>

                    <TouchableOpacity style={styles.startBtn} onPress={startGame} activeOpacity={0.85}>
                        <Text style={styles.startText}>🎲 Start Game</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={[styles.backLink]} onPress={() => navigation.goBack()}>
                        <Text style={[styles.backText, { color: sub }]}>← Back to Home</Text>
                    </TouchableOpacity>
                </ScrollView>
            </SafeAreaView>
        );
    }

    // ── GAME SCREEN ──
    const renderSnakesAndLadders = () => {
        const elements: React.ReactNode[] = [];
        
        // Draw Ladders
        Object.entries(LADDERS).forEach(([fromStr, toStr]) => {
            const from = Number(fromStr);
            const to = Number(toStr);
            const start = getCoords(from);
            const end = getCoords(to);
            const sx = start.x + CELL / 2;
            const sy = start.y + CELL / 2;
            const ex = end.x + CELL / 2;
            const ey = end.y + CELL / 2;

            const cx = (sx + ex) / 2;
            const cy = (sy + ey) / 2;
            const dist = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            const angle = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;
            
            const rungs = Math.floor(dist / (CELL * 0.4));
            
            elements.push(
                <View key={`ladder-${from}`} style={{
                    position: 'absolute', left: cx - dist / 2, top: cy - CELL * 0.25,
                    width: dist, height: CELL * 0.5,
                    transform: [{ rotate: `${angle}deg` }],
                    flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center',
                    zIndex: 4,
                }}>
                    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: '#B45309', borderRadius: 2 }} />
                    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: '#B45309', borderRadius: 2 }} />
                    {Array.from({length: rungs}).map((_, i) => (
                        <View key={i} style={{ width: 4, height: '100%', backgroundColor: '#D97706', borderRadius: 2 }} />
                    ))}
                </View>
            );
        });

        // Draw Snakes
        Object.entries(SNAKES).forEach(([fromStr, toStr]) => {
            const from = Number(fromStr);
            const to = Number(toStr);
            // Snake head is at 'from', tail is at 'to'
            const start = getCoords(from);
            const end = getCoords(to);
            const sx = start.x + CELL / 2;
            const sy = start.y + CELL / 2;
            const ex = end.x + CELL / 2;
            const ey = end.y + CELL / 2;

            const cx = (sx + ex) / 2;
            const cy = (sy + ey) / 2;
            const dist = Math.sqrt(Math.pow(ex - sx, 2) + Math.pow(ey - sy, 2));
            const angle = Math.atan2(ey - sy, ex - sx) * 180 / Math.PI;

            // Generate squiggly snake segments
            const segmentsCount = Math.max(10, Math.floor(dist / (CELL * 0.08)));
            const step = dist / segmentsCount;
            
            const segmentsData = Array.from({length: segmentsCount + 1}).map((_, i) => {
                const progress = i / segmentsCount;
                const size = CELL * 0.4 * (1 - progress * 0.7); // Tapers down smoothly to tail
                // 2.5 full sine waves across the body length
                const waveY = Math.sin(progress * Math.PI * 5) * (CELL * 0.18);
                return { x: i * step, y: waveY, size };
            });

            elements.push(
                <View key={`snake-${from}`} style={{
                    position: 'absolute', left: cx - dist / 2, top: cy,
                    width: dist, height: 0,
                    transform: [{ rotate: `${angle}deg` }],
                    zIndex: 5,
                    justifyContent: 'center'
                }}>
                    {/* Outline / Border layer */}
                    {segmentsData.map((seg, i) => (
                        <View key={`border-${i}`} style={{
                            position: 'absolute',
                            left: seg.x - (seg.size + 3) / 2,
                            top: seg.y - (seg.size + 3) / 2,
                            width: seg.size + 3,
                            height: seg.size + 3,
                            borderRadius: (seg.size + 3) / 2,
                            backgroundColor: '#14532D',
                        }} />
                    ))}

                    {/* Fill layer */}
                    {segmentsData.map((seg, i) => (
                        <View key={`fill-${i}`} style={{
                            position: 'absolute',
                            left: seg.x - seg.size / 2,
                            top: seg.y - seg.size / 2,
                            width: seg.size,
                            height: seg.size,
                            borderRadius: seg.size / 2,
                            backgroundColor: '#22C55E',
                        }}>
                            {/* Snake scales/pattern dots */}
                            {i % 4 === 0 && i > 0 && i < segmentsCount && (
                                <View style={{
                                    position: 'absolute', left: seg.size/2 - 2, top: seg.size/2 - 2,
                                    width: 4, height: 4, borderRadius: 2, backgroundColor: '#14532D', opacity: 0.35
                                }} />
                            )}
                        </View>
                    ))}

                    {/* Snake Head */}
                    <View style={{
                        position: 'absolute', left: -CELL * 0.25, top: -CELL * 0.25,
                        width: CELL * 0.55, height: CELL * 0.5,
                        backgroundColor: '#16A34A',
                        borderRadius: CELL * 0.28,
                        borderWidth: 1.5, borderColor: '#14532D',
                        justifyContent: 'center', alignItems: 'center',
                        zIndex: 2,
                        // Angle head slightly to match the start of the sine wave
                        transform: [{ rotate: '-15deg' }]
                    }}>
                        {/* Eyes */}
                        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 4 }}>
                            <View style={{ width: 10, height: 10, backgroundColor: '#FFF', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#14532D' }}>
                                <View style={{ width: 5, height: 5, backgroundColor: '#000', borderRadius: 2.5 }} />
                            </View>
                            <View style={{ width: 10, height: 10, backgroundColor: '#FFF', borderRadius: 5, justifyContent: 'center', alignItems: 'center', borderWidth: 0.5, borderColor: '#14532D' }}>
                                <View style={{ width: 5, height: 5, backgroundColor: '#000', borderRadius: 2.5 }} />
                            </View>
                        </View>
                        {/* Tongue */}
                        <View style={{ position: 'absolute', left: -14, top: '48%', width: 14, height: 3, backgroundColor: '#DC2626', borderRadius: 1.5 }} />
                    </View>
                </View>
            );
        });

        return elements;
    };

    const renderBoard = () => {
        const cells = [];
        for (let r = 0; r < 10; r++) {
            for (let c = 0; c < 10; c++) {
                const row = 9 - r;
                const cellNum = row % 2 === 0 ? row * 10 + c + 1 : row * 10 + (9 - c) + 1;
                const dark = (r + c) % 2 === 0;
                const cellBg = dark
                    ? (isDarkMode ? '#334155' : '#E2E8F0')
                    : (isDarkMode ? '#1E293B' : '#F8FAFC');

                cells.push(
                    <View key={cellNum} style={[styles.cell, {
                        width: CELL, height: CELL, backgroundColor: cellBg,
                        left: c * CELL, top: r * CELL,
                    }]}>
                        <Text style={[styles.cellNum, {
                            color: isDarkMode ? '#64748B' : '#94A3B8',
                            fontSize: CELL < 34 ? 7 : 9,
                        }]}>{cellNum}</Text>
                    </View>
                );
            }
        }
        return cells;
    };

    const renderTokens = () => {
        return Array.from({ length: playerCount }, (_, i) => {
            const offX = (i % 2) * CELL * 0.28 + CELL * 0.12;
            const offY = Math.floor(i / 2) * CELL * 0.28 + CELL * 0.12;
            const size = CELL * 0.45;
            return (
                <Animated.View key={i} style={[styles.token, {
                    width: size, height: size, borderRadius: size / 2,
                    backgroundColor: P_COLORS[i],
                    borderColor: '#FFF', borderWidth: 2,
                    transform: [
                        { translateX: Animated.add(anims[i].x, offX) },
                        { translateY: Animated.add(anims[i].y, offY) },
                    ],
                    zIndex: current === i ? 20 : 10,
                    shadowColor: P_COLORS[i],
                }]}>
                    <Text style={{ color: '#FFF', fontSize: size * 0.45, fontWeight: '900' }}>{i + 1}</Text>
                </Animated.View>
            );
        });
    };

    const renderDice = () => {
        const dots: Record<number, [number, number][]> = {
            1: [[1, 1]], 2: [[0, 2], [2, 0]], 3: [[0, 2], [1, 1], [2, 0]],
            4: [[0, 0], [0, 2], [2, 0], [2, 2]], 5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
            6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
        };
        return (
            <Animated.View style={[styles.dice, { backgroundColor: cardBg, transform: [{ scale: diceScale }] }]}>
                {[0, 1, 2].map(r => (
                    <View key={r} style={styles.diceRow}>
                        {[0, 1, 2].map(c => (
                            <View key={c} style={[styles.dot,
                                dice && dots[dice]?.some(d => d[0] === r && d[1] === c)
                                    ? { backgroundColor: P_COLORS[current] }
                                    : { backgroundColor: 'transparent' },
                            ]} />
                        ))}
                    </View>
                ))}
            </Animated.View>
        );
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: bg }]} edges={['top', 'bottom']}>
            {/* Dynamic Background Gradients */}
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[0] }]} pointerEvents="none">
                <LinearGradient colors={[`${P_COLORS[0]}35`, `${P_COLORS[0]}00`]} locations={[0, 0.7]} start={{x: 0, y: 1}} end={{x: 1, y: 0}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[1] }]} pointerEvents="none">
                <LinearGradient colors={[`${P_COLORS[1]}35`, `${P_COLORS[1]}00`]} locations={[0, 0.7]} start={{x: 0, y: 0}} end={{x: 1, y: 1}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[2] }]} pointerEvents="none">
                <LinearGradient colors={[`${P_COLORS[2]}35`, `${P_COLORS[2]}00`]} locations={[0, 0.7]} start={{x: 1, y: 0}} end={{x: 0, y: 1}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgOpacities[3] }]} pointerEvents="none">
                <LinearGradient colors={[`${P_COLORS[3]}35`, `${P_COLORS[3]}00`]} locations={[0, 0.7]} start={{x: 1, y: 1}} end={{x: 0, y: 0}} style={StyleSheet.absoluteFill} />
            </Animated.View>
            {/* Header */}
            <View style={styles.gameHeader}>
                <TouchableOpacity style={[styles.menuBtn, { backgroundColor: surfBg }]} onPress={() => setMenuVisible(true)}>
                    <Text style={[{ fontSize: 13, fontWeight: '700', color: txt }]}>⚙️ Menu</Text>
                </TouchableOpacity>
                <Text style={[styles.gameTitle, { color: txt }]}>🐍 Snakes & Ladders</Text>
                <View style={{ width: 70 }} />
            </View>

            <ScrollView contentContainerStyle={styles.gameScroll} showsVerticalScrollIndicator={false}>
                {/* Player Status Bar */}
                <View style={styles.statusBar}>
                    {Array.from({ length: playerCount }, (_, i) => (
                        <View key={i} style={[styles.statusItem, {
                            backgroundColor: current === i ? P_COLORS[i] : surfBg,
                            borderColor: P_COLORS[i], borderWidth: current === i ? 0 : 1.5,
                        }]}>
                            <Text style={{ fontSize: 12 }}>{P_EMOJI[i]}</Text>
                            <Text style={[styles.statusText, { color: current === i ? '#FFF' : txt }]}>
                                {positions[i]}
                            </Text>
                            {roundTrip && (
                                <Text style={{ fontSize: 10, color: current === i ? '#FFF' : txt }}>
                                    {directions[i] === 'up' ? '⬆' : '⬇'}
                                </Text>
                            )}
                        </View>
                    ))}
                </View>

                {/* Turn indicator */}
                <View style={[styles.turnBadge, { backgroundColor: P_COLORS[current] }]}>
                    <Text style={styles.turnText}>
                        {P_NAMES[current]}'s Turn{extraTurn ? '  🎲 Extra!' : ''}
                    </Text>
                </View>

                {/* Board */}
                <View style={[styles.boardFrame, { backgroundColor: isDarkMode ? '#475569' : '#94A3B8' }]}>
                    <View style={[styles.board, { width: BOARD_SIZE, height: BOARD_SIZE }]}>
                        {renderBoard()}
                        {renderSnakesAndLadders()}
                        {renderTokens()}
                    </View>
                </View>

                {/* Dice */}
                <View style={styles.diceArea}>
                    <TouchableOpacity onPress={rollDice} disabled={rolling || winner !== null}
                        style={[styles.diceTouch, rolling && { opacity: 0.6 }]} activeOpacity={0.8}>
                        {renderDice()}
                    </TouchableOpacity>
                    <Text style={[styles.rollHint, { color: sub }]}>
                        {rolling ? 'Rolling...' : winner !== null ? '' : 'Tap dice to roll'}
                    </Text>
                </View>
            <AdBanner />
        </ScrollView>

            {/* Winner Overlay */}
            {winner !== null && (
                <View style={styles.overlay}>
                    <View style={[styles.winCard, { backgroundColor: cardBg }]}>
                        <Text style={{ fontSize: 64, marginBottom: 8 }}>🏆</Text>
                        <Text style={[styles.winTitle, { color: P_COLORS[winner] }]}>{P_NAMES[winner]} Wins!</Text>
                        <Text style={[styles.winSub, { color: sub }]}>Congratulations, Player {winner + 1}!</Text>
                        <TouchableOpacity style={[styles.winBtn, { backgroundColor: APP_COLORS.primary }]} onPress={playAgainWithAd}>
                            <Text style={styles.winBtnText}>Play Again</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.winBtnSec, { borderColor: surfBg }]} onPress={quitWithAd}>
                            <Text style={[styles.winBtnSecText, { color: sub }]}>Quit</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            <GameMenuModal visible={menuVisible} onClose={() => setMenuVisible(false)}
                onSaveAndQuit={() => navigation.goBack()} onQuit={() => navigation.goBack()} />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    // Setup
    setupContent: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 40, paddingBottom: 60 },
    setupTitle: { fontSize: 30, fontWeight: '800', letterSpacing: -0.5, marginBottom: 6 },
    setupSub: { fontSize: 15, fontWeight: '500', marginBottom: 32 },
    setupCard: { width: '100%', padding: 20, borderRadius: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
    setupLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 14, textTransform: 'uppercase' },
    countRow: { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 16 },
    countBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
    countText: { fontSize: 22, fontWeight: '700' },
    chipRow: { flexDirection: 'row', justifyContent: 'center', gap: 8, flexWrap: 'wrap' },
    chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
    chipDot: { width: 10, height: 10, borderRadius: 5 },
    chipText: { fontSize: 13, fontWeight: '700' },
    legendRow: { gap: 12, marginBottom: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 10 },
    legendText: { fontSize: 14, fontWeight: '600' },
    legendHint: { fontSize: 13, fontWeight: '500', fontStyle: 'italic' },
    startBtn: { backgroundColor: '#6366F1', paddingVertical: 16, paddingHorizontal: 48, borderRadius: 28, marginTop: 12, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8 },
    startText: { color: '#FFF', fontSize: 18, fontWeight: '700' },
    backLink: { marginTop: 20, paddingVertical: 10 },
    backText: { fontSize: 15, fontWeight: '600' },
    // Game
    gameHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
    menuBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20 },
    gameTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
    gameScroll: { alignItems: 'center', paddingBottom: 40 },
    statusBar: { flexDirection: 'row', gap: 8, marginBottom: 10, paddingHorizontal: 16 },
    statusItem: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
    statusText: { fontSize: 13, fontWeight: '800' },
    turnBadge: { paddingHorizontal: 24, paddingVertical: 8, borderRadius: 20, marginBottom: 8 },
    turnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
    msgBadge: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, marginBottom: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 6, elevation: 3 },
    msgText: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
    // Board
    boardFrame: { padding: 6, borderRadius: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 10 },
    board: { borderRadius: 8, overflow: 'hidden', position: 'relative' },
    cell: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    cellNum: { position: 'absolute', top: 1, left: 2, fontWeight: '700' },
    cellIcon: { opacity: 0.85 },
    token: { position: 'absolute', justifyContent: 'center', alignItems: 'center', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4, elevation: 6 },
    // Dice
    diceArea: { marginTop: 20, alignItems: 'center' },
    diceTouch: { alignItems: 'center' },
    dice: { width: 72, height: 72, borderRadius: 16, padding: 8, justifyContent: 'space-around', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 6 },
    diceRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    dot: { width: 13, height: 13, borderRadius: 7 },
    rollHint: { marginTop: 10, fontSize: 14, fontWeight: '700' },
    // Winner
    overlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    winCard: { width: 300, padding: 32, borderRadius: 28, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.25, shadowRadius: 20, elevation: 15 },
    winTitle: { fontSize: 26, fontWeight: '900', marginBottom: 4 },
    winSub: { fontSize: 14, fontWeight: '500', marginBottom: 24 },
    winBtn: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', marginBottom: 10 },
    winBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
    winBtnSec: { width: '100%', paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 2 },
    winBtnSecText: { fontSize: 16, fontWeight: '700' },
    modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14 },
    modeBtnText: { fontSize: 14, fontWeight: '700' },
});
