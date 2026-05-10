import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Appearance } from 'react-native';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

// Dark mode aware error boundary
const getThemeColors = () => {
    const isDark = Appearance.getColorScheme() === 'dark';
    return {
        bg: isDark ? '#0F172A' : '#F8FAFC',
        card: isDark ? '#1E293B' : '#FFFFFF',
        text: isDark ? '#F8FAFC' : '#0F172A',
        textSecondary: isDark ? '#94A3B8' : '#64748B',
        surface: isDark ? '#1E293B' : '#F1F5F9',
        primary: '#6366F1',
    };
};

export default class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('App Error:', error, errorInfo);
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null });
    };

    render() {
        if (this.state.hasError) {
            const colors = getThemeColors();
            return (
                <View style={[styles.container, { backgroundColor: colors.bg }]}>
                    <Text style={styles.emoji}>😵</Text>
                    <Text style={[styles.title, { color: colors.text }]}>Oops!</Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Something went wrong</Text>
                    <Text style={[styles.errorText, { color: colors.textSecondary, backgroundColor: colors.surface }]}>
                        {this.state.error?.message || 'Unknown error'}
                    </Text>
                    <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={this.handleReset}>
                        <Text style={styles.buttonText}>Try Again</Text>
                    </TouchableOpacity>
                </View>
            );
        }

        return this.props.children;
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 32,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 20,
    },
    errorText: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 32,
        fontFamily: 'monospace',
        padding: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    button: {
        paddingVertical: 14,
        paddingHorizontal: 32,
        borderRadius: 14,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
    },
});
