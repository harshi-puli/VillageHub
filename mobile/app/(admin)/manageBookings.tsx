import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { listBooking, updateBooking } from '@/services/roomBookingService';
import { subscribeToAuthState } from '@/services/authService';
import { Timestamp } from 'firebase/firestore';

type BookingRow = {
  id: string;
  title: string;
  description?: string;
  site?: string;
  reservedSpot?: string;
  user?: string;
  approved?: boolean;
  checkIn?: Timestamp | { seconds?: number } | Date;
  checkOut?: Timestamp | { seconds?: number } | Date;
  createdAt?: Timestamp | { seconds?: number };
};

function toDate(val: BookingRow['checkIn']): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'object' && 'seconds' in val && typeof val.seconds === 'number') {
    return new Date(val.seconds * 1000);
  }
  return new Date(val as Date);
}

type Tab = 'pending' | 'approved' | 'all';

export default function ManageBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('pending');
  const [actingId, setActingId] = useState<string | null>(null);
  const [isSignedIn, setIsSignedIn] = useState<boolean | null>(null); // null = unknown

  // Track auth state — stop all fetches the moment user signs out
  useEffect(() => {
    const unsubscribe = subscribeToAuthState((user) => {
      setIsSignedIn(!!user);
    });
    return unsubscribe;
  }, []);

  const load = useCallback(async () => {
    // Guard: don't fetch if we know there's no user
    if (isSignedIn === false) return;
    const data = (await listBooking()) as BookingRow[];
    setBookings(data);
  }, [isSignedIn]);

  useEffect(() => {
    // Don't attempt load until auth state is known
    if (isSignedIn === null) return;
    // If signed out, clear bookings and stop loading
    if (isSignedIn === false) {
      setBookings([]);
      setLoading(false);
      return;
    }

    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load bookings.');
      } finally {
        setLoading(false);
      }
    })();
  }, [load, isSignedIn]);

  const onRefresh = useCallback(async () => {
    if (!isSignedIn) return;
    try {
      setRefreshing(true);
      await load();
    } catch {
      Alert.alert('Error', 'Could not refresh.');
    } finally {
      setRefreshing(false);
    }
  }, [load, isSignedIn]);

  const filtered = useMemo(() => {
    if (tab === 'pending') return bookings.filter((b) => !b.approved);
    if (tab === 'approved') return bookings.filter((b) => !!b.approved);
    return bookings;
  }, [bookings, tab]);

  const approve = async (id: string) => {
    if (!isSignedIn) return;
    try {
      setActingId(id);
      await updateBooking(id, { approved: true });
      await load();
    } catch {
      Alert.alert('Error', 'Could not approve booking. Check Firestore rules allow admin updates.');
    } finally {
      setActingId(null);
    }
  };

  const unapprove = (id: string) => {
    if (!isSignedIn) return;
    Alert.alert('Mark pending?', 'This will set the booking back to pending.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Mark pending',
        style: 'destructive',
        onPress: async () => {
          try {
            setActingId(id);
            await updateBooking(id, { approved: false });
            await load();
          } catch {
            Alert.alert('Error', 'Could not update booking.');
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  };

  if (loading || isSignedIn === null) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  const pendingCount = bookings.filter((b) => !b.approved).length;

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage bookings</Text>
        <Text style={styles.subtitle}>{pendingCount} pending approval</Text>
      </View>

      <View style={styles.tabs}>
        {(['pending', 'approved', 'all'] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t === 'pending' ? 'Pending' : t === 'approved' ? 'Approved' : 'All'}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={<Text style={styles.empty}>No bookings in this view.</Text>}
        renderItem={({ item }) => {
          const busy = actingId === item.id;
          return (
            <View style={styles.card}>
              <View style={styles.rowTop}>
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.badge, item.approved ? styles.badgeOk : styles.badgeWait]}>
                  {item.approved ? 'Approved' : 'Pending'}
                </Text>
              </View>
              {!!item.description && (
                <Text style={styles.desc} numberOfLines={3}>
                  {item.description}
                </Text>
              )}
              <Text style={styles.meta}>
                {(item.site ?? '—') + ' • ' + (item.reservedSpot ?? '—')}
              </Text>
              <Text style={styles.meta}>
                {toDate(item.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                {' → '}
                {toDate(item.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </Text>
              {item.user ? <Text style={styles.uid}>Resident: {item.user.slice(0, 8)}…</Text> : null}

              {!item.approved ? (
                <Pressable
                  style={[styles.approveBtn, busy && styles.btnDisabled]}
                  onPress={() => approve(item.id)}
                  disabled={busy}>
                  <Text style={styles.approveBtnText}>{busy ? 'Saving…' : 'Approve'}</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.pendingBtn, busy && styles.btnDisabled]}
                  onPress={() => unapprove(item.id)}
                  disabled={busy}>
                  <Text style={styles.pendingBtnText}>Mark pending</Text>
                </Pressable>
              )}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8F8F6' },
  centered: { justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8 },
  title: { fontSize: 22, fontWeight: '600', color: '#1A1A18' },
  subtitle: { marginTop: 4, fontSize: 13, color: '#6A6964' },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 10,
    backgroundColor: '#EDEDEA',
    borderRadius: 10,
    padding: 3,
    gap: 4,
  },
  tab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: '#fff', borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.08)' },
  tabText: { fontSize: 13, color: '#888780' },
  tabTextActive: { color: '#1A1A18', fontWeight: '600' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', marginTop: 40 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEBE7',
    padding: 14,
    gap: 6,
  },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  badgeWait: { backgroundColor: '#F9EFD9', color: '#825102' },
  badgeOk: { backgroundColor: '#E3F2DA', color: '#205A30' },
  desc: { fontSize: 13, color: '#605F59' },
  meta: { fontSize: 12, color: '#8A8982' },
  uid: { fontSize: 11, color: '#B4B2A9' },
  approveBtn: {
    marginTop: 8,
    backgroundColor: '#1A1A18',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '600' },
  pendingBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#D9D8D2',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  pendingBtnText: { color: '#5D5C57', fontWeight: '600' },
  btnDisabled: { opacity: 0.6 },
});