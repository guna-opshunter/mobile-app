import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme, COLORS } from '../theme';

const MAX_BUTTON_SIZE = 76;
const BUTTON_GAP = 10;

export default function CalculatorScreen({ navigation }: any) {
    const { width } = useWindowDimensions();
    const { isDarkMode, backgroundColor } = useTheme();
    const [tokens, setTokens] = useState<string[]>([]);
    const [result, setResult] = useState<string>('0');
    const [evaluated, setEvaluated] = useState<boolean>(false);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    // Responsive sizing
    const containerPadding = 40;
    const availableWidth = Math.min(width, 500) - containerPadding;
    const buttonSize = Math.min((availableWidth / 4) - BUTTON_GAP, MAX_BUTTON_SIZE);
    const keypadWidth = (buttonSize * 4) + (BUTTON_GAP * 3);

    React.useEffect(() => {
        if (tokens.length === 0) {
            setResult('0');
            return;
        }

        const expression = tokens.join('');
        try {
            const cleanExpr = expression.replace(/[+\-*/]$/, '');
            if (!cleanExpr) {
                setResult('0');
                return;
            }
            const evalResult = new Function(`return ${cleanExpr}`)();
            if (isFinite(evalResult)) {
                let resStr = String(parseFloat(evalResult.toFixed(10)));
                setResult(resStr);
            } else {
                setResult('Error');
            }
        } catch (e) {
            // Keep previous result if typing is in an invalid intermediate state
        }
    }, [tokens]);

    const formatNumber = (numStr: string) => {
        if (!numStr || numStr === 'Error' || numStr === 'NaN' || numStr === 'Infinity') return numStr;
        const parts = numStr.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return parts.join('.');
    };

    const formatExpression = (tokensList: string[]) => {
        return tokensList.map(token => {
            if (token === '*') return '×';
            if (token === '/') return '÷';
            if (token === '-') return '−';
            if (token === '+') return '+';
            return formatNumber(token);
        }).join('');
    };

    const inputDigit = (digit: number) => {
        if (evaluated) {
            setTokens([String(digit)]);
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) {
            setTokens([String(digit)]);
            return;
        }

        const lastToken = tokens[tokens.length - 1];
        if (['+', '-', '*', '/'].includes(lastToken)) {
            setTokens([...tokens, String(digit)]);
        } else {
            if (lastToken === '0') {
                setTokens([...tokens.slice(0, -1), String(digit)]);
            } else if (lastToken === '-0') {
                setTokens([...tokens.slice(0, -1), '-' + String(digit)]);
            } else {
                setTokens([...tokens.slice(0, -1), lastToken + digit]);
            }
        }
    };

    const inputDot = () => {
        if (evaluated) {
            setTokens(['0.']);
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) {
            setTokens(['0.']);
            return;
        }

        const lastToken = tokens[tokens.length - 1];
        if (['+', '-', '*', '/'].includes(lastToken)) {
            setTokens([...tokens, '0.']);
        } else {
            if (!lastToken.includes('.')) {
                setTokens([...tokens.slice(0, -1), lastToken + '.']);
            }
        }
    };

    const clearDisplay = () => {
        setTokens([]);
        setResult('0');
        setEvaluated(false);
    };

    const backspace = () => {
        if (evaluated) {
            setTokens([]);
            setResult('0');
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) return;

        const lastToken = tokens[tokens.length - 1];
        if (['+', '-', '*', '/'].includes(lastToken)) {
            setTokens(tokens.slice(0, -1));
        } else {
            if (lastToken.length > 1) {
                const newToken = lastToken.slice(0, -1);
                if (newToken === '-' || newToken === '-0') {
                    setTokens(tokens.slice(0, -1));
                } else {
                    setTokens([...tokens.slice(0, -1), newToken]);
                }
            } else {
                setTokens(tokens.slice(0, -1));
            }
        }
    };

    const performOperation = (op: string) => {
        if (op === '=') {
            setEvaluated(true);
            return;
        }

        if (evaluated) {
            setTokens([result, op]);
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) {
            setTokens(['0', op]);
            return;
        }

        const lastToken = tokens[tokens.length - 1];
        if (['+', '-', '*', '/'].includes(lastToken)) {
            setTokens([...tokens.slice(0, -1), op]);
        } else {
            setTokens([...tokens, op]);
        }
    };

    const inputPercent = () => {
        if (evaluated) {
            const val = String(parseFloat(result) / 100);
            setTokens([val]);
            setResult(val);
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) return;

        const lastToken = tokens[tokens.length - 1];
        if (!['+', '-', '*', '/'].includes(lastToken)) {
            const val = String(parseFloat(lastToken) / 100);
            setTokens([...tokens.slice(0, -1), val]);
        }
    };

    const toggleSign = () => {
        if (evaluated) {
            const val = result.startsWith('-') ? result.slice(1) : '-' + result;
            setTokens([val]);
            setResult(val);
            setEvaluated(false);
            return;
        }

        if (tokens.length === 0) {
            setTokens(['-0']);
            return;
        }

        const lastToken = tokens[tokens.length - 1];
        if (!['+', '-', '*', '/'].includes(lastToken)) {
            const val = lastToken.startsWith('-') ? lastToken.slice(1) : '-' + lastToken;
            setTokens([...tokens.slice(0, -1), val]);
        }
    };

    const CalcButton = ({ onPress, text, variant = 'default' }: {
        onPress: () => void;
        text: string;
        variant?: 'default' | 'operator' | 'clear' | 'backspace' | 'equal' | 'zero';
    }) => {
        const buttonStyles: any = {
            default: {
                bg: isDarkMode ? '#1E293B' : '#F1F5F9',
                text: theme.text,
            },
            operator: {
                bg: '#F59E0B',
                text: '#FFFFFF',
            },
            clear: {
                bg: '#EF4444',
                text: '#FFFFFF',
            },
            backspace: {
                bg: isDarkMode ? '#334155' : '#94A3B8',
                text: '#FFFFFF',
            },
            equal: {
                bg: COLORS.primary,
                text: '#FFFFFF',
            },
        };

        const style = buttonStyles[variant] || buttonStyles.default;

        return (
            <TouchableOpacity
                onPress={onPress}
                activeOpacity={0.7}
                style={[
                    styles.button,
                    {
                        width: buttonSize,
                        height: buttonSize,
                        borderRadius: 18,
                        backgroundColor: style.bg || buttonStyles.default.bg,
                    },
                ]}
            >
                <Text style={[
                    styles.buttonText,
                    {
                        fontSize: buttonSize * 0.32,
                        color: style.text || buttonStyles.default.text,
                    }
                ]}>
                    {text}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: isDarkMode ? COLORS.dark.bg : backgroundColor }]}>
            {/* Back Button */}
            <TouchableOpacity
                style={styles.backButton}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
            >
                <View style={[styles.backButtonBg, { backgroundColor: theme.card }]}>
                    <Text style={[styles.backButtonText, { color: COLORS.primary }]}>← Back</Text>
                </View>
            </TouchableOpacity>

            {/* Calculator Card */}
            <View style={[styles.calcCard, { width: keypadWidth + 40, backgroundColor: theme.card }]}>
                {/* Display */}
                <View style={[styles.display, { width: keypadWidth + 8, backgroundColor: theme.surface }]}>
                    <Text 
                        style={[styles.expressionText, { color: theme.text, opacity: 0.6 }]} 
                        numberOfLines={1} 
                        adjustsFontSizeToFit
                    >
                        {tokens.length > 0 ? formatExpression(tokens) + (evaluated ? ' =' : '') : ''}
                    </Text>
                    <Text
                        style={[styles.displayText, {
                            fontSize: result.length > 10 ? 32 : result.length > 7 ? 40 : 50,
                            color: theme.text,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {formatNumber(result)}
                    </Text>
                </View>

                {/* Keypad */}
                <View style={[styles.keypad, { width: keypadWidth }]}>
                    <CalcButton text="AC" onPress={clearDisplay} variant="clear" />
                    <CalcButton text="±" onPress={toggleSign} variant="backspace" />
                    <CalcButton text="%" onPress={inputPercent} variant="backspace" />
                    <CalcButton text="÷" onPress={() => performOperation('/')} variant="operator" />

                    <CalcButton text="7" onPress={() => inputDigit(7)} />
                    <CalcButton text="8" onPress={() => inputDigit(8)} />
                    <CalcButton text="9" onPress={() => inputDigit(9)} />
                    <CalcButton text="×" onPress={() => performOperation('*')} variant="operator" />

                    <CalcButton text="4" onPress={() => inputDigit(4)} />
                    <CalcButton text="5" onPress={() => inputDigit(5)} />
                    <CalcButton text="6" onPress={() => inputDigit(6)} />
                    <CalcButton text="−" onPress={() => performOperation('-')} variant="operator" />

                    <CalcButton text="1" onPress={() => inputDigit(1)} />
                    <CalcButton text="2" onPress={() => inputDigit(2)} />
                    <CalcButton text="3" onPress={() => inputDigit(3)} />
                    <CalcButton text="+" onPress={() => performOperation('+')} variant="operator" />

                    <CalcButton text="⌫" onPress={backspace} variant="backspace" />
                    <CalcButton text="0" onPress={() => inputDigit(0)} />
                    <CalcButton text="." onPress={inputDot} />
                    <CalcButton text="=" onPress={() => performOperation('=')} variant="equal" />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    backButton: {
        position: 'absolute',
        top: 56,
        left: 20,
        zIndex: 10,
    },
    backButtonBg: {
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
    calcCard: {
        borderRadius: 28,
        padding: 20,
        alignItems: 'center',
        elevation: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 24,
    },
    display: {
        padding: 32,
        marginBottom: 16,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        borderRadius: 20,
        minHeight: 200,
    },
    expressionText: {
        fontSize: 24,
        lineHeight: 34,
        fontWeight: '400',
        marginBottom: 12,
        letterSpacing: 1,
    },
    displayText: {
        fontWeight: '300',
        letterSpacing: -1,
        lineHeight: 60,
    },
    keypad: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        gap: BUTTON_GAP,
    },
    button: {
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 4,
        elevation: 2,
    },
    buttonText: {
        fontWeight: '600',
    },
});
