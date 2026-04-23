import { useState } from 'react';
import { Alert, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { rotateChores } from '@/services/choreService';

export default function ManageChores() {
  const [modalVisible, setModalVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleRotate = async () => {
    try {
      setSubmitting(true);
      await rotateChores();
      setModalVisible(false);
      Alert.alert('Done', 'Chore rotation was recorded for the current week.');
    } catch {
      Alert.alert('Error', 'Unable to rotate chores.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Manage chores</Text>
      <Text style={styles.subtitle}>
        Rotate the weekly chore schedule for all residents. Residents can only mark their own week complete from their app.
      </Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Rotate weekly chores</Text>
        <Text style={styles.cardBodyText}>Updates the current week&apos;s rotation record in Firestore.</Text>
        <Pressable style={styles.primaryButton} onPress={() => setModalVisible(true)} disabled={submitting}>
          <Text style={styles.primaryButtonText}>Open rotation</Text>
        </Pressable>
      </View>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Rotate chores now?</Text>
            <Text style={styles.modalText}>This runs the admin rotation for the current week.</Text>
            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={() => setModalVisible(false)} disabled={submitting}>
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.confirmBtn} onPress={handleRotate} disabled={submitting}>
                <Text style={styles.confirmText}>{submitting ? 'Running...' : 'Rotate'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8F6', padding: 20, gap: 14 },
  title: { fontSize: 24, fontWeight: '600', color: '#1A1A18', marginTop: 4 },
  subtitle: { color: '#6C6B66', lineHeight: 20 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, gap: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#1A1A18' },
  cardBodyText: { color: '#6A6964' },
  primaryButton: { backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '600' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.32)', padding: 20 },
  modal: { width: '100%', borderRadius: 14, backgroundColor: '#FFFFFF', padding: 18, gap: 10 },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  modalText: { color: '#676660' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 6 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#D9D8D2', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  cancelText: { color: '#5D5C57' },
  confirmBtn: { flex: 1, backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center', paddingVertical: 10 },
  confirmText: { color: '#FFFFFF', fontWeight: '600' },
});
