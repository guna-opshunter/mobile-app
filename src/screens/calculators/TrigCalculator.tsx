import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

type TrigFunc = 'sin' | 'cos' | 'tan' | 'asin' | 'acos' | 'atan';
type AngleUnit = 'deg' | 'rad';

export default function TrigCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [func, setFunc] = useState<TrigFunc>('sin');
    const [unit, setUnit] = useState<AngleUnit>('deg');
    const [value, setValue] = useState('');
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const functions: { key: TrigFunc; label: string }[] = [
        { key: 'sin', label: 'sin' },
        { key: 'cos', label: 'cos' },
        { key: 'tan', label: 'tan' },
        { key: 'asin', label: 'sin⁻¹' },
        { key: 'acos', label: 'cos⁻¹' },
        { key: 'atan', label: 'tan⁻¹' },
    ];

    const calculate = () => {
        const v = parseFloat(value);
        if (isNaN(v)) return;

        let res: number;
        let label = '';
        let detail = '';

        const isInverse = func.startsWith('a');

        if (isInverse) {
            // Inverse trig: input is a ratio, output is an angle
            if (func === 'asin') {
                if (v < -1 || v > 1) {
                    setResult({ main: 'Error', label: 'sin⁻¹ requires input between -1 and 1', detail: '', color: COLORS.danger });
                    return;
                }
                res = Math.asin(v);
            } else if (func === 'acos') {
                if (v < -1 || v > 1) {
                    setResult({ main: 'Error', label: 'cos⁻¹ requires input between -1 and 1', detail: '', color: COLORS.danger });
                    return;
                }
                res = Math.acos(v);
            } else {
                res = Math.atan(v);
            }
            const degResult = (res * 180) / Math.PI;
            const radResult = res;
            label = `${func}(${v})`;
            detail = `${degResult.toFixed(4)}° = ${radResult.toFixed(6)} rad`;
            setResult({
                main: unit === 'deg' ? `${degResult.toFixed(4)}°` : `${radResult.toFixed(6)} rad`,
                label,
                detail,
            });
        } else {
            // Regular trig: input is angle, output is ratio
            const radians = unit === 'deg' ? (v * Math.PI) / 180 : v;
            if (func === 'sin') res = Math.sin(radians);
            else if (func === 'cos') res = Math.cos(radians);
            else res = Math.tan(radians);

            // Handle very small numbers (basically zero)
            if (Math.abs(res) < 1e-10) res = 0;

            const unitLabel = unit === 'deg' ? '°' : ' rad';
            label = `${func}(${v}${unitLabel})`;
            detail = unit === 'deg' ? `${v}° = ${radians.toFixed(6)} radians` : `${v} rad = ${((v * 180) / Math.PI).toFixed(4)}°`;

            setResult({
                main: res.toFixed(6),
                label,
                detail,
            });
        }
        Keyboard.dismiss();
    };

    const reset = () => {
        setValue('');
        setResult(null);
    };

    const isInverse = func.startsWith('a');

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>📐</Text>
                <Text style={[styles.title, { color: theme.text }]}>Trigonometry</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Sin, Cos, Tan & inverses</Text>
            </View>

            {/* Function Selector */}
            <View style={[styles.funcContainer, { backgroundColor: theme.card }]}>
                {functions.map((f) => (
                    <TouchableOpacity
                        key={f.key}
                        style={[
                            styles.funcButton,
                            func === f.key && styles.funcButtonActive,
                        ]}
                        onPress={() => { setFunc(f.key); reset(); }}
                        activeOpacity={0.75}
                    >
                        <Text style={[
                            styles.funcText,
                            { color: func === f.key ? 'white' : theme.textSecondary },
                        ]}>{f.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Angle Unit Toggle */}
            {!isInverse && (
                <View style={[styles.unitRow, { backgroundColor: theme.card }]}>
                    <Text style={[styles.unitLabel, { color: theme.textSecondary }]}>ANGLE UNIT</Text>
                    <View style={styles.unitToggle}>
                        <TouchableOpacity
                            style={[styles.unitBtn, unit === 'deg' && { backgroundColor: COLORS.primary }]}
                            onPress={() => { setUnit('deg'); reset(); }}
                        >
                            <Text style={[styles.unitBtnText, { color: unit === 'deg' ? '#fff' : theme.textSecondary }]}>Degrees</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.unitBtn, unit === 'rad' && { backgroundColor: COLORS.primary }]}
                            onPress={() => { setUnit('rad'); reset(); }}
                        >
                            <Text style={[styles.unitBtnText, { color: unit === 'rad' ? '#fff' : theme.textSecondary }]}>Radians</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            )}

            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    {isInverse ? 'VALUE (ratio)' : `ANGLE (${unit === 'deg' ? 'degrees' : 'radians'})`}
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={isInverse ? 'e.g. 0.5' : unit === 'deg' ? 'e.g. 45' : 'e.g. 0.7854'}
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
                    <View style={[styles.resultHeroCard, { backgroundColor: result.color || '#8B5CF6' }]}>
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
    funcContainer: {
        flexDirection: 'row', flexWrap: 'wrap', borderRadius: 16, padding: 6, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    funcButton: {
        width: '33%', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 12, borderRadius: 12,
    },
    funcButtonActive: { backgroundColor: COLORS.primary },
    funcText: { fontSize: 15, fontWeight: '700' },
    unitRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        borderRadius: 16, padding: 16, marginBottom: 16,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    unitLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8 },
    unitToggle: { flexDirection: 'row', gap: 8 },
    unitBtn: {
        paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10,
    },
    unitBtnText: { fontSize: 13, fontWeight: '700' },
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
        color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500', marginTop: 8,
    },
});
