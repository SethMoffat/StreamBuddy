import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StyleSheet } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import HomeScreen from './src/screens/HomeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TimerScreen from './src/screens/TimerScreen';
import AddTaskScreen from './src/screens/AddTaskScreen';
import EditTaskScreen from './src/screens/EditTaskScreen';

const Stack = createNativeStackNavigator();

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  useEffect(() => {
    // Simulate app loading (you can replace this with actual loading logic)
    const prepare = async () => {
      try {
        // Add any app initialization here
        await new Promise(resolve => setTimeout(resolve, 2000)); // Show splash for 2 seconds
      } catch (e) {
        console.warn(e);
      } finally {
        // Hide the splash screen
        await SplashScreen.hideAsync();
      }
    };

    prepare();
  }, []);

  return (
    <NavigationContainer>
      <StatusBar style="light" backgroundColor="#8A2BE2" />
      <Stack.Navigator
        initialRouteName="Home"
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
