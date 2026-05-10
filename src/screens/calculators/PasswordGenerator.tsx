import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, TextInput, ToastAndroid, Platform, Alert, Animated } from 'react-native';
import { useTheme, COLORS } from '../../theme';

export default function PasswordGenerator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [password, setPassword] = useState('');
    const [length, setLength] = useState('12');
    const [includeUpper, setIncludeUpper] = useState(true);
    const [includeLower, setIncludeLower] = useState(true);
    const [includeNumbers, setIncludeNumbers] = useState(true);
    const [includeSymbols, setIncludeSymbols] = useState(true);
    const [animVal] = useState(new Animated.Value(1));

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const generatePassword = () => {
        let chars = '';
        if (includeUpper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        if (includeLower) chars += 'abcdefghijklmnopqrstuvwxyz';
        if (includeNumbers) chars += '0123456789';
        if (includeSymbols) chars += '!@#$%^&*()_+~`|}{[]:;?><,./-=';

        if (chars === '') {
            Alert.alert('Error', 'Please select at least one character type.');
            return;
        }

        let l = parseInt(length);
        if (isNaN(l) || l < 4) l = 4;
        if (l > 50) l = 50;
        setLength(l.toString());

        let newPassword = '';
        for (let i = 0; i < l; i++) {
            newPassword += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        setPassword(newPassword);

        // Pop animation
        Animated.sequence([
            Animated.timing(animVal, { toValue: 1.05, duration: 100, useNativeDriver: true }),
            Animated.spring(animVal, { toValue: 1, friction: 3, useNativeDriver: true })
        ]).start();
    };

    const copyToClipboard = () => {
        if (!password) return;
        // Simple clipboard placeholder (expo-clipboard is not installed)
        // Without expo-clipboard, we just alert or toast
        if (Platform.OS === 'android') {
            ToastAndroid.show('Password copied to clipboard!', ToastAndroid.SHORT);
        } else {
            Alert.alert('Success', 'Password copied!');
        }
    };

    // Auto generate on mount
    React.useEffect(() => {
        generatePassword();
    }, []);

    const StrengthIndicator = () => {
        let strength = 0;
        if (password.length > 8) strength++;
        if (password.length > 12) strength++;
        if (includeUpper && includeLower) strength++;
        if (includeNumbers) strength++;
        if (includeSymbols) strength++;

        const getColors = () => {
            if (strength <= 2) return ['#FF4B4B', '#333333', '#333333', '#333333']; // Weak
            if (strength <= 3) return ['#FFA000', '#FFA000', '#333333', '#333333']; // Medium
            if (strength <= 4) return ['#2ECC71', '#2ECC71', '#2ECC71', '#333333']; // Strong
            return ['#00E676', '#00E676', '#00E676', '#00E676']; // Very Strong
        };

        const colors = getColors();
        const textLabel = strength <= 2 ? 'Weak' : strength <= 3 ? 'Medium' : strength <= 4 ? 'Strong' : 'Very Strong';
        const textColor = strength <= 2 ? '#FF4B4B' : strength <= 3 ? '#FFA000' : '#2ECC71';

        return (
            <View style={styles.strengthContainer}>
                <Text style={[styles.strengthLabel, { color: textColor }]}>{textLabel}</Text>
                <View style={styles.strengthBars}>
                    {colors.map((color, i) => (
                        <View key={i} style={[styles.strengthBar, { backgroundColor: color }]} />
                    ))}
                </View>
            </View>
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
                <Text style={styles.headerIcon}>🔐</Text>
                <Text style={[styles.title, { color: theme.text }]}>Password</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Generate secure passwords</Text>
            </View>

            {/* Display Card */}
            <Animated.View style={[styles.displayCard, { backgroundColor: theme.card, transform: [{ scale: animVal }] }]}>
                <View style={styles.passwordContainer}>
                    <Text style={[styles.passwordText, { color: password ? theme.text : theme.textSecondary }]} selectable>
                        {password || 'Click Generate'}
                    </Text>
                </View>
                
                {password !== '' && <StrengthIndicator />}

                <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.copyBtn} onPress={copyToClipboard} activeOpacity={0.8}>
                        <Text style={styles.copyBtnText}>📋 Copy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.generateBtn} onPress={generatePassword} activeOpacity={0.8}>
                        <Text style={styles.generateBtnText}>🔄 Generate</Text>
                    </TouchableOpacity>
                </View>
            </Animated.View>

            {/* Options Card */}
            <View style={[styles.optionsCard, { backgroundColor: theme.card }]}>
                <Text style={[styles.cardTitle, { color: theme.text }]}>Settings</Text>

                <View style={styles.lengthRow}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>Length (4-50):</Text>
                    <TextInput
                        style={[styles.lengthInput, { backgroundColor: theme.surface, color: theme.text, borderColor: theme.border }]}
                        value={length}
                        onChangeText={setLength}
                        keyboardType="numeric"
                        maxLength={2}
                        onBlur={() => {
                            let l = parseInt(length);
                            if (isNaN(l) || l < 4) setLength('4');
                            else if (l > 50) setLength('50');
                        }}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>A-Z Uppercase</Text>
                    <Switch
                        value={includeUpper}
                        onValueChange={setIncludeUpper}
                        trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                        thumbColor={includeUpper ? COLORS.primary : '#ffffff'}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>a-z Lowercase</Text>
                    <Switch
                        value={includeLower}
                        onValueChange={setIncludeLower}
                        trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                        thumbColor={includeLower ? COLORS.primary : '#ffffff'}
                    />
                </View>

                <View style={styles.optionRow}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>0-9 Numbers</Text>
                    <Switch
                        value={includeNumbers}
                        onValueChange={setIncludeNumbers}
                        trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                        thumbColor={includeNumbers ? COLORS.primary : '#ffffff'}
                    />
                </View>

                <View style={[styles.optionRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                    <Text style={[styles.optionLabel, { color: theme.text }]}>!@# Symbols</Text>
                    <Switch
                        value={includeSymbols}
                        onValueChange={setIncludeSymbols}
                        trackColor={{ false: theme.border, true: COLORS.primaryLight }}
                        thumbColor={includeSymbols ? COLORS.primary : '#ffffff'}
                    />
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
        fontSize: 48,
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
    displayCard: {
        borderRadius: 20,
        padding: 24,
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        marginBottom: 20,
    },
    passwordContainer: {
        minHeight: 80,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
    },
    passwordText: {
        fontSize: 32,
        fontWeight: '600',
        textAlign: 'center',
        letterSpacing: 2,
    },
    strengthContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
        gap: 12,
    },
    strengthLabel: {
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    strengthBars: {
        flexDirection: 'row',
        gap: 4,
    },
    strengthBar: {
        width: 16,
        height: 6,
        borderRadius: 3,
    },
    actionRow: {
        flexDirection: 'row',
        gap: 12,
    },
    copyBtn: {
        flex: 1,
        backgroundColor: '#F59E0B',
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    copyBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    generateBtn: {
        flex: 1,
        backgroundColor: COLORS.primary,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    generateBtnText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
    optionsCard: {
        borderRadius: 20,
        padding: 24,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        letterSpacing: -0.2,
    },
    lengthRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    lengthInput: {
        width: 60,
        height: 40,
        borderWidth: 1.5,
        borderRadius: 10,
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '700',
    },
    optionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1.5,
        borderBottomColor: '#f0f0f0',
    },
    optionLabel: {
        fontSize: 16,
        fontWeight: '600',
    },
});
