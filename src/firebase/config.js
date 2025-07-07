// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, getAuth, getReactNativePersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAkxZbQEf5rBacw60MomOTkeXWjKYM3qgQ",
  authDomain: "streambuddy-8a93f.firebaseapp.com",
  projectId: "streambuddy-8a93f",
  storageBucket: "streambuddy-8a93f.firebasestorage.app",
  messagingSenderId: "292613052106",
  appId: "1:292613052106:web:ed064b5a447c02a9f7c633",
  measurementId: "G-B7K220PS6C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);

// Initialize Auth with AsyncStorage persistence for React Native
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage)
  });
} catch (error) {
  // If auth is already initialized, get the existing instance
  if (error.code === 'auth/already-initialized') {
    auth = getAuth(app);
  } else {
    console.error('Firebase Auth initialization error:', error);
    throw error;
  }
}

export { auth };
export default app;