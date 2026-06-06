import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../../theme';
import AdBanner from '../../components/AdBanner';

export default function EMICalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor, currencyType, setCurrencyType } = useTheme();
    const [amount, setAmount] = useState('');
    const [rate, setRate] = useState('');
    const [tenure, setTenure] = useState('');
    const [result, setResult] = useState<any>(null);

    const CURRENCIES = ['$', '₹', '€', '£'];

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculateEMI = () => {
        const P = parseFloat(amount);
        const R = parseFloat(rate) / 12 / 100;
        const N = parseFloat(tenure);

        if (isNaN(P) || isNaN(R) || isNaN(N) || N === 0) return;

        const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
        const totalPayment = emi * N;
        const totalInterest = totalPayment - P;

        setResult({
            emi: emi.toFixed(2),
            totalPayment: totalPayment.toFixed(2),
            totalInterest: totalInterest.toFixed(2)
        });
        Keyboard.dismiss();
    };

    const formatCurrency = (val: string) => {
        return currencyType + parseFloat(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
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
                <Text style={styles.headerIcon}>💰</Text>
                <Text style={[styles.title, { color: theme.text }]}>EMI Calculator</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Equated Monthly Installment</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                {/* Currency Selector */}
                <View style={styles.currencyRow}>
                    {CURRENCIES.map(curr => (
                        <TouchableOpacity
                            key={curr}
                            style={[
                                styles.currencyBtn,
                                currencyType === curr ? { backgroundColor: COLORS.primary } : { backgroundColor: theme.surface, borderColor: theme.border }
                            ]}
                            onPress={() => setCurrencyType(curr)}
                        >
                            <Text style={[
                                styles.currencyText,
                                currencyType === curr ? { color: 'white' } : { color: theme.text }
                            ]}>{curr}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={[styles.label, { color: theme.textSecondary }]}>LOAN AMOUNT ({currencyType})</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="e.g. 500000"
                    placeholderTextColor={theme.textSecondary}
                    value={amount}
                    onChangeText={setAmount}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>INTEREST RATE (%)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="e.g. 8.5"
                    placeholderTextColor={theme.textSecondary}
                    value={rate}
                    onChangeText={setRate}
                />

                <Text style={[styles.label, { color: theme.textSecondary }]}>TENURE (MONTHS)</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder="e.g. 60"
                    placeholderTextColor={theme.textSecondary}
                    value={tenure}
                    onChangeText={setTenure}
                />

                <TouchableOpacity style={styles.calcButton} onPress={calculateEMI} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate EMI</Text>
                </TouchableOpacity>
            </View>

            {result && (
                <View style={[styles.resultContainer]}>
                    {/* EMI Hero */}
                    <View style={[styles.emiHeroCard, { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.emiHeroLabel}>Monthly EMI</Text>
                        <Text style={styles.emiHeroValue}>{formatCurrency(result.emi)}</Text>
                    </View>

                    {/* Details */}
                    <View style={styles.detailsRow}>
                        <View style={[styles.detailCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.detailIconBg, { backgroundColor: '#F59E0B15' }]}>
                                <Text style={styles.detailIcon}>📈</Text>
                            </View>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Interest</Text>
                            <Text style={[styles.detailValue, { color: '#F59E0B' }]}>{formatCurrency(result.totalInterest)}</Text>
                        </View>
                        <View style={[styles.detailCard, { backgroundColor: theme.card }]}>
                            <View style={[styles.detailIconBg, { backgroundColor: '#10B98115' }]}>
                                <Text style={styles.detailIcon}>💵</Text>
                            </View>
                            <Text style={[styles.detailLabel, { color: theme.textSecondary }]}>Total Payment</Text>
                            <Text style={[styles.detailValue, { color: '#10B981' }]}>{formatCurrency(result.totalPayment)}</Text>
                        </View>
                    </View>

                    {/* Breakdown */}
                    <View style={[styles.breakdownCard, { backgroundColor: theme.card }]}>
                        <Text style={[styles.breakdownTitle, { color: theme.text }]}>Payment Breakdown</Text>
                        <View style={styles.breakdownBarContainer}>
                            <View style={[styles.breakdownBar, {
                                flex: parseFloat(amount) || 1,
                                backgroundColor: COLORS.primary,
                            }]} />
                            <View style={[styles.breakdownBar, {
                                flex: parseFloat(result.totalInterest) || 1,
                                backgroundColor: '#F59E0B',
                            }]} />
                        </View>
                        <View style={styles.breakdownLegend}>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: COLORS.primary }]} />
                                <Text style={[styles.legendText, { color: theme.textSecondary }]}>Principal</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={[styles.legendDot, { backgroundColor: '#F59E0B' }]} />
                                <Text style={[styles.legendText, { color: theme.textSecondary }]}>Interest</Text>
                            </View>
                        </View>
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
    container: {
        flex: 1,
        padding: 20,
    },
    backButton: {
        marginTop: 8,
        marginBottom: 16,
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
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
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
    currencyRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    currencyBtn: {
        flex: 1,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    currencyText: {
        fontSize: 16,
        fontWeight: '700',
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
    // Results
    resultContainer: {
        marginTop: 20,
    },
    emiHeroCard: {
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        marginBottom: 14,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    emiHeroLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    emiHeroValue: {
        color: 'white',
        fontSize: 34,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    detailsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 14,
    },
    detailCard: {
        flex: 1,
        borderRadius: 18,
        padding: 18,
        alignItems: 'center',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    detailIconBg: {
        width: 40,
        height: 40,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    detailIcon: {
        fontSize: 20,
    },
    detailLabel: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 4,
        letterSpacing: 0.2,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '800',
        letterSpacing: -0.3,
    },
    // Breakdown
    breakdownCard: {
        borderRadius: 18,
        padding: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    breakdownTitle: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 14,
        letterSpacing: -0.2,
    },
    breakdownBarContainer: {
        flexDirection: 'row',
        height: 10,
        borderRadius: 5,
        overflow: 'hidden',
        marginBottom: 14,
        gap: 2,
    },
    breakdownBar: {
        borderRadius: 5,
    },
    breakdownLegend: {
        flexDirection: 'row',
        gap: 20,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    legendDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        marginRight: 8,
    },
    legendText: {
        fontSize: 13,
        fontWeight: '600',
    },
});
