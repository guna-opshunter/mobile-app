import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

type AlgMode = 'quadratic' | 'linear' | 'simultaneous';

export default function AlgebraCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [mode, setMode] = useState<AlgMode>('quadratic');
    const [a, setA] = useState('');
    const [b, setB] = useState('');
    const [c, setC] = useState('');
    const [d, setD] = useState('');
    const [e, setE] = useState('');
    const [f, setF] = useState('');
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const modes: { key: AlgMode; label: string; icon: string }[] = [
        { key: 'quadratic', label: 'Quadratic', icon: 'x²' },
        { key: 'linear', label: 'Linear', icon: 'ax+b' },
        { key: 'simultaneous', label: '2 Eqns', icon: 'x,y' },
    ];

    const calculate = () => {
        if (mode === 'quadratic') {
            const av = parseFloat(a);
            const bv = parseFloat(b);
            const cv = parseFloat(c);
            if (isNaN(av) || isNaN(bv) || isNaN(cv)) return;
            if (av === 0) {
                setResult({ main: 'Error', label: 'a cannot be 0 for quadratic', detail: 'Use linear mode instead', color: COLORS.danger });
                return;
            }

            const discriminant = bv * bv - 4 * av * cv;
            const formula = `${av}x² + ${bv}x + ${cv} = 0`;

            if (discriminant > 0) {
                const x1 = (-bv + Math.sqrt(discriminant)) / (2 * av);
                const x2 = (-bv - Math.sqrt(discriminant)) / (2 * av);
                setResult({
                    main: `x₁ = ${x1.toFixed(4)}\nx₂ = ${x2.toFixed(4)}`,
                    label: 'Two Real Roots',
                    detail: `${formula}\nD = ${discriminant.toFixed(2)} > 0`,
                });
            } else if (discriminant === 0) {
                const x = -bv / (2 * av);
                setResult({
                    main: `x = ${x.toFixed(4)}`,
                    label: 'One Repeated Root',
                    detail: `${formula}\nD = 0`,
                });
            } else {
                const realPart = (-bv / (2 * av)).toFixed(4);
                const imagPart = (Math.sqrt(-discriminant) / (2 * av)).toFixed(4);
                setResult({
                    main: `x = ${realPart} ± ${imagPart}i`,
                    label: 'Complex Roots',
                    detail: `${formula}\nD = ${discriminant.toFixed(2)} < 0`,
                    color: '#F59E0B',
                });
            }
        } else if (mode === 'linear') {
            // ax + b = 0 → x = -b/a
            const av = parseFloat(a);
            const bv = parseFloat(b);
            if (isNaN(av) || isNaN(bv)) return;
            if (av === 0) {
                setResult({
                    main: bv === 0 ? 'Infinite solutions' : 'No solution',
                    label: bv === 0 ? 'Identity' : 'Contradiction',
                    detail: `${av}x + ${bv} = 0`,
                    color: bv === 0 ? '#10B981' : COLORS.danger,
                });
                return;
            }
            const x = -bv / av;
            setResult({
                main: `x = ${x.toFixed(4)}`,
                label: 'Solution',
                detail: `${av}x + ${bv} = 0`,
            });
        } else if (mode === 'simultaneous') {
            // a1x + b1y = c1
            // a2x + b2y = c2
            const a1 = parseFloat(a);
            const b1 = parseFloat(b);
            const c1 = parseFloat(c);
            const a2 = parseFloat(d);
            const b2 = parseFloat(e);
            const c2 = parseFloat(f);
            if ([a1, b1, c1, a2, b2, c2].some(isNaN)) return;

            const det = a1 * b2 - a2 * b1;
            if (det === 0) {
                setResult({
                    main: 'No unique solution',
                    label: 'Parallel or coincident lines',
                    detail: `Determinant = 0`,
                    color: COLORS.danger,
                });
                return;
            }
            const x = (c1 * b2 - c2 * b1) / det;
            const y = (a1 * c2 - a2 * c1) / det;
            setResult({
                main: `x = ${x.toFixed(4)}\ny = ${y.toFixed(4)}`,
                label: 'Solution',
                detail: `${a1}x + ${b1}y = ${c1}\n${a2}x + ${b2}y = ${c2}`,
            });
        }
        Keyboard.dismiss();
    };

    const reset = () => {
        setA(''); setB(''); setC(''); setD(''); setE(''); setF('');
        setResult(null);
    };

    const renderInputs = () => {
        if (mode === 'quadratic') {
            return (
                <>
                    <Text style={[styles.equation, { color: theme.text }]}>ax² + bx + c = 0</Text>
                    <View style={styles.inputRow}>
                        <View style={styles.inputCol}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>a</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                keyboardType="numeric" placeholder="e.g. 1" placeholderTextColor={theme.textSecondary} value={a} onChangeText={setA} />
                        </View>
                        <View style={styles.inputCol}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>b</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                keyboardType="numeric" placeholder="e.g. -5" placeholderTextColor={theme.textSecondary} value={b} onChangeText={setB} />
                        </View>
                        <View style={styles.inputCol}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>c</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                keyboardType="numeric" placeholder="e.g. 6" placeholderTextColor={theme.textSecondary} value={c} onChangeText={setC} />
                        </View>
                    </View>
                </>
            );
        }

        if (mode === 'linear') {
            return (
                <>
                    <Text style={[styles.equation, { color: theme.text }]}>ax + b = 0</Text>
                    <View style={styles.inputRow}>
                        <View style={[styles.inputCol, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>a</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor={theme.textSecondary} value={a} onChangeText={setA} />
                        </View>
                        <View style={[styles.inputCol, { flex: 1 }]}>
                            <Text style={[styles.label, { color: theme.textSecondary }]}>b</Text>
                            <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                keyboardType="numeric" placeholder="e.g. -6" placeholderTextColor={theme.textSecondary} value={b} onChangeText={setB} />
                        </View>
                    </View>
                </>
            );
        }

        // Simultaneous
        return (
            <>
                <Text style={[styles.equation, { color: theme.text }]}>Equation 1: a₁x + b₁y = c₁</Text>
                <View style={styles.inputRow}>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>a₁</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. 2" placeholderTextColor={theme.textSecondary} value={a} onChangeText={setA} />
                    </View>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>b₁</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. 3" placeholderTextColor={theme.textSecondary} value={b} onChangeText={setB} />
                    </View>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>c₁</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. 8" placeholderTextColor={theme.textSecondary} value={c} onChangeText={setC} />
                    </View>
                </View>

                <Text style={[styles.equation, { color: theme.text, marginTop: 12 }]}>Equation 2: a₂x + b₂y = c₂</Text>
                <View style={styles.inputRow}>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>a₂</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. 1" placeholderTextColor={theme.textSecondary} value={d} onChangeText={setD} />
                    </View>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>b₂</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. -1" placeholderTextColor={theme.textSecondary} value={e} onChangeText={setE} />
                    </View>
                    <View style={styles.inputCol}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>c₂</Text>
                        <TextInput style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric" placeholder="e.g. 2" placeholderTextColor={theme.textSecondary} value={f} onChangeText={setF} />
                    </View>
                </View>
            </>
        );
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>🔣</Text>
                <Text style={[styles.title, { color: theme.text }]}>Algebra</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Solve equations instantly</Text>
            </View>

            {/* Mode Selector */}
            <View style={[styles.modeContainer, { backgroundColor: theme.card }]}>
                {modes.map((m) => (
                    <TouchableOpacity
                        key={m.key}
                        style={[styles.modeButton, mode === m.key && styles.modeButtonActive]}
                        onPress={() => { setMode(m.key); reset(); }}
                        activeOpacity={0.75}
                    >
                        <Text style={[styles.modeIcon, { color: mode === m.key ? 'white' : theme.text }]}>{m.icon}</Text>
                        <Text style={[styles.modeText, { color: mode === m.key ? 'white' : theme.textSecondary }]}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                {renderInputs()}

                <TouchableOpacity style={styles.calcButton} onPress={calculate} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Solve</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultContainer}>
                    <View style={[styles.resultHeroCard, { backgroundColor: result.color || '#10B981' }]}>
                        <Text style={styles.resultHeroLabel}>{result.label}</Text>
                        <Text style={styles.resultHeroValue}>{result.main}</Text>
                        <Text style={styles.resultDetail}>{result.detail}</Text>
                    </View>
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backButton: { marginTop: 8, marginBottom: 16 },
    backButtonBg: {
        alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    backButtonText: { fontSize: 16, fontWeight: '700' },
    headerSection: { alignItems: 'center', marginBottom: 24 },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 15, fontWeight: '500' },
    modeContainer: {
        flexDirection: 'row', borderRadius: 16, padding: 6, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    modeButton: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12, gap: 2,
    },
    modeButtonActive: { backgroundColor: COLORS.primary },
    modeIcon: { fontSize: 14, fontWeight: '800' },
    modeText: { fontSize: 12, fontWeight: '700' },
    card: {
        borderRadius: 20, padding: 22, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    equation: {
        fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16, fontStyle: 'italic',
    },
    inputRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
    inputCol: { flex: 1 },
    label: { fontSize: 12, marginBottom: 6, fontWeight: '700', letterSpacing: 0.8, textAlign: 'center' },
    input: {
        height: 48, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12,
        fontSize: 16, fontWeight: '500', textAlign: 'center',
    },
    calcButton: {
        backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center',
        marginTop: 8, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    calcButtonText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    resultContainer: { marginTop: 20 },
    resultHeroCard: {
        borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 14,
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    resultHeroLabel: {
        color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 8, letterSpacing: 0.5,
    },
    resultHeroValue: { color: 'white', fontSize: 28, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
    resultDetail: {
        color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginTop: 8, textAlign: 'center',
    },
});
