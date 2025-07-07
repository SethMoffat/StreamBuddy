import React, { useEffect, useRef, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet, AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import { startSession, endSession, logAnalyticsEvent } from './src/firebase/storage';
import { initializeAuth, subscribeToAuthState, getCurrentUser, resetGuestUser } from './src/firebase/auth';

import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TimerScreen from './src/screens/TimerScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';
import ProfileScreen from './src/screens/ProfileScreen';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const sessionRef = useRef(null);
  const appState = useRef(AppState.currentState);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    let authUnsubscribe;
    let unsubscribe;
    let appStateSubscription;
    
    const initializeApp = async () => {
      try {
        // Initialize authentication once
        authUnsubscribe = initializeAuth();
        
        // Subscribe to auth state changes
        unsubscribe = subscribeToAuthState((currentUser) => {
          console.log('App received auth state change:', currentUser ? currentUser.displayName || currentUser.uid : 'No user');
          setUser(currentUser);
          setAuthLoading(false);
        });

        // Handle app state changes (but don't log to Firebase automatically)
        const handleAppStateChange = (nextAppState) => {
          // Only track app state changes, don't log to Firebase
          console.log('App state changed to:', nextAppState);
          appState.current = nextAppState;
        };

        // Set up app state listener
        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
        
        // Wait for auth to initialize before proceeding
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Don't start session tracking automatically
        // Session tracking will only start when user presses "Start Stream"
        
        // Simulate app loading
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    };

    // App cleanup - only clean up if session was started
    const cleanup = () => {
      if (sessionRef.current) {
        endSession(sessionRef.current, user?.uid);
        sessionRef.current = null;
      }
    };

    // Initialize the app
    initializeApp();
    
    // Cleanup on unmount
    return () => {
      appStateSubscription?.remove();
      cleanup();
      if (authUnsubscribe) authUnsubscribe();
      if (unsubscribe) unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  // Show loading screen while checking auth
  if (authLoading) {
    return (
      <NavigationContainer>
        <StatusBar style="light" backgroundColor="#8A2BE2" />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#8A2BE2" />
      <Stack.Navigator
        initialRouteName={user ? "Home" : "Login"}
        screenOptions={{
          headerStyle: {
            backgroundColor: '#8A2BE2',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        {user ? (
          // Authenticated screens
          <>
            <Stack.Screen 
              name="Home" 
              component={HomeScreen} 
              options={{ title: '' }}
            />
            <Stack.Screen 
              name="Schedule" 
              component={ScheduleScreen} 
              options={{ title: '' }}
            />
            <Stack.Screen 
              name="Timer" 
              component={TimerScreen} 
              options={{ title: '' }}
            />
            <Stack.Screen 
              name="AddTask" 
              component={AddTaskScreen} 
              options={{ title: '' }}
            />
            <Stack.Screen 
              name="EditTask" 
              component={EditTaskScreen} 
              options={{ title: '' }}
            />
            <Stack.Screen 
              name="Profile" 
              component={ProfileScreen} 
              options={{ title: '' }}
            />
          </>
        ) : (
          // Unauthenticated screens
          <Stack.Screen 
            name="Login" 
            component={LoginScreen} 
            options={{ headerShown: false }}
          />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
