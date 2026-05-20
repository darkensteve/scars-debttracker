import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Provider as PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DebtProvider, useDebt } from './app/context/DebtContext';
import DashboardScreen from './app/screens/DashboardScreen';
import ContactsScreen from './app/screens/ContactsScreen';
import AddTransactionScreen from './app/screens/AddTransactionScreen';
import SettingsScreen from './app/screens/SettingsScreen';
import ContactDetailScreen from './app/screens/ContactDetailScreen';
import AddContactScreen from './app/screens/AddContactScreen';
import SplashScreen from './app/screens/SplashScreen';
import WebPreviewFrame from './app/components/WebPreviewFrame';
import { paperTheme } from './app/theme/paperTheme';
import { colors } from './app/theme/colors';

const SPLASH_MIN_MS = 2400;

const Tab = createBottomTabNavigator();
const ContactsStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function ContactsStackScreen() {
  return (
    <ContactsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
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
    </ContactsStack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          const icons = {
            Dashboard: 'view-dashboard-outline',
            People: 'account-group-outline',
            Add: 'plus-circle-outline',
            Settings: 'cog-outline',
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
          fontWeight: '600',
        },
        headerStyle: { backgroundColor: colors.surface },
        headerTitleStyle: { fontWeight: '600', color: colors.text },
        headerShadowVisible: false,
      })}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{ headerShown: false, title: 'Home' }}
      />
      <Tab.Screen
        name="People"
        component={ContactsStackScreen}
        options={{ headerShown: false, title: 'People' }}
      />
      <Tab.Screen
        name="Add"
        component={AddTransactionScreen}
        options={{ title: 'Add transaction' }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isReady } = useDebt();
  const [splashVisible, setSplashVisible] = useState(true);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const readyAt = useRef(null);

  useEffect(() => {
    if (!isReady) return;
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
  }, [isReady, fadeAnim]);

  return (
    <View style={styles.root}>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Main" component={MainTabs} />
      </RootStack.Navigator>

      {splashVisible ? (
        <Animated.View
          style={[styles.splashOverlay, { opacity: fadeAnim }]}
          pointerEvents={isReady ? 'none' : 'auto'}
        >
          <SplashScreen loading={!isReady} />
        </Animated.View>
      ) : null}
    </View>
  );
}

export default function App() {
  return (
    <WebPreviewFrame>
      <SafeAreaProvider>
        <PaperProvider theme={paperTheme}>
          <DebtProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </DebtProvider>
        </PaperProvider>
      </SafeAreaProvider>
    </WebPreviewFrame>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    elevation: 100,
  },
});
