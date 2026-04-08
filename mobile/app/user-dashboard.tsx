import React, { useEffect, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { router } from 'expo-router';

import { useAuth } from '@/state/auth';
import { logoutResident } from '@/services/authService';
import { updateAnnouncement } from '@/services/announcementService';

export default function UserDashboardScreen() {
  const { user, loading } = useAuth();

  const [announcementId, setAnnouncementId] = useState('');
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [updateResult, setUpdateResult] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) router.replace('/login');
  }, [loading, user]);

  const onLogout = async () => {
    await logoutResident();
    router.replace('/login');
  };

  const onTestUpdate = async () => {
    setUpdateResult(null);
    setUpdateError(null);
    const id = announcementId.trim();
    if (!id) {
      setUpdateError('Enter the Firestore document ID for the announcement.');
      return;
    }
    const updates: { title?: string; description?: string } = {};
    if (editTitle.trim()) updates.title = editTitle.trim();
    if (editDescription.trim()) updates.description = editDescription.trim();
    if (Object.keys(updates).length === 0) {
      setUpdateError('Fill in at least New title or New description.');
      return;
    }

    setUpdating(true);
    try {
      const res = await updateAnnouncement(id, updates);
      setUpdateResult(JSON.stringify(res, null, 2));
    } catch (e: unknown) {
      setUpdateError(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>User Dashboard</Text>

      <Text style={styles.sectionLabel}>Test updateAnnouncement</Text>
      <Text style={styles.hint}>
        Paste a document id from the announcements collection (e.g. from add test or Firebase console).
      </Text>
      <TextInput
        style={styles.input}
        placeholder="Announcement document ID"
        value={announcementId}
        onChangeText={setAnnouncementId}
        autoCapitalize="none"
        autoCorrect={false}
        editable={!updating}
      />
      <TextInput
        style={styles.input}
        placeholder="New title (optional if description set)"
        value={editTitle}
        onChangeText={setEditTitle}
        editable={!updating}
      />
      <TextInput
        style={[styles.input, styles.inputMultiline]}
        placeholder="New description (optional if title set)"
        value={editDescription}
        onChangeText={setEditDescription}
        multiline
        editable={!updating}
      />
      <Pressable
        style={[styles.buttonSecondary, updating && styles.buttonDisabled]}
        onPress={onTestUpdate}
        disabled={updating}>
        <Text style={styles.buttonText}>{updating ? 'Updating…' : 'Update announcement'}</Text>
      </Pressable>
      {updateError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{updateError}</Text>
        </View>
      ) : null}
      {updateResult ? (
        <View style={styles.resultBox}>
          <Text style={styles.resultText}>{updateResult}</Text>
        </View>
      ) : null}

      <Pressable style={styles.button} onPress={onLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  container: {
    backgroundColor: '#f9fdbfff',
    flexGrow: 1,
    padding: 20,
    gap: 12,
    paddingBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  hint: {
    fontSize: 13,
    color: '#6b7280',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  button: {
    backgroundColor: '#111827',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignSelf: 'center',
    marginTop: 8,
  },
  buttonSecondary: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
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

