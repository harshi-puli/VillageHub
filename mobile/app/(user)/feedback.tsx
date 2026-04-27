import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import {
  addFeedback,
  deleteFeedback,
  listUsersFeedback,
  listUsersFeedbackOldestFirst,
} from '@/services/feedbackService';

type FeedbackItem = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  site?: string;
  createdAt?: { seconds?: number } | Date;
};

const FEEDBACK_CATEGORIES = ['general', 'maintenance', 'safety'] as const;

const STATUS_FILTERS: { key: 'all' | string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'Awaiting Review', label: 'Awaiting' },
  { key: 'In Progress', label: 'In progress' },
  { key: 'Resolved', label: 'Resolved' },
];

type SortOrder = 'newest' | 'oldest';

function formatCreatedAt(value: FeedbackItem['createdAt']) {
  if (!value) return 'Just now';
  const date = value instanceof Date ? value : new Date((value.seconds ?? 0) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Feedback() {
  const [feedbackItems, setFeedbackItems] = useState<FeedbackItem[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  const [statusFilter, setStatusFilter] = useState<string | 'all'>('Awaiting Review');
  const isFirstRun = useRef(true);

  const [title, setTitle] = useState('');
  const [site, setSite] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<(typeof FEEDBACK_CATEGORIES)[number]>('general');

  const loadFeedback = useCallback(async () => {
    if (isFirstRun.current) {
      setInitialLoad(true);
    } else {
      setRefreshing(true);
    }
    try {
      let data: FeedbackItem[];
      if (sortOrder === 'newest') {
        data = (await listUsersFeedback()) as FeedbackItem[];
      } else {
        data = (await listUsersFeedbackOldestFirst()) as FeedbackItem[];
      }
      if (statusFilter !== 'all') {
        data = data.filter((item) => (item.status ?? 'Awaiting Review') === statusFilter);
      }
      setFeedbackItems(data);
    } catch {
      Alert.alert('Error', 'Unable to load feedback.');
    } finally {
      if (isFirstRun.current) {
        setInitialLoad(false);
        isFirstRun.current = false;
      } else {
        setRefreshing(false);
      }
    }
  }, [sortOrder, statusFilter]);

  useEffect(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const onPullRefresh = useCallback(() => {
    void loadFeedback();
  }, [loadFeedback]);

  const openModal = () => {
    setTitle('');
    setSite('');
    setDescription('');
    setCategory('general');
    setModalVisible(true);
  };

  const closeModal = () => setModalVisible(false);

  const submitFeedback = async () => {
    if (!title.trim() || !site.trim()) {
      Alert.alert('Required', 'Please enter a title and site.');
      return;
    }
    try {
      setSubmitting(true);
      await addFeedback({
        title: title.trim(),
        description: description.trim(),
        category,
        site: site.trim(),
      });
      closeModal();
      void loadFeedback();
    } catch {
      Alert.alert('Error', 'Unable to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = (item: FeedbackItem) => {
    Alert.alert('Delete feedback', `Remove “${item.title}”?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteFeedback(item.id);
            void loadFeedback();
          } catch {
            Alert.alert('Error', 'Could not delete feedback.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Feedback</Text>
          <Text style={styles.subtitle}>Share requests or report issues.</Text>
        </View>
        <Pressable style={styles.newButton} onPress={openModal}>
          <Text style={styles.newButtonText}>+ New</Text>
        </Pressable>
      </View>

      <View style={styles.sortRow}>
        <Text style={styles.sortLabel}>Sort</Text>
        <View style={styles.sortChips}>
          <Pressable
            style={[styles.chip, sortOrder === 'newest' && styles.chipActive]}
            onPress={() => setSortOrder('newest')}>
            <Text style={[styles.chipText, sortOrder === 'newest' && styles.chipTextActive]}>Newest</Text>
          </Pressable>
          <Pressable
            style={[styles.chip, sortOrder === 'oldest' && styles.chipActive]}
            onPress={() => setSortOrder('oldest')}>
            <Text style={[styles.chipText, sortOrder === 'oldest' && styles.chipTextActive]}>Oldest</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.filterBlock}>
        <Text style={styles.sortLabel}>Status</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {STATUS_FILTERS.map((f) => {
            const active = statusFilter === f.key;
            return (
              <Pressable
                key={f.key}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setStatusFilter(f.key)}>
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{f.label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {initialLoad ? (
        <ActivityIndicator style={styles.loader} />
      ) : (
        <FlatList
          data={feedbackItems}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          onRefresh={onPullRefresh}
          refreshing={refreshing}
          ListEmptyComponent={<Text style={styles.emptyText}>No feedback here.</Text>}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardTopRow}>
                <View style={styles.cardTitleBlock}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                <View style={styles.cardActions}>
                  <Text style={styles.status}>{item.status ?? 'Awaiting Review'}</Text>
                  <Pressable
                    onPress={() => handleDelete(item)}
                    style={styles.deleteBtn}
                    hitSlop={8}
                    accessibilityLabel="Delete feedback">
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </Pressable>
                </View>
              </View>
              {!!item.description && <Text style={styles.cardDescription}>{item.description}</Text>}
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>{item.category ?? 'general'}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{item.site ?? 'General'}</Text>
                <Text style={styles.metaDot}>•</Text>
                <Text style={styles.metaText}>{formatCreatedAt(item.createdAt)}</Text>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Submit feedback</Text>
            <TextInput style={styles.input} placeholder="Title *" value={title} onChangeText={setTitle} />
            <TextInput style={styles.input} placeholder="Site *" value={site} onChangeText={setSite} />
            <TextInput
              style={[styles.input, styles.inputLarge]}
              placeholder="Description"
              value={description}
              onChangeText={setDescription}
              multiline
            />
            <View style={styles.categoryRow}>
              {FEEDBACK_CATEGORIES.map((item) => (
                <Pressable
                  key={item}
                  onPress={() => setCategory(item)}
                  style={[styles.categoryChip, category === item && styles.categoryChipActive]}>
                  <Text style={[styles.categoryText, category === item && styles.categoryTextActive]}>
                    {item}
                  </Text>
                </Pressable>
              ))}
            </View>
            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={closeModal} disabled={submitting}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.submitBtn} onPress={submitFeedback} disabled={submitting}>
                <Text style={styles.submitBtnText}>{submitting ? 'Submitting...' : 'Submit'}</Text>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  title: { fontSize: 24, fontWeight: '600', color: '#1A1A18' },
  subtitle: { marginTop: 4, color: '#6A6964' },
  newButton: {
    backgroundColor: '#1A1A18',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignSelf: 'flex-start',
  },
  newButtonText: { color: '#FFFFFF', fontWeight: '600' },
  sortRow: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 4, gap: 8 },
  filterBlock: { paddingLeft: 20, paddingBottom: 8, gap: 6 },
  sortLabel: { fontSize: 12, fontWeight: '600', color: '#6A6964', textTransform: 'uppercase', letterSpacing: 0.5 },
  sortChips: { flexDirection: 'row', gap: 8 },
  filterScroll: { flexDirection: 'row', gap: 8, paddingRight: 20 },
  chip: {
    borderWidth: 1,
    borderColor: '#D5D4CF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  chipActive: { borderColor: '#1A1A18', backgroundColor: '#EDEDEA' },
  chipText: { fontSize: 13, color: '#7B7A73' },
  chipTextActive: { color: '#1A1A18', fontWeight: '600' },
  loader: { marginTop: 40 },
  listContent: { padding: 20, gap: 10, paddingBottom: 40 },
  emptyText: { textAlign: 'center', color: '#8A8982', marginTop: 48 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, gap: 8 },
  cardTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitleBlock: { flex: 1, minWidth: 0 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  cardActions: { alignItems: 'flex-end', gap: 6 },
  status: { fontSize: 12, color: '#4B6A34', backgroundColor: '#EAF3DE', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 20 },
  deleteBtn: { paddingVertical: 2, paddingHorizontal: 4 },
  deleteBtnText: { fontSize: 12, color: '#b91c1c', fontWeight: '600' },
  cardDescription: { color: '#605F59', fontSize: 13 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 6 },
  metaDot: { color: '#B4B2A9' },
  metaText: { color: '#8A8982', fontSize: 12 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modal: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: 20, gap: 10 },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1A1A18', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#E1E0DC', borderRadius: 10, padding: 11, backgroundColor: '#FAFAF8' },
  inputLarge: { minHeight: 90, textAlignVertical: 'top' },
  categoryRow: { flexDirection: 'row', gap: 8, marginTop: 6, flexWrap: 'wrap' },
  categoryChip: { borderWidth: 1, borderColor: '#D5D4CF', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 6 },
  categoryChipActive: { borderColor: '#1A1A18', backgroundColor: '#EDEDEA' },
  categoryText: { color: '#7B7A73', fontSize: 12, textTransform: 'capitalize' },
  categoryTextActive: { color: '#1A1A18', fontWeight: '600' },
  footer: { flexDirection: 'row', gap: 10, marginTop: 8 },
  cancelBtn: { flex: 1, borderWidth: 1, borderColor: '#DAD9D4', borderRadius: 10, alignItems: 'center', paddingVertical: 12 },
  cancelBtnText: { color: '#595852' },
  submitBtn: { flex: 2, borderRadius: 10, alignItems: 'center', paddingVertical: 12, backgroundColor: '#1A1A18' },
  submitBtnText: { color: '#FFFFFF', fontWeight: '600' },
});
