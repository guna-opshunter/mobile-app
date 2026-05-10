import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, useTheme } from '../theme';

interface ScreenHeaderProps {
    title: string;
    subtitle?: string;
    showBack?: boolean;
    onBack?: () => void;
    rightElement?: React.ReactNode;
}

export default function ScreenHeader({ title, subtitle, showBack, onBack, rightElement }: ScreenHeaderProps) {
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    return (
        <View style={styles.container}>
            <View style={styles.topRow}>
                {showBack && onBack && (
                    <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.card }]} onPress={onBack} activeOpacity={0.8}>
                        <Text style={[styles.backText, { color: COLORS.primary }]}>← Back</Text>
                    </TouchableOpacity>
                )}
                {rightElement && <View style={styles.rightSlot}>{rightElement}</View>}
            </View>
            <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
            {subtitle && <Text style={[styles.subtitle, { color: theme.textSecondary }]}>{subtitle}</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 56,
        paddingBottom: 8,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    backButton: {
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
    backText: {
        fontSize: 16,
        fontWeight: '700',
    },
    rightSlot: {
        marginLeft: 'auto',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        letterSpacing: -0.5,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        fontWeight: '500',
    },
});
