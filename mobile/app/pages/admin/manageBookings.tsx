import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/state/auth';

function Sidebar() {
  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarTitle}>Admin Panel</Text>
      <Pressable onPress={() => router.push('/admin-dashboard')}>
        <Text style={styles.sidebarItem}>Home</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/pages/admin/reviewFeedback')}>
        <Text style={styles.sidebarItem}>Feedback</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/pages/admin/manageBookings')}>
        <Text style={styles.sidebarItem}>Bookings</Text>
      </Pressable>
      <Pressable onPress={() => router.push('/pages/admin/manageChores')}>
        <Text style={styles.sidebarItem}>Chores</Text>
      </Pressable>
    </View>
  );
}

export default function manageBookingsScreen() {
  const { user, profile, loading } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <View style={styles.container}>
      {/* Hamburger Button */}
      <Pressable style={styles.hamburger} onPress={() => setSidebarOpen(!sidebarOpen)}>
        <Text style={styles.hamburgerText}>☰</Text>
      </Pressable>

      {/* Sidebar */}
      {sidebarOpen && <Sidebar />}

      <Text style={styles.title}>Bookings</Text>
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
  hamburger: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 10,
  },
  hamburgerText: {
    fontSize: 28,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    width: 220,
    backgroundColor: '#1a1a2e',
    padding: 40,
    zIndex: 9,
    gap: 20,
  },
  sidebarTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 10,
  },
  sidebarItem: {
    color: 'white',
    fontSize: 16,
    paddingVertical: 8,
  },
  // your existing styles
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