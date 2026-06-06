import React, { Suspense, memo, useEffect } from 'react';
import { NavigationContainer, DefaultTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet, Platform, ActivityIndicator, Image, Animated } from 'react-native';
import mobileAds from 'react-native-google-mobile-ads';
import ErrorBoundary from './src/components/ErrorBoundary';

import { RecordsProvider } from './src/context/RecordsContext';
import { AchievementsProvider } from './src/context/AchievementsContext';
import AchievementToast from './src/components/AchievementToast';

import { usePersistedSettings } from './src/utils/usePersistedSettings';

// Re-export from theme for backward compatibility
export { COLORS, useTheme } from './src/theme';
import { COLORS, useTheme, ThemeContext } from './src/theme';

// ALL screens lazy-loaded
const HomeScreen = React.lazy(() => import('./src/screens/HomeScreen'));

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
const SnakeGame = React.lazy(() => import('./src/screens/games/SnakeGame'));
const SnakeAndLadderGame = React.lazy(() => import('./src/screens/games/SnakeAndLadderGame'));
const Game2048 = React.lazy(() => import('./src/screens/games/Game2048'));

// Lazy-loaded Screens
const RecordsScreen = React.lazy(() => import('./src/screens/RecordsScreen'));
const ProfileScreen = React.lazy(() => import('./src/screens/ProfileScreen'));

import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

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
  { name: 'Snake', component: createSuspenseWrapper(SnakeGame) },
  { name: 'SnakeLadder', component: createSuspenseWrapper(SnakeAndLadderGame) },
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
function TabIcon({ iconName, focused, color }: { iconName: keyof typeof Ionicons.glyphMap; focused: boolean; color: string }) {
  return (
    <View style={[styles.tabIconContainer, focused && styles.tabIconFocused]}>
      <Ionicons name={iconName} size={focused ? 24 : 22} color={color} style={{ opacity: focused ? 1 : 0.8 }} />
    </View>
  );
}

// Root screen names for each tab — tab bar is only visible on these
const TAB_ROOT_SCREENS: Record<string, string> = {
  HomeTab: 'HomeScreen',
  RecordsTab: 'RecordsHome',
  ProfileTab: 'ProfileHome',
};

// Helper: returns tabBarStyle to hide the tab bar on sub-screens
function getTabBarStyle(route: any, tabName: string, baseStyle: any) {
  const routeName = getFocusedRouteNameFromRoute(route) ?? TAB_ROOT_SCREENS[tabName];
  if (routeName !== TAB_ROOT_SCREENS[tabName]) {
    return { display: 'none' as const };
  }
  return baseStyle;
}

// Main Tab Navigator
function MainTabs() {
  const { isDarkMode } = useTheme();
  const theme = isDarkMode ? COLORS.dark : COLORS.light;
  const insets = useSafeAreaInsets();

  const tabBarHeight = 60 + insets.bottom;

  const baseTabBarStyle = {
    backgroundColor: theme.card,
    borderTopColor: theme.border,
    borderTopWidth: 0.5,
    height: tabBarHeight,
    paddingTop: 4,
    paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  };

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
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
        options={({ route }) => ({
          tabBarLabel: 'Home',
          tabBarIcon: ({ focused, color }) => <TabIcon iconName={focused ? "home" : "home-outline"} focused={focused} color={color} />,
          tabBarStyle: getTabBarStyle(route, 'HomeTab', baseTabBarStyle),
        })}
      />
      <Tab.Screen
        name="RecordsTab"
        component={RecordsTab}
        options={({ route }) => ({
          tabBarLabel: 'Records',
          tabBarIcon: ({ focused, color }) => <TabIcon iconName={focused ? "stats-chart" : "stats-chart-outline"} focused={focused} color={color} />,
          tabBarStyle: getTabBarStyle(route, 'RecordsTab', baseTabBarStyle),
        })}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileTab}
        options={({ route }) => ({
          tabBarLabel: 'Profile',
          tabBarIcon: ({ focused, color }) => <TabIcon iconName={focused ? "person" : "person-outline"} focused={focused} color={color} />,
          tabBarStyle: getTabBarStyle(route, 'ProfileTab', baseTabBarStyle),
        })}
      />
    </Tab.Navigator>
  );
}

function SplashScreen() {
  const scaleAnim = React.useRef(new Animated.Value(0.9)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;
  const translateYAnim = React.useRef(new Animated.Value(15)).current;
  
  const glowScale = React.useRef(new Animated.Value(1)).current;
  const glowOpacity = React.useRef(new Animated.Value(0.6)).current;
  const progressWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    // Clean, elegant modern app entrance
    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 9,
        tension: 15,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Breathing glow animation loop
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(glowScale, { toValue: 1.25, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowScale, { toValue: 1.0, duration: 2200, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(glowOpacity, { toValue: 0.25, duration: 2200, useNativeDriver: true }),
          Animated.timing(glowOpacity, { toValue: 0.6, duration: 2200, useNativeDriver: true }),
        ])
      ])
    ).start();

    // Minimal progress bar animation
    Animated.timing(progressWidth, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();
  }, []);

  return (
    <View style={styles.splashContainer}>
      <Animated.View style={[styles.splashContent, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.logoContainer}>
          <Animated.View style={[styles.logoGlow, { transform: [{ scale: glowScale }], opacity: glowOpacity }]} />
          <Image
            source={require('./assets/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
      </Animated.View>
      <Animated.View style={{ opacity: opacityAnim, transform: [{ translateY: translateYAnim }], alignItems: 'center' }}>
        <Text style={styles.splashTitle}>NexaPlay</Text>
        <Text style={styles.splashSubtitle}>Games & Smart Tools</Text>
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBar, {
            width: progressWidth.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%']
            })
          }]} />
        </View>
      </Animated.View>
    </View>
  );
}

function AppContent() {
  const settings = usePersistedSettings();
  const insets = useSafeAreaInsets();

  const theme = settings.isDarkMode ? COLORS.dark : COLORS.light;

  // Initialize Google Mobile Ads SDK
  useEffect(() => {
    mobileAds()
      .initialize()
      .then(adapterStatuses => {
        console.log('Mobile Ads SDK initialized');
      })
      .catch(err => {
        console.log('Mobile Ads SDK init error:', err);
      });
  }, []);

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
    <SafeAreaProvider>
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
        currencyType: settings.currencyType,
        setCurrencyType: settings.setCurrencyType,
        navigationType: settings.navigationType,
        setNavigationType: settings.setNavigationType,
        setupCompleted: settings.setupCompleted,
        setSetupCompleted: settings.setSetupCompleted,
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
    </SafeAreaProvider>
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
    backgroundColor: '#0B0F19',
    justifyContent: 'center',
    alignItems: 'center',
  },
  splashContent: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoImage: {
    width: 140,
    height: 140,
    borderRadius: 28,
  },
  logoGlow: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 25,
    elevation: 8,
  },
  splashTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textTransform: 'uppercase',
  },
  splashSubtitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 10,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  progressBarBg: {
    width: 120,
    height: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 1,
    marginTop: 40,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
});
