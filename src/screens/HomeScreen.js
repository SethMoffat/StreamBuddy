import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { loadTasks, formatTime } from '../utils/storage';
import { startSession, logAnalyticsEvent } from '../firebase/storage';
import { getCurrentUser } from '../firebase/auth';

const { width } = Dimensions.get('window');

export default function HomeScreen({ navigation }) {
  const [tasks, setTasks] = useState([]);
  const [nextTask, setNextTask] = useState(null);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [currentSessionId, setCurrentSessionId] = useState(null);

  useFocusEffect(
    React.useCallback(() => {
      loadTasksFromStorage();
    }, [])
  );

  const loadTasksFromStorage = async () => {
    const savedTasks = await loadTasks();
    setTasks(savedTasks);
    if (savedTasks.length > 0) {
      setNextTask(savedTasks[0]);
    }
  };

  const startStream = async () => {
    if (tasks.length === 0) {
      Alert.alert(
        'No Tasks Available',
        'Please add some tasks to your stream schedule first.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      // Start Firebase logging only when stream starts
      const currentUser = getCurrentUser();
      if (currentUser) {
        // Start session tracking
        const sessionId = await startSession(currentUser.uid);
        setCurrentSessionId(sessionId);
        console.log('Stream session started:', sessionId);
        
        // Log stream start event
        await logAnalyticsEvent('stream_started', {
          taskCount: tasks.length,
          totalDuration: tasks.reduce((total, task) => total + task.duration, 0),
          platform: 'mobile',
          userType: currentUser.userType || 'unknown',
          startTime: new Date().toISOString(),
        }, currentUser.uid);
      }
    } catch (error) {
      console.warn('Firebase logging failed, continuing with stream:', error);
    }

    // Navigate to timer regardless of logging success
    navigation.navigate('Timer', { 
      tasks,
      currentTaskIndex: 0,
      sessionId: currentSessionId
    });
  };

  const TaskCard = ({ task, isNext = false }) => (
    <View style={[styles.taskCard, isNext && styles.nextTaskCard]}>
      <View style={styles.taskHeader}>
        <Text style={[styles.taskTitle, isNext && styles.nextTaskTitle]}>
          {task.title}
        </Text>
        <Text style={[styles.taskDuration, isNext && styles.nextTaskDuration]}>
          {formatTime(task.duration)}
        </Text>
      </View>
      {task.description && (
        <Text style={[styles.taskDescription, isNext && styles.nextTaskDescription]}>
          {task.description}
        </Text>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.title}>Stream Buddy</Text>
              <Text style={styles.subtitle}>Ready to stream?</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => navigation.navigate('Profile')}
            >
              <Ionicons name="person-circle" size={32} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{tasks.length}</Text>
            <Text style={styles.statLabel}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {formatTime(tasks.reduce((total, task) => total + task.duration, 0))}
            </Text>
            <Text style={styles.statLabel}>Total Time</Text>
          </View>
        </View>

        {/* Next Task Section */}
        {nextTask && (
          <View style={styles.nextTaskSection}>
            <Text style={styles.sectionTitle}>Next Task</Text>
            <TaskCard task={nextTask} isNext={true} />
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={startStream}
            disabled={tasks.length === 0}
          >
            <Ionicons name="play" size={24} color="#fff" />
            <Text style={styles.primaryButtonText}>Start Stream</Text>
          </TouchableOpacity>

          <View style={styles.secondaryButtons}>
            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Schedule')}
            >
              <Ionicons name="calendar" size={20} color="#000" />
              <Text style={styles.secondaryButtonText}>Schedule</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Ionicons name="add" size={20} color="#000" />
              <Text style={styles.secondaryButtonText}>Add Task</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Tasks Preview */}
        {tasks.length > 0 && (
          <View style={styles.recentTasksSection}>
            <Text style={styles.sectionTitle}>Your Tasks</Text>
            {tasks.slice(0, 3).map((task, index) => (
              <TaskCard key={task.id} task={task} />
            ))}
            {tasks.length > 3 && (
              <TouchableOpacity 
                style={styles.viewMoreButton}
                onPress={() => navigation.navigate('Schedule')}
              >
                <Text style={styles.viewMoreText}>
                  View all {tasks.length} tasks
                </Text>
                <Ionicons name="chevron-forward" size={16} color="#000" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Empty State */}
        {tasks.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="calendar-outline" size={64} color="#ccc" />
            <Text style={styles.emptyStateTitle}>No Tasks Yet</Text>
            <Text style={styles.emptyStateText}>
              Add your first streaming task to get started
            </Text>
            <TouchableOpacity 
              style={styles.emptyStateButton}
              onPress={() => navigation.navigate('AddTask')}
            >
              <Text style={styles.emptyStateButtonText}>Add First Task</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  header: {
    padding: 20,
    backgroundColor: '#8A2BE2',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  profileButton: {
    padding: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 20,
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginTop: -10,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  nextTaskSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  taskCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  nextTaskCard: {
    backgroundColor: '#8A2BE2',
    borderWidth: 2,
    borderColor: '#9370DB',
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  nextTaskTitle: {
    color: '#fff',
  },
  taskDuration: {
    fontSize: 14,
    color: '#000',
    fontWeight: 'bold',
  },
  nextTaskDuration: {
    color: '#fff',
  },
  taskDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  nextTaskDescription: {
    color: '#fff',
    opacity: 0.9,
  },
  actionsContainer: {
    padding: 20,
  },
  primaryButton: {
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  secondaryButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#000',
    flex: 0.48,
  },
  secondaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 5,
  },
  recentTasksSection: {
    padding: 20,
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  viewMoreText: {
    color: '#000',
    fontSize: 14,
    marginRight: 5,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  emptyStateButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  emptyStateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
