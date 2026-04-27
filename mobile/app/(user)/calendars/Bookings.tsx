import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Timestamp } from 'firebase/firestore';
import { listUpcomingEvents, type CalendarEvent } from '@/services/calendarService';

function toDate(val: Timestamp | undefined): Date {
  if (!val) return new Date(0);
  if (val instanceof Timestamp) return val.toDate();
  return new Date((val as { seconds: number }).seconds * 1000);
}

function formatDateRange(start: Date, end: Date): string {
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = start.toLocaleDateString('en-US', opts);
  const endStr = end.toLocaleDateString('en-US', { ...opts, year: 'numeric' });
  return `${startStr} → ${endStr}`;
}

function getDayOfMonth(date: Date): string {
  return date.getDate().toString();
}

function getMonthAbbr(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
}

export default function EventsScreen() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const data = await listUpcomingEvents();
    setEvents(data);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch {
        Alert.alert('Error', 'Could not load events.');
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
      <View style={styles.header}>
        <Text style={styles.title}>Events</Text>
        <Text style={styles.subtitle}>Upcoming community events</Text>
      </View>

      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Ionicons name="calendar-outline" size={36} color="#C8C7C0" />
            <Text style={styles.empty}>No upcoming events.</Text>
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
                <Text style={styles.cardTitle} numberOfLines={2}>
                  {item.title}
                </Text>
                {!!item.description && (
                  <Text style={styles.desc} numberOfLines={2}>
                    {item.description}
                  </Text>
                )}
                <View style={styles.metaRow}>
                  <Ionicons name="time-outline" size={11} color="#B4B2A9" />
                  <Text style={styles.meta}>{formatDateRange(start, end)}</Text>
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
  emptyWrap: { alignItems: 'center', marginTop: 60, gap: 10 },
  empty: { textAlign: 'center', color: '#8A8982', fontSize: 14 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ECEBE7',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
  },
  dateBadge: {
    width: 44,
    height: 48,
    backgroundColor: '#F2F1ED',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  dateBadgeDay: { fontSize: 18, fontWeight: '700', color: '#1A1A18', lineHeight: 20 },
  dateBadgeMon: { fontSize: 10, fontWeight: '600', color: '#6A6964', letterSpacing: 0.5 },
  cardBody: { flex: 1, gap: 4 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#1A1A18' },
  desc: { fontSize: 13, color: '#605F59' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  meta: { fontSize: 12, color: '#8A8982' },
});