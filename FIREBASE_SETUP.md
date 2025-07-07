# Firebase Anonymous Authentication Setup Guide

## Problem
The error `auth/configuration-not-found` occurs when Anonymous Authentication is not enabled in your Firebase project.

## Solution

### Step 1: Go to Firebase Console
1. Open [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `streambuddy-8a93f`

### Step 2: Enable Anonymous Authentication
1. In the left sidebar, click on **Authentication**
2. Click on the **Sign-in method** tab
3. Find **Anonymous** in the list of sign-in providers
4. Click on **Anonymous**
5. Toggle the **Enable** switch to ON
6. Click **Save**

### Step 3: Verify Configuration
After enabling Anonymous Authentication, the app should work properly. The guest login will:
- Create an anonymous user in Firebase Auth
- Store user profile data in Firestore
- Allow full app functionality

### Fallback Solution
If Firebase Anonymous Auth is not available, the app includes a fallback that:
- Creates a local guest user
- Stores data locally using AsyncStorage
- Provides basic functionality

### Additional Setup (Optional)
For production apps, you may also want to:
1. Set up proper security rules in Firestore
2. Configure other sign-in methods (Google, Facebook, etc.)
3. Set up proper user management

## Current Configuration
- Project ID: `streambuddy-8a93f`
- Auth Domain: `streambuddy-8a93f.firebaseapp.com`
- Anonymous Auth: **NEEDS TO BE ENABLED**
