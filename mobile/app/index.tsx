import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/state/auth';
import { loginResident, registerResident } from '@/services/authService';

export default function LoginScreen() {
  const { user, profile, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [unitNumber, setUnitNumber] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (profile?.isAdmin === true) router.replace('/(admin)/adminDashboard');
    else router.replace('/(user)/userDashboard');
  }, [loading, user, profile]);

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await loginResident({ email, password });
        if (error) setError(error);
      } else {
        const { error } = await registerResident({ email, password, name, unitNumber });
        if (error) setError(error);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{isLogin ? 'Log In' : 'Sign Up'}</Text>

      {!!error && <Text style={styles.error}>{error}</Text>}

      {!isLogin && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Full name"
            value={name}
            onChangeText={setName}
            editable={!submitting}
            autoCapitalize="words"
          />
          <TextInput
            style={styles.input}
            placeholder="Unit number"
            value={unitNumber}
            onChangeText={setUnitNumber}
            editable={!submitting}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        editable={!submitting}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        editable={!submitting}
        secureTextEntry
      />

      <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.primaryButtonText}>
          {submitting ? 'Please wait...' : isLogin ? 'Log In' : 'Sign Up'}
        </Text>
      </Pressable>

      {submitting && <ActivityIndicator />}

      <Pressable
        style={styles.linkButton}
        onPress={() => {
          setIsLogin((v) => !v);
          setError('');
        }}
        disabled={submitting}>
        <Text style={styles.linkText}>
          {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Log in'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fdbfff',
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: 'white',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2595ebff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  linkButton: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  linkText: {
    color: '#2595ebff',
    fontWeight: '600',
  },
});

