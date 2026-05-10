import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, Alert } from 'react-native';
import { useTheme, COLORS } from '../../theme';
import { useRecords, getBirthdayCountdown } from '../../context/RecordsContext';

export default function AgeCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const { addBirthdayRecord } = useRecords();
    const [day, setDay] = useState('');
    const [month, setMonth] = useState('');
    const [year, setYear] = useState('');
    const [result, setResult] = useState<any>(null);
    const [countdown, setCountdown] = useState<any>(null);
    const [saved, setSaved] = useState(false);
    const [saveName, setSaveName] = useState('');

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculateAge = () => {
        const d = parseInt(day);
        const m = parseInt(month) - 1; // Month is 0-indexed
        const y = parseInt(year);

        if (isNaN(d) || isNaN(m) || isNaN(y)) return;

        const birthDate = new Date(y, m, d);
        const today = new Date();

        if (birthDate > today) {
            alert("Birth date cannot be in the future!");
            return;
        }

        let years = today.getFullYear() - birthDate.getFullYear();
        let months = today.getMonth() - birthDate.getMonth();
        let days = today.getDate() - birthDate.getDate();

        if (days < 0) {
            months--;
            const lastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
            days += lastMonth.getDate();
        }

        if (months < 0) {
            years--;
            months += 12;
        }

        setResult({ years, months, days });
        setSaved(false);
        Keyboard.dismiss();
    };

    // Update countdown every second when result is shown
    useEffect(() => {
        if (!result || !day || !month) return;

        const updateCountdown = () => {
            const cd = getBirthdayCountdown(parseInt(day), parseInt(month));
            setCountdown(cd);
        };

        updateCountdown();
        const interval = setInterval(updateCountdown, 1000);
        return () => clearInterval(interval);
    }, [result, day, month]);

    const handleSaveBirthday = (customName: string) => {
        if (!result) return;

        const name = customName.trim() || 'My Birthday';

        addBirthdayRecord({
            day: parseInt(day),
            month: parseInt(month),
            year: parseInt(year),
            name: name,
            ageYears: result.years,
            ageMonths: result.months,
            ageDays: result.days,
        });
        setSaved(true);
        setSaveName('');
    };

    return (
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>🎂</Text>
                <Text style={[styles.title, { color: theme.text }]}>Age Calculator</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Date of Birth</Text>
            </View>

            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <Text style={[styles.label, { color: theme.textSecondary }]}>ENTER YOUR DATE OF BIRTH</Text>

                <View style={styles.dateRow}>
                    <View style={styles.dateInputContainer}>
                        <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Day</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric"
                            placeholder="DD"
                            placeholderTextColor={theme.textSecondary}
                            maxLength={2}
                            value={day}
                            onChangeText={setDay}
                        />
                    </View>
                    <View style={styles.dateInputContainer}>
                        <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Month</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric"
                            placeholder="MM"
                            placeholderTextColor={theme.textSecondary}
                            maxLength={2}
                            value={month}
                            onChangeText={setMonth}
                        />
                    </View>
                    <View style={styles.dateInputContainer}>
                        <Text style={[styles.smallLabel, { color: theme.textSecondary }]}>Year</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric"
                            placeholder="YYYY"
                            placeholderTextColor={theme.textSecondary}
                            maxLength={4}
                            value={year}
                            onChangeText={setYear}
                        />
                    </View>
                </View>

                <TouchableOpacity style={styles.calcButton} onPress={calculateAge} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate Age</Text>
                </TouchableOpacity>
            </View>

            {result && (
                <View style={styles.resultContainer}>
                    {/* Age Display - Hero Cards */}
                    <Text style={[styles.resultTitle, { color: theme.text }]}>Your Age</Text>
                    <View style={styles.ageDisplayRow}>
                        {[
                            { value: result.years, label: 'Years', color: COLORS.primary },
                            { value: result.months, label: 'Months', color: '#F97316' },
                            { value: result.days, label: 'Days', color: '#10B981' },
                        ].map((item, idx) => (
                            <View key={idx} style={[styles.ageBox, { backgroundColor: theme.card }]}>
                                <Text style={[styles.ageValue, { color: item.color }]}>{item.value}</Text>
                                <Text style={[styles.ageLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                                <View style={[styles.ageBoxAccent, { backgroundColor: item.color }]} />
                            </View>
                        ))}
                    </View>

                    {/* Birthday Countdown */}
                    {countdown && (
                        <View style={[styles.countdownSection, { backgroundColor: theme.card }]}>
                            <Text style={[styles.countdownTitle, { color: theme.text }]}>🎂 Birthday Countdown</Text>
                            <View style={styles.countdownRow}>
                                {[
                                    { val: countdown.days, label: 'Days' },
                                    { val: countdown.hours, label: 'Hours' },
                                    { val: countdown.minutes, label: 'Mins' },
                                    { val: countdown.seconds, label: 'Secs' },
                                ].map((item, idx) => (
                                    <View key={idx} style={styles.countdownBox}>
                                        <Text style={styles.countdownValue}>{item.val}</Text>
                                        <Text style={styles.countdownUnit}>{item.label}</Text>
                                    </View>
                                ))}
                            </View>
                        </View>
                    )}

                    {/* Save Section */}
                    {!saved && (
                        <View style={[styles.saveSection, { backgroundColor: theme.card }]}>
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
                                    onPress={() => handleSaveBirthday('My Birthday')}
                                    activeOpacity={0.85}
                                >
                                    <Text style={styles.saveButtonText}>Quick Save</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.customSaveButton, !saveName.trim() && styles.saveButtonDisabled]}
                                    onPress={() => handleSaveBirthday(saveName)}
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
        marginBottom: 16,
        fontWeight: '700',
        letterSpacing: 0.8,
    },
    dateRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
        gap: 12,
    },
    dateInputContainer: {
        flex: 1,
    },
    smallLabel: {
        fontSize: 12,
        marginBottom: 6,
        fontWeight: '600',
    },
    input: {
        height: 52,
        borderWidth: 1.5,
        borderRadius: 14,
        paddingHorizontal: 12,
        fontSize: 17,
        textAlign: 'center',
        fontWeight: '600',
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
        marginTop: 24,
    },
    resultTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 14,
        textAlign: 'center',
        letterSpacing: -0.2,
    },
    ageDisplayRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 10,
        marginBottom: 16,
    },
    ageBox: {
        flex: 1,
        alignItems: 'center',
        paddingVertical: 20,
        borderRadius: 18,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    ageValue: {
        fontSize: 36,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    ageLabel: {
        fontSize: 13,
        marginTop: 4,
        fontWeight: '600',
    },
    ageBoxAccent: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 3,
    },
    // Countdown
    countdownSection: {
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
    },
    countdownTitle: {
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 14,
        letterSpacing: -0.2,
    },
    countdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        gap: 8,
    },
    countdownBox: {
        alignItems: 'center',
        backgroundColor: COLORS.primary,
        borderRadius: 14,
        paddingVertical: 12,
        paddingHorizontal: 6,
        flex: 1,
    },
    countdownValue: {
        fontSize: 24,
        fontWeight: '800',
        color: 'white',
    },
    countdownUnit: {
        fontSize: 10,
        color: 'rgba(255,255,255,0.8)',
        marginTop: 2,
        fontWeight: '600',
    },
    // Save
    saveSection: {
        borderRadius: 20,
        padding: 22,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
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
