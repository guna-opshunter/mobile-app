import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, useWindowDimensions } from 'react-native';
import { useTheme, COLORS } from '../theme';

const MAX_BUTTON_SIZE = 76;
const BUTTON_GAP = 10;

export default function CalculatorScreen({ navigation }: any) {
    const { width } = useWindowDimensions();
    const { isDarkMode, backgroundColor } = useTheme();
    const [displayValue, setDisplayValue] = useState<string>('0');
    const [firstOperand, setFirstOperand] = useState<number | null>(null);
    const [operator, setOperator] = useState<string | null>(null);
    const [waitingForSecondOperand, setWaitingForSecondOperand] = useState<boolean>(false);

    const theme = isDarkMode ? COLORS.dark : COLORS.light;

    // Responsive sizing
    const containerPadding = 40;
    const availableWidth = Math.min(width, 500) - containerPadding;
    const buttonSize = Math.min((availableWidth / 4) - BUTTON_GAP, MAX_BUTTON_SIZE);
    const keypadWidth = (buttonSize * 4) + (BUTTON_GAP * 3);

    const inputDigit = (digit: number) => {
        if (waitingForSecondOperand || displayValue === 'Error') {
            setDisplayValue(String(digit));
            setWaitingForSecondOperand(false);
        } else {
            setDisplayValue(displayValue === '0' ? String(digit) : displayValue + digit);
        }
    };

    const inputDot = () => {
        if (waitingForSecondOperand || displayValue === 'Error') {
            setDisplayValue('0.');
            setWaitingForSecondOperand(false);
            return;
        }
        if (!displayValue.includes('.')) {
            setDisplayValue(displayValue + '.');
        }
    };

    const clearDisplay = () => {
        setDisplayValue('0');
        setFirstOperand(null);
        setOperator(null);
        setWaitingForSecondOperand(false);
    };

    const backspace = () => {
        if (waitingForSecondOperand || displayValue === 'Error') return;

        if (displayValue.length > 1) {
            setDisplayValue(displayValue.slice(0, -1));
        } else {
            setDisplayValue('0');
        }
    };

    const performOperation = (nextOperator: string) => {
        if (displayValue === 'Error') return;
        const inputValue = parseFloat(displayValue);

        if (firstOperand === null) {
            setFirstOperand(inputValue);
        } else if (operator) {
            const currentValue = firstOperand || 0;
            const newValue = calculate(currentValue, inputValue, operator);
            setDisplayValue(String(newValue));
            
            if (newValue === 'Error') {
                setFirstOperand(null);
                setOperator(null);
                setWaitingForSecondOperand(false);
                return;
            }
            setFirstOperand(Number(newValue));
        }

        setWaitingForSecondOperand(true);
        setOperator(nextOperator === '=' ? null : nextOperator);
    };

    const calculate = (first: number, second: number, op: string): number | string => {
        switch (op) {
            case '+': return first + second;
            case '-': return first - second;
            case '*': return first * second;
            case '/': 
                if (second === 0) return 'Error';
                return first / second;
            default: return second;
        }
    };

    const inputPercent = () => {
        if (displayValue !== 'Error') {
            const val = parseFloat(displayValue);
            setDisplayValue(String(val / 100));
        }
    };

    const toggleSign = () => {
        if (displayValue !== 'Error' && displayValue !== '0') {
            setDisplayValue(displayValue.startsWith('-') ? displayValue.slice(1) : '-' + displayValue);
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
                    {operator && (
                        <Text style={[styles.operatorIndicator, { color: '#F59E0B' }]}>{operator === '*' ? '×' : operator === '/' ? '÷' : operator}</Text>
                    )}
                    <Text
                        style={[styles.displayText, {
                            fontSize: displayValue.length > 10 ? 28 : displayValue.length > 7 ? 36 : 46,
                            color: theme.text,
                        }]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                    >
                        {displayValue}
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
        padding: 24,
        marginBottom: 16,
        alignItems: 'flex-end',
        justifyContent: 'flex-end',
        borderRadius: 20,
        height: 110,
    },
    operatorIndicator: {
        fontSize: 16,
        fontWeight: '700',
        position: 'absolute',
        top: 16,
        left: 20,
    },
    displayText: {
        fontWeight: '300',
        letterSpacing: -1,
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
