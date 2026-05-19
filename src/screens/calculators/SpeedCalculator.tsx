import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

type SolveFor = 'speed' | 'distance' | 'time';

export default function SpeedCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [solveFor, setSolveFor] = useState<SolveFor>('speed');
    const [input1, setInput1] = useState('');
    const [input2, setInput2] = useState('');
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const modes: { key: SolveFor; label: string; icon: string; color: string }[] = [
        { key: 'speed', label: 'Speed', icon: '🏎️', color: '#EF4444' },
        { key: 'distance', label: 'Distance', icon: '📏', color: '#3B82F6' },
        { key: 'time', label: 'Time', icon: '⏱️', color: '#10B981' },
    ];

    const getLabels = (): { l1: string; p1: string; l2: string; p2: string } => {
        switch (solveFor) {
            case 'speed':
                return { l1: 'DISTANCE (km)', p1: 'e.g. 150', l2: 'TIME (hours)', p2: 'e.g. 2.5' };
            case 'distance':
                return { l1: 'SPEED (km/h)', p1: 'e.g. 60', l2: 'TIME (hours)', p2: 'e.g. 3' };
            case 'time':
                return { l1: 'DISTANCE (km)', p1: 'e.g. 200', l2: 'SPEED (km/h)', p2: 'e.g. 80' };
        }
    };

    const calculate = () => {
        const v1 = parseFloat(input1);
        const v2 = parseFloat(input2);
        if (isNaN(v1) || isNaN(v2) || v2 === 0) return;

        let res: number;
        let unit: string;
        let formula: string;
        let icon: string;

        switch (solveFor) {
            case 'speed':
                res = v1 / v2;
                unit = 'km/h';
                formula = `Speed = ${v1} km ÷ ${v2} h`;
                icon = '🏎️';
                break;
            case 'distance':
                res = v1 * v2;
                unit = 'km';
                formula = `Distance = ${v1} km/h × ${v2} h`;
                icon = '📏';
                break;
            case 'time':
                res = v1 / v2;
                unit = 'hours';
                formula = `Time = ${v1} km ÷ ${v2} km/h`;
                icon = '⏱️';
                break;
        }

        const hours = Math.floor(res!);
        const minutes = Math.round((res! - hours) * 60);

        setResult({
            value: res!.toFixed(2),
            unit: unit!,
            formula: formula!,
            icon: icon!,
            color: modes.find(m => m.key === solveFor)!.color,
            timeFormatted: solveFor === 'time' ? `${hours}h ${minutes}m` : null,
            speedMph: solveFor === 'speed' ? (res! * 0.621371).toFixed(2) : null,
            speedMs: solveFor === 'speed' ? (res! / 3.6).toFixed(2) : null,
        });
        Keyboard.dismiss();
    };

    const { l1, p1, l2, p2 } = getLabels();

    const reset = () => {
        setInput1('');
        setInput2('');
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
                <Text style={styles.headerIcon}>🚀</Text>
                <Text style={[styles.title, { color: theme.text }]}>Speed Calculator</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Speed • Distance • Time</Text>
            </View>

            {/* Formula Display */}
            <View style={[styles.formulaCard, { backgroundColor: theme.card }]}>
                <Text style={styles.formulaEmoji}>📐</Text>
                <Text style={[styles.formulaText, { color: theme.text }]}>
                    Speed = Distance ÷ Time
                </Text>
            </View>

            {/* Solve For Selector */}
            <View style={[styles.modeContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>SOLVE FOR</Text>
                <View style={styles.modeRow}>
                    {modes.map((m) => (
                        <TouchableOpacity
                            key={m.key}
                            style={[
                                styles.modeButton,
                                solveFor === m.key && { backgroundColor: m.color },
                            ]}
                            onPress={() => { setSolveFor(m.key); reset(); }}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.modeIcon}>{m.icon}</Text>
                            <Text style={[
                                styles.modeText,
                                { color: solveFor === m.key ? 'white' : theme.textSecondary },
                            ]}>{m.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{l1}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={p1}
                    placeholderTextColor={theme.textSecondary}
                    value={input1}
                    onChangeText={setInput1}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>{l2}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={p2}
                    placeholderTextColor={theme.textSecondary}
                    value={input2}
                    onChangeText={setInput2}
                />

                <TouchableOpacity
                    style={[styles.calcButton, { backgroundColor: modes.find(m => m.key === solveFor)!.color }]}
                    onPress={calculate}
                    activeOpacity={0.85}
                >
                    <Text style={styles.calcButtonText}>Calculate {modes.find(m => m.key === solveFor)!.label}</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultContainer}>
                    <View style={[styles.heroCard, { backgroundColor: result.color }]}>
                        <Text style={styles.heroIcon}>{result.icon}</Text>
                        <Text style={styles.heroLabel}>{modes.find(m => m.key === solveFor)!.label}</Text>
                        <Text style={styles.heroValue}>
                            {result.value} {result.unit}
                        </Text>
                        {result.timeFormatted && (
                            <Text style={styles.heroSub}>{result.timeFormatted}</Text>
                        )}
                    </View>

                    <View style={[styles.formulaResultCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.formulaResultLabel, { color: theme.textSecondary }]}>Formula Used</Text>
                        <Text style={[styles.formulaResultText, { color: theme.text }]}>{result.formula}</Text>
                    </View>

                    {result.speedMph && (
                        <View style={styles.extraRow}>
                            <View style={[styles.extraCard, { backgroundColor: theme.card }]}>
                                <Text style={styles.extraIcon}>🇺🇸</Text>
                                <Text style={[styles.extraLabel, { color: theme.textSecondary }]}>mph</Text>
                                <Text style={[styles.extraValue, { color: '#F97316' }]}>{result.speedMph}</Text>
                            </View>
                            <View style={[styles.extraCard, { backgroundColor: theme.card }]}>
                                <Text style={styles.extraIcon}>⚡</Text>
                                <Text style={[styles.extraLabel, { color: theme.textSecondary }]}>m/s</Text>
                                <Text style={[styles.extraValue, { color: '#8B5CF6' }]}>{result.speedMs}</Text>
                            </View>
                        </View>
                    )}
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
    formulaCard: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
        borderRadius: 14, padding: 14, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 6, elevation: 2,
    },
    formulaEmoji: { fontSize: 20 },
    formulaText: { fontSize: 15, fontWeight: '600', fontStyle: 'italic' },
    sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
    modeContainer: {
        borderRadius: 20, padding: 18, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    modeRow: { flexDirection: 'row', justifyContent: 'space-between', marginHorizontal: -4 },
    modeButton: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 14, marginHorizontal: 4,
    },
    modeIcon: { fontSize: 24, marginBottom: 6 },
    modeText: { fontSize: 12, fontWeight: '700' },
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
        padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4,
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    calcButtonText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    resultContainer: { marginTop: 20, gap: 12 },
    heroCard: {
        borderRadius: 20, padding: 28, alignItems: 'center',
        shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    heroIcon: { fontSize: 36, marginBottom: 8 },
    heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', letterSpacing: 0.5 },
    heroValue: { color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: -0.5, marginTop: 4 },
    heroSub: { color: 'rgba(255,255,255,0.7)', fontSize: 16, fontWeight: '600', marginTop: 6 },
    formulaResultCard: {
        borderRadius: 16, padding: 16, alignItems: 'center',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    formulaResultLabel: { fontSize: 11, fontWeight: '600', letterSpacing: 0.5, marginBottom: 6 },
    formulaResultText: { fontSize: 15, fontWeight: '700' },
    extraRow: { flexDirection: 'row', gap: 12 },
    extraCard: {
        flex: 1, borderRadius: 16, padding: 18, alignItems: 'center',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    extraIcon: { fontSize: 24, marginBottom: 6 },
    extraLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
    extraValue: { fontSize: 20, fontWeight: '800' },
});
