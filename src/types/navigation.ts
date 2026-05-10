/**
 * Navigation type definitions for NexaPlay app.
 * Provides compile-time type safety for all route names and params.
 */

export type RootStackParamList = {
    // Main screens
    HomeScreen: undefined;
    Records: undefined;
    Profile: undefined;

    // Calculators
    Calculator: undefined;
    EMI: undefined;
    Age: undefined;
    BMI: undefined;
    Area: undefined;
    Mensuration: undefined;
    Percentage: undefined;
    Temperature: undefined;
    Speed: undefined;
    Currency: undefined;
    Trig: undefined;
    Algebra: undefined;
    Log: undefined;
    PasswordGen: undefined;
    TipCalc: undefined;

    // Games
    WordScramble: undefined;
    Quiz: undefined;
    MemoryMatch: undefined;
    Chess: undefined;
    Ludo: { savedGame?: any } | undefined;
    Sudoku: undefined;
    TicTacToe: undefined;
    Snake: undefined;
    Game2048: undefined;
};

// Helper type for screen props
export type ScreenProps<T extends keyof RootStackParamList> = {
    navigation: {
        navigate: <K extends keyof RootStackParamList>(
            screen: K,
            params?: RootStackParamList[K]
        ) => void;
        goBack: () => void;
    };
    route: {
        params: RootStackParamList[T];
    };
};
