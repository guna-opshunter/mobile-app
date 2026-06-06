import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../../theme';
import AdBanner from '../../components/AdBanner';

type Unit = 'celsius' | 'fahrenheit' | 'kelvin';

interface ConversionResult {
    celsius: string;
    fahrenheit: string;
    kelvin: string;
}

const UNIT_INFO: Record<Unit, { label: string; symbol: string; icon: string; color: string }> = {
    celsius: { label: 'Celsius', symbol: '°C', icon: '🌡️', color: '#EF4444' },
    fahrenheit: { label: 'Fahrenheit', symbol: '°F', icon: '🌤️', color: '#F97316' },
    kelvin: { label: 'Kelvin', symbol: 'K', icon: '❄️', color: '#3B82F6' },
};

export default function TemperatureConverter({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [fromUnit, setFromUnit] = useState<Unit>('celsius');
    const [value, setValue] = useState('');
    const [result, setResult] = useState<ConversionResult | null>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const convert = () => {
        const v = parseFloat(value);
        if (isNaN(v)) return;

        let c: number, f: number, k: number;

        switch (fromUnit) {
            case 'celsius':
                c = v;
                f = (v * 9 / 5) + 32;
                k = v + 273.15;
                break;
            case 'fahrenheit':
                c = (v - 32) * 5 / 9;
                f = v;
                k = (v - 32) * 5 / 9 + 273.15;
                break;
            case 'kelvin':
                c = v - 273.15;
                f = (v - 273.15) * 9 / 5 + 32;
                k = v;
                break;
        }

        setResult({
            celsius: c!.toFixed(2),
            fahrenheit: f!.toFixed(2),
            kelvin: k!.toFixed(2),
        });
        Keyboard.dismiss();
    };

    const getTemperatureEmoji = (celsius: number): string => {
        if (celsius <= 0) return '🥶';
        if (celsius <= 10) return '❄️';
        if (celsius <= 20) return '🌤️';
        if (celsius <= 30) return '☀️';
        if (celsius <= 40) return '🔥';
        return '🌋';
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
                <Text style={styles.headerIcon}>🌡️</Text>
                <Text style={[styles.title, { color: theme.text }]}>Temperature</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Convert between units</Text>
            </View>

            {/* Unit Selector */}
            <View style={[styles.unitContainer, { backgroundColor: theme.card }]}>
                <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>CONVERT FROM</Text>
                <View style={styles.unitRow}>
                    {(Object.keys(UNIT_INFO) as Unit[]).map((unit) => (
                        <TouchableOpacity
                            key={unit}
                            style={[
                                styles.unitButton,
                                fromUnit === unit && { backgroundColor: UNIT_INFO[unit].color },
                            ]}
                            onPress={() => { setFromUnit(unit); setResult(null); }}
                            activeOpacity={0.75}
                        >
                            <Text style={styles.unitIcon}>{UNIT_INFO[unit].icon}</Text>
                            <Text style={[
                                styles.unitText,
                                { color: fromUnit === unit ? 'white' : theme.textSecondary },
                            ]}>{UNIT_INFO[unit].symbol}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </View>

            {/* Input */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>
                    TEMPERATURE ({UNIT_INFO[fromUnit].symbol})
                </Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={`Enter temperature in ${UNIT_INFO[fromUnit].symbol}`}
                    placeholderTextColor={theme.textSecondary}
                    value={value}
                    onChangeText={setValue}
                />

                <TouchableOpacity
                    style={[styles.calcButton, { backgroundColor: UNIT_INFO[fromUnit].color }]}
                    onPress={convert}
                    activeOpacity={0.85}
                >
                    <Text style={styles.calcButtonText}>Convert 🔄</Text>
                </TouchableOpacity>
            </View>

            {/* Results */}
            {result && (
                <View style={styles.resultContainer}>
                    <View style={[styles.emojiCard, { backgroundColor: theme.card }]}>
                        <Text style={styles.tempEmoji}>
                            {getTemperatureEmoji(parseFloat(result.celsius))}
                        </Text>
                        <Text style={[styles.emojiDesc, { color: theme.textSecondary }]}>
                            {parseFloat(result.celsius) <= 0 ? 'Freezing!' :
                                parseFloat(result.celsius) <= 15 ? 'Cold' :
                                    parseFloat(result.celsius) <= 25 ? 'Comfortable' :
                                        parseFloat(result.celsius) <= 35 ? 'Warm' : 'Very Hot!'}
                        </Text>
                    </View>

                    {(Object.keys(UNIT_INFO) as Unit[])
                        .filter(u => u !== fromUnit)
                        .map((unit) => (
                            <View key={unit} style={[styles.resultCard, { backgroundColor: theme.card }]}>
                                <View style={[styles.resultIconBg, { backgroundColor: UNIT_INFO[unit].color + '15' }]}>
                                    <Text style={styles.resultIcon}>{UNIT_INFO[unit].icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.resultLabel, { color: theme.textSecondary }]}>
                                        {UNIT_INFO[unit].label}
                                    </Text>
                                    <Text style={[styles.resultValue, { color: UNIT_INFO[unit].color }]}>
                                        {result[unit]} {UNIT_INFO[unit].symbol}
                                    </Text>
                                </View>
                            </View>
                        ))}

                    {/* Original value */}
                    <View style={[styles.originalCard, { backgroundColor: UNIT_INFO[fromUnit].color }]}>
                        <Text style={styles.originalLabel}>Input</Text>
                        <Text style={styles.originalValue}>
                            {value} {UNIT_INFO[fromUnit].symbol}
                        </Text>
                    </View>
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
    sectionLabel: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
    unitContainer: {
        borderRadius: 20, padding: 18, marginBottom: 20,
        shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
    },
    unitRow: { flexDirection: 'row', gap: 10 },
    unitButton: {
        flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
        paddingVertical: 14, borderRadius: 14, gap: 6, backgroundColor: 'transparent',
    },
    unitIcon: { fontSize: 18 },
    unitText: { fontSize: 15, fontWeight: '700' },
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
    emojiCard: {
        borderRadius: 18, padding: 20, alignItems: 'center',
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    tempEmoji: { fontSize: 48, marginBottom: 8 },
    emojiDesc: { fontSize: 16, fontWeight: '600' },
    resultCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, gap: 14,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    resultIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    resultIcon: { fontSize: 24 },
    resultLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 4 },
    resultValue: { fontSize: 22, fontWeight: '800', letterSpacing: -0.3 },
    originalCard: {
        borderRadius: 18, padding: 20, alignItems: 'center',
        shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 8,
    },
    originalLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', marginBottom: 6 },
    originalValue: { color: 'white', fontSize: 26, fontWeight: '800' },
});
