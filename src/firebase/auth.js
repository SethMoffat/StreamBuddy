import { 
  signInAnonymously, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from './config';
import { Alert } from 'react-native';

// User types
export const USER_TYPES = {
  GUEST: 'guest',
  TWITCH: 'twitch',
  YOUTUBE: 'youtube'
};

// Auth state management
let currentUser = null;
let authStateListeners = [];
let isInitialized = false;
let guestUserRestored = false;
let authUnsubscribe = null;

// Initialize auth state listener
export const initializeAuth = () => {
  if (isInitialized) {
    console.log('Auth already initialized, skipping...');
    return authUnsubscribe || (() => {}); // Return existing unsubscribe function
  }
  
  isInitialized = true;
  console.log('Initializing Firebase Auth...');
  
  authUnsubscribe = onAuthStateChanged(auth, async (user) => {
    console.log('Auth state changed:', user ? 'User logged in' : 'User logged out');
    
    if (user) {
      // Get user profile from Firestore
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.exists() ? userDoc.data() : null;
        
        currentUser = {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          ...userData
        };
        
        console.log('Firebase user loaded:', currentUser.displayName || currentUser.uid);
      } catch (error) {
        console.error('Error getting user data from Firestore:', error);
        // Fallback to basic user info
        currentUser = {
          uid: user.uid,
          isAnonymous: user.isAnonymous,
          userType: USER_TYPES.GUEST,
          displayName: 'Guest User',
          profilePicture: null,
          platform: null,
          platformId: null,
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        };
      }
    } else {
      // Only try to restore guest user once
      if (!guestUserRestored) {
        guestUserRestored = true;
        
        try {
          const AsyncStorage = require('@react-native-async-storage/async-storage').default;
          const storedGuestUser = await AsyncStorage.getItem('guestUser');
          if (storedGuestUser) {
            currentUser = JSON.parse(storedGuestUser);
            console.log('Restored guest user from AsyncStorage');
          } else {
            currentUser = null;
            console.log('No stored guest user found');
          }
        } catch (error) {
          console.error('Error restoring guest user from AsyncStorage:', error);
          currentUser = null;
        }
      } else {
        // Don't restore again, just set to null
        currentUser = null;
      }
    }
    
    // Notify all listeners
    authStateListeners.forEach(listener => listener(currentUser));
  });
  
  return authUnsubscribe;
};

// Subscribe to auth state changes
export const subscribeToAuthState = (callback) => {
  authStateListeners.push(callback);
  
  // Return unsubscribe function
  return () => {
    authStateListeners = authStateListeners.filter(listener => listener !== callback);
  };
};

// Get current user
export const getCurrentUser = () => currentUser;

// Guest login (anonymous authentication)
export const loginAsGuest = async () => {
  try {
    console.log('Starting guest login...');
    console.log('Auth object:', auth);
    
    // Check if auth is properly initialized
    if (!auth) {
      throw new Error('Firebase Auth is not initialized');
    }
    
    const result = await signInAnonymously(auth);
    console.log('Anonymous sign in result:', result);
    
    const user = result.user;
    console.log('User object:', user);
    
    // Create user profile in Firestore
    const userProfile = {
      userType: USER_TYPES.GUEST,
      displayName: 'Guest User',
      profilePicture: null,
      platform: null,
      platformId: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isAnonymous: true
    };
    
    console.log('Creating user profile in Firestore...');
    await setDoc(doc(db, 'users', user.uid), userProfile);
    console.log('User profile created successfully');
    
    return user;
  } catch (error) {
    console.error('Guest login error:', error);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    // Provide helpful error messages and fallback
    if (error.code === 'auth/configuration-not-found') {
      console.log('Anonymous authentication not enabled, using local guest mode...');
      
      // Create a local guest user without showing the alert
      const guestUser = {
        uid: 'guest-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9),
        isAnonymous: true,
        userType: USER_TYPES.GUEST,
        displayName: 'Guest User',
        profilePicture: null,
        platform: null,
        platformId: null,
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        isLocalGuest: true // Flag to indicate this is a local fallback user
      };
      
      // Store in AsyncStorage for persistence
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem('guestUser', JSON.stringify(guestUser));
        console.log('Guest user stored in AsyncStorage');
      } catch (storageError) {
        console.error('Failed to store guest user in AsyncStorage:', storageError);
      }
      
      // Set the current user manually
      currentUser = guestUser;
      
      // Notify listeners
      authStateListeners.forEach(listener => listener(currentUser));
      
      return guestUser;
    }
    
    // For other errors, provide a generic fallback
    if (error.code === 'auth/network-request-failed') {
      console.log('Network error, using offline guest mode...');
    } else {
      console.log('Authentication error, using local guest mode...');
    }
    
    // Create fallback user for any error
    const fallbackUser = {
      uid: 'fallback-' + Date.now(),
      isAnonymous: true,
      userType: USER_TYPES.GUEST,
      displayName: 'Guest User',
      profilePicture: null,
      platform: null,
      platformId: null,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      isLocalGuest: true
    };
    
    // Store in AsyncStorage for persistence
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('guestUser', JSON.stringify(fallbackUser));
      console.log('Fallback guest user stored in AsyncStorage');
    } catch (storageError) {
      console.error('Failed to store fallback guest user in AsyncStorage:', storageError);
    }
    
    currentUser = fallbackUser;
    authStateListeners.forEach(listener => listener(currentUser));
    
    return fallbackUser;
  }
};

// Twitch OAuth login (placeholder - requires OAuth setup)
export const loginWithTwitch = async () => {
  try {
    // For now, show alert that this feature is coming soon
    Alert.alert(
      'Coming Soon',
      'Twitch login integration is coming soon! For now, please use Guest login.',
      [{ text: 'OK' }]
    );
    throw new Error('Twitch login not implemented yet');
  } catch (error) {
    console.error('Twitch login error:', error);
    throw error;
  }
};

// YouTube OAuth login (placeholder - requires OAuth setup)
export const loginWithYouTube = async () => {
  try {
    // For now, show alert that this feature is coming soon
    Alert.alert(
      'Coming Soon',
      'YouTube login integration is coming soon! For now, please use Guest login.',
      [{ text: 'OK' }]
    );
    throw new Error('YouTube login not implemented yet');
  } catch (error) {
    console.error('YouTube login error:', error);
    throw error;
  }
};

// Logout
export const logout = async () => {
  try {
    // Clear stored guest user
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('guestUser');
    
    // Reset auth state
    currentUser = null;
    guestUserRestored = false;
    
    // Sign out from Firebase if authenticated
    if (auth.currentUser) {
      await signOut(auth);
    }
    
    // Notify listeners immediately
    authStateListeners.forEach(listener => listener(null));
    
    console.log('User logged out successfully');
  } catch (error) {
    console.error('Logout error:', error);
    throw error;
  }
};

// Reset guest user data
export const resetGuestUser = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('guestUser');
    
    // Reset flags
    guestUserRestored = false;
    
    // If current user is a guest, clear it
    if (currentUser && (currentUser.userType === USER_TYPES.GUEST || currentUser.isLocalGuest)) {
      currentUser = null;
      authStateListeners.forEach(listener => listener(null));
    }
    
    console.log('Guest user data reset successfully');
  } catch (error) {
    console.error('Error resetting guest user data:', error);
    throw error;
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  if (!currentUser) throw new Error('No user logged in');
  
  try {
    await updateDoc(doc(db, 'users', currentUser.uid), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    // Update local user data
    currentUser = { ...currentUser, ...updates };
    
    // Notify listeners
    authStateListeners.forEach(listener => listener(currentUser));
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
};

// Check if user is logged in
export const isLoggedIn = () => {
  return currentUser !== null;
};

// Check if user is guest
export const isGuest = () => {
  return currentUser && currentUser.userType === USER_TYPES.GUEST;
};

// Get user's platform
export const getUserPlatform = () => {
  return currentUser?.platform || null;
};

// Reset auth state (useful for debugging)
export const resetAuthState = async () => {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    await AsyncStorage.removeItem('guestUser');
    
    // Clear all auth state
    currentUser = null;
    guestUserRestored = false;
    isInitialized = false;
    authStateListeners = [];
    
    // Unsubscribe from auth if exists
    if (authUnsubscribe) {
      authUnsubscribe();
      authUnsubscribe = null;
    }
    
    console.log('Auth state reset completely');
  } catch (error) {
    console.error('Error resetting auth state:', error);
  }
};

// Show Firebase setup instructions
export const showFirebaseSetupInstructions = () => {
  Alert.alert(
    'Firebase Setup Required',
    'For full authentication features, please enable Anonymous Authentication in your Firebase Console:\n\n' +
    '1. Go to Firebase Console (https://console.firebase.google.com)\n' +
    '2. Select your project\n' +
    '3. Go to Authentication → Sign-in method\n' +
    '4. Enable Anonymous authentication\n\n' +
    'The app will continue to work with local guest mode until then.',
    [{ text: 'OK' }]
  );
};
