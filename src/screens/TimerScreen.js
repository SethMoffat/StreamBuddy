import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatTime } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function TimerScreen({ route, navigation }) {
  const { tasks, currentTaskIndex: initialTaskIndex = 0 } = route.params;
  
  const [currentTaskIndex, setCurrentTaskIndex] = useState(initialTaskIndex);
  const [timeRemaining, setTimeRemaining] = useState(tasks[initialTaskIndex]?.duration || 0);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const intervalRef = useRef(null);
  const currentTask = tasks[currentTaskIndex];

  useEffect(() => {
    if (isRunning && !isPaused && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsCompleted(true);
            showTaskCompleteAlert();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, isPaused, timeRemaining]);

  const showTaskCompleteAlert = () => {
    Alert.alert(
      'Task Complete! 🎉',
      `"${currentTask.title}" is finished! Time to move on to the next task.`,
      [
        {
          text: 'Next Task',
          onPress: moveToNextTask,
          style: 'default',
        },
        {
          text: 'Stay Here',
          onPress: () => setIsCompleted(false),
          style: 'cancel',
        },
      ]
    );
  };

  const moveToNextTask = () => {
    if (currentTaskIndex < tasks.length - 1) {
      const nextIndex = currentTaskIndex + 1;
      setCurrentTaskIndex(nextIndex);
      setTimeRemaining(tasks[nextIndex].duration);
      setIsRunning(false);
      setIsPaused(false);
      setIsCompleted(false);
    } else {
      Alert.alert(
        'All Tasks Complete! 🎊',
        'Congratulations! You\'ve completed all tasks in your stream schedule.',
        [
          {
            text: 'Back to Home',
            onPress: () => navigation.navigate('Home'),
          },
        ]
      );
    }
  };

  const startTimer = () => {
    setIsRunning(true);
    setIsPaused(false);
    setIsCompleted(false);
  };

  const pauseTimer = () => {
    setIsRunning(false);
    setIsPaused(true);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setIsPaused(false);
    setIsCompleted(false);
    setTimeRemaining(currentTask.duration);
  };

  const skipToNextTask = () => {
    Alert.alert(
      'Skip Task',
      'Are you sure you want to skip to the next task?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: moveToNextTask },
      ]
    );
  };

  const goToPreviousTask = () => {
    if (currentTaskIndex > 0) {
      const prevIndex = currentTaskIndex - 1;
      setCurrentTaskIndex(prevIndex);
      setTimeRemaining(tasks[prevIndex].duration);
      setIsRunning(false);
      setIsPaused(false);
      setIsCompleted(false);
    }
  };

  const getProgressPercentage = () => {
    if (!currentTask) return 0;
    return ((currentTask.duration - timeRemaining) / currentTask.duration) * 100;
  };

  const getTimeColor = () => {
    const percentage = getProgressPercentage();
    if (percentage < 25) return '#4CAF50';
    if (percentage < 50) return '#FF9800';
    if (percentage < 75) return '#FF5722';
    return '#F44336';
  };

  const getTimerFontSize = () => {
    const timeString = formatTime(timeRemaining);
    const screenWidth = width;
    
    // Base font size based on screen width
    let baseFontSize = 48;
    if (screenWidth < 350) {
      baseFontSize = 36;
    } else if (screenWidth < 400) {
      baseFontSize = 42;
    }
    
    // Adjust font size based on time string length
    const timeLength = timeString.length;
    if (timeLength <= 5) { // MM:SS format
      return baseFontSize;
    } else if (timeLength <= 8) { // HH:MM:SS format
      return Math.max(baseFontSize * 0.8, 24);
    } else { // Very long format
      return Math.max(baseFontSize * 0.65, 20);
    }
  };

  if (!currentTask) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No tasks available</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBackground}>
          <View 
            style={[
              styles.progressBar, 
              { width: `${getProgressPercentage()}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(getProgressPercentage())}% Complete
        </Text>
      </View>

      {/* Task Info */}
      <View style={styles.taskInfo}>
        <Text style={styles.taskCounter}>
          Task {currentTaskIndex + 1} of {tasks.length}
        </Text>
        <Text style={styles.taskTitle}>{currentTask.title}</Text>
        {currentTask.description && (
          <Text style={styles.taskDescription}>{currentTask.description}</Text>
        )}
      </View>

      {/* Timer Display */}
      <View style={styles.timerContainer}>
        <Text style={[styles.timerText, { color: getTimeColor(), fontSize: getTimerFontSize() }]}>
          {formatTime(timeRemaining)}
        </Text>
        <Text style={styles.timerLabel}>
          {isCompleted ? 'Completed!' : isRunning ? 'Running' : isPaused ? 'Paused' : 'Ready'}
        </Text>
      </View>

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, styles.resetButton]}
          onPress={resetTimer}
        >
          <Ionicons name="refresh" size={24} color="#fff" />
          <Text style={styles.controlButtonText}>Reset</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.primaryButton]}
          onPress={isRunning ? pauseTimer : startTimer}
        >
          <Ionicons 
            name={isRunning ? 'pause' : 'play'} 
            size={32} 
            color="#fff" 
          />
          <Text style={styles.primaryButtonText}>
            {isRunning ? 'Pause' : 'Start'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, styles.skipButton]}
          onPress={skipToNextTask}
          disabled={currentTaskIndex >= tasks.length - 1}
        >
          <Ionicons name="play-skip-forward" size={24} color="#fff" />
          <Text style={styles.controlButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, currentTaskIndex === 0 && styles.navButtonDisabled]}
          onPress={goToPreviousTask}
          disabled={currentTaskIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentTaskIndex === 0 ? '#ccc' : '#000'} />
          <Text style={[styles.navButtonText, currentTaskIndex === 0 && styles.navButtonTextDisabled]}>
            Previous
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.navButton, currentTaskIndex >= tasks.length - 1 && styles.navButtonDisabled]}
          onPress={moveToNextTask}
          disabled={currentTaskIndex >= tasks.length - 1}
        >
          <Text style={[styles.navButtonText, currentTaskIndex >= tasks.length - 1 && styles.navButtonTextDisabled]}>
            Next
          </Text>
          <Ionicons name="chevron-forward" size={20} color={currentTaskIndex >= tasks.length - 1 ? '#ccc' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* Task List Preview */}
      <View style={styles.taskListContainer}>
        <Text style={styles.taskListTitle}>Upcoming Tasks</Text>
        {tasks.slice(currentTaskIndex + 1, currentTaskIndex + 4).map((task, index) => (
          <View key={task.id} style={styles.upcomingTask}>
            <Text style={styles.upcomingTaskTitle}>{task.title}</Text>
            <Text style={styles.upcomingTaskTime}>{formatTime(task.duration)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  progressBarContainer: {
    marginBottom: 30,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#8A2BE2',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 8,
    fontSize: 14,
    color: '#666',
  },
  taskInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  taskCounter: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginBottom: 10,
  },
  taskTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  taskDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  timerContainer: {
    alignItems: 'center',
    marginBottom: 50,
    paddingHorizontal: 10,
    width: '100%',
  },
  timerText: {
    fontWeight: 'bold',
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    textAlign: 'center',
    minWidth: '100%',
  },
  timerLabel: {
    fontSize: 18,
    color: '#666',
    marginTop: 10,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  controlButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    minWidth: 80,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    paddingHorizontal: 30,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 5,
  },
  resetButton: {
    backgroundColor: '#000',
  },
  skipButton: {
    backgroundColor: '#4CAF50',
  },
  controlButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 5,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    backgroundColor: '#fff',
  },
  navButtonDisabled: {
    borderColor: '#ccc',
    backgroundColor: '#f5f5f5',
  },
  navButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  navButtonTextDisabled: {
    color: '#ccc',
  },
  taskListContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  taskListTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  upcomingTask: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  upcomingTaskTitle: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  upcomingTaskTime: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
  },
  errorText: {
    fontSize: 18,
    color: '#ff4444',
    textAlign: 'center',
    marginTop: 50,
  },
});
