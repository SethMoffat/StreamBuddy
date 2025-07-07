// Test Firebase configuration
import { auth, db } from './config';
import { signInAnonymously } from 'firebase/auth';

export const testFirebaseConfig = async () => {
  try {
    console.log('Testing Firebase configuration...');
    console.log('Auth instance:', auth);
    console.log('Firestore instance:', db);
    
    // Test anonymous sign in
    console.log('Testing anonymous authentication...');
    const result = await signInAnonymously(auth);
    console.log('Anonymous auth successful:', result.user.uid);
    
    return true;
  } catch (error) {
    console.error('Firebase configuration test failed:', error);
    return false;
  }
};
