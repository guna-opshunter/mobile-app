import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, COLORS } from '../../theme';
import AdBanner from '../../components/AdBanner';

const SHAPES_2D = ['Square', 'Circle', 'Triangle', 'Rectangle'];
const SHAPES_3D = ['Cube', 'Sphere', 'Cylinder', 'Rectangular Prism'];

const SHAPE_ICONS: { [key: string]: string } = {
    'Square': '⬜', 'Circle': '⭕', 'Triangle': '🔺', 'Rectangle': '▬',
    'Cube': '🧊', 'Sphere': '🔮', 'Cylinder': '🗑️', 'Rectangular Prism': '📦',
};

export default function AreaCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [mode, setMode] = useState('2D'); // 2D or 3D
    const [selectedShape, setSelectedShape] = useState('Square');
    const [inputs, setInputs] = useState<any>({});
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculate = () => {
        let res = 0;
        let unit = mode === '2D' ? 'sq units' : 'cubic units';
        const vals = Object.values(inputs).map((v: any) => parseFloat(v));

        if (vals.some(v => isNaN(v))) return;

        if (mode === '2D') {
            switch (selectedShape) {
                case 'Square': res = Math.pow(vals[0], 2); break;
                case 'Circle': res = Math.PI * Math.pow(vals[0], 2); break;
                case 'Triangle': res = 0.5 * vals[0] * vals[1]; break;
                case 'Rectangle': res = vals[0] * vals[1]; break;
            }
        } else {
            switch (selectedShape) {
                case 'Cube': res = Math.pow(vals[0], 3); break;
                case 'Sphere': res = (4 / 3) * Math.PI * Math.pow(vals[0], 3); break;
                case 'Cylinder': res = Math.PI * Math.pow(vals[0], 2) * vals[1]; break;
                case 'Rectangular Prism': res = vals[0] * vals[1] * vals[2]; break;
            }
        }

        setResult(res.toFixed(2) + ' ' + unit);
        Keyboard.dismiss();
    };

    const renderInputs = () => {
        const shape = selectedShape;
        const fields: { name: string; label: string }[] = [];

        if (mode === '2D') {
            if (shape === 'Square') fields.push({ name: 'side', label: 'Side Length' });
            if (shape === 'Circle') fields.push({ name: 'radius', label: 'Radius' });
            if (shape === 'Triangle') fields.push({ name: 'base', label: 'Base' }, { name: 'height', label: 'Height' });
            if (shape === 'Rectangle') fields.push({ name: 'length', label: 'Length' }, { name: 'width', label: 'Width' });
        } else {
            if (shape === 'Cube') fields.push({ name: 'side', label: 'Edge Length' });
            if (shape === 'Sphere') fields.push({ name: 'radius', label: 'Radius' });
            if (shape === 'Cylinder') fields.push({ name: 'radius', label: 'Radius' }, { name: 'height', label: 'Height' });
            if (shape === 'Rectangular Prism') fields.push({ name: 'length', label: 'Length' }, { name: 'width', label: 'Width' }, { name: 'height', label: 'Height' });
        }

        return fields.map(f => (
            <View key={f.name} style={{ marginBottom: 16 }}>
                <Text style={[styles.inputLabel, { color: theme.textSecondary }]}>{f.label.toUpperCase()}</Text>
                <TextInput
                    style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                    keyboardType="numeric"
                    placeholder={`Enter ${f.label.toLowerCase()}`}
                    placeholderTextColor={theme.textSecondary}
                    value={inputs[f.name] || ''}
                    onChangeText={(val) => setInputs({ ...inputs, [f.name]: val })}
                />
            </View>
        ));
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
                <Text style={styles.headerIcon}>📐</Text>
                <Text style={[styles.title, { color: theme.text }]}>Area & Volume</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>2D & 3D calculations</Text>
            </View>

            {/* Mode Toggle */}
            <View style={[styles.modeRow, { backgroundColor: theme.surface }]}>
                {['2D', '3D'].map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                        onPress={() => { setMode(m); setSelectedShape(m === '2D' ? SHAPES_2D[0] : SHAPES_3D[0]); setInputs({}); setResult(null); }}
                        activeOpacity={0.8}
                    >
                        <Text style={[styles.modeBtnText, mode === m ? styles.modeBtnTextActive : { color: theme.textSecondary }]}>
                            {m === '2D' ? '2D Shapes' : '3D Shapes'}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {/* Shape Selector */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.shapeSelector}>
                {(mode === '2D' ? SHAPES_2D : SHAPES_3D).map(s => {
                    const isSelected = selectedShape === s;
                    return (
                        <TouchableOpacity
                            key={s}
                            style={[
                                styles.shapeBtn,
                                { backgroundColor: isSelected ? COLORS.primary : theme.card },
                                !isSelected && { borderColor: theme.border, borderWidth: 1 }
                            ]}
                            onPress={() => { setSelectedShape(s); setInputs({}); setResult(null); }}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.shapeIcon}>{SHAPE_ICONS[s]}</Text>
                            <Text style={[styles.shapeBtnText, { color: isSelected ? 'white' : theme.text }]}>{s}</Text>
                        </TouchableOpacity>
                    );
                })}
            </ScrollView>

            {/* Input Card */}
            <View style={[styles.card, { backgroundColor: theme.card }]}>
                <View style={styles.cardHeader}>
                    <Text style={styles.shapeHeaderIcon}>{SHAPE_ICONS[selectedShape]}</Text>
                    <Text style={[styles.cardTitle, { color: theme.text }]}>{selectedShape}</Text>
                </View>
                {renderInputs()}
                <TouchableOpacity style={styles.calcButton} onPress={calculate} activeOpacity={0.85}>
                    <Text style={styles.calcButtonText}>Calculate {mode === '2D' ? 'Area' : 'Volume'}</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultCard}>
                    <View style={[styles.resultInner, { backgroundColor: COLORS.primary }]}>
                        <Text style={styles.resultLabel}>{mode === '2D' ? 'Area' : 'Volume'}</Text>
                        <Text style={styles.resultValue}>{result}</Text>
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
    // Mode Toggle
    modeRow: {
        flexDirection: 'row',
        marginBottom: 18,
        borderRadius: 14,
        padding: 4,
    },
    modeBtn: {
        flex: 1,
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 10,
    },
    modeBtnActive: {
        backgroundColor: COLORS.primary,
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4,
    },
    modeBtnText: {
        fontWeight: '700',
        fontSize: 14,
    },
    modeBtnTextActive: {
        color: 'white',
    },
    // Shape Selector
    shapeSelector: {
        marginBottom: 18,
    },
    shapeBtn: {
        paddingHorizontal: 18,
        paddingVertical: 12,
        borderRadius: 14,
        marginRight: 10,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    shapeIcon: {
        fontSize: 16,
    },
    shapeBtnText: {
        fontWeight: '600',
        fontSize: 14,
    },
    // Card
    card: {
        borderRadius: 20,
        padding: 22,
        elevation: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        gap: 10,
    },
    shapeHeaderIcon: {
        fontSize: 24,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
    inputLabel: {
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
    // Result
    resultCard: {
        marginTop: 20,
    },
    resultInner: {
        borderRadius: 20,
        padding: 28,
        alignItems: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    resultLabel: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
        letterSpacing: 0.5,
    },
    resultValue: {
        color: 'white',
        fontSize: 28,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
});
