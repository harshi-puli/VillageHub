import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import {
  listEvents,
  listGardeningSlots,
  type CalendarEvent,
  type GardeningSlot,
} from '@/services/calendarService';
import { listBooking } from '@/services/roomBookingService';

// ─── Types ────────────────────────────────────────────────────────────────────

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
};

type Tab = 'events' | 'bookings' | 'gardening';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toDate(val: unknown): Date {
  if (!val) return new Date(0);
  if (val instanceof Date) return val;
  if (val instanceof Timestamp) return val.toDate();
  if (typeof val === 'object' && val !== null && 'seconds' in val) {
    return new Date((val as { seconds: number }).seconds * 1000);
  }
  return new Date(0);
}

function fmtDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getDayOfMonth(date: Date): string {
  return date.getDate().toString();
}

function getMonthAbbr(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function UserCalendars() {
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [gardeningSlots, setGardeningSlots] = useState<GardeningSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const [evts, bkgs, garden] = await Promise.all([
      listEvents(),
      listBooking() as Promise<BookingRow[]>,
      listGardeningSlots(),
    ]);
    setEvents(evts);
    setBookings(bkgs.sort((a, b) => toDate(a.checkIn).getTime() - toDate(b.checkIn).getTime()));
    setGardeningSlots(garden);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load calendar data.');
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

  if (loading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Calendars</Text>
        <Text style={styles.subtitle}>Community schedule</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['events', 'bookings', 'gardening'] as const).map((t) => (
          <Pressable key={t} style={[styles.tab, tab === t && styles.tabActive]} onPress={() => setTab(t)}>
            <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Events Tab */}
      {tab === 'events' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{events.length} event{events.length !== 1 ? 's' : ''}</Text>
          </View>
          <FlatList
            data={events}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="calendar-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No events yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const start = toDate(item.startDate);
              const end = toDate(item.endDate);
              return (
                <View style={styles.card}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeDay}>{getDayOfMonth(start)}</Text>
                    <Text style={styles.dateBadgeMon}>{getMonthAbbr(start)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {!!item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(start)} → {fmtDate(end)}</Text>
                    </View>
                    {!!item.location && (
                      <View style={styles.metaRow}>
                        <Ionicons name="location-outline" size={11} color="#B4B2A9" />
                        <Text style={styles.meta}>{item.location}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {/* Bookings Tab */}
      {tab === 'bookings' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{bookings.length} booking{bookings.length !== 1 ? 's' : ''}</Text>
          </View>
          <FlatList
            data={bookings}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="bed-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No bookings yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const checkIn = toDate(item.checkIn);
              const checkOut = toDate(item.checkOut);
              return (
                <View style={styles.card}>
                  <View style={styles.dateBadge}>
                    <Text style={styles.dateBadgeDay}>{getDayOfMonth(checkIn)}</Text>
                    <Text style={styles.dateBadgeMon}>{getMonthAbbr(checkIn)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <View style={styles.rowTop}>
                      <Text style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                      <Text style={[styles.badge, item.approved ? styles.badgeOk : styles.badgeWait]}>
                        {item.approved ? 'Approved' : 'Pending'}
                      </Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="location-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{item.site ?? '—'} · {item.reservedSpot ?? '—'}</Text>
                    </View>
                    <View style={styles.metaRow}>
                      <Ionicons name="time-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(checkIn)} → {fmtDate(checkOut)}</Text>
                    </View>
                  </View>
                </View>
              );
            }}
          />
        </>
      )}

      {/* Gardening Tab */}
      {tab === 'gardening' && (
        <>
          <View style={styles.listHeader}>
            <Text style={styles.listCount}>{gardeningSlots.length} session{gardeningSlots.length !== 1 ? 's' : ''}</Text>
          </View>
          <FlatList
            data={gardeningSlots}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="leaf-outline" size={36} color="#C8C7C0" />
                <Text style={styles.empty}>No sessions yet.</Text>
              </View>
            }
            renderItem={({ item }) => {
              const date = toDate(item.date);
              return (
                <View style={styles.card}>
                  <View style={[styles.dateBadge, styles.dateBadgeGreen]}>
                    <Text style={[styles.dateBadgeDay, styles.dateBadgeDayGreen]}>{getDayOfMonth(date)}</Text>
                    <Text style={[styles.dateBadgeMon, styles.dateBadgeMonGreen]}>{getMonthAbbr(date)}</Text>
                  </View>
                  <View style={styles.cardBody}>
                    <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
                    {!!item.description && <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>}
                    <View style={styles.metaRow}>
                      <Ionicons name="calendar-outline" size={11} color="#B4B2A9" />
                      <Text style={styles.meta}>{fmtDate(date)}</Text>
                    </View>
                    {!!item.plot && (
                      <View style={styles.metaRow}>
                        <Ionicons name="map-outline" size={11} color="#B4B2A9" />
                        <Text style={styles.meta}>{item.plot}</Text>
                      </View>
                    )}
                  </View>
                </View>
              );
            }}
          />
        </>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

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
  listHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 8 },
  listCount: { fontSize: 13, color: '#6A6964' },
  list: { paddingHorizontal: 20, paddingBottom: 32, gap: 10 },
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', fontSize: 14 },
  card: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#ECEBE7', padding: 14, flexDirection: 'row', gap: 12 },
  dateBadge: { width: 44, height: 48, backgroundColor: '#F2F1ED', borderRadius: 10, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  dateBadgeGreen: { backgroundColor: '#EDF4EB' },
  dateBadgeDay: { fontSize: 18, fontWeight: '700', color: '#1A1A18', lineHeight: 20 },
  dateBadgeDayGreen: { color: '#205A30' },
  dateBadgeMon: { fontSize: 10, fontWeight: '600', color: '#6A6964', letterSpacing: 0.5 },
  dateBadgeMonGreen: { color: '#3A7D47' },
  cardBody: { flex: 1, gap: 4 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  cardTitle: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 12, fontSize: 11, fontWeight: '600', overflow: 'hidden' },
  badgeWait: { backgroundColor: '#F9EFD9', color: '#825102' },
  badgeOk: { backgroundColor: '#E3F2DA', color: '#205A30' },
  desc: { fontSize: 13, color: '#605F59' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: '#8A8982' },
});
