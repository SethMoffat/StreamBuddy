import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment
} from 'firebase/firestore';
import { db } from './config';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Collection names
const TASKS_COLLECTION = 'tasks';
const ANALYTICS_COLLECTION = 'analytics';
const SESSIONS_COLLECTION = 'sessions';
const TIMER_HISTORY_COLLECTION = 'timerHistory';

// Flag to track if Firebase logging is enabled (only when streaming)
let isFirebaseLoggingEnabled = false;

// Enable Firebase logging (called when stream starts)
export const enableFirebaseLogging = () => {
  isFirebaseLoggingEnabled = true;
  console.log('Firebase logging enabled');
};

// Disable Firebase logging (called when stream ends)
export const disableFirebaseLogging = () => {
  isFirebaseLoggingEnabled = false;
  console.log('Firebase logging disabled');
};

// Generate device/session info
const getDeviceInfo = () => ({
  platform: Platform.OS,
  version: Platform.Version,
  timestamp: new Date().toISOString(),
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  locale: Intl.DateTimeFormat().resolvedOptions().locale,
});

// Generate detailed task data
const enrichTaskData = (task) => ({
  ...task,
  metadata: {
    createdAt: serverTimestamp(),
    createdBy: 'user',
    device: getDeviceInfo(),
    appVersion: '1.0.0',
    taskLength: task.title ? task.title.length : 0,
    descriptionLength: task.description ? task.description.length : 0,
    durationMinutes: Math.round(task.duration / 60),
    durationCategory: getDurationCategory(task.duration),
    weekday: new Date().toLocaleDateString('en-US', { weekday: 'long' }),
    hour: new Date().getHours(),
    timeOfDay: getTimeOfDay(new Date().getHours()),
  }
});

// Categorize duration
const getDurationCategory = (seconds) => {
  const minutes = seconds / 60;
  if (minutes <= 5) return 'very-short';
  if (minutes <= 15) return 'short';
  if (minutes <= 30) return 'medium';
  if (minutes <= 60) return 'long';
  return 'very-long';
};

// Get time of day category
const getTimeOfDay = (hour) => {
  if (hour < 6) return 'early-morning';
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  if (hour < 21) return 'evening';
  return 'night';
};

// Log analytics events (only when Firebase logging is enabled)
export const logAnalyticsEvent = async (eventName, eventData = {}, userId = 'default') => {
  if (!isFirebaseLoggingEnabled) {
    console.log(`Analytics event skipped (logging disabled): ${eventName}`);
    return;
  }
  
  try {
    const analyticsRef = collection(db, `users/${userId}/${ANALYTICS_COLLECTION}`);
    await addDoc(analyticsRef, {
      eventName,
      eventData,
      timestamp: serverTimestamp(),
      device: getDeviceInfo(),
      sessionId: generateSessionId(),
    });
    console.log(`Analytics event logged: ${eventName}`);
  } catch (error) {
    console.error('Error logging analytics:', error);
  }
};

// Log timer session data
export const logTimerSession = async (sessionData, userId = 'default') => {
  try {
    const timerRef = collection(db, `users/${userId}/${TIMER_HISTORY_COLLECTION}`);
    await addDoc(timerRef, {
      ...sessionData,
      timestamp: serverTimestamp(),
      device: getDeviceInfo(),
      completionRate: sessionData.timeCompleted / sessionData.totalTime,
      efficiency: calculateEfficiency(sessionData),
    });
  } catch (error) {
    console.error('Error logging timer session:', error);
  }
};

// Calculate efficiency score
const calculateEfficiency = (sessionData) => {
  const { timeCompleted, totalTime, pauseCount = 0, skipCount = 0 } = sessionData;
  let score = (timeCompleted / totalTime) * 100;
  score -= (pauseCount * 5); // Penalty for pauses
  score -= (skipCount * 10); // Penalty for skips
  return Math.max(0, Math.min(100, score));
};

// Generate session ID
const generateSessionId = () => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Helper function for local storage tasks
const getLocalTasks = async (userId) => {
  try {
    const tasksJson = await AsyncStorage.getItem(`tasks_${userId}`);
    if (tasksJson) {
      const tasks = JSON.parse(tasksJson);
      console.log(`Loaded ${tasks.length} tasks from AsyncStorage for user ${userId}`);
      return tasks;
    }
    return [];
  } catch (error) {
    console.error('Error getting local tasks:', error);
    return [];
  }
};

// Enhanced task saving with comprehensive data
export const saveTask = async (task, userId = 'default') => {
  try {
    // Check if this is a local guest user
    if (userId.startsWith('guest-') || userId.startsWith('fallback-')) {
      console.log('Saving task for local guest user to AsyncStorage');
      
      // Get existing tasks from AsyncStorage
      const existingTasks = await getLocalTasks(userId);
      
      // Add new task
      const newTask = {
        id: generateId(),
        ...task,
        createdAt: new Date().toISOString(),
        userId: userId
      };
      
      existingTasks.push(newTask);
      
      // Save back to AsyncStorage
      await AsyncStorage.setItem(`tasks_${userId}`, JSON.stringify(existingTasks));
      
      console.log('Task saved to AsyncStorage successfully');
      return newTask;
    }
    
    // Firebase storage (original implementation)
    const enrichedTask = enrichTaskData(task);
    const tasksRef = collection(db, `users/${userId}/${TASKS_COLLECTION}`);
    const docRef = await addDoc(tasksRef, enrichedTask);
    
    // Log analytics event
    await logAnalyticsEvent('task_created', {
      taskId: docRef.id,
      title: task.title,
      duration: task.duration,
      category: getDurationCategory(task.duration),
    }, userId);
    
    return { id: docRef.id, ...enrichedTask };
  } catch (error) {
    console.error('Error saving task:', error);
    throw error;
  }
};

// Enhanced task updating
export const updateTask = async (taskId, updates, userId = 'default') => {
  try {
    const taskRef = doc(db, `users/${userId}/${TASKS_COLLECTION}`, taskId);
    const enrichedUpdates = {
      ...updates,
      updatedAt: serverTimestamp(),
      updateMetadata: {
        device: getDeviceInfo(),
        updateCount: increment(1),
        lastUpdateBy: 'user',
      }
    };
    
    await updateDoc(taskRef, enrichedUpdates);
    
    // Log analytics event
    await logAnalyticsEvent('task_updated', {
      taskId,
      updatedFields: Object.keys(updates),
      updateType: 'manual',
    }, userId);
    
    return { id: taskId, ...enrichedUpdates };
  } catch (error) {
    console.error('Error updating task:', error);
    throw error;
  }
};

// Enhanced task deletion
export const deleteTask = async (taskId, userId = 'default') => {
  try {
    const taskRef = doc(db, `users/${userId}/${TASKS_COLLECTION}`, taskId);
    await deleteDoc(taskRef);
    
    // Log analytics event
    await logAnalyticsEvent('task_deleted', {
      taskId,
      deletedAt: new Date().toISOString(),
    }, userId);
    
    return taskId;
  } catch (error) {
    console.error('Error deleting task:', error);
    throw error;
  }
};

// Format time helper (keeping the same as before)
export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

// Generate unique ID
export const generateId = () => {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
};

// Load tasks from Firestore with enhanced metadata
export const loadTasks = async (userId = 'default') => {
  try {
    // Check if this is a local guest user
    if (userId.startsWith('guest-') || userId.startsWith('fallback-')) {
      console.log('Loading tasks for local guest user from AsyncStorage');
      return await getLocalTasks(userId);
    }
    
    // Firebase storage (original implementation)
    const tasksRef = collection(db, `users/${userId}/${TASKS_COLLECTION}`);
    const q = query(tasksRef, orderBy('metadata.createdAt', 'asc'));
    const querySnapshot = await getDocs(q);
    
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Log analytics event
    await logAnalyticsEvent('tasks_loaded', {
      taskCount: tasks.length,
      loadTime: new Date().toISOString(),
    }, userId);
    
    return tasks;
  } catch (error) {
    console.error('Error loading tasks:', error);
    
    // Fallback to local storage
    const userId_fallback = userId.startsWith('guest-') ? userId : `fallback-${userId}`;
    return await getLocalTasks(userId_fallback);
  }
};

// Save multiple tasks (enhanced for compatibility)
export const saveTasks = async (tasks, userId = 'default') => {
  try {
    const promises = tasks.map(task => {
      if (task.id && !task.id.startsWith('temp_')) {
        return updateTask(task.id, task, userId);
      } else {
        const { id, ...taskData } = task;
        return saveTask(taskData, userId);
      }
    });
    
    await Promise.all(promises);
    
    // Log bulk operation
    await logAnalyticsEvent('tasks_bulk_save', {
      taskCount: tasks.length,
      operationType: 'bulk_save',
    }, userId);
    
    return tasks;
  } catch (error) {
    console.error('Error saving tasks:', error);
    throw error;
  }
};

// Real-time listener for tasks with analytics
export const subscribeToTasks = (callback, userId = 'default') => {
  const tasksRef = collection(db, `users/${userId}/${TASKS_COLLECTION}`);
  const q = query(tasksRef, orderBy('metadata.createdAt', 'asc'));
  
  // Log subscription start
  logAnalyticsEvent('tasks_subscription_started', {
    subscriptionType: 'real_time',
  }, userId);
  
  return onSnapshot(q, (querySnapshot) => {
    const tasks = [];
    querySnapshot.forEach((doc) => {
      tasks.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    // Log real-time update
    logAnalyticsEvent('tasks_real_time_update', {
      taskCount: tasks.length,
      updateTime: new Date().toISOString(),
    }, userId);
    
    callback(tasks);
  }, (error) => {
    console.error('Error in tasks subscription:', error);
    logAnalyticsEvent('tasks_subscription_error', {
      error: error.message,
    }, userId);
  });
};

// Start app session tracking
export const startSession = async (userId = 'default') => {
  try {
    // Enable Firebase logging when session starts
    enableFirebaseLogging();
    
    const sessionRef = collection(db, `users/${userId}/${SESSIONS_COLLECTION}`);
    const sessionData = {
      sessionId: generateSessionId(),
      startTime: serverTimestamp(),
      device: getDeviceInfo(),
      appVersion: '1.0.0',
      isActive: true,
    };
    
    const docRef = await addDoc(sessionRef, sessionData);
    
    await logAnalyticsEvent('session_started', {
      sessionId: sessionData.sessionId,
      startTime: new Date().toISOString(),
    }, userId);
    
    return docRef.id;
  } catch (error) {
    console.error('Error starting session:', error);
    // Still enable logging even if Firebase fails
    enableFirebaseLogging();
    return null;
  }
};

// End app session tracking
export const endSession = async (sessionDocId, userId = 'default') => {
  try {
    if (sessionDocId) {
      const sessionRef = doc(db, `users/${userId}/${SESSIONS_COLLECTION}`, sessionDocId);
      await updateDoc(sessionRef, {
        endTime: serverTimestamp(),
        isActive: false,
      });
      
      await logAnalyticsEvent('session_ended', {
        sessionDocId,
        endTime: new Date().toISOString(),
      }, userId);
    }
  } catch (error) {
    console.error('Error ending session:', error);
  } finally {
    // Always disable Firebase logging when session ends
    disableFirebaseLogging();
  }
};
