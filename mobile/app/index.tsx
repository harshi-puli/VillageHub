import React, { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';

import { useAuth } from '@/state/auth';
import { isResidentProfileAdmin, loginResident, registerResident } from '@/services/authService';
import { db } from '@/firebase';

const logo = require('../assets/images/TVS_logo.png');

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
      <View style={styles.authBox}>
        <Image source={logo} style={styles.logo} resizeMode="contain" />

        <Text style={styles.mainTitle}>
          {isLogin ? 'Welcome,' : 'Create Account'}
        </Text>
        <Text style={styles.subtitle}>
          {isLogin ? 'Glad to see you!' : 'to get started now!'}
        </Text>

        {!!error && <Text style={styles.error}>{error}</Text>}

        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Full Name"
            placeholderTextColor="#007C83"
            value={name}
            onChangeText={setName}
            editable={!submitting}
            autoCapitalize="words"
          />
        )}

        <TextInput
          style={styles.input}
          placeholder="Email Address"
          placeholderTextColor="#007C83"
          value={email}
          onChangeText={setEmail}
          editable={!submitting}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#007C83"
          value={password}
          onChangeText={setPassword}
          editable={!submitting}
          secureTextEntry
        />

        {!isLogin && (
          <View style={styles.siteSection}>
            <Text style={styles.siteLabel}>Choose your site</Text>

            <View style={styles.siteOptions}>
              {sites.map((s) => (
                <Pressable
                  key={s}
                  style={[styles.siteOption, site === s && styles.siteOptionSelected]}
                  onPress={() => setSite(s)}
                  disabled={submitting}
                >
                  <Text style={[styles.siteText, site === s && styles.siteTextSelected]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        <Pressable style={styles.primaryButton} onPress={onSubmit} disabled={submitting}>
          <Text style={styles.primaryButtonText}>
            {submitting ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
          </Text>
        </Pressable>

        {submitting && <ActivityIndicator />}

        <Pressable
          style={styles.switchButton}
          onPress={() => {
            setIsLogin((v) => !v);
            setError('');
          }}
          disabled={submitting}
        >
          <Text style={styles.switchSmallText}>
            {isLogin ? "Don’t have an account?" : 'Already have an account?'}
          </Text>
          <Text style={styles.switchMainText}>
            {isLogin ? 'Sign Up Now' : 'Login Now'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBE9A6',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  authBox: {
    width: '100%',
    maxWidth: 420,
    alignItems: 'center',
  },
  logo: {
    width: 115,
    height: 115,
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#007C83',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 22,
    color: '#007C83',
    textAlign: 'center',
    marginBottom: 26,
  },
  error: {
    color: '#b91c1c',
    textAlign: 'center',
    marginBottom: 10,
    fontWeight: '600',
  },
  input: {
    width: 220,
    backgroundColor: '#F5C400',
    color: '#007C83',
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 12,
    fontSize: 14,
    borderWidth: 0,
  },
  siteSection: {
    width: 220,
    marginBottom: 12,
  },
  siteLabel: {
    color: '#007C83',
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  siteOptions: {
    gap: 8,
  },
  siteOption: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    alignItems: 'center',
  },
  siteOptionSelected: {
    backgroundColor: '#007C83',
  },
  siteText: {
    color: '#007C83',
    fontWeight: '700',
  },
  siteTextSelected: {
    color: '#FFFFFF',
  },
  primaryButton: {
    width: 220,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#007C83',
    fontWeight: '700',
  },
  switchButton: {
    marginTop: 28,
    alignItems: 'center',
  },
  switchSmallText: {
    color: '#007C83',
    fontSize: 13,
    fontWeight: '700',
  },
  switchMainText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
});