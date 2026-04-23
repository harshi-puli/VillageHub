import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { markChoreCompleted } from '@/services/choreService';
import { useAuth } from '@/state/auth';

export default function Chores() {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);

  const handleMarkComplete = async () => {
    if (!user?.uid) {
      Alert.alert('Sign in required', 'Log in to record chore completion.');
      return;
    }
    try {
      setSubmitting(true);
      await markChoreCompleted(user.uid);
      Alert.alert('Saved', 'Chore completion was recorded for this week.');
    } catch {
      Alert.alert('Error', 'Unable to mark chore as completed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Chores</Text>
      <Text style={styles.subtitle}>
        Mark your weekly chore as done when finished. Rotating the chore schedule is handled by staff in the admin app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Mark this week complete</Text>
        <Text style={styles.cardBodyText}>
          This records completion for your account for the current week.
        </Text>
        <Pressable style={styles.primaryButton} onPress={handleMarkComplete} disabled={submitting || !user}>
          <Text style={styles.primaryButtonText}>{submitting ? 'Saving...' : 'Mark my week complete'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8F6', padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: '600', color: '#1A1A18', marginTop: 4 },
  subtitle: { color: '#6C6B66', marginBottom: 2, lineHeight: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  cardBodyText: { color: '#6A6964' },
  primaryButton: { backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600' },
});
