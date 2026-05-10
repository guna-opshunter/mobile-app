import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useAchievements, Achievement } from '../context/AchievementsContext';

export default function AchievementToast() {
    const { recentUnlock, dismissUnlock } = useAchievements();
    const slideAnim = useRef(new Animated.Value(-120)).current;
    const opacityAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (recentUnlock) {
            // Slide in
            Animated.parallel([
                Animated.spring(slideAnim, { toValue: 60, friction: 7, useNativeDriver: true }),
                Animated.timing(opacityAnim, { toValue: 1, duration: 300, useNativeDriver: true }),
            ]).start();

            // Auto dismiss after 3 seconds
            const timer = setTimeout(() => {
                Animated.parallel([
                    Animated.timing(slideAnim, { toValue: -120, duration: 300, useNativeDriver: true }),
                    Animated.timing(opacityAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
                ]).start(() => dismissUnlock());
            }, 3000);

            return () => clearTimeout(timer);
        }
    }, [recentUnlock]);

    if (!recentUnlock) return null;

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    transform: [{ translateY: slideAnim }],
                    opacity: opacityAnim,
                    borderLeftColor: recentUnlock.color,
                },
            ]}
        >
            <TouchableOpacity style={styles.inner} onPress={dismissUnlock} activeOpacity={0.9}>
                <View style={[styles.iconBg, { backgroundColor: recentUnlock.color + '20' }]}>
                    <Text style={styles.icon}>{recentUnlock.icon}</Text>
                </View>
                <View style={styles.textContainer}>
                    <Text style={styles.label}>🏅 Achievement Unlocked!</Text>
                    <Text style={styles.name}>{recentUnlock.name}</Text>
                    <Text style={styles.desc}>{recentUnlock.description}</Text>
                </View>
            </TouchableOpacity>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: 0,
        left: 16,
        right: 16,
        zIndex: 9999,
        backgroundColor: '#1E293B',
        borderRadius: 16,
        borderLeftWidth: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 20,
    },
    inner: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
    },
    iconBg: {
        width: 48,
        height: 48,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 24,
    },
    textContainer: {
        flex: 1,
    },
    label: {
        color: '#F59E0B',
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 0.5,
        marginBottom: 2,
    },
    name: {
        color: '#F8FAFC',
        fontSize: 16,
        fontWeight: '700',
    },
    desc: {
        color: '#94A3B8',
        fontSize: 12,
        marginTop: 1,
    },
});
