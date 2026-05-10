import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard } from 'react-native';
import { useTheme, COLORS } from '../../theme';

const SHAPES_2D = ['Square', 'Rectangle', 'Circle', 'Triangle'];
const SHAPES_3D = ['Cube', 'Cuboid', 'Sphere', 'Cylinder', 'Cone'];

const SHAPE_ICONS: { [key: string]: string } = {
    'Square': '⬜', 'Rectangle': '▬', 'Circle': '⭕', 'Triangle': '🔺',
    'Cube': '🧊', 'Cuboid': '📦', 'Sphere': '🔮', 'Cylinder': '🗑️', 'Cone': '🍦'
};

export default function MensurationCalculator({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [mode, setMode] = useState<'2D' | '3D'>('2D');
    const [selectedShape, setSelectedShape] = useState('Square');
    const [inputs, setInputs] = useState<any>({});
    const [result, setResult] = useState<any>(null);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    const calculate = () => {
        let calculations = [];
        const vals = Object.keys(inputs).reduce((acc: any, key) => {
            acc[key] = parseFloat(inputs[key]);
            return acc;
        }, {});

        if (Object.values(vals).some((v: any) => isNaN(v))) return;

        if (mode === '2D') {
            if (selectedShape === 'Square') {
                const s = vals.side;
                calculations.push({ label: 'Area', value: (s * s).toFixed(2) + ' sq units' });
                calculations.push({ label: 'Perimeter', value: (4 * s).toFixed(2) + ' units' });
            } else if (selectedShape === 'Rectangle') {
                const l = vals.length;
                const w = vals.width;
                calculations.push({ label: 'Area', value: (l * w).toFixed(2) + ' sq units' });
                calculations.push({ label: 'Perimeter', value: (2 * (l + w)).toFixed(2) + ' units' });
            } else if (selectedShape === 'Circle') {
                const r = vals.radius;
                calculations.push({ label: 'Area', value: (Math.PI * r * r).toFixed(2) + ' sq units' });
                calculations.push({ label: 'Circumference', value: (2 * Math.PI * r).toFixed(2) + ' units' });
            } else if (selectedShape === 'Triangle') {
                const b = vals.base;
                const h = vals.height;
                const s1 = vals.side1 || 0;
                const s2 = vals.side2 || 0;
                calculations.push({ label: 'Area', value: (0.5 * b * h).toFixed(2) + ' sq units' });
                if (s1 && s2) {
                    calculations.push({ label: 'Perimeter', value: (b + s1 + s2).toFixed(2) + ' units' });
                }
            }
        } else {
            if (selectedShape === 'Cube') {
                const s = vals.side;
                calculations.push({ label: 'Volume', value: (s * s * s).toFixed(2) + ' cubic units' });
                calculations.push({ label: 'Surface Area', value: (6 * s * s).toFixed(2) + ' sq units' });
            } else if (selectedShape === 'Cuboid') {
                const l = vals.length;
                const w = vals.width;
                const h = vals.height;
                calculations.push({ label: 'Volume', value: (l * w * h).toFixed(2) + ' cubic units' });
                calculations.push({ label: 'Surface Area', value: (2 * (l * w + w * h + h * l)).toFixed(2) + ' sq units' });
            } else if (selectedShape === 'Sphere') {
                const r = vals.radius;
                calculations.push({ label: 'Volume', value: ((4 / 3) * Math.PI * Math.pow(r, 3)).toFixed(2) + ' cubic units' });
                calculations.push({ label: 'Surface Area', value: (4 * Math.PI * r * r).toFixed(2) + ' sq units' });
            } else if (selectedShape === 'Cylinder') {
                const r = vals.radius;
                const h = vals.height;
                calculations.push({ label: 'Volume', value: (Math.PI * r * r * h).toFixed(2) + ' cubic units' });
                calculations.push({ label: 'Surface Area', value: (2 * Math.PI * r * (r + h)).toFixed(2) + ' sq units' });
            } else if (selectedShape === 'Cone') {
                const r = vals.radius;
                const h = vals.height;
                const l = Math.sqrt(r * r + h * h);
                calculations.push({ label: 'Volume', value: ((1 / 3) * Math.PI * r * r * h).toFixed(2) + ' cubic units' });
                calculations.push({ label: 'Surface Area', value: (Math.PI * r * (r + l)).toFixed(2) + ' sq units' });
            }
        }

        setResult(calculations);
        Keyboard.dismiss();
    };

    const renderInputs = () => {
        const shape = selectedShape;
        const fields: { name: string; label: string }[] = [];

        if (mode === '2D') {
            if (shape === 'Square') fields.push({ name: 'side', label: 'Side Length' });
            if (shape === 'Rectangle') fields.push({ name: 'length', label: 'Length' }, { name: 'width', label: 'Width' });
            if (shape === 'Circle') fields.push({ name: 'radius', label: 'Radius' });
            if (shape === 'Triangle') fields.push(
                { name: 'base', label: 'Base' },
                { name: 'height', label: 'Height' },
                { name: 'side1', label: 'Side 1 (optional for perimeter)' },
                { name: 'side2', label: 'Side 2 (optional for perimeter)' }
            );
        } else {
            if (shape === 'Cube') fields.push({ name: 'side', label: 'Edge Length' });
            if (shape === 'Cuboid') fields.push({ name: 'length', label: 'Length' }, { name: 'width', label: 'Width' }, { name: 'height', label: 'Height' });
            if (shape === 'Sphere') fields.push({ name: 'radius', label: 'Radius' });
            if (shape === 'Cylinder' || shape === 'Cone') fields.push({ name: 'radius', label: 'Radius' }, { name: 'height', label: 'Height' });
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
        <ScrollView style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            <View style={styles.headerSection}>
                <Text style={styles.headerIcon}>📏</Text>
                <Text style={[styles.title, { color: theme.text }]}>Mensuration</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Area, Perimeter & Volume</Text>
            </View>

            {/* Mode Toggle */}
            <View style={[styles.modeRow, { backgroundColor: theme.surface }]}>
                {['2D', '3D'].map((m) => (
                    <TouchableOpacity
                        key={m}
                        style={[styles.modeBtn, mode === m && styles.modeBtnActive]}
                        onPress={() => { setMode(m as any); setSelectedShape(m === '2D' ? SHAPES_2D[0] : SHAPES_3D[0]); setInputs({}); setResult(null); }}
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
                    <Text style={styles.calcButtonText}>Calculate</Text>
                </TouchableOpacity>
            </View>

            {/* Result */}
            {result && (
                <View style={styles.resultCard}>
                    {result.map((res: any, idx: number) => (
                        <View key={idx} style={[styles.resultInner, { backgroundColor: COLORS.primary, marginBottom: 10 }]}>
                            <Text style={styles.resultLabel}>{res.label}</Text>
                            <Text style={styles.resultValue}>{res.value}</Text>
                        </View>
                    ))}
                </View>
            )}

            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    backButton: { marginTop: 40, marginBottom: 16 },
    backButtonBg: {
        alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10,
        borderRadius: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06, shadowRadius: 6, elevation: 3,
    },
    backButtonText: { fontSize: 16, fontWeight: '700' },
    headerSection: { alignItems: 'center', marginBottom: 24 },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 15, fontWeight: '500' },
    modeRow: { flexDirection: 'row', marginBottom: 18, borderRadius: 14, padding: 4 },
    modeBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 10 },
    modeBtnActive: {
        backgroundColor: COLORS.primary, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25, shadowRadius: 8, elevation: 4,
    },
    modeBtnText: { fontWeight: '700', fontSize: 14 },
    modeBtnTextActive: { color: 'white' },
    shapeSelector: { marginBottom: 18 },
    shapeBtn: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, marginRight: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    shapeIcon: { fontSize: 16 },
    shapeBtnText: { fontWeight: '600', fontSize: 14 },
    card: { borderRadius: 20, padding: 22, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 10 },
    shapeHeaderIcon: { fontSize: 24 },
    cardTitle: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
    inputLabel: { fontSize: 12, marginBottom: 8, fontWeight: '700', letterSpacing: 0.8 },
    input: { height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18, fontSize: 16, fontWeight: '500' },
    calcButton: {
        backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 4,
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    calcButtonText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    resultCard: { marginTop: 20 },
    resultInner: {
        borderRadius: 20, padding: 20, alignItems: 'center', shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
    },
    resultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: '600', marginBottom: 4, letterSpacing: 0.5 },
    resultValue: { color: 'white', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
});
