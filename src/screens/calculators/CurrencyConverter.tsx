import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Keyboard, ActivityIndicator, Alert, Image } from 'react-native';
import { useTheme, COLORS } from '../../theme';
import { ALL_CURRENCIES, CurrencyInfo } from '../../data/currencies';

export default function CurrencyConverter({ navigation }: any) {
    const { isDarkMode, backgroundColor } = useTheme();
    const [currencies, setCurrencies] = useState<CurrencyInfo[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    
    const [fromCode, setFromCode] = useState('USD');
    const [toCode, setToCode] = useState('INR');
    
    const [amount, setAmount] = useState('');
    const [result, setResult] = useState<any>(null);
    const [showFromPicker, setShowFromPicker] = useState(false);
    const [showToPicker, setShowToPicker] = useState(false);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    useEffect(() => {
        const fetchRates = async () => {
            try {
                const res = await fetch('https://open.er-api.com/v6/latest/USD');
                const data = await res.json();
                
                if (data && data.rates) {
                    let available = ALL_CURRENCIES.map(c => ({
                        ...c,
                        rateToUSD: data.rates[c.code] || 0
                    })).filter(c => c.rateToUSD > 0);
                    
                    const priority = ['USD', 'EUR', 'GBP', 'INR', 'JPY', 'AUD', 'CAD'];
                    available.sort((a, b) => {
                        const idxA = priority.indexOf(a.code);
                        const idxB = priority.indexOf(b.code);
                        if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                        if (idxA !== -1) return -1;
                        if (idxB !== -1) return 1;
                        return a.name.localeCompare(b.name);
                    });

                    setCurrencies(available);
                }
            } catch (err) {
                Alert.alert("Notice", "Could not fetch live rates. Using default rates.");
            } finally {
                setIsLoading(false);
            }
        };
        fetchRates();
    }, []);

    const convert = () => {
        const val = parseFloat(amount);
        if (isNaN(val)) return;

        const from = currencies.find(c => c.code === fromCode);
        const to = currencies.find(c => c.code === toCode);
        if (!from || !to) return;

        const inUSD = val / from.rateToUSD;
        const converted = inUSD * to.rateToUSD;
        const rate = to.rateToUSD / from.rateToUSD;

        setResult({
            converted: converted.toFixed(2),
            rate: rate.toFixed(4),
            from,
            to,
            amount: val,
        });
        Keyboard.dismiss();
        setShowFromPicker(false);
        setShowToPicker(false);
    };

    const swap = () => {
        const tempFrom = fromCode;
        setFromCode(toCode);
        setToCode(tempFrom);
        setResult(null);
    };

    const CurrencyPicker = ({ selectedCode, onSelect, show, setShow }: any) => {
        const [search, setSearch] = useState('');
        
        const filtered = currencies.filter(c => 
            c.code.toLowerCase().includes(search.toLowerCase()) || 
            c.name.toLowerCase().includes(search.toLowerCase()) ||
            c.countryCode.toLowerCase().includes(search.toLowerCase())
        );
        
        const selected = currencies.find(c => c.code === selectedCode) || currencies[0];
        if (!selected) return null;

        return (
            <View>
                <TouchableOpacity
                    style={[styles.currencySelector, { backgroundColor: theme.surface, borderColor: theme.border }]}
                    onPress={() => setShow(!show)}
                    activeOpacity={0.8}
                >
                    <View style={styles.selectorFlagContainer}>
                         <Image source={{ uri: `https://flagcdn.com/w40/${selected.countryCode}.png` }} style={styles.flagImage} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={[styles.selectorCode, { color: theme.text }]}>{selected.code}</Text>
                        <Text style={[styles.selectorName, { color: theme.textSecondary }]}>{selected.name}</Text>
                    </View>
                    <Text style={[styles.selectorArrow, { color: theme.textSecondary }]}>{show ? '▲' : '▼'}</Text>
                </TouchableOpacity>

                {show && (
                    <View style={[styles.pickerDropdown, { backgroundColor: theme.card, borderColor: theme.border }]}>
                        <TextInput
                            style={[styles.searchInput, { color: theme.text, borderBottomColor: theme.border }]}
                            placeholder="Search currency..."
                            placeholderTextColor={theme.textSecondary}
                            value={search}
                            onChangeText={setSearch}
                        />
                        <ScrollView nestedScrollEnabled style={{ maxHeight: 240 }}>
                            {filtered.map((c) => (
                                <TouchableOpacity
                                    key={c.code}
                                    style={[
                                        styles.pickerItem,
                                        c.code === selectedCode && { backgroundColor: COLORS.primary + '15' },
                                    ]}
                                    onPress={() => { onSelect(c.code); setShow(false); setResult(null); setSearch(''); }}
                                >
                                    <View style={styles.pickerFlagContainer}>
                                        <Image source={{ uri: `https://flagcdn.com/w40/${c.countryCode}.png` }} style={styles.flagImageSmall} />
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.pickerCode, { color: theme.text }]}>{c.code}</Text>
                                        <Text style={[styles.pickerName, { color: theme.textSecondary }]} numberOfLines={1}>{c.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                )}
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
                <Text style={styles.headerIcon}>💱</Text>
                <Text style={[styles.title, { color: theme.text }]}>Currency</Text>
                <Text style={[styles.subtitle, { color: theme.textSecondary }]}>Live exchange rate converter</Text>
            </View>

            {isLoading ? (
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 40 }}>
                    <ActivityIndicator size="large" color={COLORS.primary} />
                    <Text style={{ marginTop: 12, color: theme.textSecondary }}>Fetching live rates...</Text>
                </View>
            ) : (
                <>
                    <View style={[styles.noteCard, { backgroundColor: '#F59E0B' + '15' }]}>
                        <Text style={styles.noteIcon}>✅</Text>
                        <Text style={[styles.noteText, { color: theme.textSecondary }]}>
                            Rates are live and updated automatically
                        </Text>
                    </View>

                    <View style={[styles.card, { backgroundColor: theme.card }]}>
                        <Text style={[styles.label, { color: theme.textSecondary }]}>FROM</Text>
                        <CurrencyPicker
                            selectedCode={fromCode}
                            onSelect={setFromCode}
                            show={showFromPicker}
                            setShow={(v: boolean) => { setShowFromPicker(v); setShowToPicker(false); }}
                        />

                        <Text style={[styles.label, { color: theme.textSecondary, marginTop: 16 }]}>AMOUNT</Text>
                        <TextInput
                            style={[styles.input, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
                            keyboardType="numeric"
                            placeholder={`Enter amount in ${fromCode}`}
                            placeholderTextColor={theme.textSecondary}
                            value={amount}
                            onChangeText={setAmount}
                        />

                        <TouchableOpacity style={styles.swapButton} onPress={swap} activeOpacity={0.75}>
                            <Text style={styles.swapText}>🔄 Swap</Text>
                        </TouchableOpacity>

                        <Text style={[styles.label, { color: theme.textSecondary }]}>TO</Text>
                        <CurrencyPicker
                            selectedCode={toCode}
                            onSelect={setToCode}
                            show={showToPicker}
                            setShow={(v: boolean) => { setShowToPicker(v); setShowFromPicker(false); }}
                        />

                        <TouchableOpacity style={styles.calcButton} onPress={convert} activeOpacity={0.85}>
                            <Text style={styles.calcButtonText}>Convert 💱</Text>
                        </TouchableOpacity>
                    </View>

                    {result && (
                        <View style={styles.resultContainer}>
                            <View style={[styles.heroCard, { backgroundColor: COLORS.primary }]}>
                                <View style={styles.heroFlags}>
                                    <Image source={{ uri: `https://flagcdn.com/w80/${result.from.countryCode}.png` }} style={styles.heroFlagImage} />
                                    <Text style={styles.heroArrow}>→</Text>
                                    <Image source={{ uri: `https://flagcdn.com/w80/${result.to.countryCode}.png` }} style={styles.heroFlagImage} />
                                </View>
                                <Text style={styles.heroLabel}>
                                    {result.from.symbol}{result.amount.toLocaleString()} {result.from.code}
                                </Text>
                                <Text style={styles.heroValue}>
                                    {result.to.symbol}{parseFloat(result.converted).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                                </Text>
                                <Text style={styles.heroCode}>{result.to.code}</Text>
                            </View>

                            <View style={[styles.rateCard, { backgroundColor: theme.card }]}>
                                <View style={[styles.rateIconBg, { backgroundColor: COLORS.primary + '15' }]}>
                                    <Text style={styles.rateIcon}>📊</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.rateLabel, { color: theme.textSecondary }]}>Live Exchange Rate</Text>
                                    <Text style={[styles.rateValue, { color: theme.text }]}>
                                        1 {result.from.code} = {result.rate} {result.to.code}
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}
                </>
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
    headerSection: { alignItems: 'center', marginBottom: 20 },
    headerIcon: { fontSize: 40, marginBottom: 8 },
    title: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5, marginBottom: 4 },
    subtitle: { fontSize: 15, fontWeight: '500' },
    noteCard: {
        flexDirection: 'row', alignItems: 'center', gap: 8, borderRadius: 12, padding: 12, marginBottom: 16,
    },
    noteIcon: { fontSize: 16 },
    noteText: { fontSize: 12, fontWeight: '500', flex: 1 },
    card: {
        borderRadius: 20, padding: 22, elevation: 4,
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12,
    },
    label: { fontSize: 12, marginBottom: 8, fontWeight: '700', letterSpacing: 0.8 },
    currencySelector: {
        flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: 14,
        borderWidth: 1.5, gap: 12,
    },
    selectorFlagContainer: { width: 36, height: 26, justifyContent: 'center', alignItems: 'center' },
    flagImage: { width: 32, height: 24, borderRadius: 4, backgroundColor: '#eee' },
    selectorCode: { fontSize: 16, fontWeight: '700' },
    selectorName: { fontSize: 12, fontWeight: '500', marginTop: 1 },
    selectorArrow: { fontSize: 12, fontWeight: '700' },
    pickerDropdown: {
        borderRadius: 14, borderWidth: 1, marginTop: 6, overflow: 'hidden',
        shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 6,
    },
    searchInput: {
        height: 44, paddingHorizontal: 16, fontSize: 14, borderBottomWidth: 1, fontWeight: '500',
    },
    pickerItem: {
        flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12, borderBottomWidth: 0,
    },
    pickerFlagContainer: { width: 32, height: 24, justifyContent: 'center', alignItems: 'center' },
    flagImageSmall: { width: 28, height: 20, borderRadius: 3, backgroundColor: '#eee' },
    pickerCode: { fontSize: 14, fontWeight: '700', width: 44 },
    pickerName: { fontSize: 13, fontWeight: '500', flex: 1 },
    input: {
        height: 52, borderWidth: 1.5, borderRadius: 14, paddingHorizontal: 18,
        fontSize: 16, marginBottom: 16, fontWeight: '500',
    },
    swapButton: {
        alignSelf: 'center', paddingHorizontal: 24, paddingVertical: 10,
        borderRadius: 20, backgroundColor: COLORS.primary + '15', marginBottom: 16,
    },
    swapText: { fontSize: 14, fontWeight: '700', color: COLORS.primary },
    calcButton: {
        backgroundColor: COLORS.primary, padding: 16, borderRadius: 14, alignItems: 'center',
        marginTop: 16, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
    },
    calcButtonText: { color: 'white', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
    resultContainer: { marginTop: 20, gap: 12 },
    heroCard: {
        borderRadius: 20, padding: 28, alignItems: 'center',
        shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10,
    },
    heroFlags: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
    heroFlagImage: { width: 52, height: 38, borderRadius: 6, backgroundColor: '#eee', borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)' },
    heroArrow: { color: 'rgba(255,255,255,0.6)', fontSize: 20, fontWeight: '700' },
    heroLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 16, fontWeight: '600', marginBottom: 8 },
    heroValue: { color: 'white', fontSize: 34, fontWeight: '800', letterSpacing: -0.5 },
    heroCode: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '600', marginTop: 4 },
    rateCard: {
        flexDirection: 'row', alignItems: 'center', borderRadius: 18, padding: 18, gap: 14,
        elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8,
    },
    rateIconBg: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
    rateIcon: { fontSize: 22 },
    rateLabel: { fontSize: 12, fontWeight: '600', letterSpacing: 0.2, marginBottom: 4 },
    rateValue: { fontSize: 15, fontWeight: '700' },
});
