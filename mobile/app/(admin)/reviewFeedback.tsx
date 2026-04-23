import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { listFeedback, updateFeedback } from '@/services/feedbackService';

type FeedbackItem = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  site?: string;
  user?: string;
  isCompleted?: boolean;
  createdAt?: { seconds?: number } | Date;
};

const STATUS_OPTIONS = ['Awaiting Review', 'In Progress', 'Resolved', 'Closed'] as const;

function formatCreatedAt(value: FeedbackItem['createdAt']) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date((value.seconds ?? 0) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function shortUid(uid?: string) {
  if (!uid) return '—';
  return uid.length > 10 ? `${uid.slice(0, 6)}…${uid.slice(-4)}` : uid;
}

export default function ReviewFeedback() {
  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editItem, setEditItem] = useState<FeedbackItem | null>(null);
  const [draftStatus, setDraftStatus] = useState<string>('Awaiting Review');
  const [draftCompleted, setDraftCompleted] = useState(false);

  const load = useCallback(async () => {
    const data = (await listFeedback()) as FeedbackItem[];
    setItems(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load feedback.');
      } finally {
        setLoading(false);
      }
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    try {
      setRefreshing(true);
      await load();
    } catch {
      Alert.alert('Error', 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [load]);

  const openEdit = (item: FeedbackItem) => {
    setEditItem(item);
    setDraftStatus(item.status ?? 'Awaiting Review');
    setDraftCompleted(!!item.isCompleted);
  };

  const closeEdit = () => {
    setEditItem(null);
  };

  const saveEdit = async () => {
    if (!editItem) return;
    try {
      setSaving(true);
      await updateFeedback(editItem.id, {
        status: draftStatus,
        isCompleted: draftCompleted,
      });
      closeEdit();
      await load();
    } catch {
      Alert.alert('Error', 'Could not update feedback.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>All feedback</Text>
        <Text style={styles.subtitle}>Tap a row to update status or completion.</Text>
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>No feedback yet.</Text>}
        renderItem={({ item }) => (
          <Pressable style={styles.card} onPress={() => openEdit(item)}>
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <View style={[styles.badge, item.isCompleted && styles.badgeDone]}>
                <Text style={styles.badgeText}>{item.isCompleted ? 'Done' : item.status ?? 'Pending'}</Text>
              </View>
            </View>
            {!!item.description && (
              <Text style={styles.desc} numberOfLines={2}>
                {item.description}
              </Text>
            )}
            <Text style={styles.meta}>
              {item.site ?? '—'} • {item.category ?? 'general'} • User {shortUid(item.user)}
            </Text>
            <Text style={styles.date}>{formatCreatedAt(item.createdAt)}</Text>
            <Text style={styles.tapHint}>Tap to update</Text>
          </Pressable>
        )}
      />

      <Modal visible={!!editItem} animationType="slide" transparent onRequestClose={closeEdit}>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Update feedback</Text>
            {editItem && (
              <Text style={styles.modalSubtitle} numberOfLines={2}>
                {editItem.title}
              </Text>
            )}

            <Text style={styles.label}>Status</Text>
            <View style={styles.chipWrap}>
              {STATUS_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setDraftStatus(s)}
                  style={[styles.chip, draftStatus === s && styles.chipActive]}>
                  <Text style={[styles.chipText, draftStatus === s && styles.chipTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.label}>Completed</Text>
            <View style={styles.row}>
              <Pressable
                style={[styles.toggle, draftCompleted && styles.toggleOn]}
                onPress={() => setDraftCompleted(true)}>
                <Text style={styles.toggleText}>Yes</Text>
              </Pressable>
              <Pressable
                style={[styles.toggle, !draftCompleted && styles.toggleOn]}
                onPress={() => setDraftCompleted(false)}>
                <Text style={styles.toggleText}>No</Text>
              </Pressable>
            </View>

            <View style={styles.modalFooter}>
              <Pressable style={styles.cancelBtn} onPress={closeEdit} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={saveEdit} disabled={saving}>
                <Text style={styles.saveBtnText}>{saving ? 'Saving…' : 'Save'}</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6A6964' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', marginTop: 48 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEBE7',
    padding: 14,
    gap: 6,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  badge: {
    backgroundColor: '#F9EFD9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeDone: { backgroundColor: '#E3F2DA' },
  badgeText: { fontSize: 11, fontWeight: '600', color: '#1A1A18' },
  desc: { fontSize: 13, color: '#605F59' },
  meta: { fontSize: 12, color: '#8A8982' },
  date: { fontSize: 12, color: '#B4B2A9' },
  tapHint: { fontSize: 11, color: '#2595eb', fontWeight: '600', marginTop: 2 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 22,
    paddingBottom: 28,
  },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#1A1A18' },
  modalSubtitle: { fontSize: 14, color: '#6A6964', marginTop: 6, marginBottom: 8 },
  label: { fontSize: 12, fontWeight: '600', color: '#6A6964', marginTop: 12, marginBottom: 6 },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: '#D5D4CF',
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipActive: { borderColor: '#1A1A18', backgroundColor: '#EDEDEA' },
  chipText: { fontSize: 12, color: '#7B7A73' },
  chipTextActive: { color: '#1A1A18', fontWeight: '600' },
  row: { flexDirection: 'row', gap: 10 },
  toggle: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D5D4CF',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  toggleOn: { borderColor: '#1A1A18', backgroundColor: '#EDEDEA' },
  toggleText: { fontWeight: '600', color: '#1A1A18' },
  modalFooter: { flexDirection: 'row', gap: 10, marginTop: 22 },
  cancelBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#DAD9D4',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelBtnText: { color: '#595852' },
  saveBtn: { flex: 2, backgroundColor: '#1A1A18', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  saveBtnText: { color: '#fff', fontWeight: '600' },
});
