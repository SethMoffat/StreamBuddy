import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { 
  loginAsGuest, 
  loginWithTwitch, 
  loginWithYouTube 
} from '../firebase/auth';

const { width, height } = Dimensions.get('window');

export default function LoginScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingType, setLoadingType] = useState(null);

  const handleGuestLogin = async () => {
    setLoading(true);
    setLoadingType('guest');
    
    try {
      await loginAsGuest();
      // Navigation will be handled by the auth state listener
    } catch (error) {
      Alert.alert('Error', 'Failed to login as guest. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleTwitchLogin = async () => {
    setLoading(true);
    setLoadingType('twitch');
    
    try {
      await loginWithTwitch();
      // Navigation will be handled by the auth state listener
    } catch (error) {
      Alert.alert('Error', 'Failed to login with Twitch. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  const handleYouTubeLogin = async () => {
    setLoading(true);
    setLoadingType('youtube');
    
    try {
      await loginWithYouTube();
      // Navigation will be handled by the auth state listener
    } catch (error) {
      Alert.alert('Error', 'Failed to login with YouTube. Please try again.');
    } finally {
      setLoading(false);
      setLoadingType(null);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Logo and Title */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="timer" size={80} color="#8A2BE2" />
          </View>
          <Text style={styles.title}>StreamBuddy</Text>
          <Text style={styles.subtitle}>
            Manage your stream schedule and stay on track
          </Text>
        </View>

        {/* Login Options */}
        <View style={styles.loginOptions}>
          <Text style={styles.loginTitle}>Choose how to get started:</Text>
          
          {/* Twitch Login */}
          <TouchableOpacity
            style={[styles.loginButton, styles.twitchButton]}
            onPress={handleTwitchLogin}
            disabled={loading}
          >
            {loading && loadingType === 'twitch' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-twitch" size={24} color="#fff" />
                <Text style={styles.loginButtonText}>Login with Twitch</Text>
              </>
            )}
          </TouchableOpacity>

          {/* YouTube Login */}
          <TouchableOpacity
            style={[styles.loginButton, styles.youtubeButton]}
            onPress={handleYouTubeLogin}
            disabled={loading}
          >
            {loading && loadingType === 'youtube' ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="logo-youtube" size={24} color="#fff" />
                <Text style={styles.loginButtonText}>Login with YouTube</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Guest Login */}
          <TouchableOpacity
            style={[styles.loginButton, styles.guestButton]}
            onPress={handleGuestLogin}
            disabled={loading}
          >
            {loading && loadingType === 'guest' ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <Ionicons name="person" size={24} color="#333" />
                <Text style={[styles.loginButtonText, styles.guestButtonText]}>
                  Continue as Guest
                </Text>
              </>
            )}
          </TouchableOpacity>
          
          <View style={styles.guestNote}>
            <Ionicons name="information-circle" size={16} color="#666" />
            <Text style={styles.guestNoteText}>
              Guest mode stores your data locally on this device
            </Text>
          </View>
        </View>

        {/* Benefits */}
        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>Why connect your account?</Text>
          
          <View style={styles.benefit}>
            <Ionicons name="cloud" size={20} color="#8A2BE2" />
            <Text style={styles.benefitText}>
              Sync your data across devices
            </Text>
          </View>
          
          <View style={styles.benefit}>
            <Ionicons name="analytics" size={20} color="#8A2BE2" />
            <Text style={styles.benefitText}>
              Get detailed streaming analytics
            </Text>
          </View>
          
          <View style={styles.benefit}>
            <Ionicons name="notifications" size={20} color="#8A2BE2" />
            <Text style={styles.benefitText}>
              Smart notifications for your schedule
            </Text>
          </View>
          
          <View style={styles.benefit}>
            <Ionicons name="trophy" size={20} color="#8A2BE2" />
            <Text style={styles.benefitText}>
              Track your streaming achievements
            </Text>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
        </View>
      </View>
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
    paddingHorizontal: 20,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoContainer: {
    backgroundColor: '#fff',
    borderRadius: 50,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginOptions: {
    marginBottom: 40,
  },
  loginTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  twitchButton: {
    backgroundColor: '#9146FF',
  },
  youtubeButton: {
    backgroundColor: '#FF0000',
  },
  guestButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#ddd',
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  guestButtonText: {
    color: '#333',
  },
  guestNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingHorizontal: 10,
  },
  guestNoteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
    fontStyle: 'italic',
  },
  benefits: {
    marginBottom: 30,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
    flex: 1,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 16,
  },
});
