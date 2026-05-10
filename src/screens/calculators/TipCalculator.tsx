import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

export default function TipCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [billAmount, setBillAmount] = useState('');
    const [tipPercent, setTipPercent] = useState('15');
    const [splitCount, setSplitCount] = useState('1');

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculateTip = () => {
        const bill = parseFloat(billAmount) || 0;
        const tipPct = parseFloat(tipPercent) || 0;
        const split = parseInt(splitCount) || 1;

        const totalTipAmount = bill * (tipPct / 100);
        const totalBillAmount = bill + totalTipAmount;

        const tipPerPerson = totalTipAmount / split;
        const totalPerPerson = totalBillAmount / split;

        return {
            totalTipAmount: totalTipAmount.toFixed(2),
            totalBillAmount: totalBillAmount.toFixed(2),
            tipPerPerson: tipPerPerson.toFixed(2),
            totalPerPerson: totalPerPerson.toFixed(2)
        };
    };

    const results = calculateTip();
    const COMMON_TIPS = [10, 15, 18, 20, 25];

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]} showsVerticalScrollIndicator={false}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>💵</Text>
                <Text style={[styles.title, { color: theme.text }]}>Tip Calculator</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Easy bill split & tip</Text>
            </View>

            {/* Input Card */}
            <View style={[styles.inputCard, { backgroundColor: theme.card }]}>
                {/* Bill Amount */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>BILL AMOUNT</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <Text style={[styles.currencySymbol, { color: theme.textSecondary }]}>$</Text>
                    <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={billAmount}
                        onChangeText={setBillAmount}
                        keyboardType="decimal-pad"
                        placeholder="0.00"
                        placeholderTextColor={theme.textSecondary}
                    />
                </View>

                {/* Tip Percentage */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 24 }]}>TIP PERCENTAGE (%)</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                    <TextInput
                        style={[styles.input, { color: theme.text, paddingLeft: 16 }]}
                        value={tipPercent}
                        onChangeText={setTipPercent}
                        keyboardType="numeric"
                        placeholder="15"
                        placeholderTextColor={theme.textSecondary}
                        maxLength={3}
                    />
                    <Text style={[styles.currencySymbol, { color: theme.textSecondary, paddingRight: 16 }]}>%</Text>
                </View>

                <View style={styles.chipContainer}>
                    {COMMON_TIPS.map(tip => (
                        <TouchableOpacity
                            key={tip}
                            style={[
                                styles.chipBtn,
                                tipPercent === tip.toString() ? { backgroundColor: COLORS.primary } : { backgroundColor: theme.surface, borderColor: theme.border }
                            ]}
                            onPress={() => {
                                setTipPercent(tip.toString());
                                Keyboard.dismiss();
                            }}
                        >
                            <Text style={[
                                styles.chipText,
                                tipPercent === tip.toString() ? { color: 'white' } : { color: theme.text }
                            ]}>{tip}%</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Split */}
                <Text style={[styles.inputLabel, { color: theme.textSecondary, marginTop: 24 }]}>SPLIT WITH</Text>
                <View style={styles.splitContainer}>
                    <TouchableOpacity
                        style={[styles.adjustBtn, { backgroundColor: theme.surface }]}
                        onPress={() => setSplitCount(Math.max(1, parseInt(splitCount || '1') - 1).toString())}
                    >
                        <Text style={[styles.adjustBtnText, { color: theme.text }]}>-</Text>
                    </TouchableOpacity>
                    
                    <View style={[styles.splitInputContainer, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                        <Text style={[styles.splitIcon, { color: theme.textSecondary }]}>👥</Text>
                        <TextInput
                            style={[styles.splitInput, { color: theme.text }]}
                            value={splitCount}
                            onChangeText={setSplitCount}
                            keyboardType="numeric"
                            maxLength={3}
                        />
                    </View>

                    <TouchableOpacity
                        style={[styles.adjustBtn, { backgroundColor: theme.surface }]}
                        onPress={() => setSplitCount((parseInt(splitCount || '1') + 1).toString())}
                    >
                        <Text style={[styles.adjustBtnText, { color: theme.text }]}>+</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Results Card */}
            <View style={[styles.resultsCard, { backgroundColor: COLORS.primary }]}>
                {parseInt(splitCount) > 1 && (
                    <>
                        <View style={styles.resultRow}>
                            <View>
                                <Text style={styles.resultTitle}>Tip Amount</Text>
                                <Text style={styles.resultSubtitle}>/ person</Text>
                            </View>
                            <Text style={styles.resultValue}>${results.tipPerPerson}</Text>
                        </View>
                        <View style={styles.divider} />
                    </>
                )}
                <View style={styles.resultRow}>
                    <View>
                        <Text style={styles.resultTitle}>Total Amount</Text>
                        <Text style={styles.resultSubtitle}>{parseInt(splitCount) > 1 ? '/ person' : 'including tip'}</Text>
                    </View>
                    <Text style={[styles.resultValue, styles.resultValueLarge]}>${results.totalPerPerson}</Text>
                </View>

                <View style={styles.totalBreakdown}>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Total Bill</Text>
                        <Text style={styles.breakdownValue}>${results.totalBillAmount}</Text>
                    </View>
                    <View style={styles.breakdownItem}>
                        <Text style={styles.breakdownLabel}>Total Tip</Text>
                        <Text style={styles.breakdownValue}>${results.totalTipAmount}</Text>
                    </View>
                </View>
            </View>

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    backButton: {
        marginTop: 40,
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
    inputCard: {
        borderRadius: 24,
        padding: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.08,
        shadowRadius: 16,
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.2,
        marginBottom: 10,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        height: 56,
        borderWidth: 1.5,
        borderRadius: 16,
        overflow: 'hidden',
    },
    currencySymbol: {
        fontSize: 20,
        fontWeight: '600',
        paddingLeft: 16,
    },
    input: {
        flex: 1,
        height: '100%',
        fontSize: 24,
        fontWeight: '700',
        paddingHorizontal: 12,
    },
    chipContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        marginTop: 14,
        gap: 8,
    },
    chipBtn: {
        flex: 1,
        minWidth: 46,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
    },
    chipText: {
        fontSize: 14,
        fontWeight: '700',
    },
    splitContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    adjustBtn: {
        width: 50,
        height: 50,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
    },
    adjustBtnText: {
        fontSize: 24,
        fontWeight: '600',
    },
    splitInputContainer: {
        flex: 1,
        marginHorizontal: 14,
        height: 50,
        borderWidth: 1.5,
        borderRadius: 14,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    splitIcon: {
        fontSize: 18,
        marginRight: 6,
    },
    splitInput: {
        fontSize: 22,
        fontWeight: '700',
        minWidth: 40,
        textAlign: 'center',
    },
    resultsCard: {
        borderRadius: 24,
        padding: 28,
        elevation: 10,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.35,
        shadowRadius: 20,
    },
    resultRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    resultTitle: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    resultSubtitle: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        marginTop: 2,
    },
    resultValue: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    resultValueLarge: {
        fontSize: 36,
    },
    divider: {
        height: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
        marginVertical: 20,
    },
    totalBreakdown: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 24,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    breakdownItem: {
        alignItems: 'center',
        flex: 1,
    },
    breakdownLabel: {
        color: 'rgba(255,255,255,0.7)',
        fontSize: 12,
        fontWeight: '600',
        textTransform: 'uppercase',
        marginBottom: 6,
    },
    breakdownValue: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
    },
});
