import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

type LogMode = 'log' | 'ln' | 'custom' | 'antilog';

export default function LogCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [mode, setMode] = useState<LogMode>('log');
    const [value, setValue] = useState('');
    const [base, setBase] = useState('');
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const modes: { key: LogMode; label: string; icon: string }[] = [
        { key: 'log', label: 'log₁₀', icon: '🔟' },
        { key: 'ln', label: 'ln', icon: '📈' },
        { key: 'custom', label: 'logₙ', icon: '🔢' },
        { key: 'antilog', label: 'Antilog', icon: '🔄' },
    ];

    const calculate = () => {
        const v = parseFloat(value);
        if (isNaN(v)) return;

        if (mode === 'log') {
            if (v <= 0) {
                setResult({ main: 'Error', label: 'Value must be > 0', detail: 'Logarithm undefined for x ≤ 0', color: COLORS.danger });
                return;
            }
            const res = Math.log10(v);
            setResult({
                main: res.toFixed(6),
                label: `log₁₀(${v})`,
                detail: `10^${res.toFixed(6)} = ${v}`,
            });
        } else if (mode === 'ln') {
            if (v <= 0) {
                setResult({ main: 'Error', label: 'Value must be > 0', detail: 'Natural log undefined for x ≤ 0', color: COLORS.danger });
                return;
            }
            const res = Math.log(v);
            setResult({
                main: res.toFixed(6),
                label: `ln(${v})`,
                detail: `e^${res.toFixed(6)} = ${v}`,
            });
        } else if (mode === 'custom') {
            const b = parseFloat(base);
            if (isNaN(b) || b <= 0 || b === 1) {
                setResult({ main: 'Error', label: 'Invalid base', detail: 'Base must be > 0 and ≠ 1', color: COLORS.danger });
                return;
            }
            if (v <= 0) {
                setResult({ main: 'Error', label: 'Value must be > 0', detail: 'Logarithm undefined for x ≤ 0', color: COLORS.danger });
                return;
            }
            const res = Math.log(v) / Math.log(b);
            setResult({
                main: res.toFixed(6),
                label: `log${b}(${v})`,
                detail: `${b}^${res.toFixed(6)} = ${v}`,
            });
        } else if (mode === 'antilog') {
            // antilog base 10: 10^v
            const res10 = Math.pow(10, v);
            const resE = Math.exp(v);
            setResult({
                main: res10.toFixed(4),
                label: `10^${v}`,
                detail: `Antilog₁₀(${v}) = ${res10.toFixed(4)}\ne^${v} = ${resE.toFixed(4)}`,
                extra: { label: 'Natural Antilog (e^x)', value: resE.toFixed(4) },
            });
        }
        Keyboard.dismiss();
    };

    const reset = () => {
        setValue('');
        setBase('');
        setResult(null);
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>📊</Text>
                <Text style={[styles.title, { color: theme.text }]}>Logarithm</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Log, Ln, Custom base & Antilog</Text>
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
                        <Text style={styles.modeIcon}>{m.icon}</Text>
                        <Text style={[styles.modeText, { color: mode === m.key ? 'white' : theme.textSecondary }]}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                {mode === 'custom' && (
                    <>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>BASE</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric"
                            placeholder="e.g. 2"
                            placeholderTextColor={theme.textSecondary}
                            value={base}
                            onChangeText={setBase}
                        />
                    </>
                )}

                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {mode === 'antilog' ? 'EXPONENT' : 'VALUE'}
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={mode === 'antilog' ? 'e.g. 3' : 'e.g. 100'}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={setValue}
                />

                <TouchableOpacity style={styles.calcButton} onPress={calculate} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultContainer}>
                    <View style={[styles.resultHeroCard, { backgroundColor: result.color || '#6366F1' }]}>
                        <Text style={styles.resultHeroLabel}>{result.label}</Text>
                        <Text style={styles.resultHeroValue}>{result.main}</Text>
                        <Text style={styles.resultDetail}>{result.detail}</Text>
                    </View>

                    {result.extra && (
                        <View style={[styles.extraCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.extraIconBg, { backgroundColor: '#6366F115' }]}>
                                <Text style={styles.extraIcon}>📈</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.extraLabel, { color: theme.textSecondary }]}>{result.extra.label}</Text>
                                <Text style={[styles.extraValue, { color: COLORS.primary }]}>{result.extra.value}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            {/* Reference Card */}
            <View style={[styles.refCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.refTitle, { color: theme.text }]}>Quick Reference</Text>
                <View style={styles.refRow}>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>log₁₀(10) = 1</Text>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>log₁₀(100) = 2</Text>
                </View>
                <View style={styles.refRow}>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>ln(e) = 1</Text>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>ln(1) = 0</Text>
                </View>
                <View style={styles.refRow}>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>log₂(8) = 3</Text>
                    <Text style={[styles.refItem, { color: theme.textSecondary }]}>e ≈ 2.71828</Text>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backButton: { marginTop: 40, marginBottom: 16 },
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
        paddingVertical: 10, borderRadius: 12, gap: 4,
    },
    modeButtonActive: { backgroundColor: COLORS.primary },
    modeIcon: { fontSize: 16 },
    modeText: { fontSize: 11, fontWeight: '700' },
    card: {
        borderRadius: 20, padding: 22, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    label: { fontSize: 12, marginBottom: 8, fontWeight: '700', letterSpacing: 0.8 },
    input: {
        height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18,
        fontSize: 16, marginBottom: 18, fontWeight: '500',
    },
    calcButton: {
        backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center',
        marginTop: 4, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
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
    resultHeroValue: { color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
    resultDetail: {
        color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginTop: 8, textAlign: 'center',
    },
    extraCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, gap: 14,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    extraIconBg: {
        width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    extraIcon: { fontSize: 22 },
    extraLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 2 },
    extraValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
    refCard: {
        borderRadius: 18, padding: 20, marginTop: 20, elevation: 3,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    refTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12, letterSpacing: 0.2 },
    refRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
    refItem: { fontSize: 13, fontWeight: '500' },
});
