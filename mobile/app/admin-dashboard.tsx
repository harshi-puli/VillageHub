import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/state/auth';
import { logoutResident } from '@/services/authService';

export default function AdminDashboardScreen() {
  const { user, profile, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (profile && profile.isAdmin !== true) {
      router.replace('/user-dashboard');
    }
  }, [loading, user, profile]);

  const onLogout = async () => {
    await logoutResident();
    router.replace('/login');
  };

  

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin Dashboard</Text>
      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
      <Text style={styles.p}>HIIHIHIHIHIHI</Text>
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
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  p: {
    textAlign: 'center',
    color: '#374151',
  },
});

