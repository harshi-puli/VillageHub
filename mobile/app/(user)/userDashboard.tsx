import { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Timestamp } from 'firebase/firestore';
import { logoutResident } from '@/services/authService';
import { listAnnouncements } from '@/services/announcementService';
import { listChoresForUser } from '@/services/choreService';
import { listUsersBookings } from '@/services/roomBookingService';
import { useAuth } from '@/state/auth';

type Announcement = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  dueDate?: { seconds?: number } | Date;
};

type Booking = {
  id: string;
  title: string;
  site?: string;
  reservedSpot?: string;
  checkIn?: { seconds?: number } | Date;
  approved?: boolean;
};

type ChoreRow = {
  id: string;
  title: string;
  description?: string;
  site?: string;
  dueDate?: { seconds?: number } | Date;
  isCompleted?: boolean;
};

const MAX_VISIBLE_ITEMS = 3;
const ROW_HEIGHT_PX = 118;

const toDate = (value?: { seconds?: number } | Date | Timestamp): Date => {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return new Date(0);
};

const cappedScrollMaxHeight = MAX_VISIBLE_ITEMS * ROW_HEIGHT_PX;

export default function UserDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chores, setChores] = useState<ChoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = useCallback(async () => {
    // Guard: if there's no user, don't touch any auth-gated service
    if (!user?.uid) return;

    const [announcementData, bookingData, choreData] = await Promise.all([
      listAnnouncements(),
      listUsersBookings(),
      listChoresForUser(user.uid),
    ]);
    setAnnouncements(announcementData as Announcement[]);
    setBookings(bookingData as Booking[]);
    setChores(choreData as ChoreRow[]);
  }, [user?.uid]);

  useEffect(() => {
    // Don't attempt load if signed out
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        await fetchHomeData();
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [fetchHomeData, user?.uid]);

  const upcomingBookings = useMemo(() => {
    const now = new Date();
    return bookings
      .filter((booking) => toDate(booking.checkIn) >= now)
      .sort((a, b) => toDate(a.checkIn).getTime() - toDate(b.checkIn).getTime());
  }, [bookings]);

  const handleRefresh = async () => {
    if (!user?.uid) return;
    try {
      setRefreshing(true);
      await fetchHomeData();
    } finally {
      setRefreshing(false);
    }
  };

  const handleLogout = async () => {
    // Clear local state before signing out so no re-fetch is triggered
    setAnnouncements([]);
    setBookings([]);
    setChores([]);
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
        <Text style={styles.title}>Home</Text>

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
              {announcements.map((announcement) => (
                <View key={announcement.id} style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {announcement.title}
                  </Text>
                  {!!announcement.description && (
                    <Text style={styles.cardDescription} numberOfLines={2}>
                      {announcement.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>
                    {(announcement.category ?? 'general').toUpperCase()} • Due{' '}
                    {toDate(announcement.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your chores</Text>
          {chores.length === 0 ? (
            <Text style={styles.emptyText}>No chores assigned to you yet.</Text>
          ) : (
            <ScrollView
              style={[styles.cappedScroll, { maxHeight: cappedScrollMaxHeight }]}
              contentContainerStyle={styles.cappedScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {chores.map((c) => (
                <View key={c.id} style={styles.card}>
                  <Text style={styles.cardTitle} numberOfLines={2}>
                    {c.title}
                  </Text>
                  {!!c.description && (
                    <Text style={styles.cardDescription} numberOfLines={4}>
                      {c.description}
                    </Text>
                  )}
                  <Text style={styles.cardMeta}>
                    {(c.site ?? '—') +
                      (c.isCompleted !== undefined ? ` • ${c.isCompleted ? 'Done' : 'To do'}` : '')}
                    {c.dueDate
                      ? ` • Due ${toDate(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                      : ''}
                  </Text>
                </View>
              ))}
            </ScrollView>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Upcoming bookings</Text>
          {upcomingBookings.length === 0 ? (
            <Text style={styles.emptyText}>No upcoming bookings.</Text>
          ) : (
            <ScrollView
              style={[styles.cappedScroll, { maxHeight: cappedScrollMaxHeight }]}
              contentContainerStyle={styles.cappedScrollContent}
              nestedScrollEnabled
              showsVerticalScrollIndicator>
              {upcomingBookings.map((booking) => (
                <View key={booking.id} style={styles.card}>
                  <View style={styles.rowBetween}>
                    <Text style={styles.cardTitle} numberOfLines={2}>
                      {booking.title}
                    </Text>
                    <Text style={[styles.badge, booking.approved ? styles.badgeApproved : styles.badgePending]}>
                      {booking.approved ? 'Approved' : 'Pending'}
                    </Text>
                  </View>
                  <Text style={styles.cardDescription} numberOfLines={2}>
                    {(booking.site ?? 'Unknown site')} • {booking.reservedSpot ?? 'Unknown spot'}
                  </Text>
                  <Text style={styles.cardMeta}>
                    Check-in {toDate(booking.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
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
  outerScroll: {
    flex: 1,
  },
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
  section: {
    gap: 8,
  },
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
    alignItems: 'center',
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
  badgeApproved: {
    color: '#205A30',
    backgroundColor: '#E3F2DA',
  },
  badgePending: {
    color: '#825102',
    backgroundColor: '#F9EFD9',
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