import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { loadTasks, saveTask, generateId } from '../firebase/storage';
import { getCurrentUser } from '../firebase/auth';

export default function AddTaskScreen({ navigation }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('0');
  const [minutes, setMinutes] = useState('15');
  const [seconds, setSeconds] = useState('0');

  const validateInputs = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return false;
    }

    const h = parseInt(hours) || 0;
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;

    if (h < 0 || h > 23 || m < 0 || m > 59 || s < 0 || s > 59) {
      Alert.alert('Error', 'Please enter valid time values');
      return false;
    }

    if (h === 0 && m === 0 && s === 0) {
      Alert.alert('Error', 'Task duration must be greater than 0');
      return false;
    }

    return true;
  };

  const handleSaveTask = async () => {
    if (!validateInputs()) return;

    const duration = (parseInt(hours) || 0) * 3600 + (parseInt(minutes) || 0) * 60 + (parseInt(seconds) || 0);
    
    const newTask = {
      id: generateId(),
      title: title.trim(),
      description: description.trim(),
      duration,
      createdAt: new Date().toISOString(),
    };

    try {
      const currentUser = getCurrentUser();
      const userId = currentUser?.uid || 'default';
      
      await saveTask(newTask, userId);
      
      Alert.alert(
        'Success',
        'Task added successfully!',
        [
          {
            text: 'Add Another',
            onPress: () => {
              setTitle('');
              setDescription('');
              setHours('0');
              setMinutes('15');
              setSeconds('0');
            },
          },
          {
            text: 'Back to Schedule',
            onPress: () => navigation.navigate('Schedule'),
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save task. Please try again.');
    }
  };

  const presetTimes = [
    { label: '5 min', h: 0, m: 5, s: 0 },
    { label: '10 min', h: 0, m: 10, s: 0 },
    { label: '15 min', h: 0, m: 15, s: 0 },
    { label: '30 min', h: 0, m: 30, s: 0 },
    { label: '1 hour', h: 1, m: 0, s: 0 },
    { label: '2 hours', h: 2, m: 0, s: 0 },
  ];

  const setPresetTime = (preset) => {
    setHours(preset.h.toString());
    setMinutes(preset.m.toString());
    setSeconds(preset.s.toString());
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Add New Task</Text>
          <Text style={styles.headerSubtitle}>Create a new task for your stream schedule</Text>
        </View>

        {/* Task Title */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Task Title *</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Gaming Session, Chat with Viewers, Break"
            placeholderTextColor="#999"
            maxLength={50}
          />
        </View>

        {/* Task Description */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.multilineInput]}
            value={description}
            onChangeText={setDescription}
            placeholder="Add any details about this task..."
            placeholderTextColor="#999"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
        </View>

        {/* Duration */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Duration *</Text>
          <View style={styles.timeInputContainer}>
            <View style={styles.timeInput}>
              <TextInput
                style={styles.timeInputField}
                value={hours}
                onChangeText={setHours}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.timeInputLabel}>hours</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInput}>
              <TextInput
                style={styles.timeInputField}
                value={minutes}
                onChangeText={setMinutes}
                placeholder="15"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.timeInputLabel}>minutes</Text>
            </View>
            <Text style={styles.timeSeparator}>:</Text>
            <View style={styles.timeInput}>
              <TextInput
                style={styles.timeInputField}
                value={seconds}
                onChangeText={setSeconds}
                placeholder="0"
                keyboardType="numeric"
                maxLength={2}
              />
              <Text style={styles.timeInputLabel}>seconds</Text>
            </View>
          </View>
        </View>

        {/* Preset Times */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Quick Presets</Text>
          <View style={styles.presetContainer}>
            {presetTimes.map((preset, index) => (
              <TouchableOpacity
                key={index}
                style={styles.presetButton}
                onPress={() => setPresetTime(preset)}
              >
                <Text style={styles.presetButtonText}>{preset.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Save Button */}
        <TouchableOpacity style={styles.saveButton} onPress={handleSaveTask}>
          <Ionicons name="checkmark" size={24} color="#fff" />
          <Text style={styles.saveButtonText}>Save Task</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    backgroundColor: '#8A2BE2',
    padding: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  inputSection: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  timeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  timeInput: {
    alignItems: 'center',
    flex: 1,
  },
  timeInputField: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    minWidth: 60,
  },
  timeInputLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 5,
  },
  timeSeparator: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
    marginHorizontal: 10,
  },
  presetContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  presetButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#000',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 5,
  },
  presetButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#8A2BE2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    marginTop: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
