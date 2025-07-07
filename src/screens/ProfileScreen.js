import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  getCurrentUser, 
  logout, 
  subscribeToAuthState,
  isGuest,
  getUserPlatform,
  USER_TYPES,
  resetGuestUser,
  showFirebaseSetupInstructions
} from '../firebase/auth';

export default function ProfileScreen({ navigation }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Subscribe to auth state changes
    const unsubscribe = subscribeToAuthState((currentUser) => {
      setUser(currentUser);
    });

    // Set initial user
    setUser(getCurrentUser());

    return unsubscribe;
  }, []);

  const handleLogout = async () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await logout();
              // Navigation will be handled by the auth state listener
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getPlatformIcon = () => {
    switch (user?.userType) {
      case USER_TYPES.TWITCH:
        return 'logo-twitch';
      case USER_TYPES.YOUTUBE:
        return 'logo-youtube';
      case USER_TYPES.GUEST:
        return 'person';
      default:
        return 'person';
    }
  };

  const getPlatformColor = () => {
    switch (user?.userType) {
      case USER_TYPES.TWITCH:
        return '#9146FF';
      case USER_TYPES.YOUTUBE:
        return '#FF0000';
      case USER_TYPES.GUEST:
        return '#666';
      default:
        return '#666';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Profile</Text>
        </View>

        {/* User Info */}
        <View style={styles.userCard}>
          <View style={styles.userHeader}>
            {user.profilePicture ? (
              <Image source={{ uri: user.profilePicture }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: getPlatformColor() }]}>
                <Ionicons name={getPlatformIcon()} size={40} color="#fff" />
              </View>
            )}
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.displayName}</Text>
              <View style={styles.platformBadge}>
                <Ionicons name={getPlatformIcon()} size={16} color={getPlatformColor()} />
                <Text style={[styles.platformText, { color: getPlatformColor() }]}>
                  {user.userType === USER_TYPES.GUEST ? 'Guest' : user.platform}
                </Text>
              </View>
            </View>
          </View>

          {/* User Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {user.createdAt ? formatDate(user.createdAt) : 'Unknown'}
              </Text>
              <Text style={styles.statLabel}>Member Since</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Unknown'}
              </Text>
              <Text style={styles.statLabel}>Last Login</Text>
            </View>
          </View>
        </View>

        {/* Account Options */}
        <View style={styles.optionsContainer}>
          <Text style={styles.sectionTitle}>Account Settings</Text>
          
          {/* Data Export */}
          <TouchableOpacity style={styles.option}>
            <Ionicons name="download" size={24} color="#8A2BE2" />
            <Text style={styles.optionText}>Export Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Notifications */}
          <TouchableOpacity style={styles.option}>
            <Ionicons name="notifications" size={24} color="#8A2BE2" />
            <Text style={styles.optionText}>Notifications</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Privacy */}
          <TouchableOpacity style={styles.option}>
            <Ionicons name="shield" size={24} color="#8A2BE2" />
            <Text style={styles.optionText}>Privacy Settings</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          {/* Help */}
          <TouchableOpacity style={styles.option}>
            <Ionicons name="help-circle" size={24} color="#8A2BE2" />
            <Text style={styles.optionText}>Help & Support</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>
        </View>

        {/* Platform Specific Info */}
        {user.userType !== USER_TYPES.GUEST && (
          <View style={styles.platformContainer}>
            <Text style={styles.sectionTitle}>Platform Information</Text>
            
            {user.userType === USER_TYPES.TWITCH && user.twitchData && (
              <View style={styles.platformInfo}>
                <Text style={styles.platformInfoLabel}>Twitch Username:</Text>
                <Text style={styles.platformInfoValue}>{user.twitchData.login}</Text>
                
                <Text style={styles.platformInfoLabel}>Broadcaster Type:</Text>
                <Text style={styles.platformInfoValue}>
                  {user.twitchData.broadcasterType || 'Normal'}
                </Text>
                
                <Text style={styles.platformInfoLabel}>Total Views:</Text>
                <Text style={styles.platformInfoValue}>
                  {user.twitchData.viewCount?.toLocaleString() || 'N/A'}
                </Text>
              </View>
            )}

            {user.userType === USER_TYPES.YOUTUBE && user.youtubeData && (
              <View style={styles.platformInfo}>
                <Text style={styles.platformInfoLabel}>Channel Name:</Text>
                <Text style={styles.platformInfoValue}>
                  {user.youtubeData.channelTitle || 'N/A'}
                </Text>
                
                <Text style={styles.platformInfoLabel}>Channel ID:</Text>
                <Text style={styles.platformInfoValue}>
                  {user.youtubeData.channelId || 'N/A'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Guest Upgrade */}
        {user.userType === USER_TYPES.GUEST && (
          <View style={styles.upgradeContainer}>
            <Text style={styles.upgradeTitle}>Want to unlock more features?</Text>
            <Text style={styles.upgradeText}>
              Connect your Twitch or YouTube account to sync data, get analytics, and more!
            </Text>
            
            {/* Show Firebase setup option for local guest users */}
            {user.isLocalGuest && (
              <TouchableOpacity 
                style={[styles.upgradeButton, styles.setupButton]} 
                onPress={showFirebaseSetupInstructions}
              >
                <Ionicons name="settings" size={20} color="#8A2BE2" />
                <Text style={[styles.upgradeButtonText, styles.setupButtonText]}>
                  Setup Firebase Authentication
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.upgradeButton}>
              <Text style={styles.upgradeButtonText}>Connect Account</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={styles.logoutButton} 
          onPress={handleLogout}
          disabled={loading}
        >
          <Ionicons name="log-out" size={24} color="#fff" />
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    flex: 1,
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
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
  userCard: {
    backgroundColor: '#fff',
    margin: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  platformText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 5,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 20,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  optionsContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  optionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
    flex: 1,
  },
  platformContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  platformInfo: {
    marginTop: 10,
  },
  platformInfoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  platformInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  upgradeContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  upgradeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  upgradeText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
  },
  upgradeButton: {
    backgroundColor: '#8A2BE2',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  setupButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#8A2BE2',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  upgradeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  setupButtonText: {
    color: '#8A2BE2',
  },
  logoutButton: {
    backgroundColor: '#dc3545',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    marginHorizontal: 20,
    marginBottom: 30,
    borderRadius: 12,
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
});
