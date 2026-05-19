import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    KeyboardAvoidingView,
    Platform,
    Dimensions,
} from 'react-native';
import { COLORS, useTheme } from '../theme';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fp, ms } from '../utils/responsive';

const { width } = Dimensions.get('window');

export default function OnboardingScreen() {
    const { setUserName, setSetupCompleted, isDarkMode } = useTheme();
    const insets = useSafeAreaInsets();
    
    const [name, setName] = useState('');

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const handleContinue = () => {
        if (name.trim()) {
            setUserName(name.trim());
            setSetupCompleted(true);
        }
    };

    return (
        <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={[styles.container, { backgroundColor: theme.bg }]}
        >
            <View style={[styles.content, { paddingTop: insets.top + 40 }]}>
                <View style={styles.header}>
                    <View style={[styles.iconCircle, { backgroundColor: COLORS.primary + '20' }]}>
                        <Ionicons 
                            name="person" 
                            size={40} 
                            color={COLORS.primary} 
                        />
                    </View>
                    <Text style={[styles.title, { color: theme.text }]}>
                        Welcome to NexaPlay!
                    </Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                        Let's start by getting to know you. What should we call you?
                    </Text>
                </View>

                <View style={styles.inputContainer}>
                    <TextInput
                        style={[styles.input, { 
                            color: theme.text, 
                            backgroundColor: theme.card,
                            borderColor: theme.border 
                        }]}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.textSecondary}
                        value={name}
                        onChangeText={setName}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={handleContinue}
                    />
                </View>

                <View style={styles.footer}>
                    <View />
                    <TouchableOpacity 
                        style={[styles.button, { opacity: !name.trim() ? 0.6 : 1 }]}
                        onPress={handleContinue}
                        disabled={!name.trim()}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </TouchableOpacity>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    iconCircle: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: fp(28),
        fontWeight: '800',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: fp(16),
        textAlign: 'center',
        lineHeight: fp(24),
        paddingHorizontal: 20,
    },
    inputContainer: {
        width: '100%',
    },
    input: {
        height: 60,
        borderRadius: 16,
        borderWidth: 1.5,
        paddingHorizontal: 20,
        fontSize: fp(18),
        fontWeight: '500',
    },
    footer: {
        marginTop: 'auto',
        marginBottom: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    button: {
        backgroundColor: COLORS.primary,
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 16,
        gap: 8,
    },
    buttonText: {
        color: '#FFF',
        fontSize: fp(16),
        fontWeight: '700',
    },
});
