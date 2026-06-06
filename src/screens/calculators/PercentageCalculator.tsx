import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../../theme';
import AdBanner from '../../components/AdBanner';

type CalcMode = 'percentage' | 'change' | 'discount';

export default function PercentageCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [mode, setMode] = useState<CalcMode>('percentage');
    const [value1, setValue1] = useState('');
    const [value2, setValue2] = useState('');
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const modes: { key: CalcMode; label: string; icon: string }[] = [
        { key: 'percentage', label: 'Find %', icon: '🔢' },
        { key: 'change', label: '% Change', icon: '📊' },
        { key: 'discount', label: 'Discount', icon: '🏷️' },
    ];

    const calculate = () => {
        const v1 = parseFloat(value1);
        const v2 = parseFloat(value2);
        if (isNaN(v1) || isNaN(v2)) return;

        if (mode === 'percentage') {
            const res = (v1 / 100) * v2;
            setResult({
                main: res.toFixed(2),
                label: `${v1}% of ${v2}`,
                detail: `${v2} × ${v1}/100 = ${res.toFixed(2)}`,
            });
        } else if (mode === 'change') {
            if (v1 === 0) return;
            const change = ((v2 - v1) / v1) * 100;
            const isIncrease = change >= 0;
            setResult({
                main: `${isIncrease ? '+' : ''}${change.toFixed(2)}%`,
                label: isIncrease ? 'Increase' : 'Decrease',
                detail: `From ${v1} to ${v2}`,
                color: isIncrease ? COLORS.success : COLORS.danger,
            });
        } else if (mode === 'discount') {
            const discountAmount = (v2 / 100) * v1;
            const finalPrice = v1 - discountAmount;
            setResult({
                main: finalPrice.toFixed(2),
                label: `You save ${discountAmount.toFixed(2)}`,
                detail: `${v2}% off on ${v1}`,
                savings: discountAmount.toFixed(2),
            });
        }
        Keyboard.dismiss();
    };

    const getInputLabels = (): [string, string, string, string] => {
        switch (mode) {
            case 'percentage':
                return ['PERCENTAGE (%)', 'e.g. 25', 'OF NUMBER', 'e.g. 200'];
            case 'change':
                return ['ORIGINAL VALUE', 'e.g. 100', 'NEW VALUE', 'e.g. 150'];
            case 'discount':
                return ['ORIGINAL PRICE', 'e.g. 999', 'DISCOUNT (%)', 'e.g. 20'];
        }
    };

    const [label1, placeholder1, label2, placeholder2] = getInputLabels();

    const reset = () => {
        setValue1('');
        setValue2('');
        setResult(null);
    };

    return (
        <SafeAreaView style={{ flex: 1, backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }} edges={['top', 'bottom']}>
        <ScrollView style={[styles.container]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>💯</Text>
                <Text style={[styles.title, { color: theme.text }]}>Percentage</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Quick percentage calculations</Text>
            </View>

            {/* Mode Selector */}
            <View style={[styles.modeContainer, { backgroundColor: theme.card }]}>
                {modes.map((m) => (
                    <TouchableOpacity
                        key={m.key}
                        style={[
                            styles.modeButton,
                            mode === m.key && styles.modeButtonActive,
                        ]}
                        onPress={() => { setMode(m.key); reset(); }}
                        activeOpacity={0.75}
                    >
                        <Text style={styles.modeIcon}>{m.icon}</Text>
                        <Text style={[
                            styles.modeText,
                            { color: mode === m.key ? 'white' : theme.textSecondary },
                        ]}>{m.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>{label1}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={placeholder1}
                    placeholderTextColor={theme.textSecondary}
                    value={value1}
                    onChangeText={setValue1}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>{label2}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={placeholder2}
                    placeholderTextColor={theme.textSecondary}
                    value={value2}
                    onChangeText={setValue2}
                />

                <TouchableOpacity style={styles.calcButton} onPress={calculate} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultContainer}>
                    <View style={[styles.resultHeroCard, { backgroundColor: result.color || COLORS.primary }]}>
                        <Text style={styles.resultHeroLabel}>{result.label}</Text>
                        <Text style={styles.resultHeroValue}>{result.main}</Text>
                        <Text style={styles.resultDetail}>{result.detail}</Text>
                    </View>

                    {result.savings && (
                        <View style={[styles.savingsCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.savingsIconBg, { backgroundColor: '#10B98115' }]}>
                                <Text style={styles.savingsIcon}>💰</Text>
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={[styles.savingsLabel, { color: theme.textSecondary }]}>Total Savings</Text>
                                <Text style={[styles.savingsValue, { color: COLORS.success }]}>{result.savings}</Text>
                            </View>
                        </View>
                    )}
                </View>
            )}

            <View style={{ height: 40 }} />
        <AdBanner />
        </ScrollView>
        </SafeAreaView>
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
        flexDirection: 'row', justifyContent: 'space-between', borderRadius: 16, padding: 6, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    modeButton: {
        flex: 1, alignItems: 'center', justifyContent: 'center',
        paddingVertical: 10, borderRadius: 12, marginHorizontal: 2,
    },
    modeButtonActive: { backgroundColor: COLORS.primary },
    modeIcon: { fontSize: 22, marginBottom: 6 },
    modeText: { fontSize: 12, fontWeight: '700', textAlign: 'center' },
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
    resultHeroValue: { color: 'white', fontSize: 38, fontWeight: '800', letterSpacing: -0.5 },
    resultDetail: {
        color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginTop: 8,
    },
    savingsCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, gap: 14,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    savingsIconBg: {
        width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center',
    },
    savingsIcon: { fontSize: 22 },
    savingsLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 2 },
    savingsValue: { fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
});
