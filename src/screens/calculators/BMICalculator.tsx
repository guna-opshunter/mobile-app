import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../../theme';
import { useRecords } from '../../context/RecordsContext';
import { ms, fp } from '../../utils/responsive';
import AdBanner from '../../components/AdBanner';

export default function BMICalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const { addBMIRecord } = useRecords();
    const [height, setHeight] = useState('');
    const [weight, setWeight] = useState('');
    const [result, setResult] = useState<any>(null);
    const [saved, setSaved] = useState(false);
    const [saveName, setSaveName] = useState('');

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculateBMI = () => {
        const h = parseFloat(height) / 100;
        const w = parseFloat(weight);

        if (isNaN(h) || isNaN(w) || h === 0) return;

        const bmi = w / (h * h);
        let category = '';
        let color = '#000';

        if (bmi < 18.5) {
            category = 'Underweight';
            color = '#3B82F6';
        } else if (bmi < 25) {
            category = 'Normal';
            color = '#10B981';
        } else if (bmi < 30) {
            category = 'Overweight';
            color = '#F59E0B';
        } else {
            category = 'Obese';
            color = '#EF4444';
        }

        setResult({
            bmi: bmi.toFixed(1),
            category,
            color
        });
        setSaved(false);
        Keyboard.dismiss();
    };

    const handleSaveRecord = (customName: string) => {
        if (!result) return;

        const name = customName.trim() || 'My BMI';

        addBMIRecord({
            name: name,
            height: parseFloat(height),
            weight: parseFloat(weight),
            bmi: parseFloat(result.bmi),
            category: result.category,
            color: result.color,
        });
        setSaved(true);
        setSaveName('');
    };

    return (
        <SafeAreaView style={[styles.safeArea, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]} edges={['top', 'bottom']}>
        <ScrollView style={styles.container}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>⚖️</Text>
                <Text style={[styles.title, { color: theme.text }]}>BMI Calculator</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Body Mass Index</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>HEIGHT (CM)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="e.g. 175"
                    placeholderTextColor={theme.textSecondary}
                    value={height}
                    onChangeText={setHeight}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>WEIGHT (KG)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="e.g. 70"
                    placeholderTextColor={theme.textSecondary}
                    value={weight}
                    onChangeText={setWeight}
                />

                <TouchableOpacity style={styles.calcButton} onPress={calculateBMI} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate BMI</Text>
                </TouchableOpacity>
            </View>

            {result && (
                <View style={[styles.card, styles.resultCard, { backgroundColor: theme.card }]}>
                    {/* BMI Value Display */}
                    <View style={[styles.bmiCircle, { borderColor: result.color + '40' }]}>
                        <Text style={[styles.resultValue, { color: result.color }]}>{result.bmi}</Text>
                        <View style={[styles.categoryPill, { backgroundColor: result.color + '15' }]}>
                            <Text style={[styles.resultCategory, { color: result.color }]}>{result.category}</Text>
                        </View>
                    </View>

                    {/* BMI Scale */}
                    <View style={styles.scaleContainer}>
                        {[
                            { label: 'Under', range: '<18.5', color: '#3B82F6' },
                            { label: 'Normal', range: '18.5-24.9', color: '#10B981' },
                            { label: 'Over', range: '25-29.9', color: '#F59E0B' },
                            { label: 'Obese', range: '≥30', color: '#EF4444' },
                        ].map((item, idx) => (
                            <View key={idx} style={styles.scaleItem}>
                                <View style={[styles.scaleBar, {
                                    backgroundColor: item.color,
                                    opacity: result.category.toLowerCase().startsWith(item.label.toLowerCase()) ? 1 : 0.3,
                                }]} />
                                <Text style={[styles.scaleLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                                <Text style={[styles.scaleRange, { color: theme.textSecondary }]}>{item.range}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Save Section */}
                    {!saved && (
                        <View style={styles.saveSection}>
                            <View style={[styles.saveDivider, { backgroundColor: theme.border }]} />
                            <Text style={[styles.saveLabel, { color: theme.text }]}>💾 Save to Records</Text>
                            <TextInput
                                style={[styles.nameInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                                placeholder="Enter name (optional)"
                                placeholderTextColor={theme.textSecondary}
                                value={saveName}
                                onChangeText={setSaveName}
                            />
                            <View style={styles.saveButtonRow}>
                                <TouchableOpacity
                                    style={styles.quickSaveButton}
                                    onPress={() => handleSaveRecord('My BMI')}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.saveButtonText}>Quick Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.customSaveButton, !saveName.trim() && styles.saveButtonDisabled]}
                                    onPress={() => handleSaveRecord(saveName)}
                                    disabled={!saveName.trim()}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.saveButtonText}>Save as "{saveName.trim() || '...'}"</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                    {saved && (
                        <View style={styles.savedBadge}>
                            <Text style={styles.savedBadgeText}>✓ Saved to Records</Text>
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
    safeArea: {
        flex: 1,
    },
    container: {
        flex: 1,
        padding: ms(20),
    },
    backButton: {
        marginTop: ms(8),
        marginBottom: ms(16),
    },
    backButtonBg: {
        alignSelf: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 3,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '700',
    },
    headerSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    headerIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    title: {
        fontSize: fp(28),
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: fp(15),
        fontWeight: '500',
    },
    card: {
        borderRadius: 20,
        padding: 22,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },
    label: {
        fontSize: 12,
        marginBottom: 8,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 18,
        fontSize: 16,
        marginBottom: 18,
        fontWeight: '500',
    },
    calcButton: {
        backgroundColor: COLORS.primary,
        padding: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 4,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
    calcButtonText: {
        color: 'white',
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    resultCard: {
        marginTop: 20,
        alignItems: 'center',
    },
    bmiCircle: {
        width: 160,
        height: 160,
        borderRadius: 80,
        borderWidth: 6,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    resultValue: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: -1,
    },
    categoryPill: {
        paddingHorizontal: 14,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 4,
    },
    resultCategory: {
        fontSize: 14,
        fontWeight: '700',
    },
    scaleContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 20,
        gap: 6,
    },
    scaleItem: {
        flex: 1,
        alignItems: 'center',
    },
    scaleBar: {
        width: '100%',
        height: 6,
        borderRadius: 3,
        marginBottom: 6,
    },
    scaleLabel: {
        fontSize: 11,
        fontWeight: '600',
        marginBottom: 1,
    },
    scaleRange: {
        fontSize: 9,
        fontWeight: '500',
    },
    saveSection: {
        marginTop: 8,
        width: '100%',
    },
    saveDivider: {
        height: 1,
        marginBottom: 20,
    },
    saveLabel: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        textAlign: 'center',
    },
    nameInput: {
        height: 48,
        borderWidth: 1.5,
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 15,
        marginBottom: 12,
        fontWeight: '500',
    },
    saveButtonRow: {
        flexDirection: 'row',
        gap: 10,
    },
    quickSaveButton: {
        flex: 1,
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    customSaveButton: {
        flex: 1,
        backgroundColor: '#3B82F6',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: '#3B82F6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonDisabled: {
        backgroundColor: '#94A3B8',
        opacity: 0.6,
        shadowOpacity: 0,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '700',
    },
    savedBadge: {
        backgroundColor: '#10B981',
        paddingVertical: 16,
        borderRadius: 14,
        alignItems: 'center',
        marginTop: 20,
        width: '100%',
        shadowColor: '#10B981',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    savedBadgeText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
