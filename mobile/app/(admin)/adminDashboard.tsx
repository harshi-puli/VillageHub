import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { logoutResident } from '@/services/authService';
import { listAnnouncements } from '@/services/announcementService';
import { listFeedback } from '@/services/feedbackService';

type Announcement = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dueDate?: { seconds?: number } | Date;
};

type FeedbackItem = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status?: string;
  site?: string;
  isCompleted?: boolean;
  createdAt?: { seconds?: number } | Date;
};

const MAX_VISIBLE_ITEMS = 3;
const ROW_HEIGHT_PX = 118;
const cappedScrollMaxHeight = MAX_VISIBLE_ITEMS * ROW_HEIGHT_PX;

const toDate = (value?: { seconds?: number } | Date): Date => {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  return new Date((value.seconds ?? 0) * 1000);
};

function formatCreatedAt(value: FeedbackItem['createdAt']) {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date((value.seconds ?? 0) * 1000);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function AdminDashboard() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = useCallback(async () => {
    const [announcementData, feedbackData] = await Promise.all([
      listAnnouncements(),
      listFeedback(),
    ]);
    setAnnouncements(announcementData as Announcement[]);
    setFeedbackList(feedbackData as FeedbackItem[]);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await fetchHomeData();
      } finally {
        setLoading(false);
      }
    })();
  }, [fetchHomeData]);

  const handleRefresh = async () => {
    try {
      setRefreshing(true);
      await fetchHomeData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    await logoutResident();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.outerScroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Admin home</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Announcements</Text>
          {announcements.length === 0 ? (
            <Text style={styles.emptyText}>No announcements yet.</Text>
          ) : (
            <ScrollView
              style={[styles.cappedScroll, { maxHeight: cappedScrollMaxHeight }]}
              contentContainerStyle={styles.cappedScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {announcements.map((a) => (
                <View key={a.id} style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {a.title}
                  </Text>
                  {!!a.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {a.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>
                    {(a.category ?? 'general').toUpperCase()} • Due{' '}
                    {toDate(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent feedback</Text>
          {feedbackList.length === 0 ? (
            <Text style={styles.emptyText}>No feedback yet.</Text>
          ) : (
            <ScrollView
              style={[styles.cappedScroll, { maxHeight: cappedScrollMaxHeight }]}
              contentContainerStyle={styles.cappedScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {feedbackList.map((f) => (
                <View key={f.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {f.title}
                    </Text>
                    <Text style={[styles.badge, f.isCompleted ? styles.badgeDone : styles.badgeOpen]}>
                      {f.isCompleted ? 'Done' : f.status ?? 'Pending'}
                    </Text>
                  </View>
                  {!!f.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {f.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>
                    {f.site ?? '—'} • {f.category ?? 'general'} • {formatCreatedAt(f.createdAt)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </ScrollView>

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f9fdbfff',
    flex: 1,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  outerScroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    gap: 14,
  },
  title: {
    fontSize: 30,
    fontWeight: '700',
    color: '#1A1A18',
  },
  section: { gap: 8 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1A18',
  },
  cappedScroll: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E6E5E0',
    backgroundColor: '#FAFAF8',
  },
  cappedScrollContent: {
    padding: 10,
    gap: 8,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEBE7',
    padding: 12,
    gap: 6,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A18',
  },
  cardDescription: {
    color: '#61605B',
    fontSize: 13,
  },
  cardMeta: {
    color: '#898780',
    fontSize: 12,
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 11,
    fontWeight: '600',
  },
  badgeOpen: {
    color: '#825102',
    backgroundColor: '#F9EFD9',
  },
  badgeDone: {
    color: '#205A30',
    backgroundColor: '#E3F2DA',
  },
  emptyText: {
    color: '#7F7D75',
    paddingVertical: 4,
  },
  button: {
    backgroundColor: '#b91c1c',
    margin: 20,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
});
