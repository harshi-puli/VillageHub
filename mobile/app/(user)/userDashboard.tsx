import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Image,
} from 'react-native';
import { router } from 'expo-router';
import { Timestamp } from 'firebase/firestore';
import { logoutResident } from '@/services/authService';
import { listAnnouncements } from '@/services/announcementService';
import { listChoresForUser } from '@/services/choreService';
import { listUsersBookings } from '@/services/roomBookingService';
import { useAuth } from '@/state/auth';

const TEAL = '#1a7a6e';
const DARK_TEAL = '#0f5a51';
const GRAY_BOX = '#e8e8e8';

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
const ROW_HEIGHT_PX = 110;
const cappedScrollMaxHeight = MAX_VISIBLE_ITEMS * ROW_HEIGHT_PX;

const toDate = (value?: { seconds?: number } | Date | Timestamp): Date => {
  if (!value) return new Date(0);
  if (value instanceof Date) return value;
  if (value instanceof Timestamp) return value.toDate();
  if (typeof value === 'object' && 'seconds' in value && typeof value.seconds === 'number') {
    return new Date(value.seconds * 1000);
  }
  return new Date(0);
};

// Gray bubbly section box with inner ScrollView
function SectionBox({
  title,
  children,
  empty,
}: {
  title: string;
  children?: React.ReactNode;
  empty?: boolean;
}) {
  return (
    <View style={styles.sectionBox}>
      <Text style={styles.sectionBoxTitle}>{title}</Text>
      {empty ? (
        <View style={styles.sectionBoxBody}>
          <View style={styles.emptyCard} />
        </View>
      ) : (
        <ScrollView
          style={[styles.sectionBoxBody, { maxHeight: cappedScrollMaxHeight }]}
          contentContainerStyle={{ gap: 8, paddingBottom: 2 }}
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      )}
    </View>
  );
}

// White card inside a section
function ItemCard({ children }: { children: React.ReactNode }) {
  return <View style={styles.itemCard}>{children}</View>;
}

export default function UserDashboard() {
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chores, setChores] = useState<ChoreRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchHomeData = useCallback(async () => {
    if (!user?.uid) return;
    const [announcementResult, bookingResult, choreResult] = await Promise.allSettled([
      listAnnouncements(),
      listUsersBookings(),
      listChoresForUser(user.uid),
    ]);
    if (announcementResult.status === 'fulfilled') setAnnouncements(announcementResult.value as Announcement[]);
    if (bookingResult.status === 'fulfilled') setBookings(bookingResult.value as Booking[]);
    if (choreResult.status === 'fulfilled') setChores(choreResult.value as ChoreRow[]);
  }, [user?.uid]);

  useEffect(() => {
    if (!user?.uid) { setLoading(false); return; }
    (async () => {
      try { setLoading(true); await fetchHomeData(); }
      finally { setLoading(false); }
    })();
  }, [fetchHomeData, user?.uid]);

  const upcomingBookings = useMemo(() => {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    return bookings
      .filter((b) => toDate(b.checkIn) >= startOfToday)
      .sort((a, b) => toDate(a.checkIn).getTime() - toDate(b.checkIn).getTime());
  }, [bookings]);

  const handleRefresh = async () => {
    if (!user?.uid) return;
    try { setRefreshing(true); await fetchHomeData(); }
    finally { setRefreshing(false); }
  };

  const handleLogout = async () => {
    setAnnouncements([]);
    setBookings([]);
    setChores([]);
    await logoutResident();
    router.replace('/');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={TEAL} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.outerScroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={TEAL} />}
        showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.welcomeText}>
            Welcome back, <Text style={styles.welcomeBold}>User!</Text>
          </Text>
        </View>

        {/* New Announcements */}
        <SectionBox title="Announcements" empty={announcements.length === 0}>
          {announcements.map((a) => (
            <ItemCard key={a.id}>
              <Text style={styles.cardTitle} numberOfLines={1}>{a.title}</Text>
              {!!a.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{a.description}</Text>
              )}
              <Text style={styles.cardMeta}>
                {(a.category ?? 'general').toUpperCase()} • Due{' '}
                {toDate(a.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </ItemCard>
          ))}
        </SectionBox>

        {/*  Chores */}
        <SectionBox title="My Chores" empty={chores.length === 0}>
          {chores.map((c) => (
            <ItemCard key={c.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle} numberOfLines={1}>{c.title}</Text>
                {c.isCompleted !== undefined && (
                  <Text style={[styles.badge, c.isCompleted ? styles.badgeDone : styles.badgeOpen]}>
                    {c.isCompleted ? 'Done' : 'To do'}
                  </Text>
                )}
              </View>
              {!!c.description && (
                <Text style={styles.cardDesc} numberOfLines={2}>{c.description}</Text>
              )}
              <Text style={styles.cardMeta}>
                {c.site ?? '—'}
                {c.dueDate ? ` • Due ${toDate(c.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
              </Text>
            </ItemCard>
          ))}
        </SectionBox>

        {/* Upcoming Bookings */}
        <SectionBox title="Upcoming Bookings" empty={upcomingBookings.length === 0}>
          {upcomingBookings.map((b) => (
            <ItemCard key={b.id}>
              <View style={styles.rowBetween}>
                <Text style={styles.cardTitle} numberOfLines={1}>{b.title}</Text>
                <Text style={[styles.badge, b.approved ? styles.badgeDone : styles.badgeOpen]}>
                  {b.approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
              <Text style={styles.cardDesc} numberOfLines={1}>
                {b.site ?? 'Unknown site'} • {b.reservedSpot ?? 'Unknown spot'}
              </Text>
              <Text style={styles.cardMeta}>
                Check-in {toDate(b.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            </ItemCard>
          ))}
        </SectionBox>

      </ScrollView>

      {/* Logout button — always visible at the bottom */}
      <Pressable style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  center: { justifyContent: 'center', alignItems: 'center' },
  outerScroll: { flex: 1 },
  content: {
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
    gap: 20,
  },

  // header
  header: {
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  headerLogo: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
  },
  brandName: {
    fontSize: 20,
    fontWeight: '800',
    color: DARK_TEAL,
  },
  welcomeText: {
    fontSize: 30,
    color: TEAL,
    marginTop: 2,
  },
  welcomeBold: {
    fontWeight: '800',
    color: TEAL,
  },

  // gray bubbly section box
  sectionBox: {
    backgroundColor: GRAY_BOX,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sectionBoxTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a1a',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionBoxBody: {
    padding: 10,
  },
  emptyCard: {
    height: 80,
  },

  // white item card
  itemCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    gap: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  cardDesc: {
    fontSize: 13,
    color: '#555',
  },
  cardMeta: {
    fontSize: 11,
    color: '#999',
    fontWeight: '500',
  },

  // badges
  badge: {
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 3,
    fontSize: 11,
    fontWeight: '700',
    overflow: 'hidden',
  },
  badgeOpen: {
    color: '#825102',
    backgroundColor: '#F9EFD9',
  },
  badgeDone: {
    color: '#205A30',
    backgroundColor: '#E3F2DA',
  },

  // logout
  logoutBtn: {
    backgroundColor: TEAL,
    margin: 20,
    paddingVertical: 14,
    borderRadius: 999,
    alignItems: 'center',
    shadowColor: TEAL,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 15,
  },
});