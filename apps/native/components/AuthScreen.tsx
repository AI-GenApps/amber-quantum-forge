import React, { useState } from 'react';
import { StyleSheet, View, Text, Platform, Alert } from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthButton } from './AuthButton';

export const AuthScreen: React.FC = () => {
  const { signInWithGoogle, signInWithApple } = useAuth();
  const [loading, setLoading] = useState<'google' | 'apple' | null>(null);

  const handleGoogleSignIn = async () => {
    try {
      setLoading('google');
      await signInWithGoogle();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Google');
    } finally {
      setLoading(null);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setLoading('apple');
      await signInWithApple();
    } catch (error: any) {
      Alert.alert('Sign In Error', error.message || 'Failed to sign in with Apple');
    } finally {
      setLoading(null);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>
      
      <View style={styles.buttonContainer}>
        <AuthButton
          onPress={handleGoogleSignIn}
          text="Sign in with Google"
          loading={loading === 'google'}
          disabled={loading !== null}
        />
        
        {Platform.OS === 'ios' && (
          <AuthButton
            onPress={handleAppleSignIn}
            text="Sign in with Apple"
            loading={loading === 'apple'}
            disabled={loading !== null}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 40,
  },
  buttonContainer: {
    width: '100%',
    maxWidth: 300,
    alignItems: 'center',
  },
});

