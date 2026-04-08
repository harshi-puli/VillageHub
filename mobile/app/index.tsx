import React, { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/state/auth';
import { addAnnouncement } from '@/services/announcementService';

export default function IndexScreen() {
  const { user, profile, loading } = useAuth();
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    if (profile?.isAdmin === true) router.replace('/admin-dashboard');
    else router.replace('/user-dashboard');
  }, [loading, user, profile]);

  const onLogin = () => router.push('/login');

  const testAddAnnouncement = async () => {
    try {
      setError(null);
      const announcement = await addAnnouncement({
        title: 'Test Announcement',
        description: 'This is a test',
        dueDate: new Date(),
        category: 'general',
      });
      setResult(announcement);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to add announcement');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Welcome folks.</Text>
      <Image source={require('@/assets/images/logo.png')} style={styles.logo} />
      <Text style={styles.sub}>Test that announcement!</Text>

      <View style={styles.row}>
        <Pressable style={styles.button} onPress={onLogin}>
          <Text style={styles.buttonText}>Log In</Text>
        </Pressable>
        <Pressable style={styles.buttonSecondary} onPress={testAddAnnouncement}>
          <Text style={styles.buttonText}>Test addAnnouncement</Text>
        </Pressable>
      </View>

      {!!result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{JSON.stringify(result, null, 2)}</Text>
        </View>
      )}
      {!!error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f5f8daff',
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    gap: 12,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  sub: {
    textAlign: 'center',
    color: '#42411bff',
  },
  logo: {
    width: 96,
    height: 96,
    alignSelf: 'center',
    borderRadius: 18,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  button: {
    backgroundColor: '#49bbebff',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonSecondary: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
  resultBox: {
    backgroundColor: '#d4edda',
    padding: 10,
    borderRadius: 10,
  },
  resultText: {
    fontFamily: 'Courier',
    fontSize: 12,
  },
  errorBox: {
    backgroundColor: '#f8d7da',
    padding: 10,
    borderRadius: 10,
  },
  errorText: {
    color: '#6b0f1a',
  },
});

