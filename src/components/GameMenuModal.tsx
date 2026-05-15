import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { COLORS, useTheme } from '../theme';

interface GameMenuModalProps {
    visible: boolean;
    onClose: () => void;
    onSaveAndQuit?: () => void;
    onQuit: () => void;
}

export default function GameMenuModal({ visible, onClose, onSaveAndQuit, onQuit }: GameMenuModalProps) {
    const { isDarkMode } = useTheme();
    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
                <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
                    <Text style={[styles.title, { color: theme.text }]}>⚙️ Game Menu</Text>
                    <Text style={[styles.subtitle, { color: theme.textSecondary }]}>What would you like to do?</Text>
                    
                    {onSaveAndQuit && (
                        <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={onSaveAndQuit}>
                            <Text style={styles.saveButtonText}>Save & Quit</Text>
                        </TouchableOpacity>
                    )}
                    
                    <TouchableOpacity style={[styles.button, styles.quitButton]} onPress={onQuit}>
                        <Text style={styles.quitButtonText}>Quit</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={[styles.button, { backgroundColor: theme.surface }]} onPress={onClose}>
                        <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
                    </TouchableOpacity>
                </View>
            </TouchableOpacity>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        width: '100%',
        maxWidth: 320,
        borderRadius: 20,
        padding: 24,
        alignItems: 'center',
    },
    title: {
        fontSize: 22,
        fontWeight: '800',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        marginBottom: 24,
    },
    button: {
        width: '100%',
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 12,
    },
    saveButton: {
        backgroundColor: COLORS.primary,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    quitButton: {
        backgroundColor: '#EF444415',
    },
    quitButtonText: {
        color: '#EF4444',
        fontSize: 16,
        fontWeight: '700',
    },
    cancelButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
});
