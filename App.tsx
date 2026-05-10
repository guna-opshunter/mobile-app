import React, { Suspense, memo } from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import ErrorBoundary from './src/components/ErrorBoundary';

import { RecordsProvider } from './src/context/RecordsContext';
import { AchievementsProvider } from './src/context/AchievementsContext';
import AchievementToast from './src/components/AchievementToast';

import { usePersistedSettings } from './src/utils/usePersistedSettings';

// Re-export from theme for backward compatibility
export { COLORS, useTheme } from './src/theme';
import { COLORS, useTheme, ThemeContext } from './src/theme';

// ALL screens lazy-loaded (including Home and Games)
const HomeScreen = React.lazy(() => import('./src/screens/HomeScreen'));
const GamesScreen = React.lazy(() => import('./src/screens/GamesScreen'));

// Lazy-loaded Calculators
const CalculatorScreen = React.lazy(() => import('./src/screens/CalculatorScreen'));
const EMICalculator = React.lazy(() => import('./src/screens/calculators/EMICalculator'));
const AgeCalculator = React.lazy(() => import('./src/screens/calculators/AgeCalculator'));
const BMICalculator = React.lazy(() => import('./src/screens/calculators/BMICalculator'));
const AreaCalculator = React.lazy(() => import('./src/screens/calculators/AreaCalculator'));
const MensurationCalculator = React.lazy(() => import('./src/screens/calculators/MensurationCalculator'));
const PercentageCalculator = React.lazy(() => import('./src/screens/calculators/PercentageCalculator'));
const TemperatureConverter = React.lazy(() => import('./src/screens/calculators/TemperatureConverter'));
const SpeedCalculator = React.lazy(() => import('./src/screens/calculators/SpeedCalculator'));
const CurrencyConverter = React.lazy(() => import('./src/screens/calculators/CurrencyConverter'));
const TrigCalculator = React.lazy(() => import('./src/screens/calculators/TrigCalculator'));
const AlgebraCalculator = React.lazy(() => import('./src/screens/calculators/AlgebraCalculator'));
const LogCalculator = React.lazy(() => import('./src/screens/calculators/LogCalculator'));
const PasswordGenerator = React.lazy(() => import('./src/screens/calculators/PasswordGenerator'));
const TipCalculator = React.lazy(() => import('./src/screens/calculators/TipCalculator'));

// Lazy-loaded Games
const WordScrambleGame = React.lazy(() => import('./src/screens/games/WordScrambleGame'));
const QuizGame = React.lazy(() => import('./src/screens/games/QuizGame'));
const MemoryMatchGame = React.lazy(() => import('./src/screens/games/MemoryMatchGame'));
const ChessGame = React.lazy(() => import('./src/screens/games/ChessGame'));
const LudoGame = React.lazy(() => import('./src/screens/games/LudoGame'));
const SudokuGame = React.lazy(() => import('./src/screens/games/SudokuGame'));
const TicTacToeGame = React.lazy(() => import('./src/screens/games/TicTacToeGame'));
const SnakeLadderGame = React.lazy(() => import('./src/screens/games/SnakeGame'));
const Game2048 = React.lazy(() => import('./src/screens/games/Game2048'));

// Lazy-loaded Screens
const RecordsScreen = React.lazy(() => import('./src/screens/RecordsScreen'));
const ProfileScreen = React.lazy(() => import('./src/screens/ProfileScreen'));

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Lightweight loading fallback (memoized)
const LoadingFallback = memo(() => (
  <View style={styles.loadingContainer}>
    <ActivityIndicator size="large" color={COLORS.primary} />
  </View>
));

// STABLE Suspense wrappers — created once at module level, never re-created
function createSuspenseWrapper(LazyComponent: React.LazyExoticComponent<any>) {
  const Wrapped = memo((props: any) => (
    <Suspense fallback={<LoadingFallback />}>
      <LazyComponent {...props} />
    </Suspense>
  ));
  return Wrapped;
}

// Stable screen component references — created once at module level
const SuspenseHome = createSuspenseWrapper(HomeScreen);
const SuspenseGames = createSuspenseWrapper(GamesScreen);

const calculatorScreens = [
  { name: 'Calculator', component: createSuspenseWrapper(CalculatorScreen) },
  { name: 'EMI', component: createSuspenseWrapper(EMICalculator) },
  { name: 'Age', component: createSuspenseWrapper(AgeCalculator) },
  { name: 'BMI', component: createSuspenseWrapper(BMICalculator) },
  { name: 'Area', component: createSuspenseWrapper(AreaCalculator) },
  { name: 'Mensuration', component: createSuspenseWrapper(MensurationCalculator) },
  { name: 'Percentage', component: createSuspenseWrapper(PercentageCalculator) },
  { name: 'Temperature', component: createSuspenseWrapper(TemperatureConverter) },
  { name: 'Speed', component: createSuspenseWrapper(SpeedCalculator) },
  { name: 'Currency', component: createSuspenseWrapper(CurrencyConverter) },
  { name: 'Trig', component: createSuspenseWrapper(TrigCalculator) },
  { name: 'Algebra', component: createSuspenseWrapper(AlgebraCalculator) },
  { name: 'Log', component: createSuspenseWrapper(LogCalculator) },
  { name: 'PasswordGen', component: createSuspenseWrapper(PasswordGenerator) },
  { name: 'TipCalc', component: createSuspenseWrapper(TipCalculator) },
];

const gameScreens = [
  { name: 'WordScramble', component: createSuspenseWrapper(WordScrambleGame) },
  { name: 'Quiz', component: createSuspenseWrapper(QuizGame) },
  { name: 'MemoryMatch', component: createSuspenseWrapper(MemoryMatchGame) },
  { name: 'Chess', component: createSuspenseWrapper(ChessGame) },
  { name: 'Ludo', component: createSuspenseWrapper(LudoGame) },
  { name: 'Sudoku', component: createSuspenseWrapper(SudokuGame) },
  { name: 'TicTacToe', component: createSuspenseWrapper(TicTacToeGame) },
  { name: 'Snake', component: createSuspenseWrapper(SnakeLadderGame) },
  { name: 'Game2048', component: createSuspenseWrapper(Game2048) },
];

const SuspenseRecords = createSuspenseWrapper(RecordsScreen);
const SuspenseProfile = createSuspenseWrapper(ProfileScreen);

// Stack navigator options
function useStackOptions() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  return {
    headerStyle: { backgroundColor: theme.card },
    headerTintColor: theme.text,
    headerShadowVisible: false,
    animation: 'slide_from_right' as const,
    animationDuration: 250,
    headerShown: false,
  };
}

// Home Tab Stack (HomeScreen + all calculator & game drill-downs)
function HomeTab() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="HomeScreen" component={SuspenseHome} />
      {calculatorScreens.map(s => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
      {gameScreens.map(s => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
      <Stack.Screen name="Records" component={SuspenseRecords} />
      <Stack.Screen name="Profile" component={SuspenseProfile} />
    </Stack.Navigator>
  );
}

// Games Tab Stack (GamesScreen + game drill-downs)
function GamesTab() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="GamesHome" component={SuspenseGames} />
      {gameScreens.map(s => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Stack.Navigator>
  );
}

// Records Tab Stack
function RecordsTab() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="RecordsHome" component={SuspenseRecords} />
      {calculatorScreens.map(s => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
      {gameScreens.map(s => (
        <Stack.Screen key={s.name} name={s.name} component={s.component} />
      ))}
    </Stack.Navigator>
  );
}

// Profile Tab Stack
function ProfileTab() {
  const screenOptions = useStackOptions();
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ProfileHome" component={SuspenseProfile} />
    </Stack.Navigator>
  );
}

// Tab bar icon component
function TabIcon({ icon, focused, color }: { icon: string; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Text style={[styles.tabIconText, focused && styles.tabIconTextFocused]}>{icon}</Text>
    </View>
  );
}

// Main Tab Navigator
function MainTabs() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const tabBarHeight = Platform.OS === 'ios' ? 80 + insets.bottom : 68;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.card,
          borderTopColor: theme.border,
          borderTopWidth: 0.5,
          height: tabBarHeight,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? insets.bottom : 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.06,
          shadowRadius: 12,
          elevation: 12,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: theme.textSecondary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeTab}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="🏠" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="GamesTab"
        component={GamesTab}
        options={{
          tabBarLabel: 'Games',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="🎮" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsTab}
        options={{
          tabBarLabel: 'Records',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="📊" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon icon="👤" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

// Simple splash — no animations to save CPU on startup
function SplashScreen() {
  return (
    <View style={styles.splashContainer}>
      <View style={styles.splashContent}>
        <Text style={styles.splashIcon}>🎮</Text>
        <Text style={styles.splashTitle}>NexaPlay</Text>
        <Text style={styles.splashSubtitle}>Games & Smart Tools</Text>
        <ActivityIndicator size="small" color={COLORS.primaryLight} style={{ marginTop: 24 }} />
      </View>
    </View>
  );
}

function AppContent() {
  const settings = usePersistedSettings();
  const insets = useSafeAreaInsets();

  const theme = settings.isDarkMode ? COLORS.dark : COLORS.light;

  // Show splash while loading persisted settings
  if (settings.isLoading) {
    return <SplashScreen />;
  }

  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: settings.isDarkMode ? COLORS.dark.bg : settings.backgroundColor,
      card: theme.card,
      text: theme.text,
    },
  };

  return (
    <ThemeContext.Provider value={{
      backgroundColor: settings.backgroundColor,
      setBackgroundColor: settings.setBackgroundColor,
      userName: settings.userName,
      setUserName: settings.setUserName,
      isDarkMode: settings.isDarkMode,
      setIsDarkMode: settings.setIsDarkMode,
      recentlyUsed: settings.recentlyUsed,
      addRecentlyUsed: settings.addRecentlyUsed,
      favorites: settings.favorites,
      toggleFavorite: settings.toggleFavorite,
      isFavorite: settings.isFavorite,
      isLoading: settings.isLoading,
    }}>
      <RecordsProvider>
        <AchievementsProvider>
          <NavigationContainer theme={MyTheme}>
            <MainTabs />
            <AchievementToast />
            <StatusBar style={settings.isDarkMode ? 'light' : 'dark'} />
          </NavigationContainer>
        </AchievementsProvider>
      </RecordsProvider>
    </ThemeContext.Provider>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.light.bg,
  },
  // Tab bar
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 36,
    height: 28,
  },
  tabIconFocused: {
    transform: [{ scale: 1.1 }],
  },
  tabIconText: {
    fontSize: 20,
    opacity: 0.6,
  },
  tabIconTextFocused: {
    fontSize: 22,
    opacity: 1,
  },
  // Splash
  splashContainer: {
    flex: 1,
    backgroundColor: COLORS.dark.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
  },
  splashIcon: {
    fontSize: 72,
    marginBottom: 20,
  },
  splashTitle: {
    fontSize: 36,
    fontWeight: '800',
    color: '#F8FAFC',
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.primaryLight,
    marginTop: 6,
    letterSpacing: 0.5,
  },
});
