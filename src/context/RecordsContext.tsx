import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
export interface BMIRecord {
    id: string;
    name: string;
    height: number;
    weight: number;
    bmi: number;
    category: string;
    color: string;
    dateTime: string;
}

export interface BirthdayRecord {
    id: string;
    day: number;
    month: number;
    year: number;
    name: string;
    ageYears: number;
    ageMonths: number;
    ageDays: number;
    dateTime: string;
}

export interface GameRecord {
    id: string;
    game: 'ludo' | 'tictactoe' | 'chess' | '2048' | 'snake' | 'snake_ladder' | 'memory' | 'word_scramble' | string;
    winner?: string;
    winnerColor?: string;
    isHumanWinner?: boolean;
    playerCount?: number;
    gameMode?: 'passplay' | 'computer' | 'single' | string;
    difficulty?: 'easy' | 'medium' | 'hard' | string;
    score?: number;
    details?: string;
    dateTime: string;
}

export interface SavedLudoGame {
    id: string;
    tokens: { position: number; color: number }[][];
    currentPlayer: number;
    players: { isComputer: boolean; active: boolean }[];
    playMode: 'passplay' | 'computer';
    difficulty: 'easy' | 'medium' | 'hard';
    playerCount: number;
    dateTime: string;
}

export interface QuizRecord {
    id: string;
    levelId: number;
    levelName: string;
    levelIcon: string;
    levelColor: string;
    setNumber: number;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    percentage: number;
    highScore: boolean;
    dateTime: string;
}

export interface PasswordRecord {
    id: string;
    name: string;
    password: string;
    dateTime: string;
}

interface RecordsContextType {
    bmiRecords: BMIRecord[];
    birthdayRecords: BirthdayRecord[];
    gameRecords: GameRecord[];
    quizRecords: QuizRecord[];
    savedGames: SavedLudoGame[];
    passwordRecords: PasswordRecord[];
    addBMIRecord: (record: Omit<BMIRecord, 'id' | 'dateTime'>) => void;
    addBirthdayRecord: (record: Omit<BirthdayRecord, 'id' | 'dateTime'>) => void;
    addGameRecord: (record: Omit<GameRecord, 'id' | 'dateTime'>) => void;
    addQuizRecord: (record: Omit<QuizRecord, 'id' | 'dateTime' | 'highScore'>) => void;
    addPasswordRecord: (record: Omit<PasswordRecord, 'id' | 'dateTime'>) => void;
    saveLudoGame: (game: Omit<SavedLudoGame, 'id' | 'dateTime'>) => void;
    deleteSavedGame: (id: string) => void;
    deleteBMIRecord: (id: string) => void;
    deleteBirthdayRecord: (id: string) => void;
    deleteGameRecord: (id: string) => void;
    deleteQuizRecord: (id: string) => void;
    deletePasswordRecord: (id: string) => void;
    getQuizHighScore: (levelId: number) => number;
    getSetHighScore: (levelId: number, setNumber: number) => number;
    clearAllRecords: () => void;
}

const RecordsContext = createContext<RecordsContextType | undefined>(undefined);

const STORAGE_KEYS = {
    BMI: '@records_bmi',
    BIRTHDAY: '@records_birthday',
    GAME: '@records_game',
    QUIZ: '@records_quiz',
    SAVED_GAMES: '@records_saved_games',
    PASSWORD: '@records_password',
};

export function RecordsProvider({ children }: { children: ReactNode }) {
    const [bmiRecords, setBmiRecords] = useState<BMIRecord[]>([]);
    const [birthdayRecords, setBirthdayRecords] = useState<BirthdayRecord[]>([]);
    const [gameRecords, setGameRecords] = useState<GameRecord[]>([]);
    const [quizRecords, setQuizRecords] = useState<QuizRecord[]>([]);
    const [savedGames, setSavedGames] = useState<SavedLudoGame[]>([]);
    const [passwordRecords, setPasswordRecords] = useState<PasswordRecord[]>([]);

    // Load records from AsyncStorage on mount
    useEffect(() => {
        loadRecords();
    }, []);

    const loadRecords = async () => {
        try {
            const [bmiData, birthdayData, gameData, quizData, savedGamesData, passwordData] = await Promise.all([
                AsyncStorage.getItem(STORAGE_KEYS.BMI),
                AsyncStorage.getItem(STORAGE_KEYS.BIRTHDAY),
                AsyncStorage.getItem(STORAGE_KEYS.GAME),
                AsyncStorage.getItem(STORAGE_KEYS.QUIZ),
                AsyncStorage.getItem(STORAGE_KEYS.SAVED_GAMES),
                AsyncStorage.getItem(STORAGE_KEYS.PASSWORD),
            ]);

            if (bmiData) setBmiRecords(JSON.parse(bmiData));
            if (birthdayData) setBirthdayRecords(JSON.parse(birthdayData));
            if (gameData) setGameRecords(JSON.parse(gameData));
            if (quizData) setQuizRecords(JSON.parse(quizData));
            if (savedGamesData) setSavedGames(JSON.parse(savedGamesData));
            if (passwordData) setPasswordRecords(JSON.parse(passwordData));
        } catch (error) {
            console.error('Error loading records:', error);
        }
    };

    const saveRecords = async (key: string, data: any) => {
        try {
            await AsyncStorage.setItem(key, JSON.stringify(data));
        } catch (error) {
            console.error('Error saving records:', error);
        }
    };

    const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

    const formatDateTime = () => {
        const now = new Date();
        return now.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const addBMIRecord = (record: Omit<BMIRecord, 'id' | 'dateTime'>) => {
        const newRecord: BMIRecord = {
            ...record,
            id: generateId(),
            dateTime: formatDateTime(),
        };
        const updated = [newRecord, ...bmiRecords];
        setBmiRecords(updated);
        saveRecords(STORAGE_KEYS.BMI, updated);
    };

    const addBirthdayRecord = (record: Omit<BirthdayRecord, 'id' | 'dateTime'>) => {
        const newRecord: BirthdayRecord = {
            ...record,
            id: generateId(),
            dateTime: formatDateTime(),
        };
        const updated = [newRecord, ...birthdayRecords];
        setBirthdayRecords(updated);
        saveRecords(STORAGE_KEYS.BIRTHDAY, updated);
    };

    const addGameRecord = (record: Omit<GameRecord, 'id' | 'dateTime'>) => {
        const newRecord: GameRecord = {
            ...record,
            id: generateId(),
            dateTime: formatDateTime(),
        };
        const updated = [newRecord, ...gameRecords];
        setGameRecords(updated);
        saveRecords(STORAGE_KEYS.GAME, updated);
    };

    const getQuizHighScore = (levelId: number): number => {
        const levelRecords = quizRecords.filter(r => r.levelId === levelId);
        if (levelRecords.length === 0) return 0;
        return Math.max(...levelRecords.map(r => r.score));
    };

    const getSetHighScore = (levelId: number, setNumber: number): number => {
        const setRecords = quizRecords.filter(r => r.levelId === levelId && r.setNumber === setNumber);
        if (setRecords.length === 0) return 0;
        return Math.max(...setRecords.map(r => r.score));
    };

    const addQuizRecord = (record: Omit<QuizRecord, 'id' | 'dateTime' | 'highScore'>) => {
        const currentHighScore = getQuizHighScore(record.levelId);
        const isHighScore = record.score > currentHighScore;

        const newRecord: QuizRecord = {
            ...record,
            id: generateId(),
            dateTime: formatDateTime(),
            highScore: isHighScore,
        };

        // Update previous high scores for this level
        const updated = quizRecords.map(r =>
            r.levelId === record.levelId && r.highScore && isHighScore
                ? { ...r, highScore: false }
                : r
        );

        const finalRecords = [newRecord, ...updated];
        setQuizRecords(finalRecords);
        saveRecords(STORAGE_KEYS.QUIZ, finalRecords);
    };

    const addPasswordRecord = (record: Omit<PasswordRecord, 'id' | 'dateTime'>) => {
        const newRecord: PasswordRecord = {
            ...record,
            id: generateId(),
            dateTime: formatDateTime(),
        };
        const updated = [newRecord, ...passwordRecords];
        setPasswordRecords(updated);
        saveRecords(STORAGE_KEYS.PASSWORD, updated);
    };

    const deleteBMIRecord = (id: string) => {
        const updated = bmiRecords.filter(r => r.id !== id);
        setBmiRecords(updated);
        saveRecords(STORAGE_KEYS.BMI, updated);
    };

    const deleteBirthdayRecord = (id: string) => {
        const updated = birthdayRecords.filter(r => r.id !== id);
        setBirthdayRecords(updated);
        saveRecords(STORAGE_KEYS.BIRTHDAY, updated);
    };

    const deleteGameRecord = (id: string) => {
        const updated = gameRecords.filter(r => r.id !== id);
        setGameRecords(updated);
        saveRecords(STORAGE_KEYS.GAME, updated);
    };

    const saveLudoGame = (game: Omit<SavedLudoGame, 'id' | 'dateTime'>) => {
        const newSave: SavedLudoGame = {
            ...game,
            id: generateId(),
            dateTime: formatDateTime(),
        };
        // Only keep 1 saved game at a time (replace old one)
        const updated = [newSave];
        setSavedGames(updated);
        saveRecords(STORAGE_KEYS.SAVED_GAMES, updated);
    };

    const deleteSavedGame = (id: string) => {
        const updated = savedGames.filter(g => g.id !== id);
        setSavedGames(updated);
        saveRecords(STORAGE_KEYS.SAVED_GAMES, updated);
    };

    const deleteQuizRecord = (id: string) => {
        const updated = quizRecords.filter(r => r.id !== id);
        setQuizRecords(updated);
        saveRecords(STORAGE_KEYS.QUIZ, updated);
    };

    const deletePasswordRecord = (id: string) => {
        const updated = passwordRecords.filter(r => r.id !== id);
        setPasswordRecords(updated);
        saveRecords(STORAGE_KEYS.PASSWORD, updated);
    };

    const clearAllRecords = async () => {
        setBmiRecords([]);
        setBirthdayRecords([]);
        setGameRecords([]);
        setQuizRecords([]);
        setSavedGames([]);
        setPasswordRecords([]);
        await Promise.all([
            AsyncStorage.removeItem(STORAGE_KEYS.BMI),
            AsyncStorage.removeItem(STORAGE_KEYS.BIRTHDAY),
            AsyncStorage.removeItem(STORAGE_KEYS.GAME),
            AsyncStorage.removeItem(STORAGE_KEYS.QUIZ),
            AsyncStorage.removeItem(STORAGE_KEYS.SAVED_GAMES),
            AsyncStorage.removeItem(STORAGE_KEYS.PASSWORD),
        ]);
    };

    return (
        <RecordsContext.Provider
            value={{
                bmiRecords,
                birthdayRecords,
                gameRecords,
                quizRecords,
                savedGames,
                passwordRecords,
                addBMIRecord,
                addBirthdayRecord,
                addGameRecord,
                addQuizRecord,
                addPasswordRecord,
                saveLudoGame,
                deleteSavedGame,
                deleteBMIRecord,
                deleteBirthdayRecord,
                deleteGameRecord,
                deleteQuizRecord,
                deletePasswordRecord,
                getQuizHighScore,
                getSetHighScore,
                clearAllRecords,
            }}
        >
            {children}
        </RecordsContext.Provider>
    );
}

export const useRecords = () => {
    const context = useContext(RecordsContext);
    if (!context) {
        throw new Error('useRecords must be used within a RecordsProvider');
    }
    return context;
};

// Helper function to calculate birthday countdown
export const getBirthdayCountdown = (day: number, month: number) => {
    const now = new Date();
    const currentYear = now.getFullYear();

    let nextBirthday = new Date(currentYear, month - 1, day);

    // If birthday has passed this year, use next year
    if (nextBirthday <= now) {
        nextBirthday = new Date(currentYear + 1, month - 1, day);
    }

    const diff = nextBirthday.getTime() - now.getTime();

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds, nextBirthday };
};
