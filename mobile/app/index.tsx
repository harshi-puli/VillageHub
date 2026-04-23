import React, { useState, useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';

import { useAuth } from '@/state/auth';
import { isResidentProfileAdmin, loginResident, registerResident } from '@/services/authService';
import { db } from '@/firebase';

export default function LoginScreen() {
  const { user, profile, loading } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [site, setSite] = useState('');
  const [sites, setSites] = useState<string[]>([]);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchSites = async () => {
      const snap = await getDocs(collection(db, 'sites'));
      setSites(snap.docs.map((d) => d.id));
    };
    fetchSites();
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (isResidentProfileAdmin(profile)) {
      router.replace('/(admin)/adminDashboard');
    } else {
      router.replace('/(user)/userDashboard');
    }
  }, [loading, user, profile]);

  const onSubmit = async () => {
    setError('');
    setSubmitting(true);
    try {
      if (isLogin) {
        const { error } = await loginResident({ email, password });
        if (error) setError(error);
      } else {
        const { error } = await registerResident({ email, password, name, site });
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

          <Text style={styles.label}>Site</Text>
          <View style={styles.dropdownContainer}>
            {sites.map((s) => (
              <Pressable
                key={s}
                style={[styles.dropdownOption, site === s && styles.dropdownOptionSelected]}
                onPress={() => setSite(s)}
                disabled={submitting}>
                <Text style={[styles.dropdownOptionText, site === s && styles.dropdownOptionTextSelected]}>
                  {s}
                </Text>
              </Pressable>
            ))}
          </View>
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
  label: {
    fontWeight: '600',
    color: '#374151',
  },
  dropdownContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  dropdownOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: 'white',
    alignItems: 'center',
  },
  dropdownOptionSelected: {
    backgroundColor: '#2595ebff',
    borderColor: '#2595ebff',
  },
  dropdownOptionText: {
    fontWeight: '600',
    color: '#374151',
  },
  dropdownOptionTextSelected: {
    color: 'white',
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