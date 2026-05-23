import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Platform, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Poppins_400Regular,
  Poppins_500Medium,
  Poppins_600SemiBold,
  Poppins_700Bold,
} from '@expo-google-fonts/poppins';

import { DebtProvider, useDebt } from './app/context/DebtContext';
import { AuthProvider, useAuth } from './app/context/AuthContext';
import { AccountProvider, useAccount } from './app/context/AccountContext';
import { AppMessageProvider } from './app/context/AppMessageContext';
import LoginScreen from './app/screens/LoginScreen';
import RegisterScreen from './app/screens/RegisterScreen';
import DashboardScreen from './app/screens/DashboardScreen';
import HistoryScreen from './app/screens/HistoryScreen';
import ContactsScreen from './app/screens/ContactsScreen';
import AddTransactionScreen from './app/screens/AddTransactionScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import ContactDetailScreen from './app/screens/ContactDetailScreen';
import AddContactScreen from './app/screens/AddContactScreen';
import PinSetupScreen from './app/screens/PinSetupScreen';
import SplashScreen from './app/screens/SplashScreen';
import PinLockScreen from './app/screens/PinLockScreen';
import WebPreviewFrame from './app/components/WebPreviewFrame';
import { setupGlobalFonts } from './app/setupGlobalFonts';
import { paperTheme } from './app/theme/paperTheme';
import { colors } from './app/theme/colors';
import { useAppSecurity } from './app/hooks/useAppSecurity';

const SPLASH_MIN_MS = 2400;

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const ContactsStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();

function AuthStackScreen() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', color: colors.text },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <AuthStack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <AuthStack.Screen
        name="Register"
        component={RegisterScreen}
        options={{ title: 'Create account' }}
      />
    </AuthStack.Navigator>
  );
}

function HomeStackScreen() {
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
      <HomeStack.Screen
        name="PinSetup"
        component={PinSetupScreen}
        options={{ title: 'Set PIN' }}
      />
    </HomeStack.Navigator>
  );
}

function ContactsStackScreen() {
  return (
    <ContactsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontFamily: 'Poppins_600SemiBold', color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <ContactsStack.Screen
        name="ContactsList"
        component={ContactsScreen}
        options={{ title: 'People' }}
      />
      <ContactsStack.Screen
        name="ContactDetail"
        component={ContactDetailScreen}
        options={{ title: 'Contact' }}
      />
      <ContactsStack.Screen
        name="AddContact"
        component={AddContactScreen}
        options={{ title: 'New contact' }}
      />
      <ContactsStack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{ title: 'Record transaction' }}
      />
    </ContactsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size, focused }) => {
          const icons = {
            Home: focused ? 'home' : 'home-outline',
            History: focused ? 'history' : 'history',
            People: focused ? 'account-group' : 'account-group-outline',
          };
          return (
            <MaterialCommunityIcons
              name={icons[route.name]}
              size={size}
              color={color}
            />
          );
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Poppins_600SemiBold',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeStackScreen}
        options={{ title: 'Home' }}
      />
      <Tab.Screen
        name="History"
        component={HistoryScreen}
        options={{ headerShown: false, title: 'History' }}
      />
      <Tab.Screen
        name="People"
        component={ContactsStackScreen}
        options={{ title: 'People' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isReady } = useDebt();
  const { isPinEnabled, isUnlocked, isAuthReady, lockApp } = useAuth();
  const [splashVisible, setSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const readyAt = useRef(null);

  const bothReady = isReady && isAuthReady;

  const handleLock = useCallback(() => {
    if (isPinEnabled) lockApp();
  }, [isPinEnabled, lockApp]);

  useAppSecurity({
    enabled: Platform.OS !== 'web',
    isLocked: false,
    onLock: handleLock,
  });

  useEffect(() => {
    if (!bothReady) return;
    if (!readyAt.current) readyAt.current = Date.now();

    const elapsed = Date.now() - readyAt.current;
    const wait = Math.max(0, SPLASH_MIN_MS - elapsed);

    const timer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 450,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setSplashVisible(false);
      });
    }, wait);

    return () => clearTimeout(timer);
  }, [bothReady, fadeAnim]);

  const showPinLock = !splashVisible && isPinEnabled && !isUnlocked;

  return (
    <View style={styles.root}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>

      {showPinLock ? (
        <View style={styles.lockOverlay}>
          <PinLockScreen />
        </View>
      ) : null}

      {splashVisible ? (
        <Animated.View
          style={[styles.splashOverlay, { opacity: fadeAnim }]}
          pointerEvents={bothReady ? 'none' : 'auto'}
        >
          <SplashScreen loading={!bothReady} />
        </Animated.View>
      ) : null}
    </View>
  );
}

function RootNavigation() {
  const { isAuthenticated, isReady: accountReady, sessionKey } = useAccount();

  if (!accountReady) {
    return (
      <View style={styles.boot}>
        <SplashScreen loading />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthStackScreen key="auth-stack" />;
  }

  return (
    <AuthProvider key={`app-${sessionKey}`}>
      <DebtProvider key={`debt-${sessionKey}`}>
        <AppNavigator />
      </DebtProvider>
    </AuthProvider>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) setupGlobalFonts();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <WebPreviewFrame>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <AppMessageProvider>
            <AccountProvider>
              <NavigationContainer>
                <RootNavigation />
              </NavigationContainer>
            </AccountProvider>
          </AppMessageProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </WebPreviewFrame>
  );
}

const styles = StyleSheet.create({
  boot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  root: {
    flex: 1,
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    elevation: 50,
    backgroundColor: colors.background,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
});
